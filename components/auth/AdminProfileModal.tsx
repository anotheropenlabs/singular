'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/api-client';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
}

export default function AdminProfileModal({ isOpen, onClose, currentUsername }: AdminProfileModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUsername,
    password: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, username: currentUsername }));
    }
  }, [isOpen, currentUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (!formData.password) {
        toast.error('Current password is required');
        return;
    }

    setLoading(true);
    try {
      await fetcher('/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
           username: formData.username,
           password: formData.password,
           newPassword: formData.newPassword || undefined
        }),
      });

      toast.success('Profile updated successfully');
      
      // If password changed or username changed, maybe best to re-login or just close?
      // Since we use httpOnly cookie, session remains valid unless we invalidate it server-side.
      // For now, just close. User can continue.
      onClose();
      router.refresh();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit Admin Profile"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
        
        <div className="border-t border-white/10 my-4" />
        
        <Input
            label="Current Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Required to make changes"
            required
        />

        <div className="space-y-4 pt-2">
            <p className="text-xs text-sing-text-tertiary uppercase tracking-wider font-semibold">Change Password (Optional)</p>
            <Input
                label="New Password"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Leave empty to keep current"
            />
            {formData.newPassword && (
                <Input
                    label="Confirm New Password"
                    type="password"
                    value={formData.confirmNewPassword}
                    onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                    placeholder="Confirm new password"
                />
            )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
