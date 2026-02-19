import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpaceSectionProps {
    title: string;
    children: React.ReactNode;
    count: number;
}

export const SpaceSection = ({ title, children, count }: SpaceSectionProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Высота одного элемента примерно 48px. 
    // 4 элемента + отступы ≈ 200px для превью.
    const previewHeight = 200;

    return (
        <div className="w-full relative bg-[#EaEaEa] rounded-2xl overflow-visible mb-10 transition-all duration-300">
            <div className="px-2.5 pb-2 bg-[#D9D9D9] rounded-t-2xl bg-opacity-50 flex justify-between items-center">
                <h3 className="text-[28px] font-light font-sans text-black tracking-tight">
                    {title}
                </h3>
                {count && (
                    <span className="text-s font-bold text-gray-400 uppercase tracking-widest">
                        {count}
                    </span>
                )}
            </div>

            {/* Контентная часть */}
            <motion.div
                layout
                initial={false}
                animate={{
                    height: isOpen ? "auto" : previewHeight,
                }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="relative overflow-hidden rounded-b-2xl"
            >
                <div className="pb-6 flex flex-col">
                    {children}
                </div>

                {/* Градиентный фейд (скрывает текст, если он не влезает в превью) */}
                {!isOpen && count > 4 && (
                    <div className="absolute z-11 bottom-0 left-0 w-full h-12 bg-linear-to-t from-[#EaEaEa] to-transparent pointer-events-none" />
                )}
            </motion.div>

            {/* Кнопка управления (стрелочка) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute z-12 right-1/2 bottom-[-25px] py-3 flex justify-center items-center transition-colors"
            >
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="flex flex-col items-center"
                >
                    <svg
                        width="16"
                        height="27"
                        viewBox="0 0 16 27"
                        fill="none"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M6.65685 25.7071C7.04738 26.0976 7.68054 26.0976 8.07107 25.7071L14.435 19.3431C14.8256 18.9526 14.8256 18.3195 14.435 17.9289C14.0445 17.5384 13.4113 17.5384 13.0208 17.9289L7.36396 23.5858L1.70711 17.9289C1.31658 17.5384 0.683417 17.5384 0.292892 17.9289C-0.0976319 18.3195 -0.0976319 18.9526 0.292892 19.3431L6.65685 25.7071ZM7.36396 0L6.36396 0L6.36396 25H7.36396H8.36396L8.36396 0L7.36396 0Z" fill="black" /> {/* Пример твоей стрелки */}
                    </svg>
                </motion.div>
            </button>
        </div>
    );
};