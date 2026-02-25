import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSensaStore } from "../store/useSensa"

export default function RoomBlock() {
  const { mode, roomId, roomStatus, roomError, partnerOnline, createRoom, joinRoom, leaveRoom } =
    useSensaStore()

  const [inputCode, setInputCode] = useState("")
  const [view, setView] = useState<"idle" | "create" | "join">("idle")

  if (mode !== "we") return null

  if (roomStatus === "connected" && roomId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="w-full bg-[#EaEaEa] rounded-2xl px-5 py-4 flex items-center justify-between"
      >
        {/* Код комнаты */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
            Комната
          </span>
          <span className="text-2xl font-light tracking-widest text-black">
            {roomId}
          </span>
        </div>

        {/* Статус партнёра */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              partnerOnline ? "bg-green-400" : "bg-gray-300"
            }`}
          />
          <span className="text-sm font-light text-gray-500">
            {partnerOnline ? "Партнёр онлайн" : "Ждём партнёра"}
          </span>
        </div>

        {/* Выйти */}
        <button
          onClick={leaveRoom}
          className="text-[10px] uppercase tracking-widest text-gray-400 font-bold hover:text-red-400 transition-colors"
        >
          Выйти
        </button>
      </motion.div>
    )
  }

  // ── Экран выбора (idle) ────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full bg-[#EaEaEa] rounded-2xl overflow-hidden"
    >
      <AnimatePresence mode="wait">

        {/* ── idle: два варианта ─────────────────────────────────────────── */}
        {view === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex"
          >
            <button
              onClick={() => {
                setView("create")
                createRoom()
              }}
              className="flex-1 py-5 flex flex-col items-center gap-1 hover:bg-[#E0E0E0] transition-colors"
            >
              <span className="text-2xl font-light text-black">Создать</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                новая комната
              </span>
            </button>

            <div className="w-px bg-gray-300" />

            <button
              onClick={() => setView("join")}
              className="flex-1 py-5 flex flex-col items-center gap-1 hover:bg-[#E0E0E0] transition-colors"
            >
              <span className="text-2xl font-light text-black">Войти</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                есть код
              </span>
            </button>
          </motion.div>
        )}

        {/* ── create: ждём код ──────────────────────────────────────────── */}
        {view === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 py-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                Отправь этот код партнёру
              </span>
              <button
                onClick={() => setView("idle")}
                className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                ✕
              </button>
            </div>

            {roomStatus === "creating" ? (
              <div className="h-10 flex items-center">
                <span className="text-gray-400 font-light animate-pulse">Создаём комнату...</span>
              </div>
            ) : roomStatus === "error" ? (
              <div className="flex flex-col gap-2">
                <span className="text-red-400 font-light text-sm">{roomError}</span>
                <button
                  onClick={() => {
                    setView("idle")
                  }}
                  className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors self-start"
                >
                  Назад
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-3xl font-light tracking-[0.2em] text-black">
                  {roomId}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(roomId ?? "")}
                  className="text-[10px] uppercase tracking-widest text-gray-400 font-bold hover:text-black transition-colors"
                >
                  Копировать
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── join: ввод кода ───────────────────────────────────────────── */}
        {view === "join" && (
          <motion.div
            key="join"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 py-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                Введи код комнаты
              </span>
              <button
                onClick={() => {
                  setView("idle")
                  setInputCode("")
                }}
                className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3 items-center">
              <input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputCode.length >= 6) joinRoom(inputCode)
                }}
                placeholder="A3F9B2C1"
                maxLength={8}
                className="flex-1 bg-white rounded-xl px-4 py-2.5 text-xl font-light tracking-widest outline-none focus:ring-2 focus:ring-black/10 placeholder:text-gray-300"
              />
              <button
                onClick={() => joinRoom(inputCode)}
                disabled={inputCode.length < 6 || roomStatus === "joining"}
                className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-light disabled:opacity-30 transition-opacity"
              >
                {roomStatus === "joining" ? "..." : "Войти"}
              </button>
            </div>

            {roomStatus === "error" && (
              <span className="text-red-400 font-light text-sm">{roomError}</span>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}