import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lineNo = searchParams.get("lineNo") || ""

  if (!lineNo) {
    return NextResponse.json(
      { error: "lineNo parametresi gerekli" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://ulasim.denizli.bel.tr/UlasimBackend/api/Calc/GetNextBusTime?lineNo=${lineNo}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Her seferinde yeni veri almak için
      }
    )

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Bir sonraki otobüs zamanı API hatası:", error)
    return NextResponse.json(
      { error: "Veri çekilemedi" },
      { status: 500 }
    )
  }
}

