import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function GlassButton({ className, children, ...props }) {
  return (
    <Button
      {...props}
      className={cn(
        "relative overflow-hidden border border-white/75 bg-white/60 text-gray-900 backdrop-blur-md shadow-[0_3px_10px_rgba(89,74,56,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(89,74,56,0.10)] active:translate-y-0 active:bg-gray-100/90 active:text-gray-900 active:shadow-[0_2px_6px_rgba(89,74,56,0.05)] active:before:opacity-45 active:after:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),inset_0_-1px_1px_rgba(89,74,56,0.02),0_0_0_1px_rgba(255,255,255,0.20)] focus-visible:ring-gray-300 focus-visible:ring-offset-0 before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/82 before:via-white/40 before:to-sky-100/18 before:opacity-60 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0_rgba(255,255,255,0.36),inset_0_-1px_1px_rgba(89,74,56,0.03),0_0_0_1px_rgba(255,255,255,0.24)] [&>*]:relative [&>*]:z-10",
        className
      )}
    >
      {children}
    </Button>
  )
}
