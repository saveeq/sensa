import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const BASE_URL = process.env.OPENROUTER_BASE_URL
const API_KEY = process.env.OPENROUTER_API_KEY

if (!BASE_URL) throw new Error("OPENROUTER_BASE_URL is not defined")
if (!API_KEY) throw new Error("OPENROUTER_API_KEY is not defined")

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const callAI = async (
  systemPrompt: string,
  userPrompt: string,
  delayMs: number = 1000 
): Promise<string> => {
  
  
  if (delayMs > 0) {
    await sleep(delayMs);
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Sensa Pet Project",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OPENROUTER ERROR:", err);
    throw new Error("OpenRouter request failed");
  }

  const data = await res.json();
  return data.choices[0].message.content;
}