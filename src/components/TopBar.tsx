import React from 'react';
import { Music2, Github, ExternalLink, RefreshCw, Key, Globe } from 'lucide-react';
import { RateLimitState } from '../services/githubService';
import { useLanguage } from '../i18n/LanguageContext';

interface TopBarProps {
  onOpenCompare: () => void;
  compareCount: number;
  onOpenGuide: () => void;
  onOpenTokenModal: () => void;
  onOpenLanguageModal: () => void;
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
  onSyncGitHub,
  isSyncing,
  lastSyncedAt,
  rateLimit,
}) => {
  const { t, currentLanguageMeta } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-[#0A0D14]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <a 
          href="/" 
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
            <Music2 className="w-4 h-4" />
          </div>
          <span>OpenStream</span>
        </a>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
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
          <a 
            href="https://github.com/chayotic/Open-Source-Music-Streaming-Apps" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <span>Repo Original</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </nav>

        {/* Zone 3: Actions (Language + Quota + Sync + GitHub) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Language Selector Trigger Button */}
          <button
            type="button"
            onClick={onOpenLanguageModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title={`${t.topBar.language}: ${currentLanguageMeta.nativeName} (${currentLanguageMeta.code})`}
          >
            <span className="text-sm leading-none">{currentLanguageMeta.flag}</span>
            <span className="text-[11px] font-mono font-bold text-slate-300">
              {currentLanguageMeta.code.toUpperCase()}
            </span>
          </button>

          {/* Rate Limit & PAT status trigger button */}
          <button
            type="button"
            onClick={onOpenTokenModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cuota de la API REST de GitHub. Haz clic para configurar tu token personal."
          >
            <Key className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline text-[11px] text-slate-400 font-sans">API:</span>
            <span className="text-emerald-400 font-semibold tabular-nums text-[11px]">
              {rateLimit.remaining}
            </span>
            <span className="text-slate-500 text-[10px]">/{rateLimit.limit}</span>
          </button>

          {/* Sync button */}
          <button
            type="button"
            onClick={onSyncGitHub}
            disabled={isSyncing}
            title={lastSyncedAt ? `${t.topBar.syncedAt}: ${new Date(lastSyncedAt).toLocaleTimeString()}` : t.topBar.syncGitHub}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700/80 rounded-lg hover:border-slate-600 hover:text-white transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? t.topBar.syncing : t.topBar.syncGitHub.split(' ')[0]}</span>
          </button>

          {/* Primary CTA */}
          <a
            href="https://github.com/chayotic/Open-Source-Music-Streaming-Apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>

      </div>
    </header>
  );
};
