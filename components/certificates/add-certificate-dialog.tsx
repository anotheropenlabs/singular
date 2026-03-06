
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

interface AddCertificateDialogProps {
  onSuccess: () => void;
}

export function AddCertificateDialog({ onSuccess }: AddCertificateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name'),
      domain: formData.get('domain'),
      cert_path: formData.get('cert_path'),
      key_path: formData.get('key_path'),
    };

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create certificate');
      }

      setOpen(false);
      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Certificate</Button>
      
      <Modal 
        open={open} 
        onClose={() => setOpen(false)} 
        title="Add Certificate"
      >
        <p className="text-neutral-400 mb-4 text-sm">
            Link an existing certificate file on the server.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-900 text-red-200 text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            
            <Input
              id="name"
              name="name"
              label="Name"
              placeholder="My Cert"
              required
            />
            
            <Input
              id="domain"
              name="domain"
              label="Domain"
              placeholder="example.com"
              required
            />
            
            <Input
              id="cert_path"
              name="cert_path"
              label="Certificate Path"
              placeholder="/etc/ssl/cert.pem"
              required
            />
            
            <Input
              id="key_path"
              name="key_path"
              label="Private Key Path"
              placeholder="/etc/ssl/key.pem"
              required
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={loading}>
                {loading ? 'Adding...' : 'Add Certificate'}
              </Button>
            </div>
        </form>
      </Modal>
    </>
  );
}
