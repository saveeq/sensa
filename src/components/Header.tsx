"use client"

import { useSensaStore } from "../store/useSensa.ts"
import "@/src/Styles/index.css"

export default function Header() {
  const { mode, setMode } = useSensaStore()

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">MindSorter</h1>

      <div className="flex rounded-lg bg-neutral-800 p-1">
        {["me", "we"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as "me" | "we")}
            className={`px-3 py-1 rounded-md text-sm transition ${
              mode === m
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {m === "me" ? "Я" : "Мы"}
          </button>
        ))}
      </div>
    </div>
  )
}