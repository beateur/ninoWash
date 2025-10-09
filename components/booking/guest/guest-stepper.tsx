/**
 * Stepper component for guest booking flow
 * Shows progress through 5 steps with visual feedback
 */

"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuestStepperProps {
  steps: string[]
  currentStep: number
  completedSteps: number[]
  onStepClick?: (step: number) => void
}

export function GuestStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: GuestStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop: Horizontal stepper */}
      <div className="hidden md:block">
        <ol className="flex items-center justify-between">
          {steps.map((stepTitle, index) => {
            const isCompleted = completedSteps.includes(index)
            const isCurrent = currentStep === index
            const isClickable = isCompleted || index === currentStep + 1

            return (
              <li key={index} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  {/* Step circle */}
                  <button
                    onClick={() => isClickable && onStepClick?.(index)}
                    disabled={!isClickable}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                      isCompleted &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      isCurrent &&
                        "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      !isCompleted &&
                        !isCurrent &&
                        "bg-muted text-muted-foreground",
                      isClickable && !isCurrent && "cursor-pointer hover:bg-muted/80",
                      !isClickable && "cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                  </button>

                  {/* Step label */}
                  <span
                    className={cn(
                      "mt-2 text-sm font-medium text-center",
                      isCurrent && "text-foreground",
                      !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {stepTitle}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                    style={{ marginLeft: "20px", width: "calc(100% - 40px)" }}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Mobile: Compact stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">
            Étape {currentStep + 1} sur {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">{steps[currentStep]}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
