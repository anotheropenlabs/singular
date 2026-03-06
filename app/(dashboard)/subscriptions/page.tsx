'use client';

import { useState } from 'react';
import type { NodeUser } from '@/types';
import SubscriptionCard from '@/components/subscriptions/SubscriptionCard';
import Panel from '@/components/ui/Panel';
import Input from '@/components/ui/Input';
import { Link } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useUsersData } from '@/hooks/useUsers';
import { useSubscriptionUrl } from '@/hooks/useSubscriptions';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function SubscriptionsPage() {
  const { t } = useI18n();
  const { data: usersData, isLoading: loading } = useUsersData();
  const { mutateAsync: getSubscriptionUrl } = useSubscriptionUrl();
  const users = usersData?.users || [];
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<NodeUser | null>(null);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');



  const handleSelectUser = async (user: NodeUser) => {
    setSelectedUser(user);
    try {
      const data = await getSubscriptionUrl(user.id);
      setSubscriptionUrl(data.subscriptionUrl);
    } catch {
      // Handled silently for now, as was the behavior before
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header removed */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Panel className="max-h-[500px] overflow-y-auto p-0 border border-[var(--border-color)] bg-[var(--bg-base)]">
            <div className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <p className="text-[var(--text-secondary)] text-center py-4 font-mono text-sm uppercase">{t('common.loading')}</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-4 font-mono text-sm uppercase">{t('subscriptions.no_users')}</p>
              ) : (
                filteredUsers.map((user) => (
                  <Button
                    variant="ghost"
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={cn(
                      "w-full h-auto text-left flex flex-col justify-start px-4 py-3 transition-none border-l-2",
                      selectedUser?.id === user.id ? 'bg-[var(--bg-surface-hover)] border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)]'
                    )}
                  >
                    <p className="font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">{user.username}</p>
                    <p className="text-[10px] font-mono tracking-widest mt-1 opacity-60">{user.uuid}</p>
                  </Button>
                ))
              )}
            </div>
          </Panel>
        </div>

        <div>
          {selectedUser ? (
            <SubscriptionCard user={selectedUser} subscriptionUrl={subscriptionUrl} />
          ) : (
            <Panel className="flex flex-col items-center justify-center h-64 border border-[var(--border-color)] border-dashed bg-transparent">
              <Link className="w-8 h-8 text-[var(--border-color)] mb-4" />
              <p className="text-[var(--text-secondary)] font-mono text-sm uppercase tracking-wider">{t('subscriptions.select_user')}</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
