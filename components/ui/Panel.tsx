import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'ghost';
  innerClassName?: string;
  withGrid?: boolean;
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, innerClassName, hoverable = false, variant = 'default', withGrid = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-150 isolate",
          // Base Panel Style: Solid very dark gray, 1px sharp border
          variant === 'default' && "bg-[var(--bg-surface)] border border-[var(--border-color)]",
          variant === 'elevated' && "bg-[var(--bg-base)] border border-[var(--border-color)] shadow-lg shadow-black/50",
          variant === 'ghost' && "bg-transparent border border-transparent hover:bg-[var(--bg-surface)]",
          
          // Hover Effects: fast simple border highlight and tiny lift
          hoverable && "hover:border-[var(--text-secondary)] hover:-translate-y-[1px] cursor-pointer",
          
          className
        )}
        {...props}
      >
        {/* Optional subtle grid texture */}
        {withGrid && (
            <div 
                className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
                style={{ 
                  backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
            />
        )}
        
        {/* Content Container */}
        <div className={cn("relative z-10", innerClassName)}>{children}</div>
      </div>
    );
  }
);

Panel.displayName = 'Panel';

export default Panel;
