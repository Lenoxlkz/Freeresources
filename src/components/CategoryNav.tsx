import React from 'react';
import { AppCategory } from '../types/app';
import { Youtube, Disc3, HardDrive, Server, Layers, Wrench } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CategoryNavProps {
  selectedCategory: AppCategory | 'all';
  onSelectCategory: (category: AppCategory | 'all') => void;
  categoryCounts: Record<AppCategory | 'all', number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const { t } = useLanguage();

  const tabs: { id: AppCategory | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: t.categories.all, icon: Layers },
    { id: 'youtube-music', label: t.categories.youtubeMusic, icon: Youtube },
    { id: 'spotify', label: t.categories.spotify, icon: Disc3 },
    { id: 'offline', label: t.categories.offline, icon: HardDrive },
    { id: 'self-hosted', label: t.categories.selfHosted, icon: Server },
    { id: 'tools', label: t.categories.tools, icon: Wrench },
  ];

  return (
    <div className="w-full border-b border-slate-800/80 bg-[#0A0D14]/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          role="tablist" 
          aria-label="Categorías de aplicaciones"
          className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            const count = categoryCounts[tab.id] || 0;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span 
                  className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-emerald-500/25 text-emerald-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
