import express from "express"
import cors from "cors"

import { callAI } from "../../src/lib/ai"
import { sanitizeAIResponse } from "../../src/lib/sanitizeAI"
import { validateAIResult } from "../../src/lib/validateAI"
import { SYSTEM_PROMPT, SYSTEM_PROMPT_STRICT } from "../../src/lib/aiPrompt"
import { buildUserPrompt } from "../../src/lib/userPrompt"
import { retry } from "../../src/lib/retryAI"
import { adaptAIResult } from "../../src/lib/adaptAIResult"
import type { AIOutput } from "../../src/lib/aiOutput"

const router = express.Router()

router.use(cors())
router.use(express.json())

router.post("/analyze", async (req, res) => {
  const { rawInput, mode } = req.body
  if (!rawInput || !mode) return res.status(400).json({ error: "Invalid input" })

  const userPrompt = buildUserPrompt(rawInput, mode)
  let currentSystemPrompt = SYSTEM_PROMPT

  try {
    const result = await retry(async () => {
      const aiRaw = await callAI(currentSystemPrompt, userPrompt)
      console.log("Raw AI response:", aiRaw)

      const parsed = JSON.parse(sanitizeAIResponse(aiRaw)) as AIOutput
      console.log("Parsed AI response:", parsed)

      // Порядок важен:
      // 1. Валидируем RAW ответ от AI по схеме (схема описывает сырые типы)
      // 2. Только потом адаптируем в контракт (нормализуем типы: shopping_item → shopping)
      validateAIResult(parsed)

      const adapted = adaptAIResult(parsed, mode)
      console.log("Adapted AI response:", adapted)

      return adapted
    }, {
      retries: 2,
      onRetry: (attempt) => {
        console.warn(`Attempt ${attempt} failed. Switching to STRICT prompt.`)
        currentSystemPrompt = SYSTEM_PROMPT_STRICT
      }
    })

    res.json(result)
  } catch (err: any) {
    console.error("Final failure:", err)
    res.status(502).json({ error: "AI processing failed after retries" })
  }
})

export default router