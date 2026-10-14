import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MUSIC_APPS_DATABASE } from './data/musicApps';
import { AppItem, AppCategory, Platform, AppFeatures, GitHubRepoStats } from './types/app';
import { 
  getCachedStatsMap, 
  getStoredRateLimit, 
  RateLimitState, 
  fetchRepoFromGitHubAPI,
  fetchRateLimitNow,
  subscribeToRateLimit,
  getLastSyncTime
} from './services/githubService';

import { TopBar } from './components/TopBar';
import { HeroSection } from './components/HeroSection';
import { CategoryNav } from './components/CategoryNav';
import { FilterControls } from './components/FilterControls';
import { AppCard } from './components/AppCard';
import { CompareDrawer } from './components/CompareDrawer';
import { AppDetailModal } from './components/AppDetailModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { LanguageModal } from './components/LanguageModal';
import { QuotaMonitoringModal } from './components/QuotaMonitoringModal';
import { ReleaseSelectorModal } from './components/ReleaseSelectorModal';
import { Footer } from './components/Footer';

import { Layers, RotateCcw, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

const COMPARE_STORAGE_KEY = 'openstream_compared_app_ids';
const VIEW_MODE_STORAGE_KEY = 'openstream_view_mode';

type ViewMode = 'grid' | 'list';

export default function App() {
  const { t } = useLanguage();
  // Live stats cache map: repo -> GitHubRepoStats
  const [liveStatsMap, setLiveStatsMap] = useState<Record<string, GitHubRepoStats>>(() => getCachedStatsMap());
  const [rateLimit, setRateLimit] = useState<RateLimitState>(() => getStoredRateLimit());

  // Base catalog apps
  const [apps, setApps] = useState<AppItem[]>(() => {
    const cachedStats = getCachedStatsMap();
    return MUSIC_APPS_DATABASE.map((app) => {
      const stats = app.githubRepo ? cachedStats[app.githubRepo] : undefined;
      if (stats) {
        return {
          ...app,
          stars: stats.stars || app.stars,
          forks: stats.forks || app.forks,
          latestVersion: stats.latestReleaseTag || app.latestVersion,
          lastUpdated: stats.pushedAt || app.lastUpdated,
        };
      }
      return app;
    });
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [featureFilters, setFeatureFilters] = useState<Partial<Record<keyof AppFeatures, boolean>>>({});
  const [sortBy, setSortBy] = useState<'stars' | 'name' | 'recently-updated'>('stars');

  // View mode (grid | list), remembered between visits
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleChangeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
  }, []);

  // Comparison State
  const [comparedAppIds, setComparedAppIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Panels State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<AppItem | null>(null);
  const [selectedAppForReleases, setSelectedAppForReleases] = useState<AppItem | null>(null);
  const [isReleaseSelectorOpen, setIsReleaseSelectorOpen] = useState(false);

  // Sincronización robusta en tiempo real de la cuota de GitHub API
  useEffect(() => {
    // 1. Suscripción reactiva inmediata a cualquier cambio en la cuota
    const unsubscribe = subscribeToRateLimit((newRate) => {
      setRateLimit(newRate);
    });

    // 2. Consulta activa inmediata al montar la app para eliminar cualquier dato previo congelado (56/60)
    fetchRateLimitNow().then((fresh) => {
      setRateLimit(fresh);
    });

    // 3. Intervalo de actualización periódica cada 60 segundos
    const interval = setInterval(() => {
      fetchRateLimitNow();
    }, 60000);

    // 4. Sincronización al recuperar foco de ventana
    const handleFocus = () => {
      fetchRateLimitNow();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleOpenReleaseSelector = useCallback((app: AppItem) => {
    setSelectedAppForReleases(app);
    setIsReleaseSelectorOpen(true);
  }, []);

  // GitHub Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => getLastSyncTime());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncType, setSyncType] = useState<'success' | 'warning' | null>(null);

  // Save compared apps to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(comparedAppIds));
    } catch {
      // Ignore
    }
  }, [comparedAppIds]);

  // Handler when any card fetches fresh live stats
  const handleLiveStatsUpdated = useCallback((appId: string, stats: GitHubRepoStats) => {
    setRateLimit(getStoredRateLimit());
    setLiveStatsMap((prev) => {
      const next = { ...prev };
      const app = apps.find((a) => a.id === appId);
      if (app?.githubRepo) {
        next[app.githubRepo] = stats;
      }
      return next;
    });

    // Also update app's stars and version in state
    setApps((prevApps) =>
      prevApps.map((a) => {
        if (a.id === appId) {
          return {
            ...a,
            stars: stats.stars || a.stars,
            forks: stats.forks || a.forks,
            latestVersion: stats.latestReleaseTag || a.latestVersion,
            lastUpdated: stats.pushedAt || a.lastUpdated,
          };
        }
        return a;
      })
    );
  }, [apps]);

  // Platform Filter Toggle
  const handleTogglePlatform = useCallback((platform: Platform) => {
    setSelectedPlatforms((prev) => 
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }, []);

  const handleClearPlatforms = useCallback(() => {
    setSelectedPlatforms([]);
  }, []);

  // Feature Filter Toggle
  const handleToggleFeature = useCallback((key: keyof AppFeatures) => {
    setFeatureFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Reset all filters
  const handleResetAll = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPlatforms([]);
    setFeatureFilters({});
    setSortBy('stars');
  }, []);

  // Compare Toggle
  const handleToggleCompare = useCallback((app: AppItem) => {
    setComparedAppIds((prev) => {
      if (prev.includes(app.id)) {
        return prev.filter((id) => id !== app.id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, app.id];
    });
  }, []);

  const handleRemoveComparedApp = useCallback((appId: string) => {
    setComparedAppIds((prev) => prev.filter((id) => id !== appId));
  }, []);

  const handleClearAllCompared = useCallback(() => {
    setComparedAppIds([]);
  }, []);

  // Full Mass-Sync Handler (calls repos sequentially using live API)
  const handleSyncGitHub = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncMessage('Sincronizando repositorios y releases oficiales en vivo...');
    setSyncType(null);

    const reposToFetch = apps.filter((a) => a.githubRepo);
    let updatedCount = 0;
    let hitRateLimit = false;

    for (let i = 0; i < reposToFetch.length; i++) {
      const app = reposToFetch[i];
      const stats = await fetchRepoFromGitHubAPI(app.githubRepo!, true);
      const currentRate = getStoredRateLimit();
      setRateLimit(currentRate);

      if (stats) {
        updatedCount++;
        handleLiveStatsUpdated(app.id, stats);
      }

      if (currentRate.remaining <= 1) {
        hitRateLimit = true;
        break;
      }
    }

    const now = new Date().toISOString();
    setLastSyncedAt(now);

    if (hitRateLimit) {
      setSyncMessage(
        `Sincronización detenida por límite de cuota (${updatedCount} repos actualizados). Puedes ingresar un token personal para 5,000 req/hr.`
      );
      setSyncType('warning');
    } else {
      setSyncMessage(`¡Sincronización completada! ${updatedCount} repositorios actualizados con datos en vivo.`);
      setSyncType('success');
    }

    setIsSyncing(false);
    setTimeout(() => {
      setSyncMessage(null);
    }, 8000);
  }, [apps, isSyncing, handleLiveStatsUpdated]);

  // Compute Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<AppCategory | 'all', number> = {
      all: apps.length,
      'youtube-music': 0,
      spotify: 0,
      offline: 0,
      'self-hosted': 0,
      tools: 0,
    };
    apps.forEach((app) => {
      counts[app.category]++;
    });
    return counts;
  }, [apps]);

  // Compute Platform Counts
  const platformCounts = useMemo(() => {
    const counts: Record<Platform, number> = {
      android: 0,
      ios: 0,
      windows: 0,
      macos: 0,
      linux: 0,
      web: 0,
    };
    apps.forEach((app) => {
      app.platforms.forEach((p) => {
        counts[p]++;
      });
    });
    return counts;
  }, [apps]);

  // Total stars count
  const totalStars = useMemo(() => {
    return apps.reduce((acc, curr) => acc + curr.stars, 0);
  }, [apps]);

  // Filtered & Sorted Apps
  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return apps
      .filter((app) => {
        // Category check
        if (selectedCategory !== 'all' && app.category !== selectedCategory) {
          return false;
        }

        // Platform check
        if (selectedPlatforms.length > 0) {
          const hasMatch = selectedPlatforms.some((p) => app.platforms.includes(p));
          if (!hasMatch) return false;
        }

        // Feature filters check
        for (const [key, enabled] of Object.entries(featureFilters)) {
          if (enabled && !(app.features as any)[key]) {
            return false;
          }
        }

        // Search Query check
        if (query) {
          const matchName = app.name.toLowerCase().includes(query);
          const matchTagline = app.tagline.toLowerCase().includes(query);
          const matchDesc = app.description.toLowerCase().includes(query);
          const matchTech = app.techStack.some((t) => t.toLowerCase().includes(query));
          const matchPlatforms = app.platforms.some((p) => p.toLowerCase().includes(query));
          const matchSources = app.audioSources.some((s) => s.toLowerCase().includes(query));

          if (!matchName && !matchTagline && !matchDesc && !matchTech && !matchPlatforms && !matchSources) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') {
          return b.stars - a.stars;
        }
        if (sortBy === 'recently-updated') {
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        }
        return a.name.localeCompare(b.name);
      });
  }, [apps, selectedCategory, selectedPlatforms, featureFilters, searchQuery, sortBy]);

  // Compared Apps objects
  const comparedApps = useMemo(() => {
    return apps.filter((app) => comparedAppIds.includes(app.id));
  }, [apps, comparedAppIds]);

  const hasActiveFilters = 
    selectedCategory !== 'all' || 
    selectedPlatforms.length > 0 || 
    searchQuery.length > 0 || 
    Object.values(featureFilters).some(Boolean);

  return (
    <div className="min-h-screen bg-[#0A0D14] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Bar Navigation with Language & API Quota Selectors */}
      <TopBar
        onOpenCompare={() => setIsCompareOpen(true)}
        compareCount={comparedAppIds.length}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenTokenModal={() => setIsQuotaModalOpen(true)}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        onSyncGitHub={handleSyncGitHub}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        rateLimit={rateLimit}
      />

      {/* Hero Section with Search and Global KPIs */}
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalApps={apps.length}
        filteredCount={filteredApps.length}
        totalStars={totalStars}
        isSyncing={isSyncing}
        syncMessage={syncMessage}
        syncType={syncType}
      />

      {/* Main Categories Navigation Bar */}
      <div id="catalogo">
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* OS & Features Filter Controls */}
      <FilterControls
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={handleTogglePlatform}
        onClearPlatforms={handleClearPlatforms}
        featureFilters={featureFilters}
        onToggleFeature={handleToggleFeature}
        sortBy={sortBy}
        onSortChange={setSortBy}
        platformCounts={platformCounts}
        hasActiveFilters={hasActiveFilters}
        onResetAll={handleResetAll}
      />

      {/* Main Catalog Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs text-slate-400">
            {t.catalog.showing} <span className="font-mono font-semibold text-white tabular-nums">{filteredApps.length}</span> {t.catalog.appsFound}
          </div>

          {/* View mode toggle: grid / list */}
          <div
            role="group"
            aria-label={t.catalog.viewLabel}
            className="inline-flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg"
          >
            <button
              type="button"
              onClick={() => handleChangeViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              title={t.catalog.viewGrid}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.catalog.viewGrid}</span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeViewMode('list')}
              aria-pressed={viewMode === 'list'}
              title={t.catalog.viewList}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.catalog.viewList}</span>
            </button>
          </div>
        </div>

        {/* Apps Grid */}
        {filteredApps.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-3'
            }
          >
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                viewMode={viewMode}
                onSelectDetails={setSelectedAppForDetail}
                onToggleCompare={handleToggleCompare}
                onOpenReleaseSelector={handleOpenReleaseSelector}
                isCompared={comparedAppIds.includes(app.id)}
                canCompare={comparedAppIds.length < 3}
                onLiveStatsUpdated={handleLiveStatsUpdated}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 text-center max-w-lg mx-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              {t.catalog.emptyTitle}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {t.catalog.emptySubtitle}
            </p>
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.catalog.emptyReset}</span>
            </button>
          </div>
        )}

      </main>

      {/* Floating Bottom Comparison Bar (shows if at least 1 app is selected) */}
      {comparedAppIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center gap-3 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-2xl shadow-emerald-500/20 border border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>{t.compareDrawer.title}</span>
            </div>
            <span className="font-mono bg-slate-950 text-emerald-300 px-2 py-0.5 rounded text-[11px] tabular-nums">
              {comparedAppIds.length}/3
            </span>
          </button>
        </div>
      )}

      {/* Comparison Drawer / Modal */}
      <CompareDrawer
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparedApps={comparedApps}
        onRemoveApp={handleRemoveComparedApp}
        onClearAll={handleClearAllCompared}
        onSelectDetails={setSelectedAppForDetail}
        onOpenReleaseSelector={handleOpenReleaseSelector}
      />

      {/* App Detail Modal */}
      <AppDetailModal
        app={selectedAppForDetail}
        onClose={() => setSelectedAppForDetail(null)}
        onToggleCompare={handleToggleCompare}
        onOpenReleaseSelector={handleOpenReleaseSelector}
        isCompared={selectedAppForDetail ? comparedAppIds.includes(selectedAppForDetail.id) : false}
        canCompare={comparedAppIds.length < 3}
        cachedLiveStats={selectedAppForDetail?.githubRepo ? liveStatsMap[selectedAppForDetail.githubRepo] : undefined}
      />

      {/* Selector de Versiones y Descargas Rápidas ('Último Release:') */}
      <ReleaseSelectorModal
        app={selectedAppForReleases}
        isOpen={isReleaseSelectorOpen}
        onClose={() => {
          setIsReleaseSelectorOpen(false);
          setSelectedAppForReleases(null);
        }}
      />

      {/* FOSS Installation Guide Modal */}
      <InstallGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Modal Independiente de Selección de Idioma */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      {/* Modal Independiente de Monitoreo de Cuota y Configuración de API */}
      <QuotaMonitoringModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        onTokenUpdated={() => {
          fetchRateLimitNow().then(setRateLimit);
        }}
        currentRateLimit={rateLimit}
      />

      {/* Clean Accessible Footer */}
      <Footer />

    </div>
  );
}
