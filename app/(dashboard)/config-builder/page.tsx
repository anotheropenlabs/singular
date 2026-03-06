'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import ConfigEditor from '@/components/settings/ConfigEditor';
import PageHeader from '@/components/layout/PageHeader';
import Editor from '@monaco-editor/react';
import {
    Download,
    Copy,
    Upload,
    FileJson,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Package,
    Code2,
    FileEdit,
    Loader2,
    ChevronRight,
    Network,
    FlaskConical,
    Route
} from 'lucide-react';

import { useClientConfigPreview, useClientConfigMutations } from '@/hooks/useClientConfig';
import RawConfigEditor from '@/components/settings/RawConfigEditor';



// ── Generate Tab ───────────────────────────────────────────────────────────────

function GenerateTab() {
    const { t } = useI18n();
    const [copied, setCopied] = useState(false);

    const { data, isLoading, error, refetch } = useClientConfigPreview();

    const jsonString = data ? JSON.stringify(data, null, 2) : '';

    const handleCopy = async () => {
        if (!jsonString) return;
        await navigator.clipboard.writeText(jsonString);
        setCopied(true);
        toast.success('已复制到剪贴板');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!jsonString) return;
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'singular-config.json';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('配置文件已下载');
    };

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-white/50">
                    {data && (
                        <span>
                            {t('config_builder.outbound_count', '{count} outbounds').replace('{count}', String(data.outbounds?.length ?? 0))} ·{' '}
                            {t('config_builder.rule_count', '{count} rules').replace('{count}', String(data.route?.rules?.length ?? 0))} ·{' '}
                            {t('config_builder.dns_count', '{count} DNS servers').replace('{count}', String(data.dns?.servers?.length ?? 0))}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={cn('w-4 h-4 mr-1.5', isLoading && 'animate-spin')} />
                        {t('config_builder.refresh', 'Refresh')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!data}>
                        {copied ? (
                            <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-400" />
                        ) : (
                            <Copy className="w-4 h-4 mr-1.5" />
                        )}
                        {t('config_builder.copy', 'Copy')}
                    </Button>
                    <Button size="sm" onClick={handleDownload} disabled={!data}>
                        <Download className="w-4 h-4 mr-1.5" />
                        {t('config_builder.download_json', 'Download JSON')}
                    </Button>
                </div>
            </div>

            {/* Preview */}
            <Panel className="overflow-hidden p-0 border border-[var(--border-color)] bg-[#1e1e1e] rounded-none">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
                    <FileJson className="w-4 h-4 text-sing-yellow" />
                    <span className="text-xs font-mono uppercase font-bold text-[var(--text-secondary)] tracking-wider">{t('config_builder.preview_title', 'singular-config.json')}</span>
                </div>
                <div className="h-[500px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full gap-3 text-[var(--text-secondary)]">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-mono uppercase text-xs tracking-wider">{t('config_builder.generating', 'Generating config...')}</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
                            <AlertCircle className="w-8 h-8" />
                            <p className="text-sm font-mono uppercase tracking-widest text-center px-4">{(error as Error).message}</p>
                        </div>
                    ) : (
                        <Editor
                            height="100%"
                            defaultLanguage="json"
                            theme="vs-dark"
                            value={jsonString}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 12,
                                fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                formatOnPaste: true,
                                // padding: { top: 16, bottom: 16 }
                            }}
                        />
                    )}
                </div>
            </Panel>

            {/* Info */}
            <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 text-[11px] font-mono text-[var(--text-secondary)] space-y-2 uppercase tracking-wide leading-relaxed">
                <p className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
                    <span>
                        {t('config_builder.info_1', 'This config is generated based on all')} <strong className="text-[var(--text-primary)] font-bold">{t('config_builder.info_1_highlight', 'enabled')}</strong> {t('config_builder.info_1_suffix', 'Proxy Groups, Proxy Nodes, Rules, and DNS Servers in the database.')}
                    </span>
                </p>
                <p className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
                    <span>{t('config_builder.info_2', 'You can download and use it directly in client sing-box proxy tools (e.g. sing-box / SFI / SFA).')}</span>
                </p>
            </div>
        </div>
    );
}

// ── Import Tab ─────────────────────────────────────────────────────────────────

import { SUBSCRIPTION_TYPES, type SubscriptionType } from '@/lib/providers/types';

interface ImportStats {
    nodes: number;
    groups: number;
    rules: number;
    dns: number;
    raw_blocks_saved?: number;
    raw_inbounds?: number;
    raw_route?: number;
    raw_dns?: number;
    raw_experimental?: number;
}

function ImportTab() {
    const { t } = useI18n();
    const [rawText, setRawText] = useState('');
    const [dragging, setDragging] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ imported: ImportStats; format: string } | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [formatType, setFormatType] = useState<SubscriptionType>('auto');
    const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
    const { importConfig } = useClientConfigMutations();

    const handleFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setRawText(e.target?.result as string);
            setResult(null);
            setParseError(null);
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleImport = async () => {
        const content = rawText.trim();
        if (!content) return;

        setImporting(true);
        setParseError(null);

        importConfig.mutate({ content, type: formatType, mode: importMode }, {
            onSuccess: (data: any) => {
                setResult({ imported: data.imported, format: data.format });
                toast.success(data.message);
            },
            onError: (err: any) => {
                setParseError(err.message || '导入失败');
                toast.error(err.message || '导入请求失败');
            },
            onSettled: () => setImporting(false)
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Panel className="p-6 border border-[var(--border-color)] bg-[var(--bg-base)]">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--border-color)]">
                    <div>
                        <h2 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                            <Package className="w-5 h-5 text-[var(--accent-primary)]" />
                            {t('config_builder.import_subscription', 'Import Subscription')}
                        </h2>
                        <p className="text-[10px] font-mono tracking-wide text-[var(--text-secondary)] uppercase mt-2">
                            {t('config_builder.import_desc', 'Paste a subscription link, plain text nodes, or Clash/sing-box JSON here.')}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border-color)] px-2 py-1">
                        <label className="flex items-center gap-2 px-2 py-1 cursor-pointer">
                            <input
                                type="radio"
                                checked={importMode === 'append'}
                                onChange={() => setImportMode('append')}
                                className="w-3.5 h-3.5 text-[var(--accent-primary)] bg-black/50 border-[var(--border-color)] focus:ring-[var(--accent-primary)] focus:ring-offset-0"
                            />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-[var(--text-primary)]">{t('config_builder.append_mode', 'Append')}</span>
                        </label>
                        <div className="w-px h-4 bg-[var(--border-color)]" />
                        <label className="flex items-center gap-2 px-2 py-1 cursor-pointer">
                            <input
                                type="radio"
                                checked={importMode === 'overwrite'}
                                onChange={() => setImportMode('overwrite')}
                                className="w-3.5 h-3.5 text-[var(--accent-primary)] bg-black/50 border-[var(--border-color)] focus:ring-[var(--accent-primary)] focus:ring-offset-0"
                            />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-[var(--text-primary)]">{t('config_builder.overwrite_mode', 'Overwrite')}</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                            "relative border-[1.5px] border-dashed transition-all p-0 h-[400px]",
                            dragging ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5" : "border-[var(--border-color)] bg-[var(--bg-surface)]"
                        )}
                    >
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={t('config_builder.import_desc', 'Paste a subscription link, plain text nodes, or Clash/sing-box JSON here.') + '\n\n' + t('config_builder.import_from_file', 'Or drag and drop a file here')}
                            className="w-full h-full p-6 bg-transparent border-none text-[11px] text-[var(--text-primary)] font-mono leading-relaxed placeholder:text-[var(--text-secondary)] opacity-50 focus:opacity-100 resize-none focus:ring-0 tracking-wide"
                            spellCheck={false}
                        />
                        <div className="absolute top-4 right-4 flex items-center gap-3">
                            <select
                                value={formatType}
                                onChange={(e) => setFormatType(e.target.value as SubscriptionType)}
                                className="bg-[var(--bg-base)] border border-[var(--border-color)] px-3 py-1.5 text-[10px] font-mono uppercase font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] tracking-wider appearance-none"
                            >
                                {SUBSCRIPTION_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <Button
                                size="sm"
                                onClick={handleImport}
                                disabled={importing || !rawText.trim()}
                                className="rounded-none font-mono uppercase text-[10px] tracking-wider"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        {t('common.importing', 'Importing...')}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                                        {t('common.import', 'Import')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Feedback */}
                    {parseError && (
                        <div className="p-4 border border-sing-red/30 bg-sing-red/10 text-red-400 text-xs font-mono uppercase tracking-wide flex items-start gap-3 mt-4">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold">{t('config_builder.import_failed', 'Import failed')}</p>
                                <p className="text-red-400/80 leading-relaxed text-[10px] tracking-widest">{parseError}</p>
                            </div>
                        </div>
                    )}
                    
                    {result && (
                        <div className="p-4 border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981] text-xs font-mono uppercase tracking-wide flex items-start gap-3 mt-4">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-bold">{t('config_builder.import_success', 'Import successful')}</p>
                                <p className="text-[#10b981]/80 leading-relaxed text-[10px] tracking-widest mt-1">
                                    {t('config_builder.import_stats_base', 'Parsed format: {format} | Nodes: {nodes} | Groups: {groups}')
                                        .replace('{format}', result.format)
                                        .replace('{nodes}', String(result.imported.nodes))
                                        .replace('{groups}', String(result.imported.groups))}
                                    {result.imported.raw_blocks_saved ? ` | RAW BLOCKS:` : ''}
                                    {result.imported.raw_inbounds ? ' [Inbounds]' : ''}
                                    {result.imported.raw_route ? ' [Route]' : ''}
                                    {result.imported.raw_dns ? ' [DNS]' : ''}
                                    {result.imported.raw_experimental ? ' [Experimental]' : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Panel>

            <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 text-[10px] font-mono text-[var(--text-secondary)] space-y-2 uppercase tracking-wide leading-relaxed">
                <p className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
                    <span>sing-box JSON 格式还会额外提取 <strong className="text-[var(--text-primary)] font-bold">route.rules</strong> → 路由规则、<strong className="text-[var(--text-primary)] font-bold">dns.servers</strong> → DNS 服务器</span>
                </p>
                <p className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
                    <span><strong className="text-[var(--text-primary)] font-bold">追加</strong>：同名记录跳过；<strong className="text-[var(--text-primary)] font-bold">覆盖</strong>：清空手动添加的节点后再导入</span>
                </p>
            </div>
        </div>
    );
}


// ── Raw Config Tab ─────────────────────────────────────────────────────────────

type RawConfigTabId = 'inbounds' | 'route' | 'dns' | 'experimental';

function RawConfigTab() {
  const [activeTab, setActiveTab] = useState<RawConfigTabId>('inbounds');

  const tabs = [
    { id: 'inbounds', label: 'Inbounds', icon: Download },
    { id: 'route', label: 'Route', icon: Route },
    { id: 'dns', label: 'DNS', icon: Network },
    { id: 'experimental', label: 'Experimental', icon: FlaskConical },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="mb-4 space-y-3">
        <h2 className="text-[10px] items-center gap-2 flex font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">
          ADVANCED CONFIGURATION 
        </h2>
        <p className="text-[10px] font-mono tracking-wide text-[var(--text-secondary)] uppercase px-1">
          Directly edit the raw sing-box JSON configuration fragments.
        </p>
      </div>

      <div className="flex border-b border-[var(--border-color)] mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              variant={isActive ? 'primary' : 'ghost'}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RawConfigTabId)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 border-b-2 transition-all duration-200 uppercase tracking-widest text-[11px] h-auto rounded-none',
                isActive
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="mt-4">
        {tabs.map((tab) => (
          <div key={tab.id} className={cn(activeTab !== tab.id && 'hidden')}>
            <RawConfigEditor type={tab.id} title={tab.label} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ConfigBuilderPage() {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'generate' | 'import' | 'raw'>('generate');

    const tabs = [
        { id: 'generate', label: t('config_builder.preview_export', 'Preview & Export'), icon: Code2 },
        { id: 'import', label: t('config_builder.import', 'Import Wizard'), icon: Upload },
        { id: 'raw', label: 'Raw Modules', icon: FileEdit }
    ] as const;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageHeader
                title={t('config_builder.title', 'Config Builder')}
                subtitle={t('config_builder.subtitle', 'Generate client config or parse subscriptions')}
                actions={
                    activeTab === 'generate' ? (
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <Package className="w-3.5 h-3.5" />
                            <span>{t('config_builder.info_1', 'This config is generated based on all').split(' ').slice(0, 3).join(' ')}...</span>
                        </div>
                    ) : activeTab === 'import' ? (
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <Code2 className="w-3.5 h-3.5" />
                            <span>sing-box JSON → Database</span>
                        </div>
                    ) : null
                }
            />

            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--bg-surface)] border border-[var(--border-color)] p-1 w-fit">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <Button
                        variant="ghost"
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                            'flex items-center gap-2 h-auto px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-none border border-transparent rounded-none',
                            activeTab === id
                                ? 'bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]'
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </Button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                {activeTab === 'generate' && <GenerateTab />}
                {activeTab === 'import' && <ImportTab />}
                {activeTab === 'raw' && <RawConfigTab />}
            </div>
        </div>
    );
}
