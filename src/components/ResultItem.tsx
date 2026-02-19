// src/components/ResultView.tsx
// Главный компонент который рендерит все секции.
// Фильтрует айтемы по режиму: "me" → только owner="me", "we" → owner="both"

"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useSensaStore } from "@/src/store/useSensa"
import { SpaceSection } from "./SpaceSection"
import { TaskItem } from "./TaskItem"
import { IdeaItem } from "./IdeaItem"
import { ShoppingItem } from "./ShoppingItem"
import { WishlistItem } from "./WishlistItem"
import type { AnyItem, Task, Idea, ShoppingItem as ShoppingItemType, WishlistItem as WishlistItemType } from "@/src/lib/ai_contract"

export const ResultView = () => {
  const result = useSensaStore((s) => s.result)
  const mode = useSensaStore((s) => s.mode)

  if (!result) return null

  // Фильтрация по режиму
  // "me"  → показываем только owner="me"   (личные задачи)
  // "we"  → показываем только owner="both" (совместные)
  const filteredItems: AnyItem[] = result.items.filter((item) => {
    if (mode === "me") return item.owner === "me"
    if (mode === "we") return item.owner === "both"
    return true
  })

  // Разбиваем по типу
  const tasks     = filteredItems.filter((i): i is Task             => i.type === "task")
  const ideas     = filteredItems.filter((i): i is Idea             => i.type === "idea")
  const shopping  = filteredItems.filter((i): i is ShoppingItemType => i.type === "shopping")
  const wishlist  = filteredItems.filter((i): i is WishlistItemType => i.type === "wishlist")

  const hasAnything = tasks.length + ideas.length + shopping.length + wishlist.length > 0

  if (!hasAnything) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-gray-400 font-light text-center mt-8"
      >
        {mode === "me" ? "Нет личных пунктов" : "Нет совместных пунктов"}
      </motion.p>
    )
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Заголовок результата */}
      {result.title && (
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-light text-black mb-2"
        >
          {result.title}
        </motion.h2>
      )}

      {/* Задачи */}
      <AnimatePresence>
        {tasks.length > 0 && (
          <SpaceSection title="Задачи" count={tasks.length}>
            {tasks.map((item) => (
              <TaskItem key={item.id} item={item} />
            ))}
          </SpaceSection>
        )}
      </AnimatePresence>

      {/* Идеи */}
      <AnimatePresence>
        {ideas.length > 0 && (
          <SpaceSection title="Идеи" count={ideas.length}>
            {ideas.map((item) => (
              <IdeaItem key={item.id} item={item} />
            ))}
          </SpaceSection>
        )}
      </AnimatePresence>

      {/* Покупки */}
      <AnimatePresence>
        {shopping.length > 0 && (
          <SpaceSection title="Покупки" count={shopping.length}>
            {shopping.map((item) => (
              <ShoppingItem key={item.id} item={item} />
            ))}
          </SpaceSection>
        )}
      </AnimatePresence>

      {/* Вишлист */}
      <AnimatePresence>
        {wishlist.length > 0 && (
          <SpaceSection title="Вишлист" count={wishlist.length}>
            {wishlist.map((item) => (
              <WishlistItem key={item.id} item={item} />
            ))}
          </SpaceSection>
        )}
      </AnimatePresence>
    </div>
  )
}