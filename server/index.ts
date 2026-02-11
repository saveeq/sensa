import express from "express"
import router from "./api/route.ts"


const app = express()
const PORT = 3001

console.log("BASE:", process.env.LOCAL_AI_BASE_URL)
console.log("KEY:", process.env.LOCAL_AI_API_KEY?.slice(0, 6))

app.use("/api", router)

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`)
})