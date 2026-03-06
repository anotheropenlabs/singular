
'use client';

import Modal from './Modal';
import Button from './Button';
import { useI18n } from '@/lib/i18n';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isLoading
}: ConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
           <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-sing-red/10 text-sing-red' : 'bg-sing-blue/10 text-sing-blue'}`}>
             <AlertTriangle className="w-6 h-6" />
           </div>
           <div>
             <h3 className="font-bold text-white mb-1">{title}</h3>
             <p className="text-sing-text-secondary text-sm leading-relaxed">
               {description}
             </p>
           </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm} 
            isLoading={isLoading}
          >
            {confirmLabel || t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
