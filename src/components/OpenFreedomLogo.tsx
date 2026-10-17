import React from 'react';

interface OpenFreedomLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textBelow?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const OpenFreedomLogo: React.FC<OpenFreedomLogoProps> = ({
  size = 36,
  className = '',
  showText = true,
  textBelow = false,
  textSize = 'md',
}) => {
  const textClasses = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-3xl sm:text-4xl',
  }[textSize];

  return (
    <div
      className={`inline-flex items-center ${
        textBelow ? 'flex-col justify-center gap-2' : 'flex-row gap-2.5'
      } ${className}`}
    >
      {/* Isotipo: Onda sonora estilizada en alas de libertad */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30 p-1.5 shadow-[0_0_20px_-3px_rgba(16,185,129,0.3)] group-hover:border-emerald-400/60 group-hover:shadow-[0_0_25px_-2px_rgba(16,185,129,0.5)] transition-all duration-150"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="of-wing-left" x1="4" y1="24" x2="22" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="of-wing-right" x1="44" y1="24" x2="26" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="of-core" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="of-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ala Izquierda: Barras de frecuencia sonora ascendentes y curvadas hacia el vuelo */}
          <rect x="6" y="20" width="3" height="14" rx="1.5" fill="url(#of-wing-left)" opacity="0.6" />
          <rect x="11" y="14" width="3" height="22" rx="1.5" fill="url(#of-wing-left)" opacity="0.8" />
          <rect x="16" y="10" width="3.2" height="28" rx="1.6" fill="url(#of-wing-left)" />
          
          {/* Columna Central: Resonador de libertad acústica */}
          <rect x="22.2" y="6" width="3.6" height="36" rx="1.8" fill="url(#of-core)" filter="url(#of-glow)" />

          {/* Ala Derecha: Barras de frecuencia sonora simétricas */}
          <rect x="28.8" y="10" width="3.2" height="28" rx="1.6" fill="url(#of-wing-right)" />
          <rect x="34" y="14" width="3" height="22" rx="1.5" fill="url(#of-wing-right)" opacity="0.8" />
          <rect x="39" y="20" width="3" height="14" rx="1.5" fill="url(#of-wing-right)" opacity="0.6" />

          {/* Pulsos de audio / Vuelo dinámico */}
          <circle cx="24" cy="12" r="2" fill="#A7F3D0" />
          <path
            d="M14 8C17 5 21 4 24 4C27 4 31 5 34 8"
            stroke="url(#of-core)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Nombre OpenFreedom */}
      {showText && (
        <span
          className={`font-extrabold tracking-tight text-white group-hover:text-emerald-400 transition-colors duration-150 whitespace-nowrap ${textClasses}`}
        >
          OpenFreedom
        </span>
      )}
    </div>
  );
};
