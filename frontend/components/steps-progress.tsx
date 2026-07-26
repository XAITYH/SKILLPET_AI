import { cn } from "@/lib/utils";

interface Step {
  title: string;
}

interface StepsProgressProps {
  steps: Step[];
  currentStep: number;
}

export function StepsProgress({
  steps,
  currentStep,
}: StepsProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="w-full">
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        {steps.map((_, index) => {
          const isActive = index === currentStep;

          return (
            <div
              key={index}
              className="flex flex-col items-center"
              style={{ width: `${100 / steps.length}%` }}
            >
              <div
                className={cn(
                  "h-1 w-6 rounded-full transition-all duration-300",
                  isActive ? "bg-primary" : "bg-zinc-700",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
