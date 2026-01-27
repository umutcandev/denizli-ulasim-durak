import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const routeCode = searchParams.get("routeCode")

    if (!routeCode) {
        return NextResponse.json(
            { isSuccess: false, error: "routeCode parametresi gerekli" },
            { status: 400 }
        )
    }

    try {
        const response = await fetch(
            `https://ulasim.denizli.bel.tr/UlasimBackend/api/Calc/GetRouteStations?routeCode=${routeCode}`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            }
        )

        if (!response.ok) {
            throw new Error(`API yanıt hatası: ${response.status}`)
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Route stations çekme hatası:", error)
        return NextResponse.json(
            { isSuccess: false, error: "Güzergah verileri alınamadı" },
            { status: 500 }
        )
    }
}
