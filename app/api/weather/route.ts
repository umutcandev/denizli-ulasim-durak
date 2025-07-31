import { NextResponse } from 'next/server'

interface WeatherData {
  temp_c: { '@data': string }
}

interface WeatherResponse {
  xml_api_reply: {
    weather: {
      current_conditions: WeatherData
    }
  }
}

export async function GET() {
  try {
    const response = await fetch('https://mobil.denizli.bel.tr/jsonService.ashx?s=HavaDurumu', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 } // 5 dakika cache
    })

    if (!response.ok) {
      throw new Error('Hava durumu verisi alınamadı')
    }

    const data: WeatherResponse = await response.json()
    
    if (!data.xml_api_reply?.weather?.current_conditions) {
      throw new Error('Hava durumu verisi formatı hatalı')
    }

    const currentConditions = data.xml_api_reply.weather.current_conditions

    return NextResponse.json({
      temperature: currentConditions.temp_c['@data']
    })

  } catch (error) {
    console.error('Hava durumu API hatası:', error)
    return NextResponse.json(
      { error: 'Hava durumu verisi alınamadı' },
      { status: 500 }
    )
  }
}