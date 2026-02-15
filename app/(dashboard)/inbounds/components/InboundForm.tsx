'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { Protocol, Inbound } from '@/types';

const protocols: Protocol[] = ['vless', 'vmess', 'trojan', 'shadowsocks', 'hysteria2', 'hysteria', 'tuic'];

interface InboundFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Inbound | null;
}

export default function InboundForm({ open, onClose, onSubmit, initialData }: InboundFormProps) {
  const [tag, setTag] = useState(initialData?.tag || '');
  const [protocol, setProtocol] = useState<Protocol>(initialData?.protocol || 'vless');
  const [port, setPort] = useState(initialData?.port?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      tag,
      protocol,
      port: parseInt(port),
      config: generateDefaultConfig(protocol, parseInt(port)),
    });
  };

  const generateDefaultConfig = (protocol: Protocol, port: number) => {
    // Basic config template
    return {
      type: protocol,
      tag,
      listen: '::',
      listen_port: port,
    };
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit Inbound' : 'New Inbound'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="e.g., vless-reality"
          required
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">Protocol</label>
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as Protocol)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            {protocols.map((p) => (
              <option key={p} value={p} className="bg-gray-900">
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Port"
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="e.g., 443"
          required
        />
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
