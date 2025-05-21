import { NextResponse } from 'next/server'

const EXTERNAL_API_URL = 'https://ulasim.denizli.bel.tr/jsonotobusduraklar.ashx'

export async function GET() {
  try {
    const response = await fetch(EXTERNAL_API_URL, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Her seferinde yeni veri almak için
    })

    if (!response.ok) {
      throw new Error(`Harici API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Otobüs saatleri arama API route hatası:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Otobüs saatleri alınırken bir sunucu hatası oluştu.' },
      { status: 500 }
    )
  }
} 