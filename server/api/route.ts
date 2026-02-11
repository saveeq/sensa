import express from "express"
import cors from "cors"

import { callAI } from "../../src/lib/ai"
import { sanitizeAIResponse } from "../../src/lib/sanitizeAI"
import { validateAIResult } from "../../src/lib/validateAI"
import { SYSTEM_PROMPT, SYSTEM_PROMPT_STRICT } from "../../src/lib/aiPrompt"
import { buildUserPrompt } from "../../src/lib/userPrompt"

import { adaptAIResult } from "../../src/lib/adaptAIResult"
import { AIOutput } from "../../src/lib/aiOutput"
import { AIResult } from "../../src/lib/ai_contract"

const router = express.Router()

router.use(cors())
router.use(express.json())

router.post("/analyze", async (req, res) => {
  console.log("➡️ /api/analyze called")

  try {
    const { rawInput, mode } = req.body

    if (!rawInput || !mode) {
      return res.status(400).json({ error: "Invalid input" })
    }

    const userPrompt = buildUserPrompt(rawInput, mode)

    const runAI = async (systemPrompt: string): Promise<AIResult> => {
      const aiRaw = await callAI(systemPrompt, userPrompt)

      console.log("🤖 RAW AI RESPONSE:\n", aiRaw)

      // 1. парсим то, что пришло от модели
      const parsed = JSON.parse(
        sanitizeAIResponse(aiRaw)
      ) as AIOutput

      // 2. АДАПТИРУЕМ в формат приложения
      const adapted = adaptAIResult(parsed)

      // 3. ВАЛИДИРУЕМ УЖЕ АДАПТИРОВАННЫЙ РЕЗУЛЬТАТ
      validateAIResult(adapted)

      return adapted
    }
    let result: AIResult | null = null
    let lastError: any = null

    // 🔒 РУЧНОЙ retry, БЕЗ абстракций
    for (const prompt of [SYSTEM_PROMPT, SYSTEM_PROMPT_STRICT]) {
      try {
        result = await runAI(prompt)
        break
      } catch (err) {
        console.error("AI attempt failed:", err)
        lastError = err
      }
    }

    if (!result) {
      console.error("❌ All AI attempts failed:", lastError)
      return res.status(502).json({
        error: "AI failed to generate valid response",
      })
    }

    return res.json(result)

  } catch (err) {
    console.error("🔥 FATAL /api/analyze error:", err)
    return res.status(500).json({
      error: "Internal server error",
    })
  }
})

export default router