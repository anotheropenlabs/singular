import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from './Badge';

export type SectionColor = 'accent' | 'blue' | 'purple' | 'yellow' | 'cyan' | 'green' | 'red';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  color?: SectionColor;
  variant?: 'primary' | 'secondary';
  containerClassName?: string;
  titleClassName?: string;
  rightContent?: ReactNode;
}

// Map SectionColor to Badge variant
const badgeVariantMap: Record<SectionColor, any> = {
  accent: 'info', // generic accent usually maps to primary/info
  blue: 'info',
  purple: 'purple',
  yellow: 'warning',
  cyan: 'cyan',
  green: 'success',
  red: 'error',
};

export default function SectionHeader({
  title,
  description,
  icon: Icon,
  color = 'accent',
  variant = 'primary',
  containerClassName,
  titleClassName,
  rightContent
}: SectionHeaderProps) {
  const badgeVariant = badgeVariantMap[color] || 'info';

  if (variant === 'secondary') {
    return (
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", containerClassName)}>
        <div>
          <h3 className={cn("text-sm font-mono font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2 tracking-tight", titleClassName)}>
            <Badge variant={badgeVariant} className="!p-1 shrink-0 rounded-sm">
                <Icon className="w-3.5 h-3.5" />
            </Badge>
            {title}
          </h3>
          {description && (
            <p className="text-[10px] text-[var(--text-secondary)] font-mono tracking-widest mt-0.5">
              {description}
            </p>
          )}
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    );
  }

  // Primary variant
  return (
    <div className={cn("flex items-center justify-between mb-6", containerClassName)}>
      <div className="flex items-center gap-3">
        <Badge variant={badgeVariant} className="!p-2 shrink-0 rounded-sm shadow-sm">
            <Icon className="w-5 h-5" />
        </Badge>
        <div>
          <h3 className={cn("text-lg font-mono font-bold text-[var(--text-primary)] tracking-tight", titleClassName)}>
            {title}
          </h3>
          {description && (
            <p className="text-[10px] text-[var(--text-secondary)] font-mono tracking-widest mt-1">{description}</p>
          )}
        </div>
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  );
}
