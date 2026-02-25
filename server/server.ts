import express from "express"
import router from "./api/route.ts"
import "./Ws.ts"


const app = express()
const PORT = 3001

app.use("/api", router)

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`)
})