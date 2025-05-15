"use client"

import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { useEffect } from "react"

export function FontProvider() {
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-geist-sans",
      GeistSans.style.fontFamily
    )
    document.documentElement.style.setProperty(
      "--font-mono", 
      GeistMono.style.fontFamily
    )
  }, [])

  return null
} 