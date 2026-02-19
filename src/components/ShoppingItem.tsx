// src/components/ShoppingItem.tsx
import React from "react"
import { motion, useMotionValue } from "framer-motion"
import type { ShoppingItem as ShoppingItemType } from "@/src/lib/ai_contract"
import { useSensaStore } from "@/src/store/useSensa"

export const ShoppingItem = ({ item }: { item: ShoppingItemType }) => {
  const toggleItem = useSensaStore((s) => s.toggleItem)
  const removeItem = useSensaStore((s) => s.removeItem)
  const x = useMotionValue(0)

  return (
    <div className="relative overflow-hidden bg-[#EaEaEa] touch-pan-y">
      {/* Кнопка удаления за карточкой */}
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
        {/* Чекбокс — корзинка */}
        <motion.button
          onTap={(e) => {
            e.stopPropagation()
            toggleItem(item.id)
          }}
          className={`w-5 h-5 flex items-center justify-center rounded-sm border transition-all shrink-0 active:scale-90
            ${item.bought
              ? "bg-gray-300 border-gray-300"
              : "bg-white border-gray-400"
            }`}
        >
          {item.bought && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </motion.button>

        {/* Текст + количество */}
        <div className="flex w-full justify-between items-center min-w-0 pointer-events-none">
          <span
            className={`text-xl font-sans font-light transition-all truncate
              ${item.bought ? "text-gray-300 line-through" : "text-gray-800"}`}
          >
            {item.name}
          </span>

          {item.quantity && !item.bought && (
            <span className="text-[9px] whitespace-nowrap uppercase tracking-widest text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded ml-2">
              {item.quantity}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
}