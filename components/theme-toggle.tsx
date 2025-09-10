"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-8 w-20 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shadow-md",
        isDark
          ? "bg-slate-800"
          : "bg-slate-300"
      )}
      aria-label="Toggle theme"
    >
      {/* Sun icon - always visible */}
      <span className="absolute left-3 text-white">
        <IconSun size={16} />
      </span>

      {/* Moon icon - always visible */}
      <span className="absolute right-3 text-slate-400">
        <IconMoon size={16} />
      </span>

      {/* Sliding indicator with icon on top - elongated horizontally */}
      <span
        className={cn(
          "flex h-7 w-10 items-center justify-center rounded-full bg-gradient-to-r from-secondary to-yellow-500 shadow-md transition-transform",
          isDark
        ? "translate-x-10"
        : "translate-x-0.5"
        )}
      >
        {isDark ? (
          <IconMoon size={16} className="text-slate-600" />
        ) : (
          <IconSun size={16} className="text-slate-100" />
        )}
      </span>
    </button>
  )
}
