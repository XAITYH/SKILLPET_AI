import { StepsProgress } from "@/components/steps-progress"
import { CharacterPicker } from "@/components/character-picker"

const steps = [
  { title: "" },
  { title: "" },
  { title: "" },
  { title: "" },
  { title: "" },
]

export default function CharacterPickerPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 gap-9 max-w-2xl mx-auto">
      <div className="w-full">
        <StepsProgress steps={steps} currentStep={0} />
      </div>
      <CharacterPicker />
    </main>
  )
}
