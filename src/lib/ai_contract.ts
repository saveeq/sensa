export type WorkSpaceOwner = "me" | "both"
export type TaskPriority = "low" | "medium" | "high"
export type WishRarity = "common" | "rare" | "epic" | "legendary"

export interface Task {
  id: string
  type: "task"
  owner: WorkSpaceOwner  
  text: string
  done: boolean
  deadline?: string
  priority?: TaskPriority
}

export interface Idea {
  id: string
  type: "idea"
  owner: WorkSpaceOwner
  text: string
}

export interface ShoppingItem {
  id: string
  type: "shopping"
  owner: WorkSpaceOwner
  name: string
  quantity?: string
  bought: boolean
}

export interface WishlistItem {
  id: string
  type: "wishlist"
  owner: WorkSpaceOwner
  title: string
  price?: string
  link?: string
  rarity: WishRarity
  isGiftIdea: boolean
}

export interface AdditionalQuestion {
  id: string
  type: "question"
  owner: WorkSpaceOwner
  text: string
}

export type AnyItem = Task | Idea | ShoppingItem | WishlistItem | AdditionalQuestion

export type AIResult = {
  title: string
  summary: string
  items: AnyItem[]
}