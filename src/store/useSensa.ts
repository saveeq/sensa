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

// ─── WebSocket синглтон ───────────────────────────────────────────────────────
// Живёт вне стора — одно соединение на всё приложение

let wsInstance: WebSocket | null = null

function getWS(): WebSocket | null {
  if (typeof window === "undefined") return null // SSR guard
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) return wsInstance
  return null
}

function sendWS(msg: object) {
  const ws = getWS()
  if (ws) ws.send(JSON.stringify(msg))
}

// ─── Типы ─────────────────────────────────────────────────────────────────────

type RoomStatus = "idle" | "creating" | "joining" | "connected" | "error"

interface SensaState {
  // Базовое
  mode: Mode
  rawInput: string
  loading: boolean
  error: string | null

  // Результат AI
  result: AIResult | null

  // Идентификация пользователя
  userId: string // UUID, генерируется один раз

  // Режим МЫ — комната
  roomId: string | null
  roomStatus: RoomStatus
  roomError: string | null
  partnerOnline: boolean

  // ─── Действия ───────────────────────────────────────────────────────────────

  setMode: (mode: Mode) => void
  setRawInput: (value: string) => void
  reset: () => void

  // AI
  analyze: () => Promise<void>

  // Айтемы
  toggleItem: (id: string) => void
  removeItem: (id: string) => void
  updateItemTitle: (id: string, newTitle: string) => void

  // Режим МЫ
  createRoom: () => void
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  connectWS: () => void
  disconnectWS: () => void

  // Внутренние — применяют входящие WS-события от партнёра
  _applyToggle: (itemId: string) => void
  _applyRemove: (itemId: string) => void
  _applyUpdateTitle: (itemId: string, newTitle: string) => void
  _applyResultSync: (result: AIResult) => void
  _setRoomStatus: (status: RoomStatus, roomId?: string, error?: string) => void
  _setPartnerOnline: (online: boolean) => void
}

// ─── Вспомогательные функции для мутаций айтемов ──────────────────────────────

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
      case "task": return { ...item, text: newTitle } as Task
      case "shopping": return { ...item, name: newTitle } as ShoppingItem
      case "wishlist": return { ...item, title: newTitle } as WishlistItem
      case "idea": return { ...item, text: newTitle } as Idea
      default: return item
    }
  })
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
      result: null,

      userId: generateUserId(), // Сохраняется в localStorage навсегда
      roomId: null,
      roomStatus: "idle",
      roomError: null,
      partnerOnline: false,

      // ── Базовые действия ─────────────────────────────────────────────────────

      setMode: (mode) => set({ mode }),

      setRawInput: (value) => set({ rawInput: value, error: null }),

      reset: () =>
        set({
          rawInput: "",
          result: null,
          loading: false,
          error: null,
        }),

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

          set({ result: data, rawInput: "", loading: false })

          // В режиме МЫ — отправляем результат партнёру
          if (mode === "we" && roomId) {
            sendWS({
              type: "sync_result",
              roomId,
              userId,
              result: data,
            })
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
      // Каждый метод: 1) обновляет локально (оптимистично), 2) шлёт WS если режим МЫ

      toggleItem: (id) => {
        const { result, mode, roomId, userId } = get()
        if (!result) return

        // 1. Локальное обновление
        set({ result: { ...result, items: applyToggle(result.items, id) } })

        // 2. Синхронизация партнёру
        if (mode === "we" && roomId) {
          sendWS({ type: "toggle_item", roomId, userId, itemId: id })
        }
      },

      removeItem: (id) => {
        const { result, mode, roomId, userId } = get()
        if (!result) return

        set({ result: { ...result, items: applyRemove(result.items, id) } })

        if (mode === "we" && roomId) {
          sendWS({ type: "remove_item", roomId, userId, itemId: id })
        }
      },

      updateItemTitle: (id, newTitle) => {
        const { result, mode, roomId, userId } = get()
        if (!result) return

        set({ result: { ...result, items: applyUpdateTitle(result.items, id, newTitle) } })

        if (mode === "we" && roomId) {
          sendWS({ type: "update_item_title", roomId, userId, itemId: id, newTitle })
        }
      },

      // ── WebSocket ─────────────────────────────────────────────────────────────

      connectWS: () => {
        if (typeof window === "undefined") return
        if (wsInstance && wsInstance.readyState === WebSocket.OPEN) return

        const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4000"
        wsInstance = new WebSocket(WS_URL)

        wsInstance.onopen = () => {
          console.log("[WS] Connected")
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

            // Партнёр получил результат от AI — применяем к себе
            case "result_synced":
              store._applyResultSync(msg.result)
              break

            // Партнёр нажал на айтем — применяем
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
          set({ roomError: "Ошибка соединения", roomStatus: "error" })
        }
      },

      disconnectWS: () => {
        wsInstance?.close()
        wsInstance = null
      },

      // ── Комнаты ───────────────────────────────────────────────────────────────

      createRoom: () => {
        const { userId, connectWS, roomStatus } = get()

        // Убеждаемся что WS открыт
        if (!getWS()) connectWS()

        set({ roomStatus: "creating", roomError: null })

        // WS может ещё не открыться — ждём
        const tryCreate = () => {
          const ws = getWS()
          if (ws) {
            ws.send(JSON.stringify({ type: "create_room", userId }))
          } else {
            setTimeout(tryCreate, 100)
          }
        }
        tryCreate()
      },

      joinRoom: (roomId) => {
        const { userId, connectWS } = get()

        if (!getWS()) connectWS()

        set({ roomStatus: "joining", roomError: null })

        const tryJoin = () => {
          const ws = getWS()
          if (ws) {
            ws.send(JSON.stringify({ type: "join_room", roomId: roomId.toUpperCase(), userId }))
          } else {
            setTimeout(tryJoin, 100)
          }
        }
        tryJoin()
      },

      leaveRoom: () => {
        get().disconnectWS()
        set({
          roomId: null,
          roomStatus: "idle",
          roomError: null,
          partnerOnline: false,
          mode: "me", // Откат в личный режим
        })
      },

      // ── Внутренние методы (применяют события от партнёра) ────────────────────

      _applyToggle: (itemId) => {
        const { result } = get()
        if (!result) return
        set({ result: { ...result, items: applyToggle(result.items, itemId) } })
      },

      _applyRemove: (itemId) => {
        const { result } = get()
        if (!result) return
        set({ result: { ...result, items: applyRemove(result.items, itemId) } })
      },

      _applyUpdateTitle: (itemId, newTitle) => {
        const { result } = get()
        if (!result) return
        set({ result: { ...result, items: applyUpdateTitle(result.items, itemId, newTitle) } })
      },

      _applyResultSync: (result) => {
        set({ result })
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
      // userId персистим навсегда, roomId — нет (соединение не переживает перезагрузку)
      partialize: (state) => ({
        userId: state.userId,
        mode: state.mode,
        result: state.result,
      }),
    }
  )
)