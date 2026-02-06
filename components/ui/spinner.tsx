import React from "react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "w-3 h-3 border",
  md: "w-4 h-4 border-2",
  lg: "w-6 h-6 border-2"
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "border-white border-t-transparent rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}
