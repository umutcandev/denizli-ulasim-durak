import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const mifareId = searchParams.get("mifareId") || ""

    if (!mifareId) {
        return NextResponse.json(
            { isSuccess: false, error: "Kart numarası veya TC kimlik numarası gereklidir" },
            { status: 400 }
        )
    }

    try {
        const response = await fetch(
            `https://ulasim.denizli.bel.tr/UlasimBackend/api/Calc/GetCardInfo?mifareId=${encodeURIComponent(mifareId)}`,
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
        console.error("Kart bilgisi API hatası:", error)
        return NextResponse.json(
            { isSuccess: false, error: "Kart bilgisi alınamadı" },
            { status: 500 }
        )
    }
}
