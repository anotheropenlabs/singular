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
      // Primary
      primary: 'bg-transparent text-[#a1a1aa] border border-[#3f3f46] hover:bg-[#27272a] hover:text-white',
      // Secondary
      secondary: 'bg-transparent text-[#a1a1aa] border border-[#3f3f46] hover:bg-[#27272a] hover:text-white',
      // Danger (User explicitly requested uniform color and no red border)
      danger: 'bg-transparent text-[#a1a1aa] border border-[#3f3f46] hover:bg-[#27272a] hover:text-white',
      // Ghost: Transparent, hover changes bg and text
      ghost: 'bg-transparent text-[#a1a1aa] border border-transparent hover:text-[#f4f4f5] hover:bg-[#27272a]',
      // Outline
      outline: 'bg-transparent text-[#a1a1aa] border border-[#3f3f46] hover:bg-[#27272a] hover:text-white',
    };

    const sizes = {
      sm: 'h-8 px-4 py-1.5 text-[11px] gap-1.5 [&_svg]:!w-3.5 [&_svg]:!h-3.5 [&_svg]:shrink-0',
      md: 'h-8 px-4 py-1.5 text-[11px] gap-1.5 [&_svg]:!w-3.5 [&_svg]:!h-3.5 [&_svg]:shrink-0',  // Force all default forms/headers to the unified 32px height and small font
      lg: 'h-10 px-8 py-2 text-sm gap-2 [&_svg]:!w-4 [&_svg]:!h-4 [&_svg]:shrink-0',
      icon: 'h-8 w-8 p-0 flex items-center justify-center [&_svg]:!w-3.5 [&_svg]:!h-3.5 [&_svg]:shrink-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-mono uppercase tracking-wider transition-all duration-200 rounded-none",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-1 focus-visible:ring-offset-black",
          "disabled:pointer-events-none disabled:opacity-40 active:translate-y-[1px]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
