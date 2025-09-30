"use client"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"

interface HeaderProps {
  dominantColor: string
  userEmail: string
  onColorExtracted: (color: string) => void
}

export function Header({ dominantColor, userEmail, onColorExtracted }: HeaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  useEffect(() => {
    const generateGravatarUrl = async (email: string) => {
      const encoder = new TextEncoder()
      const data = encoder.encode(email.toLowerCase().trim())
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
      return `https://www.gravatar.com/avatar/${hashHex}?d=identicon&s=200`
    }

    generateGravatarUrl(userEmail).then(setAvatarUrl)
  }, [userEmail])

  useEffect(() => {
    if (!avatarUrl || !canvasRef.current) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = avatarUrl

    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      let r = 0,
        g = 0,
        b = 0
      let count = 0

      // Sample pixels and calculate average color
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        count++
      }

      r = Math.floor(r / count)
      g = Math.floor(g / count)
      b = Math.floor(b / count)

      const hexColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
      onColorExtracted(hexColor)
    }
  }, [avatarUrl, onColorExtracted])

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <nav
        className="flex h-16 items-center justify-between border-b px-6 transition-colors duration-300"
        style={{
          // backgroundColor: dominantColor,
          backgroundColor: "red",
          borderBottomColor: `${dominantColor}33`,
        }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">Shell App</h1>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={userEmail} />
            <AvatarFallback className="bg-white/20 text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      </nav>
    </>
  )
}
