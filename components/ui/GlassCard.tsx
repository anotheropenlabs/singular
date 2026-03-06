import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'default' | 'elevated';
  innerClassName?: string;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, innerClassName, hoverable = false, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-150 isolate",
          // Base Panel Style: Solid very dark gray, 1px sharp border, no heavy blur
          "bg-[var(--bg-surface)]",
          "border border-[var(--border-color)]",

          // Hover Effects: fast simple border highlight and tiny lift
          hoverable && "hover:border-[var(--text-secondary)] hover:-translate-y-[1px] hover:shadow-lg hover:shadow-black/50 cursor-pointer",

          // Variant: Elevated (blacker background, sharper contrast)
          variant === 'elevated' && "bg-[var(--bg-base)] border-[var(--border-color)]",

          className
        )}
        {...props}
      >
        {/* Subtle grid texture instead of noise overlay for technical feel */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Content Container */}
        <div className={cn("relative z-10", innerClassName)}>{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// Exporting as GlassCard to avoid breaking existing imports, but styling is Panel
export default GlassCard;
