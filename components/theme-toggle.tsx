"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Hidrasyon uyumsuzluğunu önlemek için
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
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
