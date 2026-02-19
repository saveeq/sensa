// src/components/WishlistItem.tsx
import React from "react"
import { motion, useMotionValue } from "framer-motion"
import type { WishlistItem as WishlistItemType } from "@/src/lib/ai_contract"
import { useSensaStore } from "@/src/store/useSensa"

const rarityConfig = {
  common:    { label: "обычное",    className: "text-gray-400 bg-gray-100" },
  rare:      { label: "редкое",     className: "text-blue-400 bg-blue-50" },
  epic:      { label: "эпическое",  className: "text-purple-400 bg-purple-50" },
  legendary: { label: "легенда",    className: "text-amber-500 bg-amber-50" },
}

export const WishlistItem = ({ item }: { item: WishlistItemType }) => {
  const removeItem = useSensaStore((s) => s.removeItem)
  const x = useMotionValue(0)

  const rarity = rarityConfig[item.rarity] ?? rarityConfig.common

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
        {/* Иконка подарка если это gift idea */}
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-sm pointer-events-none">
          {item.isGiftIdea ? "🎁" : "✨"}
        </div>

        {/* Основной контент */}
        <div className="flex w-full justify-between items-center min-w-0 pointer-events-none gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-sans font-light text-gray-800 truncate">
              {item.title}
            </span>
            {item.price && (
              <span className="text-xs text-gray-400 font-light">
                {item.price}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Редкость */}
            <span className={`text-[9px] whitespace-nowrap uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${rarity.className}`}>
              {rarity.label}
            </span>

            {/* Ссылка — единственный интерактивный элемент справа */}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto w-6 h-6 flex items-center justify-center
                           rounded-full bg-white/60 hover:bg-white transition-colors"
                onPointerDown={(e) => e.stopPropagation()} // Не мешать drag
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}