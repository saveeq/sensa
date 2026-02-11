export const analyzeText = async (
  rawInput: string,
  mode: "me" | "we"
) => {
  const res = await fetch("http://localhost:3001/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawInput, mode }),
  })

  if (!res.ok) throw new Error("Analyze failed")
  return res.json()
}