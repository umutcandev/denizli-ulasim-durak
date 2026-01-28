// Otobüs verilerini çekmek için API fonksiyonu
import { cleanUrl } from "@/lib/utils"

export async function fetchBusData(stationId: string, routeCode = "") {
  try {
    // Kendi API route'umuzu kullanarak CORS sorununu aşıyoruz
    const response = await fetch(`/api/bus-data?stationId=${stationId}&routeCode=${routeCode}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Her seferinde yeni veri almak için
    })

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()

    if (!data.isSuccess && !data.value) {
      throw new Error("API başarısız yanıt döndü")
    }

    return data.value || data
  } catch (error) {
    console.error("Veri çekme hatası:", error)
    throw error
  }
}

export async function fetchAllStations() {
  try {
    const response = await fetch("https://ulasim.denizli.bel.tr/UlasimBackend/api/Calc/GetWaitingStations", {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Durak listesi çekme hatası:", error)
    throw error
  }
}

// Otobüs saatlerini çekmek için API fonksiyonu
export async function fetchBusSchedules() {
  try {
    const response = await fetch("/api/bus-schedules", {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Her seferinde yeni veri almak için
    })

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()

    // Otobüs hat numaralarını ve saat resim URL'lerini içeren bir nesne oluştur
    const scheduleUrls: Record<string, string> = {}

    if (data && data.otobus && Array.isArray(data.otobus)) {
      data.otobus.forEach((bus: any) => {
        if (bus.HatNo && bus.SaatResim) {
          scheduleUrls[bus.HatNo] = cleanUrl(bus.SaatResim)
        }
      })
    }

    return scheduleUrls
  } catch (error) {
    console.error("Otobüs saatleri çekme hatası:", error)
    return {} // Hata durumunda boş nesne dön
  }
}

// Bir sonraki otobüs kalkış zamanını çekmek için API fonksiyonu
export async function fetchNextBusTime(lineNo: string) {
  try {
    const response = await fetch(`/api/next-bus-time?lineNo=${lineNo}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Her seferinde yeni veri almak için
    })

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()

    if (data.isSuccess && data.value && data.value.busTime) {
      return data.value.busTime // ISO 8601 formatında zaman döner: "2025-11-18T23:15:00"
    }

    return null
  } catch (error) {
    console.error("Bir sonraki otobüs zamanı çekme hatası:", error)
    return null
  }
}

// Güzergah duraklarını çekmek için API fonksiyonu
export async function fetchRouteStations(routeCode: string) {
  try {
    const response = await fetch(`/api/route-stations?routeCode=${routeCode}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()

    if (!data.isSuccess) {
      throw new Error("API başarısız yanıt döndü")
    }

    return data.value
  } catch (error) {
    console.error("Güzergah durakları çekme hatası:", error)
    throw error
  }
}

// Canlı otobüs verilerini çekmek için API fonksiyonu
export async function fetchLiveData(lineCode: string) {
  try {
    const response = await fetch(`/api/live-data?lineCode=${lineCode}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()

    if (!data.isSuccess) {
      throw new Error("API başarısız yanıt döndü")
    }

    return data.value || []
  } catch (error) {
    console.error("Canlı veri çekme hatası:", error)
    throw error
  }
}

// Kart bilgisi tip tanımlaması
export interface CardInfo {
  mifareId: string
  cardType: string
  cardTypeDescription: string
  productionDate: string
  lastTransactionDate: string
  currentBalance: string
  name: string
  surname: string
  validityStartDate: string
  validityEndDate: string
  cardStatus: string
  citizenshipNumber: string
  remainingPass: string
  subscriptionStartDateTime: string
  subscriptionEndDateTime: string
  subscriptionPlatform: string
}

// Kart bilgilerini çekmek için API fonksiyonu
export async function fetchCardInfo(mifareId: string): Promise<CardInfo[]> {
  try {
    const response = await fetch(`/api/card-info?mifareId=${encodeURIComponent(mifareId)}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`)
    }

    const data = await response.json()

    if (!data.isSuccess) {
      throw new Error(data.error || "Kart bilgisi bulunamadı")
    }

    return data.value || []
  } catch (error) {
    console.error("Kart bilgisi çekme hatası:", error)
    throw error
  }
}
