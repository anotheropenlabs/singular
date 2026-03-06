
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Certificate } from '@/types';
import Table, {
  TableBody,
  TableCell,
  TableHeadCell,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddCertificateDialog } from './add-certificate-dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShieldCheck } from 'lucide-react';

interface CertificateListProps {
  initialCertificates: Certificate[];
}

export function CertificateList({ initialCertificates }: CertificateListProps) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const loadCertificates = async () => {
      const res = await fetch('/api/certificates');
      if (res.ok) {
          const json = await res.json();
          setCertificates(json.data);
      }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/certificates/${deletingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || 'Failed to delete certificate');
        return;
      }

      toast.success('Certificate deleted successfully');
      await loadCertificates();
      router.refresh();
      setDeletingId(null);
    } catch (err) {
      toast.error('Failed to delete certificate');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <AddCertificateDialog onSuccess={loadCertificates} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Domain</TableHeadCell>
            <TableHeadCell>Path</TableHeadCell>
            <TableHeadCell>Expires</TableHeadCell>
            <TableHeadCell className="text-right">Actions</TableHeadCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certificates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                No certificates found. Add one to get started.
              </TableCell>
            </TableRow>
          ) : (
            certificates.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell className="font-medium text-white">{cert.name}</TableCell>
                <TableCell>{cert.domain}</TableCell>
                <TableCell className="text-xs text-neutral-400 truncate max-w-[200px]" title={cert.cert_path}>
                  {cert.cert_path}
                </TableCell>
                <TableCell>
                  {cert.expires_at > 0
                    ? formatDistanceToNow(cert.expires_at * 1000, { addSuffix: true })
                    : 'Unknown'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingId(cert.id)}
                    className="text-neutral-400 hover:text-red-400 hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {certificates.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="No certificates found"
          description="Add a certificate to enable TLS for your inbounds."
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Certificate"
        description="Are you sure you want to delete this certificate? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
