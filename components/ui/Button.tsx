'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      // Primary: Subtle glow, tech borders
      primary: 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:shadow-glow-sm hover:bg-[var(--bg-surface-hover)]',
      // Secondary: Same as primary but even more subtle
      secondary: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]',
      // Danger: No red background, just red indicators on hover/border
      danger: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--status-error)] hover:border-[var(--status-error)] hover:bg-[var(--status-error)]/5',
      // Ghost: Transparent, tech reveal
      ghost: 'bg-transparent text-[var(--text-secondary)] border border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
      // Outline: Focus on the architectural line
      outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] hover:shadow-glow-sm',
    };

    const sizes = {
      sm: 'h-8 px-4 text-[10px] gap-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5',
      md: 'h-9 px-5 text-[11px] gap-2 [&_svg]:w-4 [&_svg]:h-4',
      lg: 'h-11 px-8 text-sm gap-2.5 [&_svg]:w-5 [&_svg]:h-5',
      icon: 'h-9 w-9 p-0 flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-mono uppercase tracking-widest transition-all duration-200 rounded-none relative overflow-hidden group",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-black",
          "disabled:pointer-events-none disabled:opacity-30 active:translate-y-[1px]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        <span className="relative z-10 flex items-center gap-inherit">
          {children}
        </span>
        {/* Subtle tech scanning effect on hover */}
        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-none pointer-events-none" />
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
