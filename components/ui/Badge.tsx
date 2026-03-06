import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'purple' | 'cyan';
}

export default function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-glass text-sing-text-primary border-glass-border',
    success: 'bg-sing-green/10 text-sing-green border-sing-green/20 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]',
    warning: 'bg-sing-yellow/10 text-sing-yellow border-sing-yellow/20',
    error: 'bg-sing-red/10 text-sing-red border-sing-red/20',
    info: 'bg-sing-blue/10 text-sing-blue border-sing-blue/20',
    purple: 'bg-sing-purple/10 text-sing-purple border-sing-purple/20',
    cyan: 'bg-sing-cyan/10 text-sing-cyan border-sing-cyan/20',
    outline: 'border-glass-border text-sing-text-secondary bg-transparent',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
