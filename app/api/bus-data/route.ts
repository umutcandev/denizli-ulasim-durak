import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stationId = searchParams.get("stationId") || ""
  const routeCode = searchParams.get("routeCode") || ""

  try {
    const response = await fetch(
      `https://ulasim.denizli.bel.tr/UlasimBackend/api/Calc/GetBusDataForStation?waitingStation=${stationId}&routeCode=${routeCode}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Her seferinde yeni veri almak için
      },
    )

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API hatası:", error)
    return NextResponse.json({ error: "Veri çekilemedi" }, { status: 500 })
  }
}
