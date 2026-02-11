import type { AIOutput } from "./aiOutput"
import type { AIResult } from "./ai_contract"

export const adaptAIResult = (raw: AIOutput): AIResult => {
  const items = (raw.tasks ?? []).map((t, index) => {
    if (typeof t === "string") {
      return {
        id: `task-${index}`,
        text: t,
        done: false,
      }
    }

    return {
      id: `task-${index}`,
      text: t.task,
      done: t.completed ?? false,
    }
  })

  return {
    title: "Задачи",
    summary: `Найдено задач: ${items.length}`,
    items,
  }
}