import { Check } from 'lucide-react'

interface Step {
  number: number
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = step.number < currentStep
        const isActive = step.number === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-pine-forest text-pine-lime'
                    : isActive
                    ? 'bg-pine-lime text-pine-forest ring-4 ring-pine-lime/25'
                    : 'bg-pine-cream text-pine-slate-light border-2 border-pine-border'
                }`}
              >
                {isCompleted ? <Check size={13} className="sm:w-3.5 sm:h-3.5" strokeWidth={3} /> : step.number}
              </div>
              <span
                className={`mt-1 sm:mt-1.5 text-[8.5px] sm:text-[10px] font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'text-pine-forest' : isCompleted ? 'text-pine-slate' : 'text-pine-slate-light'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`h-0.5 w-6 sm:w-14 md:w-20 mx-0.5 sm:mx-1 mb-4 sm:mb-5 transition-all duration-500 rounded-full ${
                  isCompleted ? 'bg-pine-forest' : 'bg-pine-border'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
