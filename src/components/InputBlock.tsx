import { useSensaStore } from "../store/useSensa.ts"
import "@/src/Styles/index.css"
import { useState } from "react"

import GradientText from './extras/GradientText.tsx'
import FadeContent from './extras/FadeContent.tsx'
import VoiceButton from "./VoiceButton.tsx"


export default function InputBlock() {
  const {
    rawInput,
    setRawInput,
    analyze,
    loading,
    error,
  } = useSensaStore()
  const [speechError, setSpeechError] = useState<string | null>(null)

  const handleVoiceResult = (transcript: string) => {
    const finalText = rawInput ? rawInput + ' ' + transcript : transcript
    setRawInput(finalText)
    setTimeout(() => analyze(), 50)
  }

  return (
    <FadeContent
      blur={true}
      duration={1000}
      easing="ease-out"
      initialOpacity={0}
      className="flex flex-col justify-center items-center">
      <span className="text-black w-full text-4xl font-light mb-3">
        Пиши что хочешь
      </span>
      <textarea
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="Че там че там"
        rows={6}
        className="w-full resize-none rounded-2xl bg-gray-300 p-4 text-2xl font-light outline-none focus:ring-2 focus:ring-white/20"
      />

      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}

      <div className="flex justify-center items-center gap-3 mt-4 w-full">
        <VoiceButton
          onResult={handleVoiceResult}
          onError={setSpeechError}
        />

        <button
          onClick={analyze}
          disabled={loading}
          className="min-w-30 h-17.5 rounded-3xl bg-gray-600 text-black font-light text-[40px] disabled:opacity-50"
        >
          <FadeContent blur={false} duration={400} easing="ease-out" key={loading ? 'loading' : 'idle'}>
            <GradientText
              colors={["#5227FF", "#FF9FFC", "#a3cbf0", "#8dceb5", "#cbdf96", "#e8c054", "#e17081", "#e6a8e1"]}
              animationSpeed={10}
              showBorder={true}
              className="custom-class transition-all duration-300 inline-block w-full h-full rounded-3xl"
            >
              {loading ? "..." : "ГАЗ!"}
            </GradientText>
          </FadeContent>

        </button>

      </div>
    </FadeContent>
  )
}