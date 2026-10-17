import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Bot,
  Play,
  Square,
  RefreshCw,
  Globe,
  Terminal,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
  Sparkles,
  ArrowRight,
  Eye,
  FileCode,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { AppItem } from '../types/app';

interface PinchtabStatus {
  installed: boolean;
  version: string;
  running: boolean;
  port: string;
  bind: string;
  health: any;
  instances: any[];
  features: {
    stealthInjection: boolean;
    accessibilitySnapshots: boolean;
    multiInstance: boolean;
    persistentProfiles: boolean;
    headlessOrchestration: boolean;
  };
}

interface PinchtabDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppItem[];
}

export const PinchtabDashboard: React.FC<PinchtabDashboardProps> = ({
  isOpen,
  onClose,
  apps,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'instances' | 'navigator' | 'audit' | 'logs'>('overview');
  const [status, setStatus] = useState<PinchtabStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Navegación de prueba
  const [testUrl, setTestUrl] = useState('https://github.com/kushagrasinghx/BitChord/releases');
  const [navResult, setNavResult] = useState<any>(null);
  const [navLoading, setNavLoading] = useState(false);

  // Auditor de catálogo
  const [auditResults, setAuditResults] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Consulta de estado de Pinchtab
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pinchtab/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Error obteniendo estado de Pinchtab:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Consulta de logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/pinchtab/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.lines || []);
      }
    } catch (err) {
      console.error('Error cargando logs:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchLogs();
    }
  }, [isOpen, fetchStatus, fetchLogs]);

  // Manejo de ESC para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleStartService = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/pinchtab/start', { method: 'POST' });
      await new Promise(r => setTimeout(r, 1200));
      await fetchStatus();
      await fetchLogs();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopService = async () => {
    setActionLoading(true);
    try {
      await fetch('/api/pinchtab/stop', { method: 'POST' });
      await new Promise(r => setTimeout(r, 1000));
      await fetchStatus();
      await fetchLogs();
    } finally {
      setActionLoading(false);
    }
  };

  const handleNavigateTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testUrl.trim()) return;

    setNavLoading(true);
    setNavResult(null);
    try {
      const res = await fetch('/api/pinchtab/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl.trim() }),
      });
      const data = await res.json();
      setNavResult(data);
    } catch (err: any) {
      setNavResult({ success: false, error: err.message || 'Error navegando' });
    } finally {
      setNavLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditLoading(true);
    try {
      const sampleApps = apps.slice(0, 15).map(a => ({
        id: a.id,
        name: a.name,
        url: a.githubUrl,
      }));
      const res = await fetch('/api/pinchtab/audit-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: sampleApps }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuditResults(data.results || []);
      }
    } catch (err) {
      console.error('Error en auditoría:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pinchtab-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0F1420] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-modal-window">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0A0D14]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="pinchtab-title" className="text-lg font-bold text-white tracking-tight">
                  Pinchtab Orchestrator
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tabular-nums">
                  v{status?.version || '0.15.2'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.pinchtabModal?.subtitle || 'Automatización sigilosa de alto rendimiento y orquestación de navegadores'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchStatus}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Refrescar estado"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={t.pinchtabModal?.close || 'Cerrar'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-slate-800/80 bg-[#0A0D14]/40 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t.pinchtabModal?.tabOverview || 'Panel General'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instances')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'instances'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.pinchtabModal?.tabInstances || 'Instancias'}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 tabular-nums">
              {status?.instances?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('navigator')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'navigator'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Stealth Snapshots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Auditor de Apps</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('logs');
              fetchLogs();
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{t.pinchtabModal?.tabLogs || 'Consola'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Status Banner */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0A0D14]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${status?.running ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-amber-500 ring-4 ring-amber-500/20'}`} />
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Estado del Servicio:</span>
                      <span className={status?.running ? 'text-emerald-400' : 'text-amber-400'}>
                        {status?.running ? 'En Ejecución (Activo)' : 'Detenido'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">
                      Puerto HTTP: {status?.port || '9867'} · Bind: {status?.bind || '127.0.0.1'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!status?.running ? (
                    <button
                      type="button"
                      onClick={handleStartService}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Servidor</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopService}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 text-xs font-medium bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Detener</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0A0D14]/60">
                  <div className="text-xs text-slate-400 font-medium">Instancias de Navegador</div>
                  <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
                    {status?.instances?.length ?? 1}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Orquestación multi-instancia activa</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0A0D14]/60">
                  <div className="text-xs text-slate-400 font-medium">Modo Stealth & Anti-Bot</div>
                  <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
                    Light / Patch
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    navigator.webdriver oculto
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-[#0A0D14]/60">
                  <div className="text-xs text-slate-400 font-medium">Ahorro de Tokens DOM</div>
                  <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
                    ~90% Reducción
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Vía Accessibility-Tree Snapshots
                  </div>
                </div>
              </div>

              {/* Capabilities & Architecture */}
              <div className="p-5 rounded-xl border border-slate-800 bg-[#0A0D14]/40 space-y-3">
                <h3 className="text-sm font-semibold text-white">Capacidades del Puente de Automatización</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Snapshots de Accesibilidad:</span> Captura la jerarquía semántica del DOM sin saturar la ventana de contexto de modelos de IA.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Inyección Oculta Avanzada:</span> Enmascara Canvas, WebGL, user-agent y señales de automatización para evitar bloqueos Cloudflare.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Sesiones Persistentes:</span> Mantiene cookies y perfiles aislados para interactuar con repositorios y APIs sin requerir re-autenticación.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Orquestador Ligero Go:</span> Binario nativo de 12MB compilado que opera localmente sin dependencias de nube externas.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INSTANCES */}
          {activeTab === 'instances' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Instancias Activas en el Servidor</h3>
                <span className="text-xs text-slate-400">Estrategia: always-on / FCFS</span>
              </div>

              {status?.instances && status.instances.length > 0 ? (
                <div className="space-y-3">
                  {status.instances.map((inst, idx) => (
                    <div
                      key={inst.id || idx}
                      className="p-4 rounded-xl border border-slate-800 bg-[#0A0D14]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-sm text-emerald-300">{inst.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            Puerto {inst.port}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {inst.mode || 'headless'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Perfil: {inst.profileName || 'default'} · Navegador: {inst.browser || 'chrome'} · Estado: {inst.status}
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 font-mono tabular-nums">
                        {inst.url}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-sm">
                  No hay instancias abiertas en este momento. Inicia el servidor Pinchtab para desplegar el orquestador.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NAVIGATOR & STEALTH SNAPSHOT */}
          {activeTab === 'navigator' && (
            <div className="space-y-4">
              <form onSubmit={handleNavigateTest} className="space-y-3">
                <label className="text-xs font-medium text-slate-300 block">
                  Probar Navegación Sigilosa y Extracción de Accesibilidad:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="flex-1 px-3.5 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                  <button
                    type="submit"
                    disabled={navLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{navLoading ? 'Navegando...' : 'Snapshot'}</span>
                  </button>
                </div>
              </form>

              {navResult && (
                <div className="p-4 rounded-xl border border-slate-800 bg-[#0A0D14]/90 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-semibold text-white">Resultado de Captura:</span>
                    <span className={`px-2 py-0.5 rounded font-mono ${navResult.status === 200 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                      HTTP {navResult.status || 'ERR'} · {navResult.durationMs}ms
                    </span>
                  </div>

                  {navResult.title && (
                    <div>
                      <span className="text-slate-400">Título detectado: </span>
                      <span className="font-semibold text-slate-200">{navResult.title}</span>
                    </div>
                  )}

                  {navResult.accessibilitySummary && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Ahorro de Tokens:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {navResult.accessibilitySummary.savingsPercentage} ({navResult.accessibilitySummary.accessibilityTokensEst} tokens vs {navResult.accessibilitySummary.rawDomTokensEst} raw)
                        </span>
                      </div>

                      {navResult.accessibilitySummary.headings?.length > 0 && (
                        <div>
                          <div className="text-slate-400 mb-1">Encabezados extraídos del árbol semántico:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1 font-mono">
                            {navResult.accessibilitySummary.headings.map((h: string, i: number) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {navResult.accessibilitySummary.detectedAssets?.length > 0 && (
                        <div className="pt-2">
                          <div className="text-slate-400 mb-1">Binarios de instalación descubiertos:</div>
                          <div className="flex flex-wrap gap-1.5 font-mono">
                            {navResult.accessibilitySummary.detectedAssets.map((asset: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">
                                {asset.split('/').pop()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Auditor Rápido de Enlaces del Catálogo</h3>
                  <p className="text-xs text-slate-400">Verifica la disponibilidad de repositorios oficiales con el crawler de Pinchtab</p>
                </div>
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={auditLoading}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                  <span>{auditLoading ? 'Auditando...' : 'Auditar Muestra'}</span>
                </button>
              </div>

              {auditResults.length > 0 ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-[#0A0D14]/80 text-xs">
                  {auditResults.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-4">
                      <div className="truncate flex-1">
                        <span className="font-semibold text-white mr-2">{item.name || item.id}</span>
                        <span className="text-slate-400 font-mono text-[11px] truncate">{item.url}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-slate-400 tabular-nums">{item.durationMs}ms</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${item.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {item.status || 'FAIL'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
                  Haz clic en "Auditar Muestra" para comprobar en paralelo los repositorios con Pinchtab.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Registro en Tiempo Real (/root/.pinchtab/server.log)</span>
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Actualizar Logs</span>
                </button>
              </div>

              <div className="p-4 bg-black/90 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400/90 h-64 overflow-y-auto space-y-1">
                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">No hay registros aún en el archivo de log.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0A0D14]/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pinchtab v0.15.2 · Conexión local segura en 127.0.0.1</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
          >
            {t.pinchtabModal?.close || 'Cerrar'}
          </button>
        </div>

      </div>
    </div>
  );
};
