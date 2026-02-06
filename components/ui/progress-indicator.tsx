import React from "react"
import { CheckCircle } from "lucide-react"

export interface Step {
  readonly id: string
  readonly name: string
}

export interface ProgressIndicatorProps {
  readonly steps: readonly Step[]
  readonly currentStep: string
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center relative w-full">
            {/* Línea conectora */}
            {index > 0 && (
              <div 
                className={`absolute top-4 w-full h-1 -left-1/2 ${
                  index <= steps.findIndex(s => s.id === currentStep) 
                    ? 'bg-blue-500' 
                    : 'bg-gray-200'
                }`}
              />
            )}
            
            {/* Círculo del paso */}
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                step.id === currentStep 
                  ? 'bg-blue-500 text-white' 
                  : index < steps.findIndex(s => s.id === currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < steps.findIndex(s => s.id === currentStep) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            
            {/* Nombre del paso */}
            <span className={`text-xs mt-2 font-medium ${
              step.id === currentStep 
                ? 'text-blue-600' 
                : index < steps.findIndex(s => s.id === currentStep)
                  ? 'text-green-600'
                  : 'text-gray-500'
            }`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
