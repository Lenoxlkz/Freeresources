import React from 'react';
import { Github, ExternalLink, Key, Bot } from 'lucide-react';
import { RateLimitState } from '../services/githubService';
import { useLanguage } from '../i18n/LanguageContext';
import { OpenFreedomLogo } from './OpenFreedomLogo';

interface TopBarProps {
  onOpenCompare: () => void;
  compareCount: number;
  onOpenGuide: () => void;
  onOpenTokenModal: () => void;
  onOpenLanguageModal: () => void;
  onOpenPinchtab: () => void;
  onSyncGitHub: () => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  rateLimit: RateLimitState;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCompare,
  compareCount,
  onOpenGuide,
  onOpenTokenModal,
  onOpenLanguageModal,
  onOpenPinchtab,
  rateLimit,
}) => {
  const { t, currentLanguageMeta } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-[#0A0D14]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Zone 1: Logo OpenFreedom */}
        <a 
          href="/" 
          className="flex items-center gap-2 group shrink min-w-0"
          title="OpenFreedom - Apps de código abierto para escuchar música"
        >
          <OpenFreedomLogo size={32} showText={true} textSize="sm" />
        </a>

        {/* Zone 2: Navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-400">
          <a href="#catalogo" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            {t.topBar.directory}
          </a>
          <button 
            type="button"
            onClick={onOpenCompare}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{t.topBar.compareMatrix}</span>
            {compareCount > 0 && (
              <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tabular-nums">
                {compareCount}
              </span>
            )}
          </button>
          <button 
            type="button"
            onClick={onOpenGuide}
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.topBar.installGuide}
          </button>
          <button
            type="button"
            onClick={onOpenPinchtab}
            className="hover:text-emerald-400 text-emerald-300/90 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            title="Pinchtab: Automatización de navegadores & orquestador"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pinchtab</span>
          </button>
          <a 
            href="https://github.com/pinchtab/pinchtab" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-xs text-slate-500"
            title="Pinchtab GitHub"
          >
            <span>Bot</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </nav>

        {/* Zone 3: Actions (Language + Quota + GitHub) - Totalmente optimizado para pantallas móviles */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Language Selector Trigger Button */}
          <button
            type="button"
            onClick={onOpenLanguageModal}
            className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
            title={`${t.topBar.language}: ${currentLanguageMeta.nativeName} (${currentLanguageMeta.code})`}
          >
            <span className="text-sm leading-none">{currentLanguageMeta.flag}</span>
            <span className="text-[11px] font-mono font-bold text-slate-300">
              {currentLanguageMeta.code.toUpperCase()}
            </span>
          </button>

          {/* Rate Limit status trigger button */}
          <button
            type="button"
            onClick={onOpenTokenModal}
            className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-mono rounded-lg border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Cuota de GitHub API: 60 req/h por navegador/IP"
          >
            <Key className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-emerald-400 font-semibold tabular-nums text-[11px]">
              {rateLimit.remaining}
            </span>
            <span className="text-slate-500 text-[10px]">/{rateLimit.limit}</span>
          </button>

          {/* GitHub CTA Icon (Compacto en móvil para no desbordar) */}
          <a
            href="https://github.com/chayotic/Open-Source-Music-Streaming-Apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            title="Repositorio oficial en GitHub"
          >
            <Github className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline sm:ml-1.5">GitHub</span>
          </a>

        </div>

      </div>
    </header>
  );
};
