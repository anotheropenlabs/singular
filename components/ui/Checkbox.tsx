import * as React from "react"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, checked, onCheckedChange, onChange, ...props }, ref) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        onCheckedChange?.(e.target.checked);
    };

    return (
      <div className={cn("relative flex items-center justify-center w-4 h-4", className)}>
        <input
          type="checkbox"
          ref={(input) => {
            if (typeof ref === 'function') ref(input);
            else if (ref) ref.current = input;
            
            if (input) {
                input.indeterminate = indeterminate || false;
            }
          }}
          checked={checked}
          onChange={handleChange}
          className="peer appearance-none w-4 h-4 bg-transparent border border-[#52525b] rounded-sm checked:bg-[#3b82f6] checked:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#09090b] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[#09090b] opacity-0 peer-checked:opacity-100 transition-opacity">
            {indeterminate ? <Minus className="w-3 h-3 text-[#3b82f6] stroke-[3]" /> : <Check className="w-3 h-3 stroke-[3]" />}
        </div>
        {/* Indeterminate special styling */}
        {indeterminate && !checked && (
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity">
                <Minus className="w-3 h-3 text-[#3b82f6] stroke-[3]" />
             </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
