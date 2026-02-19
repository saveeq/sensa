type TaskPriority = "low" | "medium" | "high"
type WishRarity = "common" | "rare" | "epic" | "legendary"

export type RawTask = {
  type: "task"
  id: string
  text: string
  done: boolean
  deadline?: string  
  priority?: TaskPriority
}

export type RawIdea = {
  type: "idea"
  id: string
  text: string
}

export type RawShoppingItem = {
  type: "shopping_item"  
  id: string
  name: string
  quantity?: string
  bought: boolean
}

export type RawWishlistItem = {
  type: "wishlist_item"  
  id: string
  title: string
  rarity: WishRarity
  isGiftIdea: boolean
  price?: string
  link?: string
}

export type RawAdditionalQuestion = {
  type: "additional_question"  
  id: string
  text: string
}

export type RawItem =
  | RawTask
  | RawIdea
  | RawShoppingItem
  | RawWishlistItem
  | RawAdditionalQuestion

export type AIOutput = {
  title?: string
  summary?: string
  items: RawItem[]
}