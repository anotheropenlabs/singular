'use client';

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import UserCard from '@/components/users/UserCard';
import UserForm from '@/components/users/UserForm';
import SubscriptionModal from '@/components/users/SubscriptionModal';
import { useQueryClient } from '@tanstack/react-query';
import { NodeUser, Inbound } from '@/types';
import { useUsersData, useUserMutations } from '@/hooks/useUsers';
import { useI18n } from '@/lib/i18n';
import { MotionList, MotionItem } from '@/components/ui/Motion';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

import TopUsersChart from '@/components/analytics/TopUsersChart';
import Panel from '@/components/ui/Panel';

export default function UsersPage() {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<NodeUser | null>(null);
  const [subModalUser, setSubModalUser] = useState<NodeUser | null>(null);

  // Dialog States
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading } = useUsersData();
  const { createUser, updateUser, deleteUser, resetUserTraffic, regenerateUserUuid, toggleUser } = useUserMutations();

  // Toast wrappers
  const handleCreate = (formData: any) => {
    createUser.mutate(formData, {
      onSuccess: () => { setShowForm(false); toast.success(t('users.create_success')); },
      onError: (err: any) => toast.error(err.message || t('common.error'))
    });
  };

  const handleUpdate = (id: number, formData: any) => {
    updateUser.mutate({ id, data: formData }, {
      onSuccess: () => { setEditingUser(null); toast.success(t('users.update_success')); },
      onError: (err: any) => toast.error(err.message || t('common.error'))
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    deleteUser.mutate(deletingId, {
      onSuccess: () => { setDeletingId(null); toast.success(t('users.delete_success')); },
      onError: (err: any) => toast.error(err.message || t('common.error'))
    });
  };

  const handleResetTraffic = () => {
    if (!resettingId) return;
    resetUserTraffic.mutate(resettingId, {
      onSuccess: () => { setResettingId(null); toast.success(t('users.reset_success')); },
      onError: (err: any) => toast.error(err.message || t('common.error'))
    });
  };

  const handleRegenerateUuid = () => {
    if (!regeneratingId) return;
    regenerateUserUuid.mutate(regeneratingId, {
      onSuccess: () => { setRegeneratingId(null); toast.success(t('users.uuid_success')); },
      onError: (err: any) => toast.error(err.message || t('common.error'))
    });
  };

  const handleToggle = (id: number, enabled: boolean) => {
    toggleUser.mutate({ id, enabled }, {
      onSuccess: () => toast.success(t('common.success')),
      onError: (err: any) => toast.error(err.message || t('common.error'))
    });
  };

  return (
    <div className="space-y-6">
      {/* Header removed */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowForm(true)} className="font-mono uppercase tracking-wider rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          {t('users.add_user')}
        </Button>
      </div>

      {/* Dashboard Card */}
      <Panel className="p-6 bg-[var(--bg-base)] border border-[var(--border-color)]">
        <h3 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">{t('analytics.top_users')}</h3>
        <TopUsersChart />
      </Panel>

      {/* User List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-[var(--bg-surface)] border border-[var(--border-color)] animate-pulse" />
          ))}
        </div>
      ) : !data?.users || data.users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('users.no_users')}
          description={t('users.no_users_desc', 'Add users to allow them to connect to your proxy server via subscription.')}
          action={
            <Button onClick={() => setShowForm(true)} variant="secondary">
              {t('users.add_user')}
            </Button>
          }
        />
      ) : (
        <MotionList className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.users.map((user) => (
            <MotionItem key={user.id}>
              <UserCard
                user={user}
                onEdit={() => setEditingUser(user)}
                onDelete={() => setDeletingId(user.id)}
                onResetTraffic={() => setResettingId(user.id)}
                onRegenerateUuid={() => setRegeneratingId(user.id)}
                onShare={() => setSubModalUser(user)}
                onToggle={() => handleToggle(user.id, !user.enabled)}
              />
            </MotionItem>
          ))}
        </MotionList>
      )}

      <UserForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        inbounds={data?.inbounds || []}
      />

      {editingUser && (
        <UserForm
          open={true}
          onClose={() => setEditingUser(null)}
          onSubmit={(data) => handleUpdate(editingUser.id, data)}
          initialData={editingUser}
          inbounds={data?.inbounds || []}
        />
      )}

      {subModalUser && (
        <SubscriptionModal
          user={subModalUser}
          onClose={() => setSubModalUser(null)}
        />
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title={t('common.delete_confirm')}
        description={t('common.delete_message')}
        confirmLabel={t('common.delete')}
        isLoading={deleteUser.isPending}
      />

      <ConfirmDialog
        open={!!regeneratingId}
        onClose={() => setRegeneratingId(null)}
        onConfirm={handleRegenerateUuid}
        title={t('users.regenerate_uuid')}
        description={t('users.uuid_confirm_desc')}
        confirmLabel={t('common.confirm')}
        variant="primary"
        isLoading={regenerateUserUuid.isPending}
      />

      <ConfirmDialog
        open={!!resettingId}
        onClose={() => setResettingId(null)}
        onConfirm={handleResetTraffic}
        title={t('users.reset_traffic')}
        description={t('users.reset_confirm_desc')}
        confirmLabel={t('common.confirm', 'Reset')}
        variant="primary"
        isLoading={resetUserTraffic.isPending}
      />
    </div>
  );
}
