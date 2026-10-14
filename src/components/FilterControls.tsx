import React from 'react';
import { Platform, AppFeatures, PLATFORM_METADATA } from '../types/app';
import { SlidersHorizontal, RotateCcw, Check, ArrowDownUp } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface FilterControlsProps {
  selectedPlatforms: Platform[];
  onTogglePlatform: (platform: Platform) => void;
  onClearPlatforms: () => void;
  featureFilters: Partial<Record<keyof AppFeatures, boolean>>;
  onToggleFeature: (key: keyof AppFeatures) => void;
  sortBy: 'stars' | 'name' | 'recently-updated';
  onSortChange: (sort: 'stars' | 'name' | 'recently-updated') => void;
  platformCounts: Record<Platform, number>;
  hasActiveFilters: boolean;
  onResetAll: () => void;
}

const ALL_PLATFORMS: Platform[] = ['android', 'windows', 'linux', 'macos', 'ios', 'web'];

export const FilterControls: React.FC<FilterControlsProps> = ({
  selectedPlatforms,
  onTogglePlatform,
  onClearPlatforms,
  featureFilters,
  onToggleFeature,
  sortBy,
  onSortChange,
  platformCounts,
  hasActiveFilters,
  onResetAll,
}) => {
  const { t } = useLanguage();

  const keyFeatures: { key: keyof AppFeatures; label: string }[] = [
    { key: 'backgroundPlayback', label: t.filterControls.features.backgroundPlayback },
    { key: 'offlineDownloads', label: t.filterControls.features.offlineDownloads },
    { key: 'syncedLyrics', label: t.filterControls.features.syncedLyrics },
    { key: 'androidAuto', label: t.filterControls.features.androidAuto },
    { key: 'losslessAudio', label: t.filterControls.features.losslessAudio },
    { key: 'sponsorBlock', label: t.filterControls.features.sponsorBlock },
    { key: 'noAccountNeeded', label: t.filterControls.features.noAccountNeeded },
  ];

  return (
    <div className="py-4 border-b border-slate-800/80 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Row 1: Platforms and Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Platform Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.filterControls.filterByOS}:</span>
            </span>

            <button
              type="button"
              onClick={onClearPlatforms}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedPlatforms.length === 0
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.releaseModal.filterAll}
            </button>

            {ALL_PLATFORMS.map((platform) => {
              const meta = PLATFORM_METADATA[platform];
              const isSelected = selectedPlatforms.includes(platform);
              const count = platformCounts[platform] || 0;

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => onTogglePlatform(platform)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? `${meta.badge} border font-semibold shadow-sm`
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{meta.label}</span>
                  <span className="text-[10px] font-mono tabular-nums opacity-75">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector & Reset button */}
          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>{t.filterControls.sortBy}:</span>
              
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                aria-label={t.filterControls.sortBy}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="stars">{t.filterControls.sortStars}</option>
                <option value="name">{t.filterControls.sortName}</option>
                <option value="recently-updated">{t.filterControls.sortUpdated}</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetAll}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-900/40"
                title={t.filterControls.resetAll}
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">{t.filterControls.resetAll}</span>
              </button>
            )}
          </div>

        </div>

        {/* Row 2: Audio & Functional Feature Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
            {t.filterControls.filterByFeatures}:
          </span>

          {keyFeatures.map((feat) => {
            const isEnabled = !!featureFilters[feat.key];

            return (
              <button
                key={feat.key}
                type="button"
                onClick={() => onToggleFeature(feat.key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isEnabled
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-sm'
                    : 'bg-slate-800/40 text-slate-400 hover:text-slate-300 hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                {isEnabled && <Check className="w-3 h-3 text-purple-400 stroke-[3]" />}
                <span>{feat.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
