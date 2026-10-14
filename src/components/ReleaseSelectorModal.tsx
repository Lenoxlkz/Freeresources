import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppItem, GitHubRelease, ReleaseAsset } from '../types/app';
import { 
  X, 
  Download, 
  Tag, 
  Calendar, 
  FileDown, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  FileCode,
  Check,
  ChevronDown,
  Sparkles,
  MousePointerClick
} from 'lucide-react';
import { fetchAppReleases } from '../services/githubService';
import { useLanguage } from '../i18n/LanguageContext';

interface ReleaseSelectorModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReleaseSelectorModal: React.FC<ReleaseSelectorModalProps> = ({
  app,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number>(0);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'android' | 'windows' | 'macos' | 'linux' | 'source'>('all');
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<{
    assetName: string;
    downloadUrl: string;
    timestamp: number;
  } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Load releases when modal opens or app changes
  useEffect(() => {
    if (isOpen && app) {
      setDownloadFeedback(null);
      setShowChangelog(false);
      setPlatformFilter('all');
      setSelectedAssetIndex(0);

      if (app.githubRepo) {
        setIsLoading(true);
        fetchAppReleases(app.githubRepo)
          .then((data) => {
            if (data && data.length > 0) {
              setReleases(data);
              setSelectedReleaseId(data[0].id);
            } else {
              // Create a synthesized fallback release using app metadata
              const fallbackRelease: GitHubRelease = {
                id: 1,
                tagName: app.latestVersion,
                name: `${app.name} ${app.latestVersion}`,
                htmlUrl: `${app.githubUrl}/releases`,
                publishedAt: app.lastUpdated,
                prerelease: false,
                body: `Versión ${app.latestVersion} de ${app.name}.`,
                assets: app.installSources.map((source) => ({
                  name: `${app.name}-${app.latestVersion}-${source.name.replace(/\s+/g, '_')}`,
                  downloadUrl: source.url,
                  size: 0,
                })),
              };
              setReleases([fallbackRelease]);
              setSelectedReleaseId(fallbackRelease.id);
            }
          })
          .catch(() => {
            setReleases([]);
            setSelectedReleaseId(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        const fallbackRelease: GitHubRelease = {
          id: 1,
          tagName: app.latestVersion,
          name: `${app.name} ${app.latestVersion}`,
          htmlUrl: app.websiteUrl || '#',
          publishedAt: app.lastUpdated,
          prerelease: false,
          body: `Lanzamiento oficial de ${app.name}.`,
          assets: app.installSources.map((source) => ({
            name: `${app.name}-${source.name}`,
            downloadUrl: source.url,
            size: 0,
          })),
        };
        setReleases([fallbackRelease]);
        setSelectedReleaseId(fallbackRelease.id);
        setIsLoading(false);
      }
    }
  }, [isOpen, app]);

  // Handle Esc key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset selected asset index when release changes
  useEffect(() => {
    setSelectedAssetIndex(0);
    setDownloadFeedback(null);
  }, [selectedReleaseId]);

  if (!isOpen || !app) return null;

  const handleRefresh = async () => {
    if (!app.githubRepo || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const data = await fetchAppReleases(app.githubRepo, true);
      if (data && data.length > 0) {
        setReleases(data);
        if (!selectedReleaseId) {
          setSelectedReleaseId(data[0].id);
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const selectedRelease = releases.find((r) => r.id === selectedReleaseId) || releases[0];

  // Helper to categorize asset extension badge & target OS
  const getAssetMeta = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.apk')) {
      return { 
        platform: 'android', 
        label: 'Android APK', 
        color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' 
      };
    }
    if (lower.endsWith('.exe') || lower.endsWith('.msi')) {
      return { 
        platform: 'windows', 
        label: 'Windows (.exe/.msi)', 
        color: 'bg-sky-950/80 text-sky-300 border-sky-700/60' 
      };
    }
    if (lower.endsWith('.dmg') || lower.endsWith('.pkg')) {
      return { 
        platform: 'macos', 
        label: 'macOS (.dmg)', 
        color: 'bg-purple-950/80 text-purple-300 border-purple-700/60' 
      };
    }
    if (lower.endsWith('.appimage') || lower.endsWith('.deb') || lower.endsWith('.rpm') || lower.endsWith('.tar.gz')) {
      return { 
        platform: 'linux', 
        label: t.releaseModal.linuxPackage, 
        color: 'bg-amber-950/80 text-amber-300 border-amber-700/60' 
      };
    }
    if (lower.endsWith('.ipa')) {
      return { 
        platform: 'ios', 
        label: 'iOS (.ipa)', 
        color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' 
      };
    }
    if (lower.endsWith('.zip')) {
      return { 
        platform: 'source', 
        label: t.releaseModal.zipArchive, 
        color: 'bg-slate-800 text-slate-300 border-slate-700' 
      };
    }
    return { 
      platform: 'other', 
      label: t.releaseModal.installerBinary, 
      color: 'bg-slate-900 text-slate-300 border-slate-700' 
    };
  };

  // Filtered assets by selected platform filter
  const filteredAssets = selectedRelease?.assets?.filter((asset) => {
    if (platformFilter === 'all') return true;
    const meta = getAssetMeta(asset.name);
    return meta.platform === platformFilter;
  }) || [];

  // Active asset for primary download
  const activeAsset = filteredAssets[selectedAssetIndex] || selectedRelease?.assets?.[0];

  // Helper to trigger real direct download
  const triggerDownload = (asset: { name: string; downloadUrl: string }) => {
    setDownloadFeedback({
      assetName: asset.name,
      downloadUrl: asset.downloadUrl,
      timestamp: Date.now(),
    });

    const link = document.createElement('a');
    link.href = asset.downloadUrl;
    link.setAttribute('download', asset.name);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCurrentReleaseLatest = releases.length > 0 && selectedRelease?.id === releases[0]?.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-release-title"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-3xl bg-[#0B0F19] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                  {t.releaseModal.titlePrefix}
                </span>
                <h2 id="modal-release-title" className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{app.name}</span>
                  <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                    {selectedRelease ? selectedRelease.tagName : app.latestVersion}
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.releaseModal.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {app.githubRepo && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Actualizar releases desde GitHub"
                aria-label="Refrescar versiones"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {isLoading ? (
            /* Loading State */
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">Consultando versiones disponibles...</p>
              <p className="text-xs text-slate-400">
                Obteniendo lanzamientos y ejecutables oficiales desde <code className="font-mono text-emerald-400">{app.githubRepo}</code>
              </p>
            </div>
          ) : releases.length === 0 ? (
            /* No releases found */
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-4">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {t.releaseModal.noReleasesTitle}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {t.releaseModal.noReleasesSubtitle}
                </p>
              </div>

              {app.installSources.length > 0 && (
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  {app.installSources.map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{source.name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* STEP 1: Highly Interactive & Visual Version Selector */}
              <div className="bg-slate-900/80 border-2 border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-4.5 space-y-3.5 transition-all shadow-lg shadow-emerald-950/20">
                
                {/* Visual Interactivity Banner */}
                <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <MousePointerClick className="w-4 h-4 text-emerald-400 animate-bounce" />
                    <span className="uppercase tracking-wide">{t.releaseModal.step1Title}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                    <span>{releases.length} {t.releaseModal.registeredVersionsSuffix}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400">{t.releaseModal.tapToSwitch}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed flex items-center gap-1.5">
                  <span>{t.releaseModal.interactiveBanner}</span>
                </p>

                {/* Dropdown Selector for Fast Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <label htmlFor="version-select-dropdown" className="text-xs text-slate-400 font-medium">
                    {t.releaseModal.selectVersionLabel} <strong className="font-mono text-emerald-400">{selectedRelease?.tagName}</strong>
                  </label>

                  <div className="relative min-w-[240px]">
                    <select
                      id="version-select-dropdown"
                      value={selectedRelease?.id || ''}
                      onChange={(e) => setSelectedReleaseId(Number(e.target.value))}
                      className="w-full appearance-none bg-slate-800/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-emerald-500/60 text-white text-xs font-mono font-bold rounded-xl px-3.5 py-2 pr-9 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                    >
                      {releases.map((rel, idx) => (
                        <option key={rel.id} value={rel.id}>
                          {rel.tagName} {idx === 0 ? `(${t.releaseModal.latestBadge})` : ''} {rel.prerelease ? `(${t.releaseModal.preReleaseBadge})` : ''} {rel.publishedAt ? `— ${rel.publishedAt}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Prominent Visual Interactive Version Chips (1-Click Switcher) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
                    {releases.map((rel, index) => {
                      const isSelected = selectedRelease?.id === rel.id;
                      const isLatest = index === 0 && !rel.prerelease;

                      return (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => setSelectedReleaseId(rel.id)}
                          title={`${t.releaseModal.tapToSelectVersion} ${rel.tagName}`}
                          className={`relative px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 border-2 flex items-center gap-2 active:scale-95 group ${
                            isSelected
                              ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                              : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800/90 border-slate-700/80 hover:border-emerald-500/60 hover:scale-[1.02]'
                          }`}
                        >
                          <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'} transition-colors`} />
                          
                          <span className="font-mono font-bold">{rel.tagName}</span>

                          {isSelected && (
                            <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>{t.releaseModal.activeBadge}</span>
                            </span>
                          )}

                          {isLatest && !isSelected && (
                            <span className="text-[10px] font-sans font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              {t.releaseModal.latestBadge}
                            </span>
                          )}

                          {rel.prerelease && (
                            <span className="text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {t.releaseModal.preReleaseBadge}
                            </span>
                          )}

                          {!isSelected && (
                            <span className="hidden group-hover:inline text-[9px] font-mono text-emerald-300/80">
                              {t.releaseModal.tapHint}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Selected Version Meta & Summary Banner */}
              {selectedRelease && (
                <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-white font-mono">
                          {selectedRelease.tagName}
                        </span>
                        {isCurrentReleaseLatest && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                            {t.releaseModal.recommendedBadge}
                          </span>
                        )}
                        {selectedRelease.prerelease && (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded">
                            {t.releaseModal.preReleaseBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedRelease.publishedAt || 'Fecha no especificada'}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          {selectedRelease.assets.length} {t.releaseModal.installersAvailable}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      {selectedRelease.body && (
                        <button
                          type="button"
                          onClick={() => setShowChangelog(!showChangelog)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        >
                          {showChangelog ? t.releaseModal.hideChangelog : t.releaseModal.showChangelog}
                        </button>
                      )}

                      <a
                        href={selectedRelease.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        title="Ver en GitHub"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>GitHub</span>
                      </a>
                    </div>
                  </div>

                  {/* Optional Changelog Accordion */}
                  {showChangelog && selectedRelease.body && (
                    <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {selectedRelease.body}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Platform Filter and Asset List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.releaseModal.step2Title}</span>
                  </label>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                    {(['all', 'android', 'windows', 'macos', 'linux'] as const).map((filterKey) => {
                      const labels = {
                        all: t.releaseModal.filterAll,
                        android: t.releaseModal.filterAndroid,
                        windows: t.releaseModal.filterWindows,
                        macos: t.releaseModal.filterMac,
                        linux: t.releaseModal.filterLinux,
                      };
                      const isActive = platformFilter === filterKey;
                      return (
                        <button
                          key={filterKey}
                          type="button"
                          onClick={() => {
                            setPlatformFilter(filterKey);
                            setSelectedAssetIndex(0);
                          }}
                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                            isActive
                              ? 'bg-slate-700 text-white font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          {labels[filterKey]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* If selected release has no binary assets */}
                {selectedRelease?.assets?.length === 0 ? (
                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-3">
                    <p className="text-xs text-slate-300">
                      {t.releaseModal.noReleasesSubtitle}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => triggerDownload({
                          name: `${app.name}-${selectedRelease.tagName}.zip`,
                          downloadUrl: `https://github.com/${app.githubRepo}/archive/refs/tags/${selectedRelease.tagName}.zip`
                        })}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t.releaseModal.downloadSourceZip}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerDownload({
                          name: `${app.name}-${selectedRelease.tagName}.tar.gz`,
                          downloadUrl: `https://github.com/${app.githubRepo}/archive/refs/tags/${selectedRelease.tagName}.tar.gz`
                        })}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
                      >
                        <FileCode className="w-4 h-4 text-purple-400" />
                        <span>Source Code (.tar.gz)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Asset List */
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredAssets.length === 0 ? (
                      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg text-center text-xs text-slate-400">
                        {t.releaseModal.noFilteredAssets}
                      </div>
                    ) : (
                      filteredAssets.map((asset, index) => {
                        const meta = getAssetMeta(asset.name);
                        const isDownloadingThis = downloadFeedback?.assetName === asset.name;
                        const isSelectedAsset = index === selectedAssetIndex;

                        return (
                          <div
                            key={asset.name + index}
                            onClick={() => setSelectedAssetIndex(index)}
                            className={`p-3.5 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                              isSelectedAsset
                                ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/40'
                                : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isSelectedAsset ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                <FileDown className="w-4 h-4" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold font-mono text-white truncate max-w-xs sm:max-w-md">
                                    {asset.name}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${meta.color}`}>
                                    {meta.label}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5 flex items-center gap-2">
                                  {typeof asset.size === 'number' && (
                                    <span>{(asset.size / (1024 * 1024)).toFixed(1)} MB</span>
                                  )}
                                  {asset.downloadCount !== undefined && asset.downloadCount >= 0 && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>
                                        {asset.downloadCount.toLocaleString()}{' '}
                                        {asset.downloadCount === 1
                                          ? t.releaseModal.downloadsCountSingular
                                          : t.releaseModal.downloadsCountPlural}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Direct Action Download Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerDownload(asset);
                              }}
                              className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 shadow-sm ${
                                isDownloadingThis
                                  ? 'bg-emerald-500 text-slate-950 font-extrabold ring-2 ring-emerald-300'
                                  : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 active:scale-95'
                              }`}
                            >
                              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{isDownloadingThis ? t.releaseModal.downloadingButton : t.releaseModal.downloadButton}</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Active Download Feedback Banner */}
              {downloadFeedback && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 min-w-0">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
                    <span className="truncate">
                      {t.releaseModal.downloadSuccess} <strong className="font-mono text-white">{downloadFeedback.assetName}</strong>.
                    </span>
                  </div>
                  <a
                    href={downloadFeedback.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline shrink-0 cursor-pointer"
                  >
                    {t.releaseModal.notStartingHelp}
                  </a>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t.releaseModal.officialServerNotice}</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {activeAsset && (
              <button
                type="button"
                onClick={() => triggerDownload(activeAsset)}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t.releaseModal.downloadButton} ({activeAsset.name.length > 20 ? activeAsset.name.slice(0, 18) + '...' : activeAsset.name})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {t.releaseModal.close}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
