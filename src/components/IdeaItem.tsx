// src/components/IdeaItem.tsx
import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue } from "framer-motion"
import type { Idea } from "@/src/lib/ai_contract"
import { useSensaStore } from "@/src/store/useSensa"

export const IdeaItem = ({ item }: { item: Idea }) => {
  const removeItem = useSensaStore((s) => s.removeItem)
  const updateItemTitle = useSensaStore((s) => s.updateItemTitle)

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.text)
  const inputRef = useRef<HTMLInputElement>(null)
  const x = useMotionValue(0)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  // Синхронизируем editValue если item.text изменился снаружи (от партнёра)
  useEffect(() => {
    if (!isEditing) setEditValue(item.text)
  }, [item.text, isEditing])

  const handleCommit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== item.text) {
      updateItemTitle(item.id, trimmed)
    } else {
      setEditValue(item.text)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCommit()
    if (e.key === "Escape") {
      setEditValue(item.text)
      setIsEditing(false)
    }
  }

  return (
    <div className="relative overflow-hidden bg-[#EaEaEa] touch-pan-y">
      {/* Кнопка удаления */}
      <button
        className="absolute right-0 top-0 bottom-0 w-[80px] bg-red-500 flex items-center justify-center z-0"
        onPointerDown={(e) => {
          e.stopPropagation()
          removeItem(item.id)
        }}
      >
        <span className="text-white text-[10px] font-bold uppercase pointer-events-none">
          Удалить
        </span>
      </button>

      <motion.div
        layout
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        className="relative z-10 bg-[#EaEaEa] flex py-3 px-4 items-center gap-3 border-b border-gray-100 last:border-none cursor-grab active:cursor-grabbing"
      >
        {/* Иконка идеи */}
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-sm pointer-events-none">
          💡
        </div>

        {/* Текст / инпут */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleCommit}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-xl font-light font-sans text-gray-800
                         outline-none border-b border-black/30 focus:border-black
                         transition-colors duration-150 py-0.5"
            />
          ) : (
            <span
              className="block text-xl font-sans font-light text-gray-800 truncate cursor-text"
              onDoubleClick={() => setIsEditing(true)}
            >
              {item.text}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}