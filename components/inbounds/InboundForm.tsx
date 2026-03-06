'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// import { InboundFormValues as BaseValues } from '@/lib/schemas';
import { Inbound } from '@/types';
import { useCertificates } from '@/hooks/useInbounds';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Panel from '../ui/Panel';
import { X, Network, Server, Hash, Shield, Info } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import ProtocolSelector from './ProtocolSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { getProtocol } from '@/lib/protocols/registry';
import { FieldDefinition } from '@/lib/protocols/types';
import { useI18n } from '@/lib/i18n';
import { useSystemMode } from '@/hooks/useSystemSettings';

interface InboundFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Inbound | null; 
  initialProtocol?: string;
}

// Helper to render dynamic fields
const DynamicField = ({ field, register, error, control, watchAll }: any) => {
    const isVisible = field.showIf ? field.showIf(watchAll) : true;
    
    if (!isVisible) return null;

    if (field.type === 'select') {
        return (
            <div className="space-y-2">
               <label className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase">{field.label}</label>
               <select 
                 {...register(field.key)}
                 className="flex h-10 w-full border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)] transition-colors appearance-none"
               >
                 {field.options?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                 ))}
               </select>
               {error && <p className="text-xs text-sing-red font-mono">{error.message}</p>}
               {field.help && <p className="text-[10px] text-[var(--text-secondary)] font-mono">{field.help}</p>}
            </div>
        );
    }
    
    if (field.type === 'boolean') {
        return (
            <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)] border-dashed">
                <div>
                    <label className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase">{field.label}</label>
                    {field.help && <p className="text-[10px] text-[var(--text-secondary)] font-mono">{field.help}</p>}
                </div>
                <label className="flex items-center gap-2 cursor-pointer relative">
                  <input type="checkbox" {...register(field.key)} className="hidden peer" />
                  <div className="w-10 h-5 bg-[var(--bg-surface)] border border-[var(--border-color)] peer-checked:bg-[var(--accent-primary)]/20 peer-checked:border-[var(--accent-primary)] transition-all"></div>
                  <div className="absolute left-[2px] top-[2px] w-4 h-4 bg-[var(--text-secondary)] peer-checked:bg-[var(--accent-primary)] peer-checked:translate-x-[20px] transition-all"></div>
                </label>
            </div>
        );
    }

    return (
        <Input 
           label={field.label}
           type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
           placeholder={field.placeholder}
           error={error?.message}
           {...register(field.key, { valueAsNumber: field.type === 'number' })}
           helperText={field.help}
        />
    );
};

export default function InboundForm({ open, onClose, onSubmit, initialData, initialProtocol }: InboundFormProps) {
  const { t } = useI18n();
  const { data: systemMode = 'server' } = useSystemMode();
  
  const baseDefaultValues = useMemo(() => ({
    tag: '',
    protocol: initialProtocol || (systemMode === 'client' ? 'mixed' : 'vless'),
    port: 8000,
  }), [initialProtocol, systemMode]);

  // We need a separate form instance just to watch the protocol first, 
  // or we render a wrapper. But here we can use useWatch with a default context if we are careful.
  // Actually, standard pattern is to use a state for protocol or watch it from a base form.
  // Since we want full validation schema to change, we might need to recreate the form or use a computed schema.
  
  // Let's use a two-stage approach or a computed schema with `superRefine`?
  // Easier: Watch protocol, get its schema, and use that resoler.
  
  const tempForm = useForm({ defaultValues: baseDefaultValues });
  const selectedProtocolId = useWatch({ control: tempForm.control, name: 'protocol' }) || (systemMode === 'client' ? 'mixed' : 'vless');
  
  const protocolDef = getProtocol(selectedProtocolId);
  
  // Dynamic Schema
  const dynamicSchema = useMemo(() => {
    let schema = z.object({
        tag: z.string().min(1, 'Tag is required'),
        protocol: z.string(),
        port: z.number().int().min(1).max(65535),
    });
    
    if (protocolDef) {
        // Merge protocol specific schema
        // We assume protocolDef.schema is an object schema and we put it under 'config' or spread it?
        // Sing-box config is flat for inbound fields (tag, port) but protocol fields are usually mixed.
        // But our previous types definition had them flattened in the `schema` property.
        // Let's assume the protocol definition schema covers the REST of the fields.
        return schema.merge(protocolDef.schema);
    }
    return schema;
  }, [protocolDef]);

  const { data: certificates, isLoading: isLoadingCerts } = useCertificates();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
        ...baseDefaultValues,
        certificate_id: undefined as number | undefined,
    },
  });

  // Sync protocol change from our temp watcher or just use the main form's watcher 
  // if we can ensure re-render.
  // Actually, if we change schema on the fly, React Hook Form might need a reset or mode adjustment.
  // Let's just watch `protocol` in the main form.
  const formProtocol = watch('protocol') as string;
  const activeProtocolDef = getProtocol(formProtocol);

  useEffect(() => {
    if (initialData) {
        // Hydrate form using the protocol definition from the data itself
        const correctProtocolDef = getProtocol(initialData.protocol);
        
        let parsedConfig: any = {};
        try {
            parsedConfig = typeof initialData.config === 'string' 
                ? JSON.parse(initialData.config) 
                : initialData.config;
        } catch (e) {
            console.error("Failed to parse inbound config for hydration", e);
        }

        reset({
            tag: initialData.tag,
            protocol: initialData.protocol,
            port: initialData.port,
            certificate_id: initialData.certificate_id,
            ...correctProtocolDef?.fromSingBoxConfig(parsedConfig),
        });
    } else if (!initialData && open) {
        reset({ ...baseDefaultValues, protocol: initialProtocol || baseDefaultValues.protocol });
    }
  }, [initialData, reset, open, initialProtocol, baseDefaultValues]);

  // Handle final submission
  const onFinalSubmit = (data: any) => {
    // Transform to Sing-box Config
    if (!activeProtocolDef) return;
    
    // Get the base config from the protocol definition
    const baseConfig = activeProtocolDef.toSingBoxConfig(data);
    
    // Extract top-level fields for the API
    const payload = {
        tag: data.tag,
        protocol: baseConfig.type, // types from protocols map to sing-box types
        port: data.port,
        certificate_id: data.certificate_id || null, // Pass certificate_id
        config: {
            ...baseConfig,
            type: undefined, // Remove type as it's passed as protocol
        }
    };
    
    // Clean up undefined
    delete payload.config.type;

    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Panel 
        className="w-full max-w-2xl p-6 flex flex-col max-h-[85vh] border border-[var(--border-color)] bg-[var(--bg-base)]" 
        innerClassName="flex flex-col h-full overflow-hidden" 
        variant="elevated"
      >
        <div className="flex items-center justify-between mb-6 shrink-0 border-b border-[var(--border-color)] pb-4">
          <h2 className="text-xl font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            {initialData ? t('inbounds.edit_inbound') : t('inbounds.new_inbound')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-none hover:bg-[var(--bg-surface-hover)]">
            <X className="w-5 h-5 text-[var(--text-secondary)] hover:text-sing-red" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label={t('inbounds.tag')} 
                  placeholder="e.x. VLESS-TCP" 
                  error={errors.tag?.message as string}
                  {...register('tag')}
                />
                <Input 
                  label={t('inbounds.port')} 
                  type="number"
                  {...register('port', { valueAsNumber: true })}
                  error={errors.port?.message as string}
                />
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase">{t('inbounds.protocol')}</label>
                 <ProtocolSelector 
                    value={formProtocol}
                    mode={systemMode}
                    onChange={(val) => {
                        setValue('protocol', val);
                        // Optional: reset other fields or default values
                    }} 
                 />
              </div>
            </div>

              {/* Certificate Selection */}
              {activeProtocolDef?.sections.some(s => s.id === 'tls') && (
                 <div className="space-y-3 pt-6 mt-6 border-t border-[var(--border-color)]">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase">{t('inbounds.tls_certificate')}</label>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase bg-[var(--bg-surface)] px-2 py-0.5 border border-[var(--border-color)]">{t('common.optional')}</span>
                    </div>
                    
                    {isLoadingCerts ? (
                        <div className="h-10 w-full bg-[var(--bg-surface)] border border-[var(--border-color)] animate-pulse" />
                    ) : (
                        <select
                            {...register('certificate_id', { valueAsNumber: true })}
                            className="flex h-10 w-full border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)] appearance-none"
                        >
                            <option value="">-- No Certificate (Manual Configuration) --</option>
                            {certificates?.map((cert: any) => (
                                <option key={cert.id} value={cert.id}>
                                    {cert.name} ({cert.domain})
                                </option>
                            ))}
                        </select>
                    )}
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                      {t('inbounds.auto_configure_tls')}
                    </p>
                 </div>
              )}


            <AnimatePresence mode='popLayout'>
            {activeProtocolDef && (
                 <motion.div 
                   key={activeProtocolDef.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.2, ease: "easeInOut" }}
                   className="space-y-6 pt-2"
                >
                   {activeProtocolDef.sections.map((section) => (
                       <div key={section.id} className="space-y-4 border-t border-[var(--border-color)] pt-6 mt-6">
                           <h3 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase flex items-center gap-2">
                             <span className="w-1.5 h-4 bg-[var(--accent-primary)]" />
                             {section.title}
                           </h3>
                           <div className="space-y-4">
                               {section.fields.map(field => (
                                   <DynamicField 
                                      key={field.key} 
                                      field={field} 
                                      register={register}
                                      error={(errors as any)[field.key]?.message} // Note: nested errors handling might need generic accessor
                                      control={control}
                                      watchAll={watch()}
                                   />
                               ))}
                           </div>
                       </div>
                   ))}
                </motion.div>
            )}
            </AnimatePresence>
            
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[var(--border-color)] shrink-0">
             <Button type="button" variant="ghost" onClick={onClose} className="rounded-none border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]">
               {t('common.cancel')}
             </Button>
             <Button type="submit" isLoading={isSubmitting} className="rounded-none uppercase font-mono tracking-wider min-w-32">
               {initialData ? t('common.update') : t('common.create')}
             </Button>
           </div>
        </form>
      </Panel>
    </div>
  );
}
