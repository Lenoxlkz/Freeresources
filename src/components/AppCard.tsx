import React, { useState, useEffect, useRef } from 'react';
import { AppItem, PLATFORM_METADATA, GitHubRepoStats } from '../types/app';
import { 
  Github, 
  Star, 
  ExternalLink, 
  Layers, 
  Check, 
  Download, 
  Headphones, 
  GitFork,
  Radio,
  ChevronRight,
  MousePointerClick
} from 'lucide-react';
import { fetchRepoFromGitHubAPI } from '../services/githubService';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedApp } from '../i18n/appTranslations';

interface AppCardProps {
  app: AppItem;
  viewMode?: 'grid' | 'list';
  onSelectDetails: (app: AppItem) => void;
  onToggleCompare: (app: AppItem) => void;
  onOpenReleaseSelector: (app: AppItem) => void;
  isCompared: boolean;
  canCompare: boolean;
  onLiveStatsUpdated?: (appId: string, stats: GitHubRepoStats) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  viewMode = 'grid',
  onSelectDetails,
  onToggleCompare,
  onOpenReleaseSelector,
  isCompared,
  canCompare,
  onLiveStatsUpdated,
}) => {
  const { t, language } = useLanguage();
  const localized = getLocalizedApp(app, language);
  const [liveStats, setLiveStats] = useState<GitHubRepoStats | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const hasTriggeredRef = useRef(false);

  // Progressive on-screen auto-fetching with IntersectionObserver
  useEffect(() => {
    if (!app.githubRepo || hasTriggeredRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;

          fetchRepoFromGitHubAPI(app.githubRepo!)
            .then((stats) => {
              if (stats) {
                setLiveStats(stats);
                if (onLiveStatsUpdated) {
                  onLiveStatsUpdated(app.id, stats);
                }
              }
            });
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [app.githubRepo, app.id, onLiveStatsUpdated]);

  const starsCount = liveStats?.stars ?? app.stars;
  const forksCount = liveStats?.forks ?? app.forks;
  const versionTag = liveStats?.latestReleaseTag || app.latestVersion;
  const targetRepoUrl = liveStats?.verifiedHtmlUrl || app.githubUrl;

  // ---------- LIST LAYOUT (compact row) ----------
  if (viewMode === 'list') {
    return (
      <article
        ref={cardRef}
        className="group relative flex flex-col md:flex-row md:items-center gap-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl px-4 py-3.5 transition-all duration-200"
      >
        {/* Identity: name, metadata, tagline */}
        <div className="min-w-0 md:flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              {app.name}
            </h3>
            {liveStats && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded"
                title="Sincronizado en vivo"
              >
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                <span>{t.appCard.live}</span>
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mt-0.5">
            <span>{liveStats?.licenseSpdx || app.license}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-300">{versionTag}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums flex items-center gap-1 text-amber-300">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {starsCount.toLocaleString()}
            </span>
            {liveStats && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums flex items-center gap-1 text-slate-400">
                  <GitFork className="w-3 h-3" />
                  {forksCount.toLocaleString()}
                </span>
              </>
            )}
          </div>

          <p className="text-xs font-medium text-emerald-400/90 mt-1.5 leading-relaxed line-clamp-1">
            {localized.tagline}
          </p>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed line-clamp-2">
            {localized.description}
          </p>
        </div>

        {/* Platforms + audio source */}
        <div className="md:w-60 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {app.platforms.map((platform) => {
              const meta = PLATFORM_METADATA[platform];
              return (
                <span
                  key={platform}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded border ${meta.badge}`}
                >
                  {meta.label}
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 min-w-0">
            <Headphones className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{localized.audioSources.join(', ')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => onToggleCompare(app)}
            disabled={!isCompared && !canCompare}
            title={
              isCompared
                ? 'Quitar de la matriz comparativa'
                : canCompare
                  ? t.appCard.compare
                  : t.appCard.maxCompare
            }
            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
              isCompared
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : canCompare
                  ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                  : 'bg-slate-900/40 text-slate-400 opacity-50 cursor-not-allowed border border-slate-800'
            }`}
          >
            {isCompared ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
            ) : (
              <Layers className="w-3.5 h-3.5" />
            )}
            <span className="hidden xl:inline">{isCompared ? t.appCard.inList : t.appCard.compare}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReleaseSelector(app)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 hover:border-emerald-400 rounded-lg transition-colors cursor-pointer"
            title={t.appCard.downloadTitle}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="font-mono max-w-[6rem] truncate">{versionTag}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectDetails(app)}
            className="px-3 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer"
          >
            {t.appCard.detailsAndSources}
          </button>

          <a
            href={targetRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
            title={`${t.appCard.viewRepo}: ${targetRepoUrl}`}
          >
            <Github className="w-4 h-4" />
          </a>

          {app.websiteUrl && (
            <a
              href={app.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
              title={t.appCard.visitWebsite}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </article>
    );
  }

  // ---------- GRID LAYOUT (default card) ----------
  return (
    <article 
      ref={cardRef}
      className="group relative flex flex-col justify-between bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 transition-all duration-200"
    >
      {/* Top Header Zone: App Name & Actions */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                {app.name}
              </h3>
              {liveStats && (
                <span 
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded"
                  title="Sincronizado en vivo"
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  <span>{t.appCard.live}</span>
                </span>
              )}
            </div>
            
            {/* Clean unboxed metadata with typographic separators */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mt-0.5">
              <span>{liveStats?.licenseSpdx || app.license}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-300">{versionTag}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums flex items-center gap-1 text-amber-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {starsCount.toLocaleString()}
              </span>
              {liveStats && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums flex items-center gap-1 text-slate-400">
                    <GitFork className="w-3 h-3" />
                    {forksCount.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Comparison Checkbox */}
          <button
            type="button"
            onClick={() => onToggleCompare(app)}
            disabled={!isCompared && !canCompare}
            title={
              isCompared 
                ? 'Quitar de la matriz comparativa' 
                : canCompare 
                  ? t.appCard.compare 
                  : t.appCard.maxCompare
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer shrink-0 ${
              isCompared
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : canCompare
                  ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                  : 'bg-slate-900/40 text-slate-400 opacity-50 cursor-not-allowed border border-slate-800'
            }`}
          >
            {isCompared ? (
              <>
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                <span>{t.appCard.inList}</span>
              </>
            ) : (
              <>
                <Layers className="w-3 h-3" />
                <span>{t.appCard.compare}</span>
              </>
            )}
          </button>
        </div>

        {/* Tagline & Description Localized */}
        <p className="text-xs font-medium text-emerald-400/90 mb-2 leading-relaxed">
          {localized.tagline}
        </p>
        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
          {localized.description}
        </p>

        {/* Platform Compatibility Indicator */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            {t.appCard.compatibleOS}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {app.platforms.map((platform) => {
              const meta = PLATFORM_METADATA[platform];
              return (
                <span
                  key={platform}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded border ${meta.badge}`}
                >
                  {meta.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Interactive 'Último Release:' Bar with High-Visibility Touch Cue */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => onOpenReleaseSelector(app)}
            className="w-full p-2.5 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900/80 hover:from-emerald-950/70 hover:to-slate-800 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer group/release text-left shadow-sm hover:shadow-emerald-950/50 active:scale-[0.99]"
            title="Toca para seleccionar versión disponible y descargar archivo oficial"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover/release:scale-110 transition-transform">
                <Download className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                    {t.appCard.latestReleaseTitle}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950 px-1 py-0.2 rounded border border-emerald-800 flex items-center gap-0.5">
                    <MousePointerClick className="w-2.5 h-2.5" />
                    <span>Tocar</span>
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white group-hover/release:text-emerald-200 transition-colors truncate block">
                  {versionTag}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-emerald-400 group-hover/release:text-emerald-300 group-hover/release:translate-x-0.5 transition-all">
              <span className="text-[11px]">{t.appCard.changeVersionDownload}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Audio Sources & Tech Stack Info */}
        <div className="text-xs text-slate-400 space-y-1 mb-5">
          <div className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{localized.audioSources.join(', ')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[11px] font-mono text-slate-400">{t.appCard.stack}</span>
            <span className="truncate">{app.techStack.join(' · ')}</span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectDetails(app)}
          className="flex-1 px-3 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer text-center"
        >
          {t.appCard.detailsAndSources}
        </button>

        <button
          type="button"
          onClick={() => onOpenReleaseSelector(app)}
          className="p-2 text-emerald-400 hover:text-emerald-300 bg-slate-800/70 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700/80"
          title={t.appCard.downloadTitle}
        >
          <Download className="w-4 h-4" />
        </button>

        <a
          href={targetRepoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
          title={`${t.appCard.viewRepo}: ${targetRepoUrl}`}
        >
          <Github className="w-4 h-4" />
        </a>

        {app.websiteUrl && (
          <a
            href={app.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
            title={t.appCard.visitWebsite}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

    </article>
  );
};
