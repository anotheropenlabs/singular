import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5 flex flex-col">
        {label && (
          <label className="text-xs font-mono font-medium text-[#71717a] uppercase tracking-wider peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-none border border-[#27272a] bg-[#09090b] px-3 font-mono text-sm text-[#e4e4e7] ring-offset-[#000000]",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#52525b]",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6] focus-visible:border-[#3b82f6]",
            "disabled:cursor-not-allowed disabled:opacity-40 transition-none", // Instant response
            error && "border-[#e11d48] focus-visible:ring-[#e11d48] focus-visible:border-[#e11d48]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-[10px] font-mono text-[#e11d48] mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
