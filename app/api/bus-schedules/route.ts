import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://ulasim.denizli.bel.tr/jsonotobusduraklar.ashx",
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Always fetch fresh data
      }
    );

    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
} 