import PageHeader from '@/components/layout/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import { ShieldCheck } from 'lucide-react';

export default function CertificatesPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageHeader title="Certificates" subtitle="Manage SSL/TLS certificates for your inbounds" />
            <GlassCard variant="elevated">
                <div className="p-12 text-center text-sing-text-secondary">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Certificates Management Stub</p>
                    <p className="text-sm mt-1">This section will contain SSL certificates for server-side inbounds.</p>
                </div>
            </GlassCard>
        </div>
    );
}
