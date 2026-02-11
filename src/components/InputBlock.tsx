"use client"

import { useSensaStore } from "../store/useSensa.ts"
import "@/src/Styles/index.css"

export default function InputBlock() {
  const {
    rawInput,
    setRawInput,
    analyze,
    loading,
    error,
  } = useSensaStore()

  return (
    <div className="space-y-3">
      <textarea
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="Напиши всё, что в голове…"
        rows={6}
        className="w-full resize-none rounded-xl bg-neutral-900 p-4 text-sm outline-none focus:ring-2 focus:ring-white/20"
      />

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        onClick={analyze}
        disabled={loading}
        className="w-full rounded-xl bg-white py-2 text-black font-medium disabled:opacity-50"
      >
        {loading ? "Разбираю мысли…" : "Разобрать"}
      </button>
    </div>
  )
}