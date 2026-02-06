import React from "react"

export interface InfoTooltipProps {
  message: string
}

export function InfoTooltip({ message }: InfoTooltipProps) {
  return (
    <div className="group relative inline-block ml-1">
      <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs cursor-help">
        ?
      </div>
      <div className="absolute z-10 w-64 p-2 text-xs bg-black text-white rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bottom-full mb-2 left-1/2 transform -translate-x-1/2">
        {message}
        <div className="absolute border-t-4 border-l-4 border-r-4 border-transparent border-t-black left-1/2 transform -translate-x-1/2 top-full"></div>
      </div>
    </div>
  )
}
