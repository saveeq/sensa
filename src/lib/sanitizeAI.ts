export const sanitizeAIResponse = (raw: string): string => {
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  
  const firstBrace = cleaned.indexOf("{")
  const lastBrace = cleaned.lastIndexOf("}")

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in AI response")
  }

  return cleaned.slice(firstBrace, lastBrace + 1)
}