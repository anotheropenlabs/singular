import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from './GlassCard';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <GlassCard className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="p-4 bg-white/5 rounded-full mb-4 ring-1 ring-white/10">
        <Icon className="w-8 h-8 text-sing-text-secondary" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sing-text-secondary max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </GlassCard>
  );
}
