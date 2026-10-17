import React, { useEffect } from 'react';
import { X, Globe, Sparkles, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t, supportedLanguages, detectedLanguage, isAutoDetected } = useLanguage();

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#0F1420] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto text-slate-100 animate-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0A0D14]/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 id="language-modal-title" className="text-base font-bold text-white">
                {t.languageModal.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.languageModal.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label={t.languageModal.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-300">
          
          {/* Autodetection status banner */}
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{t.languageModal.autoDetectBadge}</span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    {detectedLanguage.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t.languageModal.detectedMessage} <strong className="text-emerald-300">{detectedLanguage.toUpperCase()}</strong>
                  {isAutoDetected ? ` · ${t.languageModal.autoInUse}` : ` · ${t.languageModal.savedPreference}`}
                </p>
              </div>
            </div>
          </div>

          {/* 10 Languages Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              {t.languageModal.selectLanguagePrompt}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {supportedLanguages.map((lang) => {
                const isSelected = language === lang.code;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/40'
                        : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{lang.flag}</span>
                      <div>
                        <div className="text-xs font-bold font-sans flex items-center gap-1.5 text-white">
                          <span>{lang.nativeName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({lang.code})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {lang.name} · {lang.region}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{t.languageModal.currentActive}</span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0A0D14]/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            {t.topBar.brandName} · i18n
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            {t.languageModal.close}
          </button>
        </div>

      </div>
    </div>
  );
};
