import React from 'react';
import { Github, Music2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-[#0A0D14] text-xs text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand & Attributions */}
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-sm">
            <Music2 className="w-4 h-4 text-emerald-400" />
            <span>OpenStream Directory</span>
          </div>
          <p className="text-slate-400 max-w-md">
            {t.footer.description}{' '}
            <a 
              href="https://github.com/chayotic/Open-Source-Music-Streaming-Apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-emerald-400 underline underline-offset-2 transition-colors"
            >
              chayotic/Open-Source-Music-Streaming-Apps
            </a>.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/chayotic/Open-Source-Music-Streaming-Apps"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>{t.footer.openSourceCatalog.split(' ')[0]} GitHub</span>
          </a>
          <a
            href="https://f-droid.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-emerald-400 transition-colors"
          >
            F-Droid
          </a>
          <a
            href="https://flathub.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-emerald-400 transition-colors"
          >
            Flathub
          </a>
        </div>

      </div>
    </footer>
  );
};
