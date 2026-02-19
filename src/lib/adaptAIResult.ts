import type { AIOutput, RawItem } from "./aiOutput"
import type { AIResult, AnyItem, WorkSpaceOwner } from "./ai_contract"

export const adaptAIResult = (raw: AIOutput, mode: "me" | "we"): AIResult => {
  const owner: WorkSpaceOwner = mode === "we" ? "both" : "me"

  const items: AnyItem[] = raw.items
    .map((item: RawItem): AnyItem | null => {
      switch (item.type) {

        case "task":
          return {
            id: item.id,
            type: "task",
            owner,
            text: item.text,
            done: item.done ?? false,
            priority: item.priority,
            deadline: item.deadline,
          }

        case "idea":
          return {
            id: item.id,
            type: "idea",
            owner,
            text: item.text,
          }

        case "shopping_item":
          return {
            id: item.id,
            type: "shopping",   
            owner,
            name: item.name,
            quantity: item.quantity,
            bought: item.bought ?? false,
          }

        case "wishlist_item":
          return {
            id: item.id,
            type: "wishlist", 
            owner,
            title: item.title,
            rarity: item.rarity ?? "common",
            isGiftIdea: item.isGiftIdea ?? false,
            price: item.price,
            link: item.link,
          }

        case "additional_question":
          return {
            id: item.id,
            type: "question",
            owner,
            text: item.text,
          }

        default:
          console.warn("[adaptAIResult] Unknown item type:", (item as any).type)
          return null
      }
    })
    .filter((item): item is AnyItem => item !== null)

  return {
    title: raw.title ?? "Новый разбор",
    summary: raw.summary ?? `Обработано элементов: ${items.length}`,
    items,
  }
}