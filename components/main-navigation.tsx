"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { motion } from "framer-motion"

interface NavItem {
    id: string
    label: string
    href: string
}

const navItems: NavItem[] = [
    {
        id: "station-info",
        label: "Durak Bilgisi",
        href: "#durak-bilgisi",
    },
    {
        id: "line-info",
        label: "Hat Bilgisi",
        href: "#hat-bilgisi",
    },
    {
        id: "departure-times",
        label: "Kalkış Saatleri",
        href: "#kalkis-saatleri",
    },
    {
        id: "balance-check",
        label: "Bakiye Sorgulama",
        href: "#bakiye-sorgulama",
    },
    {
        id: "reload-points",
        label: "Dolum Noktaları",
        href: "#dolum-noktalari",
    },
]

interface MainNavigationProps {
    activeTab?: string
    onTabChange?: (tabId: string) => void
}

export function MainNavigation({ activeTab: controlledActiveTab, onTabChange }: MainNavigationProps) {
    const [internalActiveTab, setInternalActiveTab] = useState<string>("station-info")
    // Use controlled tab if provided, otherwise internal state
    const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab

    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
    const navRef = useRef<HTMLDivElement>(null)
    const textRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({})

    const updateIndicator = (tabId: string) => {
        const element = textRefs.current[tabId]
        if (element && navRef.current) {
            const navRect = navRef.current.getBoundingClientRect()
            const elementRect = element.getBoundingClientRect()
            const scrollLeft = navRef.current.scrollLeft

            setIndicatorStyle({
                left: elementRect.left - navRect.left + scrollLeft,
                width: elementRect.width,
            })
        }
    }

    const handleTabClick = (tabId: string) => {
        setInternalActiveTab(tabId)
        if (onTabChange) {
            onTabChange(tabId)
        }
    }

    // Use layoutEffect for immediate visual update
    useLayoutEffect(() => {
        updateIndicator(activeTab)
    }, [activeTab])

    // ResizeObserver for better performance
    useEffect(() => {
        if (!navRef.current) return

        const resizeObserver = new ResizeObserver(() => {
            updateIndicator(activeTab)
        })

        resizeObserver.observe(navRef.current)

        return () => {
            resizeObserver.disconnect()
        }
    }, [activeTab])

    return (
        <nav className="bg-zinc-900 dark:bg-zinc-900 text-white sticky top-0 z-40 border-b border-zinc-800">
            <div className="container mx-auto px-4 max-w-3xl">
                <div
                    ref={navRef}
                    className="relative flex items-center gap-0 overflow-x-auto scrollbar-hide"
                >
                    {navItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`
                relative flex items-center justify-center py-3 text-sm font-medium transition-colors whitespace-nowrap
                ${index === 0 ? "pl-0 pr-2.5" : "px-2.5"}
                ${activeTab === item.id
                                    ? "text-white"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }
              `}
                            aria-current={activeTab === item.id ? "page" : undefined}
                        >
                            <span
                                ref={(el) => {
                                    textRefs.current[item.id] = el
                                }}
                            >
                                {item.label}
                            </span>
                        </button>
                    ))}

                    {/* Animated underline indicator */}
                    <motion.div
                        className="absolute bottom-0 h-[2px] bg-white"
                        initial={false}
                        animate={{
                            left: indicatorStyle.left,
                            width: indicatorStyle.width,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                        }}
                    />
                </div>
            </div>
        </nav>
    )
}
