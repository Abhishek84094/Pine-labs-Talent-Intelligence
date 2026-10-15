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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-pine-green text-white'
                    : isActive
                    ? 'bg-pine-navy text-white ring-4 ring-pine-green ring-opacity-20'
                    : 'bg-pine-cream text-pine-slate-light border-2 border-pine-border'
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : step.number}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-semibold whitespace-nowrap transition-colors ${
                  isCompleted || isActive ? 'text-pine-navy' : 'text-pine-slate-light'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`h-0.5 w-10 sm:w-16 md:w-20 mx-1 mb-5 transition-colors duration-300 ${
                  isCompleted ? 'bg-pine-green' : 'bg-pine-border'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
