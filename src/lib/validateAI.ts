import type { AIOutput, RawItem } from "./aiOutput"

const VALID_RARITIES = ["common", "rare", "epic", "legendary"]
const VALID_TYPES = ["task", "shopping_item", "wishlist_item", "idea", "additional_question"]

// Мягкая валидация + автоисправление вместо жёсткого AJV
// Не бросаем ошибку — чиним что можем, выбрасываем только совсем сломанное
export const validateAIResult = (data: any): AIOutput => {
  if (!data || typeof data !== "object") {
    throw new Error("AI response is not an object")
  }

  // Чиним корневые поля
  if (!data.title) data.title = "Новый разбор"
  if (!data.summary) data.summary = "Разобрано успешно"
  if (!Array.isArray(data.items)) {
    throw new Error("AI response missing items array")
  }

  // Фильтруем и чиним items
  data.items = data.items
    .filter((item: any) => {
      if (!item || typeof item !== "object") return false
      if (!VALID_TYPES.includes(item.type)) {
        console.warn(`[validate] Skipping unknown type: ${item.type}`)
        return false
      }
      return true
    })
    .map((item: any) => {
      // Гарантируем id
      if (!item.id) {
        item.id = crypto.randomUUID()
      }

      // Чиним rarity у wishlist_item
      if (item.type === "wishlist_item") {
        if (!VALID_RARITIES.includes(item.rarity)) {
          console.warn(`[validate] Invalid rarity "${item.rarity}", defaulting to "common"`)
          item.rarity = "common"
        }
        if (typeof item.isGiftIdea !== "boolean") item.isGiftIdea = false
        if (!item.title) item.title = "Без названия"
      }

      // Чиним task
      if (item.type === "task") {
        if (!item.text) item.text = "Без названия"
        if (typeof item.done !== "boolean") item.done = false
      }

      // Чиним shopping_item
      if (item.type === "shopping_item") {
        if (!item.name) item.name = "Без названия"
        if (typeof item.bought !== "boolean") item.bought = false
      }

      // Чиним idea / additional_question
      if (item.type === "idea" || item.type === "additional_question") {
        if (!item.text) item.text = item.title ?? "Без названия"
      }

      return item
    })

  if (data.items.length === 0) {
    throw new Error("No valid items after validation")
  }

  return data as AIOutput
}