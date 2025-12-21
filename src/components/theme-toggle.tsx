"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [darkLevel, setDarkLevel] = React.useState<'lite' | 'oled'>('lite')

  React.useEffect(() => {
    // Load initial level
    const savedLevel = localStorage.getItem('theme-dark-level') as 'lite' | 'oled'
    if (savedLevel) {
      setDarkLevel(savedLevel)
    }
  }, [])

  React.useEffect(() => {
    const root = window.document.documentElement

    // Apply nested class logic
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      if (darkLevel === 'oled') {
        root.classList.add('oled')
      } else {
        root.classList.remove('oled')
      }
    } else {
      root.classList.remove('oled')
    }
  }, [theme, darkLevel])

  const handleDarkLevel = (level: 'lite' | 'oled') => {
    setDarkLevel(level)
    localStorage.setItem('theme-dark-level', level)
    setTheme('dark')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDarkLevel('lite')}>
          Dark (Standard)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDarkLevel('oled')}>
          Dark (OLED / Pitch Black)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
