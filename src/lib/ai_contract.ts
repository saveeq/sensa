export type Owner = "me" | "partner" | "both"
export type Priority = "low" | "medium" | "high"

export type Task = {
  id: string
  text: string
  done: boolean
}

export type Idea = {
  id: string
  title: string
}

export type Question = {
  id: string
  text: string
}

export type AIResult = {
  title: string
  summary: string
  items: Task[]
}