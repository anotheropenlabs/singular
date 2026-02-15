'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import InboundCard from './components/InboundCard';
import InboundForm from './components/InboundForm';
import type { Inbound } from '@/types';

export default function InboundsPage() {
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInbound, setEditingInbound] = useState<Inbound | null>(null);

  const fetchInbounds = async () => {
    try {
      const res = await fetch('/api/inbounds');
      const data = await res.json();
      if (data.success) {
        setInbounds(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbounds();
  }, []);

  const handleCreate = async (formData: any) => {
    const res = await fetch('/api/inbounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      fetchInbounds();
      setShowForm(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!editingInbound) return;
    const res = await fetch(`/api/inbounds/${editingInbound.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      fetchInbounds();
      setEditingInbound(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inbound?')) return;
    await fetch(`/api/inbounds/${id}`, { method: 'DELETE' });
    fetchInbounds();
  };

  const handleToggle = async (id: number) => {
    await fetch(`/api/inbounds/${id}/toggle`, { method: 'POST' });
    fetchInbounds();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Inbounds</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Inbound
        </Button>
      </div>

      {loading ? (
        <div className="text-white/50 text-center py-8">Loading...</div>
      ) : inbounds.length === 0 ? (
        <div className="text-white/50 text-center py-8">
          No inbounds configured. Click "Add Inbound" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {inbounds.map((inbound) => (
            <InboundCard
              key={inbound.id}
              inbound={inbound}
              onEdit={() => setEditingInbound(inbound)}
              onDelete={() => handleDelete(inbound.id)}
              onToggle={() => handleToggle(inbound.id)}
            />
          ))}
        </div>
      )}

      <InboundForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
      <InboundForm
        open={!!editingInbound}
        onClose={() => setEditingInbound(null)}
        onSubmit={handleUpdate}
        initialData={editingInbound}
      />
    </div>
  );
}
