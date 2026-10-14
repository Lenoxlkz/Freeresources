import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RefreshCw,
  Radio,
  Check,
  Clock,
  Activity
} from 'lucide-react';
import { 
  setStoredGitHubToken, 
  resetToDefaultToken,
  isUsingDefaultToken,
  getUserCustomToken,
  DEFAULT_GITHUB_TOKEN,
  verifyGitHubConnection, 
  fetchRateLimitNow,
  RateLimitState 
} from '../services/githubService';
import { useLanguage } from '../i18n/LanguageContext';

interface QuotaMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenUpdated: () => void;
  currentRateLimit: RateLimitState;
}

export const QuotaMonitoringModal: React.FC<QuotaMonitoringModalProps> = ({
  isOpen,
  onClose,
  onTokenUpdated,
  currentRateLimit,
}) => {
  const { t } = useLanguage();
  const [tokenInput, setTokenInput] = useState('');
  const [tokenMode, setTokenMode] = useState<'default' | 'custom'>('default');
  const [testing, setTesting] = useState(false);
  const [syncingQuota, setSyncingQuota] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  // Test mode simulation for countdown when remaining = 0
  const [simulatedZero, setSimulatedZero] = useState(false);

  // Live countdown timer state (in seconds)
  const isExhausted = simulatedZero || currentRateLimit.remaining <= 0;
  const [countdownSeconds, setCountdownSeconds] = useState(3600);

  // Recalculate countdown seconds from resetTime or default 60 minutes
  useEffect(() => {
    if (isExhausted) {
      const nowSec = Math.floor(Date.now() / 1000);
      const remainingSec = currentRateLimit.resetTime && currentRateLimit.resetTime > nowSec
        ? Math.min(3600, currentRateLimit.resetTime - nowSec)
        : 3600;
      setCountdownSeconds(Math.max(1, remainingSec));
    }
  }, [isExhausted, currentRateLimit.resetTime]);

  // Live ticking countdown effect every second
  useEffect(() => {
    if (!isOpen || !isExhausted) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Time expired, auto refresh rate limit
          fetchRateLimitNow();
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isExhausted]);

  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} min`;
  }, [countdownSeconds]);

  // Synchronize state on open
  useEffect(() => {
    if (isOpen) {
      const isDefault = isUsingDefaultToken();
      if (isDefault) {
        setTokenMode('default');
        setTokenInput('');
      } else {
        const custom = getUserCustomToken();
        setTokenMode('custom');
        setTokenInput(custom || '');
      }
      setStatusMessage(null);
      setStatusType(null);
    }
  }, [isOpen]);

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

  const handleManualSyncQuota = async () => {
    setSyncingQuota(true);
    try {
      await fetchRateLimitNow();
      setStatusType('success');
      setStatusMessage('Cuota de API sincronizada correctamente en tiempo real.');
      onTokenUpdated();
    } catch {
      setStatusType('error');
      setStatusMessage('Error al sincronizar la cuota.');
    } finally {
      setSyncingQuota(false);
    }
  };

  const handleUseDefault = async () => {
    setTesting(true);
    setStatusMessage(null);

    resetToDefaultToken();
    setTokenMode('default');
    setTokenInput('');

    const result = await verifyGitHubConnection(DEFAULT_GITHUB_TOKEN);
    setTesting(false);

    if (result.valid) {
      setStatusType('success');
      setStatusMessage(`¡API Oficial activa! Cuota disponible: ${result.rateLimit.remaining} / ${result.rateLimit.limit} req/hr.`);
      onTokenUpdated();
    } else {
      setStatusType('error');
      setStatusMessage('Error al verificar la API del sistema.');
    }
  };

  const handleSaveCustomToken = async () => {
    if (!tokenInput.trim()) return;
    setTesting(true);
    setStatusMessage(null);

    const result = await verifyGitHubConnection(tokenInput.trim());

    if (result.valid) {
      setStoredGitHubToken(tokenInput.trim());
      setTokenMode('custom');
      setStatusType('success');
      setStatusMessage(
        result.user 
          ? `¡Conexión verificada como @${result.user}! Límite: ${result.rateLimit.limit} req/hr.` 
          : `¡Token verificado con éxito! Límite: ${result.rateLimit.limit} req/hr.`
      );
      onTokenUpdated();
    } else {
      setStatusType('error');
      setStatusMessage(result.errorMessage || 'No se pudo validar el token con GitHub.');
    }
    setTesting(false);
  };

  const handleRemoveCustomToken = () => {
    handleUseDefault();
  };

  const consumedRequests = Math.max(0, currentRateLimit.limit - currentRateLimit.remaining);
  const remainingPercentage = Math.min(100, Math.max(0, (currentRateLimit.remaining / currentRateLimit.limit) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-modal-title"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-[#0F1420] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 id="quota-modal-title" className="text-base font-bold text-white">
                {t.quotaModal.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.quotaModal.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label={t.quotaModal.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-300">
          
          {/* Live Rate Limit Status Card */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block">
                  {t.quotaModal.currentStatus}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>{isUsingDefaultToken() ? t.quotaModal.defaultApiBadge : t.quotaModal.customApiBadge}</span>
                </span>
              </div>

              <div className="text-right">
                <span className={`font-mono font-bold text-base tabular-nums block ${
                  currentRateLimit.remaining > 50 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {currentRateLimit.remaining.toLocaleString()} / {currentRateLimit.limit.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">req / hora</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  currentRateLimit.remaining > 50 ? 'bg-emerald-500' : currentRateLimit.remaining > 0 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${remainingPercentage}%` }}
              />
            </div>

            {/* Quota Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
              <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">{t.quotaModal.availableRequests}:</span>
                <strong className="text-emerald-400 tabular-nums">{currentRateLimit.remaining.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">{t.quotaModal.consumedRequests}:</span>
                <strong className="text-slate-200 tabular-nums">{consumedRequests.toLocaleString()}</strong>
              </div>
            </div>

            {/* Live Sync Action Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleManualSyncQuota}
                disabled={syncingQuota}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingQuota ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                <span>{syncingQuota ? t.quotaModal.syncing : t.quotaModal.syncNow}</span>
              </button>

              {/* Dev simulation button for testing remaining = 0 countdown */}
              <button
                type="button"
                onClick={() => setSimulatedZero(!simulatedZero)}
                className="text-[10px] text-slate-400 hover:text-slate-300 underline font-mono cursor-pointer"
              >
                {simulatedZero ? 'Desactivar simulación 0' : 'Probar cuenta regresiva 60 min'}
              </button>
            </div>
          </div>

          {/* CRITICAL FEATURE: Prominent Live 60-Minute Countdown when Quota is 0 */}
          {isExhausted && (
            <div className="p-4 bg-amber-950/40 border-2 border-amber-500/80 rounded-xl space-y-2 animate-pulse shadow-lg">
              <div className="flex items-center gap-2.5 text-amber-300">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  {t.quotaModal.quotaExhaustedTitle}
                </h3>
              </div>

              <p className="text-xs text-amber-200 leading-relaxed">
                {t.quotaModal.countdownMessage}
              </p>

              <div className="p-3 bg-amber-950/80 border border-amber-500/60 rounded-lg flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="font-mono text-xl font-extrabold text-amber-200 tracking-wider tabular-nums">
                  {formattedCountdown}
                </span>
              </div>
            </div>
          )}

          {/* Configuration Options (Without displaying any token fragments!) */}
          <div className="space-y-3">
            
            {/* Option 1: Official System API */}
            <div 
              onClick={handleUseDefault}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                tokenMode === 'default'
                  ? 'bg-emerald-950/30 border-emerald-500/70 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="api-mode"
                    checked={tokenMode === 'default'}
                    onChange={handleUseDefault}
                    className="mt-1 accent-emerald-500 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-white">
                        {t.quotaModal.defaultApiOptionTitle}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                        5,000 req / hora
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                      {t.quotaModal.defaultApiOptionDesc}
                    </p>

                    <div className="mt-2.5 text-[11px] font-sans text-emerald-300 bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800/60 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{t.quotaModal.defaultApiProtected}</span>
                    </div>
                  </div>
                </div>

                {tokenMode === 'default' && (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 stroke-[3]" />
                )}
              </div>
            </div>

            {/* Option 2: Custom Personal Token (Optional for developers) */}
            <div className={`p-4 rounded-xl border transition-all ${
              tokenMode === 'custom'
                ? 'bg-slate-900 border-slate-700'
                : 'bg-slate-900/40 border-slate-800'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="api-mode"
                  checked={tokenMode === 'custom'}
                  onChange={() => setTokenMode('custom')}
                  className="mt-1 accent-emerald-500 cursor-pointer"
                />
                <div className="w-full space-y-2">
                  <h3 className="text-xs font-bold text-white">
                    {t.quotaModal.customApiOptionTitle}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.quotaModal.customApiOptionDesc}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => {
                        setTokenInput(e.target.value);
                        setTokenMode('custom');
                      }}
                      placeholder={t.quotaModal.tokenPlaceholder}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {tokenMode === 'custom' && getUserCustomToken() && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomToken}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar token personalizado y volver a API oficial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {tokenMode === 'custom' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveCustomToken}
                        disabled={testing || !tokenInput.trim()}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{testing ? t.quotaModal.verifying : t.quotaModal.saveVerifyButton}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Feedback status message */}
          {statusMessage && (
            <div className={`p-3 rounded-lg border flex items-center gap-2 ${
              statusType === 'success' 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
                : 'bg-rose-950/40 text-rose-300 border-rose-800'
            }`}>
              {statusType === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.quotaModal.tokenNotice}</span>
            </div>
            <a
              href="https://github.com/settings/tokens/new?description=OpenStreamDirectory&scopes="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold underline shrink-0"
            >
              <span>{t.quotaModal.generateTokenLink}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Monitoreo Activo</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            {t.quotaModal.close}
          </button>
        </div>

      </div>
    </div>
  );
};
