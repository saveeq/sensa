export const buildUserPrompt = (
  rawInput: string,
  mode: "me" | "we"
) => `
Текст пользователя:
${rawInput}

Режим: ${mode}

Верни результат строго в формате AIResult JSON.
`