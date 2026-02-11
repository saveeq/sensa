export type WorkSpaceOwner = "me" | "both"
export type TaskPriority = "low" | "medium" | "high"
export type WishRarity = "common" | "rare" | "epic" | "legendary"

export interface Task {
  id: string
  text: string
  done: boolean
  deadline?: Date
  description?: string
  priority?: TaskPriority
  tags?: string[]
}

export interface Idea {
  id: string
  title: string
  description?: string
}

export interface ShoppingItem {
  id: string
  name: string
  quantity?: string 
  bought: boolean
}

export interface WishlistItem {
  id: string
  title: string
  price?: string
  link?: string
  rarity: WishRarity
  isGiftIdea: boolean // пометка, если это идея для подарка
}

export interface AdditionalQuestion  {
  id: string
  text: string
}

export type AIResult = {
  title: string
  summary: string
  items: Task[] | Idea[] | AdditionalQuestion[] | 
}