'use client';

import { useState } from 'react';
import { useAuditLogs } from '@/hooks/useLogs';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { History, Search, ChevronLeft, ChevronRight, User, MousePointer, Target } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuditPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 20;

  // Debounce search term could be good, but for now simple state
  
  const { data, isLoading } = useAuditLogs(page, limit, searchTerm);

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setPage(1); // Reset to page 1 on search
      // Trigger query update by state change
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header removed */}

      <GlassCard className="p-6 min-h-[600px] flex flex-col" variant="elevated">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{t('audit.activity_history')}</h3>
              <form onSubmit={handleSearch} className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sing-text-secondary" />
                <input
                  type="text"
                  placeholder={t('audit.search_logs')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-glass border border-glass-border rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sing-blue"
                />
              </form>
          </div>

          <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="border-b border-white/10 text-xs text-sing-text-secondary uppercase tracking-wider">
                          <th className="px-4 py-3 font-medium">{t('audit.time')}</th>
                          <th className="px-4 py-3 font-medium">{t('audit.action')}</th>
                          <th className="px-4 py-3 font-medium">{t('audit.target')}</th>
                          <th className="px-4 py-3 font-medium">{t('audit.details')}</th>
                          <th className="px-4 py-3 font-medium">{t('audit.ip_address')}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                      {isLoading ? (
                          [...Array(5)].map((_, i) => (
                              <tr key={i} className="animate-pulse">
                                  <td className="px-4 py-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                                  <td className="px-4 py-4"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                                  <td className="px-4 py-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                                  <td className="px-4 py-4"><div className="h-4 w-48 bg-white/5 rounded" /></td>
                                  <td className="px-4 py-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                              </tr>
                          ))
                      ) : data?.length === 0 ? (
                          <tr>
                              <td colSpan={5} className="px-4 py-12 text-center text-sing-text-secondary">
                                  <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                  <p>{t('audit.no_logs')}</p>
                              </td>
                          </tr>
                      ) : (
                          data?.map((log: any) => (
                              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-4 py-3 text-sing-text-secondary">
                                      {new Date(log.created_at * 1000).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-sing-blue/10 text-sing-blue text-xs font-medium">
                                          {log.action}
                                      </span>
                                  </td>
                                  <td className="px-4 py-3 text-white font-mono text-xs">
                                      {log.target || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sing-text-secondary max-w-xs truncate" title={log.details}>
                                      {log.details ? JSON.stringify(JSON.parse(log.details)).slice(0, 50) + (log.details.length > 50 ? '...' : '') : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sing-text-secondary font-mono text-xs">
                                      {log.ip || '-'}
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1 || isLoading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t('audit.previous')}
              </Button>
              <span className="text-sm text-sing-text-secondary">{t('common.page', 'Page')} {page}</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!data || data.length < limit || isLoading}
                onClick={() => setPage(p => p + 1)}
              >
                  {t('audit.next')}
                  <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
          </div>
      </GlassCard>
    </div>
  );
}
