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
      <path d="M20 25h20v22H20z" fill="#E85002" />
      
      {/* Bottom Left Rectangle */}
      <path d="M20 53h20v22H20z" fill="#C10801" />
      
      {/* Top Right Arm */}
      <path d="M40 47L70 25h20L60 47z" fill="#FC9C0D" />
      
      {/* Bottom Right Arm */}
      <path d="M40 53h20l30 22H70z" fill="#FFDEB6" />
    </svg>
  );
}
