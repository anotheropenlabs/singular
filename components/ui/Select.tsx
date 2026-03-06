import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, icon: Icon, containerClassName, children, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5 flex flex-col w-full", containerClassName)}>
        {label && (
          <label className="text-xs font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
            </div>
          )}
          <select
            className={cn(
              "flex h-9 w-full appearance-none rounded-none border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 font-mono text-sm text-[var(--text-primary)]",
              "ring-offset-[var(--bg-base)] placeholder:text-[var(--text-secondary)]",
              Icon && "pl-9",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6] focus-visible:border-[#3b82f6]",
              "disabled:cursor-not-allowed disabled:opacity-40 transition-none cursor-pointer",
              error && "border-[#e11d48] focus-visible:ring-[#e11d48] focus-visible:border-[#e11d48]",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>
        </div>
        {error && (
          <p className="text-[10px] font-mono text-[#e11d48] mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export default Select;
