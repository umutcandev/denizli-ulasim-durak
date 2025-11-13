"use client"

import { useEffect, useState } from "react"
import { useIsMobile } from "@/components/ui/use-mobile"

export default function MobileBottomSpace() {
  const isMobile = useIsMobile()
  const [visible, setVisible] = useState(false)
  
  // Only show the space on mobile after the page has loaded
  useEffect(() => {
    setVisible(true)
  }, [])

  if (!visible || !isMobile) return null
  
  return (
    <div className="h-[120px] w-full mt-8" aria-hidden="true">
      {/* This is an empty div that adds space at the bottom of mobile devices for the sticky navbar */}
    </div>
  )
}