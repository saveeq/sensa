"use client"

import { useSensaStore } from "../store/useSensa"
import TaskList from "./TaskList"
import "@/src/Styles/index.css"

export default function ResultBlock() {
  const result = useSensaStore((s) => s.result)

  // ⬅️ ВАЖНО: проверяем items, а не только result
  if (!result || !Array.isArray(result.items)) {
    return null
  }

  return (
    <div className="space-y-6 pt-4 border-t border-neutral-800">
      {result.items.length > 0 && (
        <TaskList title={result.title} tasks={result.items} />
      )}

      <p className="text-sm text-neutral-500">
        {result.summary}
      </p>
    </div>
  )
}