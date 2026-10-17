import React, { useRef, useEffect } from 'react';
import { Search, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { OpenFreedomLogo } from './OpenFreedomLogo';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalApps: number;
  filteredCount: number;
  totalStars: number;
  isSyncing: boolean;
  syncMessage: string | null;
  syncType: 'success' | 'warning' | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  totalApps,
  filteredCount,
  totalStars,
  isSyncing,
  syncMessage,
  syncType,
}) => {
  const { t } = useLanguage();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener ('/' focuses search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className="relative pt-12 pb-10 border-b border-slate-800/60 overflow-hidden">
      {/* Subtle background glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-x-0 -top-32 h-96 bg-gradient-to-b from-emerald-500/10 via-purple-500/5 to-transparent blur-3xl opacity-70"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header content con logo original y OpenFreedom posicionado debajo */}
        <div className="max-w-3xl">
          <div className="flex flex-col items-start gap-3">
            <OpenFreedomLogo size={56} showText={false} />
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] text-balance">
              OpenFreedom
            </h1>
          </div>

          <p className="mt-3 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 px-5 bg-slate-900/60 border border-slate-800/80 rounded-xl backdrop-blur-sm">
          <div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalApps}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{t.hero.statApps}</div>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {(totalStars / 1000).toFixed(1)}k+
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{t.hero.statStars}</div>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-purple-400 tabular-nums">
              6
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{t.hero.statPlatforms}</div>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              100%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">FOSS & Open Source</div>
          </div>
        </div>

        {/* Sync notification message banner if present */}
        {syncMessage && (
          <div 
            className={`mt-4 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 border ${
              syncType === 'success' 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' 
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
            }`}
          >
            {syncType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Interactive Instant Search Bar */}
        <div className="mt-6 relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.hero.searchPlaceholder}
              aria-label="Buscar aplicaciones"
              className="w-full pl-12 pr-20 py-3.5 bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xl transition-all font-sans"
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title={t.hero.clearSearch}
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div 
                aria-hidden="true" 
                className="hidden sm:flex items-center gap-1 absolute right-3 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-400 pointer-events-none"
              >
                <span>Presiona</span>
                <kbd className="font-semibold text-slate-300">/</kbd>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
