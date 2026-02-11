import Header from "../components/Header"
import InputBlock from "../components/InputBlock"
import ResultBlock from "../components/ResultBlock"
import "@/src/Styles/index.css"

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Header />
        <InputBlock />
        <ResultBlock />
      </div>
    </main>
  )
}