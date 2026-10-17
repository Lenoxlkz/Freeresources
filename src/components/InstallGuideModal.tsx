import React, { useEffect } from 'react';
import { X, Smartphone, Monitor, Terminal, ShieldAlert, CheckCircle2, ExternalLink } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
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
      aria-labelledby="guide-modal-title"
    >
      <div 
        className="relative w-full max-w-3xl bg-[#0F1420] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            <h2 id="guide-modal-title" className="text-xl font-bold text-white">
              Guía de Instalación de Apps FOSS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cómo instalar y actualizar aplicaciones de música de código abierto por plataforma
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs leading-relaxed text-slate-300">
          
          {/* Android Guide */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
              <Smartphone className="w-4 h-4" />
              <span>Android (F-Droid, IzzyOnDroid & APKs)</span>
            </div>
            <p>
              La forma más cómoda y segura de instalar apps open-source en Android es a través del cliente oficial de{' '}
              <strong className="text-white">F-Droid</strong> o agregando el repositorio{' '}
              <strong className="text-white">IzzyOnDroid</strong>. De esta manera recibirás actualizaciones automáticas sin necesidad de Google Play Store.
            </p>
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
              Tip: Si descargas el archivo .apk directamente desde "GitHub Releases", habilita la opción de "Instalar aplicaciones de fuentes desconocidas" en los ajustes de tu navegador.
            </div>
          </div>

          {/* Linux Guide */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
              <Terminal className="w-4 h-4" />
              <span>Linux (Flathub, Flatpak & Arch AUR)</span>
            </div>
            <p>
              La mayoría de los reproductores modernos (Spotube, Feishin, Tauon, Nuclear) se distribuyen oficialmente en{' '}
              <strong className="text-white">Flathub</strong>, lo que garantiza compatibilidad universal en Ubuntu, Fedora, Debian, Arch y Steam Deck:
            </p>
            <pre className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              flatpak install flathub oss.krtirtho.Spotube
            </pre>
          </div>

          {/* Windows Guide */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-sky-400">
              <Monitor className="w-4 h-4" />
              <span>Windows (Winget & Instaladores Directos)</span>
            </div>
            <p>
              En Windows 10 y 11 puedes instalar aplicaciones directamente desde tu terminal PowerShell utilizando el gestor de paquetes nativo{' '}
              <strong className="text-white">Winget</strong>:
            </p>
            <pre className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto">
              winget install KRTirtho.Spotube
            </pre>
          </div>

          {/* iOS Guide */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-400">
              <Smartphone className="w-4 h-4" />
              <span>iOS & iPadOS (Sideloading & TestFlight)</span>
            </div>
            <p>
              Debido a las políticas de Apple sobre clientes no oficiales de YouTube y Spotify, las aplicaciones open-source en iOS suelen requerir sideloading mediante herramientas como{' '}
              <strong className="text-white">AltStore</strong>,{' '}
              <strong className="text-white">SideStore</strong> o invitaciones de{' '}
              <strong className="text-white">TestFlight</strong> publicadas por los desarrolladores en sus respectivos canales de Discord o Telegram.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
