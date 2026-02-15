'use client';

import { useEffect, useState } from 'react';
import type { NodeUser, Inbound } from '@/types';
import SubscriptionCard from './components/SubscriptionCard';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

export default function SubscriptionsPage() {
  const [users, setUsers] = useState<NodeUser[]>([]);
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<NodeUser | null>(null);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, inboundsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/inbounds'),
        ]);
        const usersData = await usersRes.json();
        const inboundsData = await inboundsRes.json();
        if (usersData.success) setUsers(usersData.data);
        if (inboundsData.success) setInbounds(inboundsData.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectUser = async (user: NodeUser) => {
    setSelectedUser(user);
    const res = await fetch(`/api/subscriptions/${user.id}`);
    const data = await res.json();
    if (data.success) {
      setSubscriptionUrl(data.data.subscriptionUrl);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Subscriptions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Card className="max-h-[500px] overflow-y-auto">
            <div className="divide-y divide-white/5">
              {loading ? (
                <p className="text-white/50 text-center py-4">Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-white/50 text-center py-4">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full text-left px-3 py-3 hover:bg-white/5 transition-colors ${
                      selectedUser?.id === user.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <p className="text-white font-medium">{user.username}</p>
                    <p className="text-white/50 text-sm">{user.uuid}</p>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        <div>
          {selectedUser ? (
            <SubscriptionCard user={selectedUser} subscriptionUrl={subscriptionUrl} />
          ) : (
            <Card className="flex items-center justify-center h-64">
              <p className="text-white/50">Select a user to view subscription</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
