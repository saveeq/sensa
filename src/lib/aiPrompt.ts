export const SYSTEM_PROMPT = `
Extract tasks, ideas and questions from the user input.

Return JSON with keys:
- tasks (array)
- ideas (array)
- questions (array)

Tasks can be strings or objects with "task" and optional "completed".

Return ONLY valid JSON.
`

export const SYSTEM_PROMPT_STRICT = `
Ты НАРУШИЛ формат ответа.

Верни ТОЛЬКО валидный JSON.
Никакого текста.
Никаких комментариев.
Никакого Markdown.

Формат:
{
  tasks: [],
  ideas: [],
  questions: []
}
`