import React, { useEffect, useState } from 'react';
import { AppItem, PLATFORM_METADATA, GitHubRepoStats } from '../types/app';
import { 
  X, 
  Github, 
  ExternalLink, 
  Download, 
  Check, 
  Minus, 
  Star, 
  GitFork, 
  ShieldCheck, 
  Headphones, 
  Sparkles,
  Layers,
  Radio,
  FileDown,
  ChevronRight
} from 'lucide-react';
import { fetchRepoFromGitHubAPI } from '../services/githubService';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedApp, getLocalizedInstallSourceType } from '../i18n/appTranslations';

interface AppDetailModalProps {
  app: AppItem | null;
  onClose: () => void;
  onToggleCompare: (app: AppItem) => void;
  onOpenReleaseSelector?: (app: AppItem) => void;
  isCompared: boolean;
  canCompare: boolean;
  cachedLiveStats?: GitHubRepoStats;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  onClose,
  onToggleCompare,
  onOpenReleaseSelector,
  isCompared,
  canCompare,
  cachedLiveStats,
}) => {
  const { t, language } = useLanguage();
  const [liveStats, setLiveStats] = useState<GitHubRepoStats | null>(cachedLiveStats || null);

  useEffect(() => {
    if (app && app.githubRepo) {
      fetchRepoFromGitHubAPI(app.githubRepo)
        .then((stats) => {
          if (stats) setLiveStats(stats);
        });
    } else {
      setLiveStats(cachedLiveStats || null);
    }
  }, [app, cachedLiveStats]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && app) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [app, onClose]);

  if (!app) return null;

  const localized = getLocalizedApp(app, language);
  const starsCount = liveStats?.stars ?? app.stars;
  const forksCount = liveStats?.forks ?? app.forks;
  const versionTag = liveStats?.latestReleaseTag || app.latestVersion;
  const targetRepoUrl = liveStats?.verifiedHtmlUrl || app.githubUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-detail-title"
    >
      <div 
        className="relative w-full max-w-3xl bg-[#0F1420] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 id="app-detail-title" className="text-2xl font-extrabold text-white">
                {app.name}
              </h2>
              {liveStats && (
                <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  <span>{t.appDetailModal?.syncedViaGitHub || 'Sincronizado vía GitHub API'}</span>
                </span>
              )}
              {app.featured && !liveStats && (
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {t.appDetailModal?.featured || 'Destacada'}
                </span>
              )}
            </div>

            {/* Clean unboxed metadata with typographic separators */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mt-1">
              <span>{t.appDetailModal?.license || 'Licencia'} {liveStats?.licenseSpdx || app.license}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-300">{t.appDetailModal?.version || 'Versión'} {versionTag}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-amber-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {starsCount.toLocaleString()} {t.appDetailModal?.stars || 'estrellas'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-400 flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5" />
                {forksCount.toLocaleString()} {t.appDetailModal?.forks || 'forks'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleCompare(app)}
              disabled={!isCompared && !canCompare}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                isCompared
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : canCompare
                    ? 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                    : 'bg-slate-900 text-slate-400 opacity-50 cursor-not-allowed border border-slate-800'
              }`}
            >
              {isCompared ? <Check className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
              <span>{isCompared ? t.appDetailModal?.inCompare || 'En Comparación' : t.appDetailModal?.compare || 'Comparar'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label={t.appDetailModal?.close || 'Cerrar ficha'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Tagline & Extended Description Localized */}
          <div>
            <p className="text-sm font-semibold text-emerald-400 mb-2">
              {localized.tagline}
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">
              {localized.description}
            </p>
          </div>

          {/* Interactive 'Último Release' Quick Launcher Bar */}
          {onOpenReleaseSelector && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-700/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      {t.appDetailModal?.latestReleaseTitle || 'Último Release:'}
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {versionTag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {t.appDetailModal?.latestReleaseDesc || 'Selecciona entre las versiones disponibles y descarga instaladores oficiales (.apk, .exe, .dmg, etc.)'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReleaseSelector(app);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t.appDetailModal?.selectVersionAndDownload || 'Seleccionar Versión & Descargar'}</span>
              </button>
            </div>
          )}

          {/* Direct Download Assets from Latest GitHub Release */}
          {liveStats?.releaseAssets && liveStats.releaseAssets.length > 0 && (
            <div className="p-4 bg-emerald-950/25 border border-emerald-800/40 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{t.appDetailModal?.installationFilesTitle || 'Archivos de Instalación del Último Release'} ({liveStats.latestReleaseTag})</span>
                </h3>
                {liveStats.latestReleaseDate && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {t.appDetailModal?.published || 'Publicado:'} {liveStats.latestReleaseDate}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {liveStats.releaseAssets.map((asset, index) => (
                  <a
                    key={index}
                    href={asset.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileDown className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white group-hover:text-emerald-300 truncate font-mono">
                          {asset.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {(asset.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 transition-colors" />
                  </a>
                ))}
              </div>

              {onOpenReleaseSelector && app.githubRepo && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReleaseSelector(app);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <span>{t.appDetailModal?.exploreAllReleases || 'Explorar todas las versiones y descargas disponibles'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Operating Systems Availability Strip */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t.appDetailModal?.osCompatibilityTitle || 'Compatibilidad de Sistemas Operativos'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {app.platforms.map((plat) => {
                const meta = PLATFORM_METADATA[plat];
                return (
                  <div
                    key={plat}
                    className={`px-3 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 ${meta.badge}`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Download & Installation Sources */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{t.appDetailModal?.officialChannelsTitle || 'Canales de Descarga e Instalación Oficial'}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {app.installSources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {source.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {getLocalizedInstallSourceType(source.type, language)}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Audio Engine & Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Audio Sources & Tech Stack */}
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.appDetailModal?.audioAndStackTitle || 'Fuentes de Audio & Stack'}</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">{t.appDetailModal?.audioOriginLabel || 'Origen de Audio:'}</span>
                  <p className="text-slate-200 font-medium mt-0.5">{localized.audioSources.join(', ')}</p>
                </div>
                <div>
                  <span className="text-slate-400">{t.appDetailModal?.techStackLabel || 'Tecnologías Utilizadas:'}</span>
                  <p className="text-slate-200 font-mono mt-0.5">{app.techStack.join(' · ')}</p>
                </div>
              </div>
            </div>

            {/* Feature Checklist Localized */}
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.appDetailModal?.featuresTitle || 'Características Soportadas'}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  {app.features.backgroundPlayback ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{t.appDetailModal?.features?.backgroundPlayback || 'Segundo Plano'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  {app.features.offlineDownloads ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{t.appDetailModal?.features?.offlineDownloads || 'Descargas Offline'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  {app.features.syncedLyrics ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{t.appDetailModal?.features?.syncedLyrics || 'Letras en Vivo'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  {app.features.androidAuto ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{t.appDetailModal?.features?.androidAuto || 'Android Auto'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  {app.features.losslessAudio ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{t.appDetailModal?.features?.losslessAudio || 'Hi-Res Lossless'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  {app.features.sponsorBlock ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{t.appDetailModal?.features?.sponsorBlock || 'SponsorBlock'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Primary Links */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <a
            href={targetRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>{t.appDetailModal?.viewOnGitHub || 'Ver Repositorio Oficial en GitHub'}</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            {t.appDetailModal?.done || 'Listo'}
          </button>
        </div>

      </div>
    </div>
  );
};
