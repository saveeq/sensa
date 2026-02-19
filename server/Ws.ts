import { WebSocketServer, WebSocket } from "ws"
import { randomUUID } from "crypto"
import type { AnyItem } from "../src/lib/ai_contract"

const PORT = parseInt(process.env.WS_PORT || "4000")

// ─── Типы сообщений ───────────────────────────────────────────────────────────

// Клиент → Сервер
type ClientMessage =
  | { type: "join_room"; roomId: string; userId: string }
  | { type: "create_room"; userId: string }
  | { type: "sync_result"; roomId: string; userId: string; result: { title: string; summary: string; items: AnyItem[] } }
  | { type: "toggle_item"; roomId: string; userId: string; itemId: string }
  | { type: "remove_item"; roomId: string; userId: string; itemId: string }
  | { type: "update_item_title"; roomId: string; userId: string; itemId: string; newTitle: string }

// Сервер → Клиент
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

// ─── Состояние сервера ────────────────────────────────────────────────────────

interface RoomMember {
  userId: string
  ws: WebSocket
}

// roomId → список участников (максимум 2)
const rooms = new Map<string, RoomMember[]>()

// ─── Утилиты ──────────────────────────────────────────────────────────────────

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
    rooms.delete(roomId) // Комната пуста — удаляем
  } else {
    rooms.set(roomId, updated)
    broadcast(roomId, { type: "partner_left" }) // Уведомляем оставшихся
  }
}

// ─── Сервер ───────────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT })

wss.on("connection", (ws) => {
  console.log("[WS] New connection")

  ws.on("message", (raw) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      send(ws, { type: "error", message: "Invalid JSON" })
      return
    }

    switch (msg.type) {

      // Создать новую комнату
      case "create_room": {
        const roomId = randomUUID().slice(0, 8).toUpperCase() // Короткий код типа "A3F9B2C1"
        rooms.set(roomId, [{ userId: msg.userId, ws }])
        send(ws, { type: "room_created", roomId })
        console.log(`[WS] Room ${roomId} created by ${msg.userId}`)
        break
      }

      // Войти в существующую комнату
      case "join_room": {
        const { roomId, userId } = msg
        const members = rooms.get(roomId)

        if (!members) {
          send(ws, { type: "error", message: "Комната не найдена" })
          return
        }
        if (members.length >= 2) {
          send(ws, { type: "error", message: "Комната уже заполнена" })
          return
        }
        if (members.some((m) => m.userId === userId)) {
          send(ws, { type: "error", message: "Ты уже в этой комнате" })
          return
        }

        members.push({ userId, ws })
        send(ws, { type: "room_joined", roomId, partnerOnline: true })
        broadcast(roomId, { type: "partner_joined", userId }, userId)
        console.log(`[WS] ${userId} joined room ${roomId}`)
        break
      }

      // AI вернул результат — синхронизируем с партнёром
      case "sync_result": {
        broadcast(msg.roomId, {
          type: "result_synced",
          result: msg.result,
          fromUserId: msg.userId,
        }, msg.userId)
        break
      }

      // Переключить статус айтема
      case "toggle_item": {
        broadcast(msg.roomId, {
          type: "item_toggled",
          itemId: msg.itemId,
          fromUserId: msg.userId,
        }, msg.userId)
        break
      }

      // Удалить айтем
      case "remove_item": {
        broadcast(msg.roomId, {
          type: "item_removed",
          itemId: msg.itemId,
          fromUserId: msg.userId,
        }, msg.userId)
        break
      }

      // Обновить название айтема
      case "update_item_title": {
        broadcast(msg.roomId, {
          type: "item_title_updated",
          itemId: msg.itemId,
          newTitle: msg.newTitle,
          fromUserId: msg.userId,
        }, msg.userId)
        break
      }
    }
  })

  ws.on("close", () => {
    // Найти userId этого соединения и удалить из комнаты
    for (const [, members] of rooms.entries()) {
      const member = members.find((m) => m.ws === ws)
      if (member) {
        removeUserFromRoom(member.userId)
        console.log(`[WS] ${member.userId} disconnected`)
        break
      }
    }
  })

  ws.on("error", (err) => {
    console.error("[WS] Error:", err.message)
  })
})

console.log(`[WS] Server running on ws://localhost:${PORT}`)