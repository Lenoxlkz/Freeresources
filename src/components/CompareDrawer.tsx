import React, { useEffect } from 'react';
import { AppItem, Platform, PLATFORM_METADATA } from '../types/app';
import { X, Check, Minus, Trash2, Github, Download } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comparedApps: AppItem[];
  onRemoveApp: (appId: string) => void;
  onClearAll: () => void;
  onSelectDetails: (app: AppItem) => void;
  onOpenReleaseSelector?: (app: AppItem) => void;
}

const ALL_PLATFORMS: Platform[] = ['android', 'ios', 'windows', 'macos', 'linux', 'web'];

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  isOpen,
  onClose,
  comparedApps,
  onRemoveApp,
  onClearAll,
  onSelectDetails,
  onOpenReleaseSelector,
}) => {
  const { t } = useLanguage();

  const featureRows = [
    { key: 'backgroundPlayback', label: t.filterControls.features.backgroundPlayback },
    { key: 'offlineDownloads', label: t.filterControls.features.offlineDownloads },
    { key: 'syncedLyrics', label: t.filterControls.features.syncedLyrics },
    { key: 'androidAuto', label: t.filterControls.features.androidAuto },
    { key: 'losslessAudio', label: t.filterControls.features.losslessAudio },
    { key: 'sponsorBlock', label: t.filterControls.features.sponsorBlock },
    { key: 'equalizer', label: t.filterControls.features.equalizer },
    { key: 'noAccountNeeded', label: t.filterControls.features.noAccountNeeded },
  ] as const;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div 
        className="relative w-full max-w-5xl bg-[#0F1420] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h2 id="compare-modal-title" className="text-xl font-bold text-white">
              {t.compareDrawer.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.compareDrawer.subtitle} ({comparedApps.length}/3)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {comparedApps.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.compareDrawer.clearAll}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar modal de comparación"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Comparison Table */}
        <div className="overflow-x-auto p-6 overflow-y-auto">
          {comparedApps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base text-slate-300 font-medium">{t.compareDrawer.emptyTitle}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {t.compareDrawer.emptyDesc}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg cursor-pointer"
              >
                {t.compareDrawer.exploreButton}
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/4">
                    {t.compareDrawer.attributeCol}
                  </th>
                  {comparedApps.map((app) => (
                    <th key={app.id} className="py-3 px-4 w-1/4 align-top">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-white">{app.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{app.latestVersion}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveApp(app.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Quitar de comparación"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                  {Array.from({ length: 3 - comparedApps.length }).map((_, idx) => (
                    <th key={`empty-header-${idx}`} className="py-3 px-4 w-1/4 text-xs text-slate-500 italic bg-slate-900/20">
                      Espacio disponible
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                
                {/* Row: Source Platform Type */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-300">Tipo de Servicio</td>
                  {comparedApps.map((app) => (
                    <td key={app.id} className="py-3 px-4 capitalize text-emerald-400 font-medium">
                      {app.category.replace('-', ' ')}
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedApps.length }).map((_, idx) => (
                    <td key={`empty-cat-${idx}`} className="py-3 px-4 bg-slate-900/10" />
                  ))}
                </tr>

                {/* Row: License */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-300">Licencia de Software</td>
                  {comparedApps.map((app) => (
                    <td key={app.id} className="py-3 px-4 font-mono text-slate-200">
                      {app.license}
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedApps.length }).map((_, idx) => (
                    <td key={`empty-lic-${idx}`} className="py-3 px-4 bg-slate-900/10" />
                  ))}
                </tr>

                {/* Row: Tech Stack */}
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-300">Stack Tecnológico</td>
                  {comparedApps.map((app) => (
                    <td key={app.id} className="py-3 px-4 text-slate-300 font-mono">
                      {app.techStack.join(', ')}
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedApps.length }).map((_, idx) => (
                    <td key={`empty-stack-${idx}`} className="py-3 px-4 bg-slate-900/10" />
                  ))}
                </tr>

                {/* Subheader: Platform Compatibility */}
                <tr className="bg-slate-900/40">
                  <td colSpan={4} className="py-2 px-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                    Soporte por Plataforma
                  </td>
                </tr>

                {ALL_PLATFORMS.map((platform) => {
                  const meta = PLATFORM_METADATA[platform];
                  return (
                    <tr key={platform}>
                      <td className="py-2.5 px-4 text-slate-300 flex items-center gap-2">
                        <span>{meta.label}</span>
                      </td>
                      {comparedApps.map((app) => {
                        const supported = app.platforms.includes(platform);
                        return (
                          <td key={app.id} className="py-2.5 px-4">
                            {supported ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Compatible</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Minus className="w-4 h-4" />
                                <span>No disponible</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      {Array.from({ length: 3 - comparedApps.length }).map((_, idx) => (
                        <td key={`empty-plat-${platform}-${idx}`} className="py-2.5 px-4 bg-slate-900/10" />
                      ))}
                    </tr>
                  );
                })}

                {/* Subheader: Key Audio Features */}
                <tr className="bg-slate-900/40">
                  <td colSpan={4} className="py-2 px-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                    Funciones de Audio & Privacidad
                  </td>
                </tr>

                {featureRows.map((feat) => (
                  <tr key={feat.key}>
                    <td className="py-2.5 px-4 text-slate-300">
                      {feat.label}
                    </td>
                    {comparedApps.map((app) => {
                      const enabled = !!(app.features as any)[feat.key];
                      return (
                        <td key={app.id} className="py-2.5 px-4">
                          {enabled ? (
                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                          ) : (
                            <Minus className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                      );
                    })}
                    {Array.from({ length: 3 - comparedApps.length }).map((_, idx) => (
                      <td key={`empty-feat-${feat.key}-${idx}`} className="py-2.5 px-4 bg-slate-900/10" />
                    ))}
                  </tr>
                ))}

                {/* Row: Actions */}
                <tr className="bg-slate-900/30">
                  <td className="py-3 px-4 font-semibold text-slate-300">Acciones</td>
                  {comparedApps.map((app) => (
                    <td key={app.id} className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectDetails(app);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          {t.compareDrawer.viewDetails}
                        </button>
                        {onOpenReleaseSelector && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenReleaseSelector(app);
                            }}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-md transition-colors cursor-pointer"
                            title={t.compareDrawer.downloadLatest}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a
                          href={app.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-md transition-colors"
                          title="Ver repositorio"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedApps.length }).map((_, idx) => (
                    <td key={`empty-action-${idx}`} className="py-3 px-4 bg-slate-900/10" />
                  ))}
                </tr>

              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>{t.compareDrawer.pressEsc}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
          >
            {t.compareDrawer.close}
          </button>
        </div>

      </div>
    </div>
  );
};
