import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const recordCount = searchParams.get("recordCount") || "6"

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat ve lng parametreleri gerekli" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://ulasim.denizli.bel.tr/UlasimBackend/api/Calc/GetAllStations?&lat=${lat}&lng=${lng}&recordCount=${recordCount}`,
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
    console.error("Yakın duraklar API hatası:", error)
    return NextResponse.json(
      { error: "Veri çekilemedi" },
      { status: 500 }
    )
  }
}

