"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

const themes = ["system", "light", "dark"]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMobileThemeChange = () => {
    const currentIndex = themes.indexOf(theme ?? "system")
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  if (!mounted) {
    return (
      <div className="flex items-center rounded-md border border-zinc-700 bg-zinc-900 p-1">
        <div className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse bg-zinc-800 rounded-sm" />
      </div>
    )
  }

  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
        onClick={handleMobileThemeChange}
        title="Temayı değiştir"
      >
        {theme === "light" && <Sun className="h-4 w-4" />}
        {theme === "dark" && <Moon className="h-4 w-4" />}
        {theme === "system" && <Monitor className="h-4 w-4" />}
        <span className="sr-only">Temayı değiştir</span>
      </Button>
    )
  }

  return (
    <div className="flex items-center rounded-md border border-zinc-800 p-0.5 bg-zinc-950">
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 sm:h-7 sm:w-7 rounded-sm ${theme === "system" ? "bg-zinc-800" : "bg-transparent hover:bg-zinc-900"}`}
        onClick={() => setTheme("system")}
        title="Sistem teması"
      >
        <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="sr-only">Sistem teması</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 sm:h-7 sm:w-7 rounded-sm ${theme === "light" ? "bg-zinc-800" : "bg-transparent hover:bg-zinc-900"}`}
        onClick={() => setTheme("light")}
        title="Açık tema"
      >
        <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="sr-only">Açık tema</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 sm:h-7 sm:w-7 rounded-sm ${theme === "dark" ? "bg-zinc-800" : "bg-transparent hover:bg-zinc-900"}`}
        onClick={() => setTheme("dark")}
        title="Koyu tema"
      >
        <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="sr-only">Koyu tema</span>
      </Button>
    </div>
  )
}
