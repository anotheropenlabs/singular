import { type UserFormValues, userSchema } from '@/lib/config/validators';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Inbound, NodeUser } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Panel from '../ui/Panel';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormValues) => void;
  initialData?: NodeUser | null;
  inbounds: Inbound[];
}

export default function UserForm({ open, onClose, onSubmit, initialData, inbounds }: UserFormProps) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      traffic_limit: 0,
      expire_at: null,
      allowed_inbounds: [],
    },
  });

  const allowedInbounds = watch('allowed_inbounds') || [];

  useEffect(() => {
    if (initialData) {
      setValue('username', initialData.username);
      setValue('traffic_limit', initialData.traffic_limit);
      setValue('expire_at', initialData.expire_at ? new Date(initialData.expire_at).toISOString().split('T')[0] : null);
      if (initialData.allowed_inbounds && typeof initialData.allowed_inbounds === 'string') {
          try {
              setValue('allowed_inbounds', JSON.parse(initialData.allowed_inbounds));
          } catch {
              setValue('allowed_inbounds', []);
          }
      }
    } else {
      reset({
        username: '',
        password: '',
        traffic_limit: 0,
        expire_at: null,
        allowed_inbounds: [],
      });
    }
  }, [initialData, reset, setValue]);

  const toggleInbound = (id: number) => {
    const current = new Set(watch('allowed_inbounds') || []);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    setValue('allowed_inbounds', Array.from(current), { shouldDirty: true });
  };
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Panel className="w-full max-w-lg p-6 space-y-6 border border-[var(--border-color)] bg-[var(--bg-base)]" variant="elevated">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <h2 className="text-xl font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            {initialData ? t('users.edit_user') : t('users.new_user')}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--status-error)] border-none"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label={t('auth.username')} 
            error={errors.username?.message}
            {...register('username')}
          />
          
          <Input 
            label={t('users.password_optional')} 
            type="password"
            placeholder={initialData ? t('users.password_placeholder_edit') : t('users.password_placeholder')}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label={`${t('users.traffic_limit')} (Bytes)`} 
              type="number"
              {...register('traffic_limit', { valueAsNumber: true })}
              error={errors.traffic_limit?.message}
            />
            
            <Input 
              label={t('users.expire_at')} 
              type="date"
              {...register('expire_at')}
              error={errors.expire_at?.message}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase">{t('users.allowed_inbounds')}</label>
            <div className="flex flex-wrap gap-2">
              {inbounds.map(inbound => (
                <Button
                  key={inbound.id}
                  type="button"
                  onClick={() => toggleInbound(inbound.id)}
                  variant={allowedInbounds.includes(inbound.id) ? 'primary' : 'ghost'}
                  className={cn(
                    "px-3 py-1.5 h-auto text-[10px] font-mono uppercase transition-all",
                    allowedInbounds.includes(inbound.id)
                      ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {inbound.tag}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[var(--border-color)]">
            <Button type="button" variant="ghost" onClick={onClose} className="border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]">
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="min-w-32">
              {initialData ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
