'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { NodeUser, Inbound } from '@/types';

interface UserFormData {
  username: string;
  password?: string;
  traffic_limit: number;
  expire_at: string | null;
  allowed_inbounds: number[] | null;
}

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: NodeUser | null;
  inbounds: Inbound[];
}

export default function UserForm({ open, onClose, onSubmit, initialData, inbounds }: UserFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [trafficLimit, setTrafficLimit] = useState('0');
  const [expireAt, setExpireAt] = useState('');
  const [allowedInbounds, setAllowedInbounds] = useState<number[]>([]);

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username);
      setPassword('');
      setTrafficLimit((initialData.traffic_limit / 1024 / 1024 / 1024).toString());
      setExpireAt(initialData.expire_at?.split('T')[0] || '');
      setAllowedInbounds(
        initialData.allowed_inbounds ? JSON.parse(initialData.allowed_inbounds) : []
      );
    } else {
      setUsername('');
      setPassword('');
      setTrafficLimit('0');
      setExpireAt('');
      setAllowedInbounds([]);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username,
      password: password || undefined,
      traffic_limit: parseFloat(trafficLimit) * 1024 * 1024 * 1024,
      expire_at: expireAt || null,
      allowed_inbounds: allowedInbounds.length > 0 ? allowedInbounds : null,
    });
  };

  const toggleInbound = (id: number) => {
    setAllowedInbounds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit User' : 'New User'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          required
        />
        <Input
          label="Password (optional)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={initialData ? 'Leave empty to keep current' : 'Optional'}
        />
        <Input
          label="Traffic Limit (GB)"
          type="number"
          value={trafficLimit}
          onChange={(e) => setTrafficLimit(e.target.value)}
          placeholder="0 = unlimited"
        />
        <Input
          label="Expire Date"
          type="date"
          value={expireAt}
          onChange={(e) => setExpireAt(e.target.value)}
        />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">
            Allowed Inbounds
          </label>
          <div className="flex flex-wrap gap-2">
            {inbounds.map((inbound) => (
              <button
                key={inbound.id}
                type="button"
                onClick={() => toggleInbound(inbound.id)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                  allowedInbounds.includes(inbound.id)
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}
              >
                {inbound.tag}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/30">Leave empty for all inbounds</p>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
