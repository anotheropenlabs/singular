'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Panel from '../ui/Panel';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Save, FileJson, AlertTriangle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useI18n } from '@/lib/i18n';
import { fetcher } from '@/lib/api-client';

interface RawConfigEditorProps {
  type: 'inbounds' | 'route' | 'dns' | 'experimental';
  title: string;
}

export default function RawConfigEditor({ type, title }: RawConfigEditorProps) {
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: initialContent, isLoading: isFetching } = useQuery({
    queryKey: ['raw-config', type],
    queryFn: async () => {
      const resp = await fetcher<any>(`/api/config/raw/${type}`);
      return JSON.stringify(resp, null, 2);
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (initialContent) setContent(initialContent);
  }, [initialContent]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      try {
        const parsed = JSON.parse(newContent);
        return fetcher(`/api/config/raw/${type}`, {
          method: 'PUT',
          body: JSON.stringify({ content: parsed }),
        });
      } catch (e) {
        // Fallback to sending as string if it isn't valid JSON (let backend reject it if needed)
        return fetcher(`/api/config/raw/${type}`, {
          method: 'PUT',
          body: JSON.stringify({ content: newContent }),
        });
      }
    },
    onSuccess: () => {
      toast.success(t('settings.save_success'));
      queryClient.invalidateQueries({ queryKey: ['raw-config', type] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('common.error'));
    }
  });

  const [confirmSave, setConfirmSave] = useState(false);

  const handleSave = () => {
    try {
        JSON.parse(content); // Pre-validate
        setConfirmSave(true);
    } catch (e: any) {
        toast.error(`Invalid JSON: ${e.message}`);
    }
  };

  const executeSave = () => {
    saveMutation.mutate(content);
    setConfirmSave(false);
  };

  return (
    <>
      <Panel 
        className="h-[calc(100vh-12rem)] min-h-[500px] overflow-hidden p-0 border-[var(--border-color)] bg-[var(--bg-base)] rounded-none"
        innerClassName="flex flex-col h-full"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
              <FileJson className="w-5 h-5" />
              <span className="font-mono font-bold uppercase tracking-wider">{title} Configuration</span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono tracking-wide uppercase">
              Raw sing-box `{type}` JSON block
            </p>
          </div>
          
          <div className="flex items-center gap-2">
              <Button 
                  size="sm" 
                  onClick={handleSave} 
                  isLoading={saveMutation.isPending}
                  disabled={isFetching}
                  className="rounded-none font-mono uppercase tracking-wider text-[10px]"
              >
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
              </Button>
          </div>
        </div>
        
        <div className="flex-1 relative bg-[#1e1e1e]"> 
          {isFetching ? (
              <div className="flex items-center justify-center h-full text-[var(--text-secondary)] font-mono uppercase text-xs tracking-wider">{t('common.loading')}</div>
          ) : (
              <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      formatOnPaste: true,
                  }}
              />
          )}
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={executeSave}
        title={`Save ${title} Config`}
        description="Are you sure you want to save these raw configuration changes? Invalid configurations might prevent the proxy client from starting."
        confirmLabel={t('common.confirm')}
        variant="primary"
        isLoading={saveMutation.isPending}
      />
    </>
  );
}
