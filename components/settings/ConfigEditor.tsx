'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Panel from '../ui/Panel';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Save, FileJson, AlertTriangle, RotateCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useI18n } from '@/lib/i18n';
import { fetcher } from '@/lib/api-client';

export default function ConfigEditor() {
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: initialContent, isLoading: isFetching } = useQuery({
    queryKey: ['raw-config'],
    queryFn: async () => {
      const data = await fetcher<{ content: string }>('/api/system/config/raw');
      return data.content;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (initialContent) setContent(initialContent);
  }, [initialContent]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      return fetcher('/api/system/config/raw', {
        method: 'POST',
        body: JSON.stringify({ content: newContent }),
      });
    },
    onSuccess: () => {
      toast.success(t('settings.save_success'));
      queryClient.invalidateQueries({ queryKey: ['raw-config'] });
    },
    onError: (error: Error) => {
      toast.error(t('common.error'));
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      return fetcher('/api/system/config/generate', { method: 'POST' });
    },
    onSuccess: () => {
      toast.success(t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['raw-config'] });
    },
    onError: (error: Error) => {
      toast.error(t('common.error'));
    }
  });

  const restartMutation = useMutation({
    mutationFn: async () => {
      return fetcher('/api/system/restart', { method: 'POST' });
    },
    onSuccess: () => {
      toast.success(t('common.success'));
    },
    onError: (error: Error) => {
      toast.error(t('common.error'));
    }
  });
  
  const [confirmAction, setConfirmAction] = useState<{
    type: 'save' | 'regenerate' | 'restart';
    title: string;
    description: string;
  } | null>(null);

  const handleSave = () => {
    setConfirmAction({
      type: 'save',
      title: t('settings.save_config_title'),
      description: t('settings.save_config_desc')
    });
  };

  const handleRegenerate = () => {
    setConfirmAction({
      type: 'regenerate',
      title: t('settings.regenerate_title'),
      description: t('settings.regenerate_desc')
    });
  };

  const handleRestart = () => {
    setConfirmAction({
      type: 'restart',
      title: t('settings.restart_title'),
      description: t('settings.restart_desc')
    });
  };

  const executeAction = () => {
    if (!confirmAction) return;
    
    switch (confirmAction.type) {
      case 'save':
        saveMutation.mutate(content);
        break;
      case 'regenerate':
        regenerateMutation.mutate();
        break;
      case 'restart':
        restartMutation.mutate();
        break;
    }
    setConfirmAction(null);
  };

  return (
    <>
      <Panel className="h-[600px] overflow-hidden p-0 border-[var(--border-color)] bg-[var(--bg-base)] flex flex-col rounded-none">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <FileJson className="w-5 h-5 text-[var(--accent-primary)]" />
            <span className="font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">config.json</span>
          </div>
          <div className="flex items-center gap-2">
              <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRegenerate}
                  isLoading={regenerateMutation.isPending}
                  disabled={isFetching || saveMutation.isPending}
                  className="mr-2 rounded-none border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] font-mono uppercase tracking-wider text-[10px]"
              >
                  <div className="flex items-center gap-2">
                      <RotateCw className={`w-3 h-3 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                      <span>{t('settings.regenerate')}</span>
                  </div>
              </Button>

              <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRestart}
                  isLoading={restartMutation.isPending}
                  disabled={isFetching}
                  className="mr-2 text-sing-red hover:bg-sing-red/10 border border-sing-red/20 rounded-none font-mono uppercase tracking-wider text-[10px]"
              >
                  <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{t('settings.restart')}</span>
                  </div>
              </Button>
              
              <Button 
                  size="sm" 
                  onClick={handleSave} 
                  isLoading={saveMutation.isPending}
                  disabled={isFetching || regenerateMutation.isPending}
                  className="rounded-none font-mono uppercase tracking-wider text-[10px]"
              >
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
              </Button>
          </div>
        </div>
        
        <div className="flex-1 bg-[#1e1e1e]"> 
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
                  }}
              />
          )}
        </div>
      </Panel>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        title={confirmAction?.title || ''}
        description={confirmAction?.description || ''}
        confirmLabel={t('common.confirm')}
        variant={confirmAction?.type === 'save' ? 'danger' : 'primary'}
        isLoading={saveMutation.isPending || regenerateMutation.isPending || restartMutation.isPending}
      />
    </>
  );
}
