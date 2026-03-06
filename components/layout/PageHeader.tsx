import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4 pb-4 border-b border-[#27272a] shrink-0 w-full relative">
      <div className="min-w-0">
        <h1 className="text-2xl font-mono font-bold text-[var(--text-primary)] tracking-wider leading-tight uppercase" suppressHydrationWarning>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1.5 tracking-widest uppercase opacity-80" suppressHydrationWarning>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
