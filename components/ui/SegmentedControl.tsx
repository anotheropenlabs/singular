import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import Button from './Button';

export interface SegmentedControlProps<T extends string = string> {
  options: { label: ReactNode; value: T }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export default function SegmentedControl<T extends string = string>({ 
  options, 
  value, 
  onChange, 
  className,
  activeClassName = 'bg-sing-purple text-white',
  inactiveClassName = 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("flex bg-[var(--bg-surface)] border border-[var(--border-color)] p-0.5", className)}>
      {options.map((option, index) => (
        <div key={String(option.value)} className="flex items-center">
          {index > 0 && <div className="w-px h-full bg-[var(--border-color)]" />}
          <Button
            variant={value === option.value ? 'primary' : 'ghost'}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-1.5 h-auto text-[10px] font-mono font-bold tracking-widest uppercase transition-all shadow-none border-none",
              value === option.value ? activeClassName : inactiveClassName
            )}
          >
            {option.label}
          </Button>
        </div>
      ))}
    </div>
  );
}
