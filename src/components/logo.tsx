import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-full h-full", className)}
    >
      {/* Top Left Rectangle */}
      <path d="M20 25h20v22H20z" fill="var(--color-kairo-orange)" />
      
      {/* Bottom Left Rectangle */}
      <path d="M20 53h20v22H20z" fill="var(--color-kairo-grad-2)" />
      
      {/* Top Right Arm */}
      <path d="M40 47L70 25h20L60 47z" fill="var(--color-kairo-light-gray)" />
      
      {/* Bottom Right Arm */}
      <path d="M40 53h20l30 22H70z" fill="var(--color-kairo-grad-4)" />
    </svg>
  );
}

