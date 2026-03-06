'use client';

import { useI18n, Language } from '@/lib/i18n';
import Button from './Button';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="relative text-sing-text-secondary hover:text-white"
      title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      <Languages className="w-5 h-5" />
      <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-sing-blue/20 text-sing-blue px-1 rounded uppercase" suppressHydrationWarning>
        {language}
      </span>
    </Button>
  );
}
