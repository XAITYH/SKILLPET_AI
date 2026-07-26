"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CHARACTERS } from "@/lib/characters"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export function CharacterPicker() {
  const router = useRouter()
  const { user, setCharacter } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const selectedCharacter = CHARACTERS.find((c) => c.id === selectedId)

  async function handleContinue() {
    if (!selectedCharacter || !user) return

    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/auth/select-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          characterFileName: selectedCharacter.fileName,
          characterName: selectedCharacter.name,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save character")
      }

      setCharacter({ fileName: selectedCharacter.fileName, name: selectedCharacter.name })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center space-y-1.5">
        <h1 className="text-xl font-extrabold text-black dark:text-white">Pick Your Perfect Pal!</h1>
        <p className="text-muted-foreground text-xs">Choose a buddy to learn and grow with — you can change later! 💫</p>
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
        {CHARACTERS.map((character) => {
          const isSelected = selectedId === character.id
          return (
            <button
              key={character.id}
              type="button"
              onClick={() => setSelectedId(character.id)}
              className={cn(
                "relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer",
                "hover:border-primary/50 hover:shadow-[0_0_20px_-5px_rgba(60,199,79,0.2)]",
                isSelected
                  ? "border-primary bg-primary/5 shadow-[0_0_20px_-5px_rgba(60,199,79,0.3)]"
                  : "border-border bg-card"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
              <div className={cn("rounded-full overflow-hidden transition-transform duration-200", isSelected && "scale-110")}>
                <Image
                  src={character.image}
                  alt={character.name}
                  width={100}
                  height={100}
                  className="object-cover"
                />
              </div>
              <span className={cn(
                "text-xs font-semibold",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {character.name}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        size="default"
        disabled={!selectedId || saving}
        onClick={handleContinue}
        className="min-w-[200px] cursor-pointer"
      >
        {saving ? "Saving..." : "Continue"}
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  )
}
