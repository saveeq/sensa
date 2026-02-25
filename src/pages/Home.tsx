// src/pages/Home.tsx
import { useEffect } from "react"
import Header from "../components/Header"
import InputBlock from "../components/InputBlock"
import { ResultView } from "../components/ResultItem"
import RoomBlock from "../components/RoomBlock"
import { useSensaStore } from "../store/useSensa"
import "@/src/Styles/index.css"

export default function Home() {
  const { roomId, roomStatus, rejoinRoom } = useSensaStore()

  useEffect(() => {
    // Если в localStorage сохранилась комната — пробуем переподключиться
    if (roomId && roomStatus === "connected") {
      rejoinRoom()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="max-w-2xl mx-auto px-5 space-y-6">
        <Header />
        <RoomBlock />
        <InputBlock />
        <ResultView />
      </div>
    </main>
  )
}