import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const lineCode = searchParams.get("lineCode")

    if (!lineCode) {
        return NextResponse.json(
            { isSuccess: false, error: "lineCode parametresi gerekli" },
            { status: 400 }
        )
    }

    try {
        const response = await fetch(
            `https://ulasim.denizli.bel.tr/UlasimBackend/api/Calc/GetLiveData?lineCode=${lineCode}`,
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
        console.error("Live data çekme hatası:", error)
        return NextResponse.json(
            { isSuccess: false, error: "Canlı veriler alınamadı" },
            { status: 500 }
        )
    }
}
