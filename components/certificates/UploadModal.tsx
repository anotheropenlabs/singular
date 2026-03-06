'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import GlassCard from '../ui/GlassCard';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  domain: string;
  certFile: FileList;
  keyFile: FileList;
}

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('domain', data.domain);
      formData.append('cert', data.certFile[0]);
      formData.append('key', data.keyFile[0]);

      const res = await fetch('/api/certificates', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      reset();
      onClose();
      toast.success('Certificate uploaded successfully');
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-md p-6 relative" variant="elevated">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-sing-text-secondary hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-sing-blue" />
          Upload Certificate
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-sing-red/10 border border-sing-red/20 rounded-lg text-sing-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sing-text-secondary mb-1">
              Name
            </label>
            <input
              {...register('name', { required: true })}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sing-blue/50 focus:ring-1 focus:ring-sing-blue/50 transition-all placeholder:text-white/20"
              placeholder="e.g. My Domain Cert"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sing-text-secondary mb-1">
              Domain
            </label>
            <input
              {...register('domain', { required: true })}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sing-blue/50 focus:ring-1 focus:ring-sing-blue/50 transition-all placeholder:text-white/20"
              placeholder="e.g. example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sing-text-secondary mb-1">
              Certificate File (.crt / .pem)
            </label>
            <input
              type="file"
              {...register('certFile', { required: true })}
              className="w-full text-sm text-sing-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sing-blue/10 file:text-sing-blue hover:file:bg-sing-blue/20 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sing-text-secondary mb-1">
              Private Key File (.key)
            </label>
            <input
              type="file"
              {...register('keyFile', { required: true })}
              className="w-full text-sm text-sing-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sing-purple/10 file:text-sing-purple hover:file:bg-sing-purple/20 cursor-pointer"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              Upload
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
