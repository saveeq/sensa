import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface VoiceButtonProps {
  onResult: (transcript: string) => void  // что делать с текстом — решает родитель
  onError?: (message: string) => void
}

export default function VoiceButton({ onResult, onError }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>("")

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      onError?.("Браузер не поддерживает голосовой ввод")
      return
    }

    transcriptRef.current = ""

    const recognition = new SpeechRecognition()
    recognition.lang = 'ru-RU'
    recognition.interimResults = false
    recognition.continuous = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onresult = (event: any) => {
      let collected = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        collected += event.results[i][0].transcript + " "
      }
      transcriptRef.current += collected
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') onError?.("Нет доступа к микрофону")
      else if (event.error !== 'no-speech') onError?.("Ошибка записи")
    }

    recognition.start()
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)

    const transcript = transcriptRef.current.trim()
    if (transcript) onResult(transcript)
  }

  return (
    <button
      onPointerDown={startListening}
      onPointerUp={stopListening}
      onPointerLeave={stopListening}
      className={`relative h-17.5 w-17.5 rounded-3xl flex items-center justify-center transition-all duration-200 shrink-0 select-none
        ${isListening ? 'bg-black scale-95' : 'bg-gray-300 hover:bg-gray-400'}`}
    >
      {isListening && (
        <motion.span
          className="absolute inset-0 rounded-3xl bg-black"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isListening ? "white" : "#555"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative z-10"
      >
        <rect x="9" y="2" width="6" height="11" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="9" y1="22" x2="15" y2="22" />
      </svg>
    </button>
  )
}