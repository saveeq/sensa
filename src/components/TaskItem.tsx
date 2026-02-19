import { motion, useMotionValue } from 'framer-motion';
import type { Task } from "@/src/lib/ai_contract";
import { useSensaStore } from "../store/useSensa";

export const TaskItem = ({ item }: { item: Task }) => {
  const toggleItem = useSensaStore((s) => s.toggleItem);
  const removeItem = useSensaStore((s) => s.removeItem);
  const x = useMotionValue(0);

  const priorityColors: Record<string, string> = {
    high: "bg-[#B85A5A]",
    medium: "bg-[#C4BF95]",
    low: "bg-[#9AB9AB]",
  };

  const checkColor = item.done ? "bg-gray-300" : (priorityColors[item.priority || 'low']);
  const textColor = item.done ? "text-gray-300 line-through" : "text-gray-800";

  return (
    <div className="relative overflow-hidden bg-[#EaEaEa] touch-pan-y">
      {/* Кнопка удаления — добавили z-0 и проверку клика */}
      <button
        className="absolute right-0 top-0 bottom-0 w-[80px] bg-red-500 flex items-center justify-center z-0"
        onPointerDown={(e) => {
          e.stopPropagation();
          removeItem(item.id);
        }}
      >
        <span className="text-white text-[10px] font-bold uppercase pointer-events-none">
          Удалить
        </span>
      </button>

      {/* Контент задачи */}
      <motion.div
        layout
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        // Остановка распространения события, чтобы драг не мешал клику по чекбоксу
        className="relative z-10 bg-[#EaEaEa] flex py-3 px-4 items-center gap-3 border-b border-gray-100 last:border-none cursor-grab active:cursor-grabbing"
      >
        {/* Кнопка-чекбокс: используем stopPropagation, чтобы drag не начинался при клике на чекбокс */}
        <motion.button
          onTap={(e) => {
            e.stopPropagation();
            toggleItem(item.id);
          }}
          className={`w-4 h-4 ${checkColor} transition-colors shrink-0 active:scale-90`}
        />

        <div className="flex w-full justify-between items-center min-w-0 pointer-events-none">
          <span className={`text-xl font-sans font-light transition-all truncate ${textColor}`}>
            {item.text}
          </span>

          {item.deadline && !item.done && (
            <span className="text-[9px] whitespace-nowrap uppercase tracking-widest text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded ml-2">
              {new Date(item.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};