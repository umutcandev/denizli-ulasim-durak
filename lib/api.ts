// Otobüs verilerini çekmek için API fonksiyonu
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
