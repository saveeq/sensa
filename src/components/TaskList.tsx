"use client"

import type { Task } from "../lib/ai_contract"
import { useSensaStore } from "../store/useSensa"
import "@/src/Styles/index.css"

export default function TaskList({
  title,
  tasks,
}: {
  title: string
  tasks: Task[]
}) {
  const { toggleTask } = useSensaStore()

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-neutral-400">
        {title}
      </h3>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-lg bg-neutral-900 px-3 py-2"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(task.id)}
              className="accent-white"
            />

            <span
              className={`text-sm ${
                task.done ? "line-through text-neutral-500" : ""
              }`}
            >
              {task.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}