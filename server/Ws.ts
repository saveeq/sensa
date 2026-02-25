import { WebSocketServer, WebSocket } from "ws"
import { randomUUID } from "crypto"
import type { AnyItem } from "../src/lib/ai_contract"

const PORT = parseInt(process.env.WS_PORT || "4000")


type ClientMessage =
  | { type: "join_room"; roomId: string; userId: string }
  | { type: "create_room"; userId: string }
  | { type: "sync_result"; roomId: string; userId: string; result: { title: string; summary: string; items: AnyItem[] } }
  | { type: "toggle_item"; roomId: string; userId: string; itemId: string }
  | { type: "remove_item"; roomId: string; userId: string; itemId: string }
  | { type: "update_item_title"; roomId: string; userId: string; itemId: string; newTitle: string }

export type ServerMessage =
  | { type: "room_created"; roomId: string }
  | { type: "room_joined"; roomId: string; partnerOnline: boolean }
  | { type: "partner_joined"; userId: string }
  | { type: "partner_left" }
  | { type: "result_synced"; result: { title: string; summary: string; items: AnyItem[] }; fromUserId: string }
  | { type: "item_toggled"; itemId: string; fromUserId: string }
  | { type: "item_removed"; itemId: string; fromUserId: string }
  | { type: "item_title_updated"; itemId: string; newTitle: string; fromUserId: string }
  | { type: "error"; message: string }


interface RoomMember {
  userId: string
  ws: WebSocket
}

const rooms = new Map<string, RoomMember[]>()


function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function broadcast(roomId: string, msg: ServerMessage, excludeUserId?: string) {
  const members = rooms.get(roomId) ?? []
  for (const member of members) {
    if (member.userId !== excludeUserId) {
      send(member.ws, msg)
    }
  }
}

function findRoomOfUser(userId: string): string | null {
  for (const [roomId, members] of rooms.entries()) {
    if (members.some((m) => m.userId === userId)) return roomId
  }
  return null
}

function removeUserFromRoom(userId: string) {
  const roomId = findRoomOfUser(userId)
  if (!roomId) return

  const members = rooms.get(roomId)!
  const updated = members.filter((m) => m.userId !== userId)

  if (updated.length === 0) {
    rooms.delete(roomId)
  } else {
    rooms.set(roomId, updated)
    broadcast(roomId, { type: "partner_left" })
  }
}


// ─── Логгер ───────────────────────────────────────────────────────────────────

const dim    = (s: string) => `\x1b[2m${s}\x1b[0m`
const cyan   = (s: string) => `\x1b[36m${s}\x1b[0m`
const green  = (s: string) => `\x1b[32m${s}\x1b[0m`
const red    = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const bold   = (s: string) => `\x1b[1m${s}\x1b[0m`

function ts() {
  return dim(new Date().toTimeString().slice(0, 8))
}

function log(icon: string, label: string, details: Record<string, string> = {}) {
  const detailStr = Object.entries(details)
    .map(([k, v]) => `${dim(k + ":")} ${v}`)
    .join("  ")
  console.log(`${ts()} ${icon} ${bold(label)}  ${detailStr}`)
}

// ─── Сервер ───────────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" })

wss.on("connection", (ws, req) => {
  const ip = req.headers["x-forwarded-for"]?.toString() ?? req.socket.remoteAddress ?? "unknown"
  log("🔌", cyan("CONNECT"), { ip })

  ws.on("message", (raw) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      log("⚠️ ", red("INVALID JSON"), { ip })
      send(ws, { type: "error", message: "Invalid JSON" })
      return
    }

    switch (msg.type) {

      case "create_room": {
        const roomId = randomUUID().slice(0, 8).toUpperCase()
        rooms.set(roomId, [{ userId: msg.userId, ws }])
        send(ws, { type: "room_created", roomId })
        log("🏠", green("ROOM CREATED"), { room: bold(roomId), user: dim(msg.userId), ip })
        break
      }

      case "join_room": {
        const members = rooms.get(msg.roomId)
        const { roomId, userId } = msg

        if (!members) {
          log("❌", red("JOIN FAILED"), { reason: "room not found", room: roomId, user: dim(userId), ip })
          send(ws, { type: "error", message: "Комната не найдена" })
          return
        }

        const existingIndex = members.findIndex((m) => m.userId === userId)

        // ── Реджойн: тот же userId возвращается после перезагрузки ──────────
        if (existingIndex !== -1) {
          const old = members[existingIndex]
          // Закрываем старый сокет тихо, если он ещё жив
          if (old.ws !== ws && old.ws.readyState === WebSocket.OPEN) {
            old.ws.close()
          }
          members[existingIndex] = { userId, ws }
          const partnerOnline = members.some((m) => m.userId !== userId && m.ws.readyState === WebSocket.OPEN)
          send(ws, { type: "room_joined", roomId, partnerOnline })
          log("♻️ ", yellow("ROOM REJOINED"), { room: bold(roomId), user: dim(userId), ip })
          break
        }

        // ── Новый участник ────────────────────────────────────────────────────
        if (members.length >= 2) {
          log("❌", red("JOIN FAILED"), { reason: "room full", room: bold(roomId), user: dim(userId), ip })
          send(ws, { type: "error", message: "Комната уже заполнена" })
          return
        }

        members.push({ userId, ws })
        send(ws, { type: "room_joined", roomId, partnerOnline: true })
        broadcast(roomId, { type: "partner_joined", userId }, userId)
        log("✅", green("ROOM JOINED"), { room: bold(roomId), user: dim(userId), ip, members: `${members.length}/2` })
        break
      }

      case "sync_result": {
        broadcast(msg.roomId, {
          type: "result_synced",
          result: msg.result,
          fromUserId: msg.userId,
        }, msg.userId)
        log("🔄", cyan("SYNC RESULT"), { room: bold(msg.roomId), user: dim(msg.userId), items: String(msg.result.items.length), title: `"${msg.result.title}"` })
        break
      }

      case "toggle_item": {
        broadcast(msg.roomId, {
          type: "item_toggled",
          itemId: msg.itemId,
          fromUserId: msg.userId,
        }, msg.userId)
        log("✔️ ", yellow("TOGGLE ITEM"), { room: bold(msg.roomId), user: dim(msg.userId), item: dim(msg.itemId) })
        break
      }

      case "remove_item": {
        broadcast(msg.roomId, {
          type: "item_removed",
          itemId: msg.itemId,
          fromUserId: msg.userId,
        }, msg.userId)
        log("🗑️ ", yellow("REMOVE ITEM"), { room: bold(msg.roomId), user: dim(msg.userId), item: dim(msg.itemId) })
        break
      }

      case "update_item_title": {
        broadcast(msg.roomId, {
          type: "item_title_updated",
          itemId: msg.itemId,
          newTitle: msg.newTitle,
          fromUserId: msg.userId,
        }, msg.userId)
        log("✏️ ", yellow("RENAME ITEM"), { room: bold(msg.roomId), user: dim(msg.userId), title: `"${msg.newTitle}"` })
        break
      }
    }
  })

  ws.on("close", () => {
    for (const [, members] of rooms.entries()) {
      const member = members.find((m) => m.ws === ws)
      if (member) {
        removeUserFromRoom(member.userId)
        log("🔴", red("DISCONNECT"), { user: dim(member.userId), ip, active: String(wss.clients.size) })
        break
      }
    }
  })

  ws.on("error", (err) => {
    log("💥", red("WS ERROR"), { ip, message: err.message })
  })
})

console.log(`[WS] Server running on ws://0.0.0.0:${PORT}`)