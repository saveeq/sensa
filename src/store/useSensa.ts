import { create } from "zustand"
import type { Task, AIResult } from "@/src/lib/ai_contract"

type Mode = "me" | "we"

type SensaState = {
  // UI state
  mode: Mode
  rawInput: string
  loading: boolean
  error: string | null

  // AI result
  result: AIResult | null

  // actions
  setMode: (mode: Mode) => void
  setRawInput: (value: string) => void

  analyze: () => Promise<void>
  toggleTask: (taskId: string) => void
  reset: () => void
}

export const useSensaStore = create<SensaState>((set, get) => ({
  // -------- initial state --------
  mode: "me",
  rawInput: "",
  loading: false,
  error: null,
  result: null,

  // -------- setters --------
  setMode: (mode) => set({ mode }),

  setRawInput: (value) =>
    set({
      rawInput: value,
      error: null,
    }),

  // -------- main action --------
  analyze: async () => {
    const { rawInput, mode } = get()
    if (!rawInput.trim()) return

    set({ loading: true, error: null })

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput, mode }),
      })

      if (!res.ok) {
        throw new Error("AI request failed")
      }

      const data: AIResult = await res.json()

      set({
        result: data,
        rawInput: "",
        loading: false,
      })
    } catch (err) {
      console.error(err)
      set({
        loading: false,
        error: "Не удалось разобрать текст. Попробуй ещё раз.",
      })
    }
  },

  // -------- task actions --------
  toggleTask: (id) =>
  set((state) => ({
    result: state.result
      ? {
          ...state.result,
          items: state.result.items.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        }
      : null,
  })),

  // -------- reset --------
  reset: () =>
    set({
      rawInput: "",
      result: null,
      loading: false,
      error: null,
    }),
}))