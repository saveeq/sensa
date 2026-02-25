// src/store/useSensa.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  AIResult,
  AnyItem,
  Task,
  ShoppingItem,
  WishlistItem,
  Idea,
} from "@/src/lib/ai_contract"
import type { ServerMessage } from "../../server/Ws"

type Mode = "me" | "we"
type RoomStatus = "idle" | "creating" | "joining" | "connected" | "error"

// ─── WebSocket синглтон ───────────────────────────────────────────────────────

let wsInstance: WebSocket | null = null
// Команда, ожидающая отправки пока сокет ещё CONNECTING (Safari fix)
let pendingWSMessage: object | null = null

function getWS(): WebSocket | null {
  if (typeof window === "undefined") return null
  if (!wsInstance) return null
  // Чистим мёртвые инстансы, чтобы connectWS мог создать новый
  if (wsInstance.readyState === WebSocket.CLOSED || wsInstance.readyState === WebSocket.CLOSING) {
    wsInstance = null
    return null
  }
  if (wsInstance.readyState === WebSocket.OPEN) return wsInstance
  return null // CONNECTING — ещё не готов
}

function sendWS(msg: object) {
  const ws = getWS()
  if (ws) ws.send(JSON.stringify(msg))
}

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface SensaState {
  // Базовое
  mode: Mode
  rawInput: string
  loading: boolean
  error: string | null

  // Два независимых результата — личный и совместный
  meResult: AIResult | null
  weResult: AIResult | null

  // Идентификация
  userId: string

  // Комната
  roomId: string | null
  roomStatus: RoomStatus
  roomError: string | null
  partnerOnline: boolean

  // ─── Действия ───────────────────────────────────────────────────────────────

  setMode: (mode: Mode) => void
  setRawInput: (value: string) => void
  reset: () => void

  // Геттер текущего результата по режиму
  getCurrentResult: () => AIResult | null

  // AI
  analyze: () => Promise<void>

  // Айтемы
  toggleItem: (id: string) => void
  removeItem: (id: string) => void
  updateItemTitle: (id: string, newTitle: string) => void

  // Комната
  createRoom: () => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  connectWS: () => void
  disconnectWS: () => void
  rejoinRoom: () => void

  // Внутренние — применяют входящие WS-события
  _applyToggle: (itemId: string) => void
  _applyRemove: (itemId: string) => void
  _applyUpdateTitle: (itemId: string, newTitle: string) => void
  _applyResultSync: (result: AIResult) => void
  _setRoomStatus: (status: RoomStatus, roomId?: string, error?: string) => void
  _setPartnerOnline: (online: boolean) => void
}

// ─── Вспомогательные функции мутаций ─────────────────────────────────────────

function applyToggle(items: AnyItem[], id: string): AnyItem[] {
  return items.map((item) => {
    if (item.id !== id) return item
    if (item.type === "task") return { ...item, done: !item.done }
    if (item.type === "shopping") return { ...item, bought: !item.bought }
    return item
  })
}

function applyRemove(items: AnyItem[], id: string): AnyItem[] {
  return items.filter((item) => item.id !== id)
}

function applyUpdateTitle(items: AnyItem[], id: string, newTitle: string): AnyItem[] {
  return items.map((item) => {
    if (item.id !== id) return item
    switch (item.type) {
      case "task":     return { ...item, text: newTitle } as Task
      case "shopping": return { ...item, name: newTitle } as ShoppingItem
      case "wishlist": return { ...item, title: newTitle } as WishlistItem
      case "idea":     return { ...item, text: newTitle } as Idea
      default:         return item
    }
  })
}

// Возвращает ключ результата по режиму
function resultKey(mode: Mode): "meResult" | "weResult" {
  return mode === "we" ? "weResult" : "meResult"
}

// ─── Генерация userId ─────────────────────────────────────────────────────────

function generateUserId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Стор ─────────────────────────────────────────────────────────────────────

export const useSensaStore = create<SensaState>()(
  persist(
    (set, get) => ({

      // ── Начальное состояние ──────────────────────────────────────────────────

      mode: "me",
      rawInput: "",
      loading: false,
      error: null,

      meResult: null,
      weResult: null,

      userId: generateUserId(),
      roomId: null,
      roomStatus: "idle",
      roomError: null,
      partnerOnline: false,

      // ── Базовые ──────────────────────────────────────────────────────────────

      setMode: (mode) => set({ mode }),

      setRawInput: (value) => set({ rawInput: value, error: null }),

      reset: () => set({ rawInput: "", loading: false, error: null }),

      getCurrentResult: () => {
        const { mode, meResult, weResult } = get()
        return mode === "we" ? weResult : meResult
      },

      // ── AI ───────────────────────────────────────────────────────────────────

      analyze: async () => {
        const { rawInput, mode, roomId, userId } = get()
        if (!rawInput.trim()) return

        set({ loading: true, error: null })

        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawInput, mode }),
          })

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || "AI request failed")
          }

          const data: AIResult = await res.json()
          const key = resultKey(mode)

          // Пишем в нужный слот — другой режим не трогаем
          set({ [key]: data, rawInput: "", loading: false })

          // В режиме МЫ — синхронизируем партнёру
          if (mode === "we" && roomId) {
            sendWS({ type: "sync_result", roomId, userId, result: data })
          }
        } catch (err: any) {
          console.error("Store Analyze Error:", err)
          set({
            loading: false,
            error: err.message || "Не удалось разобрать текст. Попробуй ещё раз.",
          })
        }
      },

      // ── Мутации айтемов ──────────────────────────────────────────────────────

      toggleItem: (id) => {
        const { mode, roomId, userId } = get()
        const key = resultKey(mode)
        const result = get()[key]
        if (!result) return

        set({ [key]: { ...result, items: applyToggle(result.items, id) } })

        if (mode === "we" && roomId) {
          sendWS({ type: "toggle_item", roomId, userId, itemId: id })
        }
      },

      removeItem: (id) => {
        const { mode, roomId, userId } = get()
        const key = resultKey(mode)
        const result = get()[key]
        if (!result) return

        set({ [key]: { ...result, items: applyRemove(result.items, id) } })

        if (mode === "we" && roomId) {
          sendWS({ type: "remove_item", roomId, userId, itemId: id })
        }
      },

      updateItemTitle: (id, newTitle) => {
        const { mode, roomId, userId } = get()
        const key = resultKey(mode)
        const result = get()[key]
        if (!result) return

        set({ [key]: { ...result, items: applyUpdateTitle(result.items, id, newTitle) } })

        if (mode === "we" && roomId) {
          sendWS({ type: "update_item_title", roomId, userId, itemId: id, newTitle })
        }
      },

      // ── WebSocket ─────────────────────────────────────────────────────────────

      connectWS: () => {
        if (typeof window === "undefined") return

        // Уже открыт — pendingWSMessage отправляем сразу и выходим
        if (wsInstance?.readyState === WebSocket.OPEN) {
          if (pendingWSMessage) {
            wsInstance.send(JSON.stringify(pendingWSMessage))
            pendingWSMessage = null
          }
          return
        }

        // Уже подключается — onopen сам заберёт pendingWSMessage, просто ждём
        if (wsInstance?.readyState === WebSocket.CONNECTING) return

        const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:4000`
        console.log("[WS] Connecting to", WS_URL)
        wsInstance = new WebSocket(WS_URL)

        wsInstance.onopen = () => {
          console.log("[WS] Connected, readyState:", wsInstance?.readyState)
          // Отправляем команду, которая ждала открытия сокета (create_room / join_room)
          if (pendingWSMessage) {
            console.log("[WS] Flushing pending:", JSON.stringify(pendingWSMessage))
            wsInstance?.send(JSON.stringify(pendingWSMessage))
            pendingWSMessage = null
          }
        }

        wsInstance.onmessage = (event) => {
          let msg: ServerMessage
          try {
            msg = JSON.parse(event.data)
          } catch {
            return
          }

          const store = get()

          switch (msg.type) {
            case "room_created":
              store._setRoomStatus("connected", msg.roomId)
              break

            case "room_joined":
              store._setRoomStatus("connected", msg.roomId)
              store._setPartnerOnline(msg.partnerOnline)
              break

            case "partner_joined":
              store._setPartnerOnline(true)
              break

            case "partner_left":
              store._setPartnerOnline(false)
              break

            case "result_synced":
              store._applyResultSync(msg.result)
              break

            case "item_toggled":
              store._applyToggle(msg.itemId)
              break

            case "item_removed":
              store._applyRemove(msg.itemId)
              break

            case "item_title_updated":
              store._applyUpdateTitle(msg.itemId, msg.newTitle)
              break

            case "error":
              set({ roomError: msg.message, roomStatus: "error" })
              break
          }
        }

        wsInstance.onclose = () => {
          console.log("[WS] Disconnected")
          wsInstance = null
        }

        wsInstance.onerror = (err) => {
          console.error("[WS] Error:", err)
          wsInstance = null // Сбрасываем чтобы connectWS мог создать новый
          set({ roomError: "Ошибка соединения", roomStatus: "error" })
        }
      },

      disconnectWS: () => {
        wsInstance?.close()
        wsInstance = null
      },

      // ── Комнаты ───────────────────────────────────────────────────────────────

      createRoom: () => {
        const { userId, connectWS } = get()
        set({ roomStatus: "creating", roomError: null })

        const cmd = { type: "create_room", userId }
        const ws = getWS()
        console.log("[WS] createRoom, readyState:", wsInstance?.readyState, "ws:", !!ws)
        if (ws) {
          ws.send(JSON.stringify(cmd))
        } else {
          pendingWSMessage = cmd
          connectWS()
        }

        // Таймаут: если за 6 секунд статус не сменился — показываем ошибку
        setTimeout(() => {
          if (get().roomStatus === "creating") {
            console.warn("[WS] createRoom timeout")
            pendingWSMessage = null
            set({ roomStatus: "error", roomError: "Нет ответа от сервера. Проверь подключение." })
          }
        }, 6000)
      },

      joinRoom: (roomId) => {
        const { userId, connectWS } = get()
        set({ roomStatus: "joining", roomError: null })

        const cmd = { type: "join_room", roomId: roomId.toUpperCase(), userId }
        const ws = getWS()
        console.log("[WS] joinRoom, readyState:", wsInstance?.readyState, "ws:", !!ws)
        if (ws) {
          ws.send(JSON.stringify(cmd))
        } else {
          pendingWSMessage = cmd
          connectWS()
        }

        setTimeout(() => {
          if (get().roomStatus === "joining") {
            console.warn("[WS] joinRoom timeout")
            pendingWSMessage = null
            set({ roomStatus: "error", roomError: "Нет ответа от сервера. Проверь подключение." })
          }
        }, 6000)
      },

      // Переподключение к сохранённой комнате после перезагрузки страницы
      rejoinRoom: () => {
        const { roomId, userId, connectWS } = get()
        if (!roomId) return

        const cmd = { type: "join_room", roomId, userId }
        const ws = getWS()
        if (ws) {
          ws.send(JSON.stringify(cmd))
        } else {
          // Сервер распознает userId и сделает rejoin вместо ошибки "уже заполнена"
          pendingWSMessage = cmd
          connectWS()
        }
      },

      leaveRoom: () => {
        get().disconnectWS()
        set({
          roomId: null,
          roomStatus: "idle",
          roomError: null,
          partnerOnline: false,
          mode: "me",
        })
      },

      // ── Внутренние методы (WS-события от партнёра) ───────────────────────────

      _applyToggle: (itemId) => {
        // WS-события всегда в режиме МЫ
        const result = get().weResult
        if (!result) return
        set({ weResult: { ...result, items: applyToggle(result.items, itemId) } })
      },

      _applyRemove: (itemId) => {
        const result = get().weResult
        if (!result) return
        set({ weResult: { ...result, items: applyRemove(result.items, itemId) } })
      },

      _applyUpdateTitle: (itemId, newTitle) => {
        const result = get().weResult
        if (!result) return
        set({ weResult: { ...result, items: applyUpdateTitle(result.items, itemId, newTitle) } })
      },

      _applyResultSync: (result) => {
        // Синк от партнёра всегда идёт в weResult
        set({ weResult: result })
      },

      _setRoomStatus: (status, roomId, error) => {
        set({
          roomStatus: status,
          ...(roomId !== undefined && { roomId }),
          ...(error !== undefined && { roomError: error }),
        })
      },

      _setPartnerOnline: (online) => {
        set({ partnerOnline: online })
      },
    }),
    {
      name: "sensa-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        mode: state.mode,
        meResult: state.meResult,   // личные заметки — вечно
        weResult: state.weResult,   // совместные заметки — вечно
        roomId: state.roomId,       // чтобы переподключиться после перезагрузки
        roomStatus: state.roomStatus,
      }),
    }
  )
)