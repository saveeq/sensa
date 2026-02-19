import Header from "../components/Header"
import InputBlock from "../components/InputBlock"
import { ResultView } from "../components/ResultItem"
import "@/src/Styles/index.css"

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="max-w-2xl mx-auto px-5 space-y-6">
        <Header />
        <InputBlock />
        <ResultView />
      </div>
    </main>
  )
}