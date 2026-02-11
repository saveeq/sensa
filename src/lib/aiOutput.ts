export type AIOutput = {
  tasks?: (
    | string
    | { task: string; completed?: boolean }
  )[]
  ideas?: string[]
  questions?: string[]
}