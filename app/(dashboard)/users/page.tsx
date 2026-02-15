'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import UserCard from './components/UserCard';
import UserForm from './components/UserForm';
import type { NodeUser, Inbound } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<NodeUser[]>([]);
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<NodeUser | null>(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (formData: { username: string; password?: string; traffic_limit: number; expire_at: string | null; allowed_inbounds: number[] | null }) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      fetchData();
      setShowForm(false);
    }
  };

  const handleUpdate = async (formData: { username: string; password?: string; traffic_limit: number; expire_at: string | null; allowed_inbounds: number[] | null }) => {
    if (!editingUser) return;
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      fetchData();
      setEditingUser(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleResetTraffic = async (id: number) => {
    await fetch(`/api/users/${id}/reset-traffic`, { method: 'POST' });
    fetchData();
  };

  const handleRegenerateUuid = async (id: number) => {
    if (!confirm('Are you sure? This will break existing subscriptions.')) return;
    await fetch(`/api/users/${id}/regenerate-uuid`, { method: 'POST' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-8">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-white/50 text-center py-8">
          No users yet. Click &quot;Add User&quot; to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => setEditingUser(user)}
              onDelete={() => handleDelete(user.id)}
              onResetTraffic={() => handleResetTraffic(user.id)}
              onRegenerateUuid={() => handleRegenerateUuid(user.id)}
            />
          ))}
        </div>
      )}

      <UserForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        inbounds={inbounds}
      />
      <UserForm
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUpdate}
        initialData={editingUser}
        inbounds={inbounds}
      />
    </div>
  );
}
