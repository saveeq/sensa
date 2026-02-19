import { useSensaStore } from "../store/useSensa.ts"
import "@/src/Styles/index.css"
import FadeContent from "./extras/FadeContent.tsx"

export default function Header() {
  const { mode, setMode } = useSensaStore()

  return (
    <FadeContent
      blur={true} 
      duration={1000} 
      easing="ease-out" 
      initialOpacity={0}
      className="flex font-sans flex-col gap-2.5 mb-22.5">
      <div className="flex items-center leading-normal justify-between">
        <h1 className="text-2xl font-extrabold">sensa</h1>
        <h1 className="text-2xl font-extrabold">сенса</h1>
      </div>
      <div className="flex justify-between max-h-10 font-sans">
        {["me", "we"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as "me" | "we")}
            className={`text-3xl text-black transition-all duration-150 ease-in-out ${mode === m
              ? "font-bold text-[40px]"
              : "text-gray-300 font-normal"
              }`}
          >
            {m === "me" ? "Я" : "МЫ"}
          </button>
        ))}
      </div>
    </FadeContent>
  )
}