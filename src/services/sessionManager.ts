/**
 * Gestor de Sesión Única, Aislamiento de Cuota, Memoria Aislada y Purga Agresiva
 * 
 * Reglas estrictas:
 * 1. Purga automática cada 50 solicitudes gastadas: cookies y localStorage eliminados sí o sí.
 * 2. Purga total al salir o al solicitarlo: se destruye la sesión previa, cookies y almacenamiento residual.
 * 3. Identidad única por usuario: cada visitante tiene su propio ID de sesión efímero y cuota independiente.
 * 4. La memoria de posición del usuario (IndexedDB) queda aparte y NUNCA es afectada por la purga.
 */

export interface ClientSessionInfo {
  sessionId: string;
  userAgent: string;
  browserVendor: string;
  platform: string;
  createdAt: number;
  consumedInCycle: number;
}

const SESSION_STORAGE_ID_KEY = 'openfreedom_session_id';
const SESSION_RATE_PREFIX = 'openfreedom_rate_';
const SESSION_COOKIE_NAME = 'openfreedom_uid';
const CYCLE_COUNTER_KEY = 'openfreedom_cycle_requests_consumed';

export const AUTO_PURGE_THRESHOLD = 50; // Umbral estricto: al llegar a 50 peticiones gastadas se purga todo

type AutoPurgeListener = (info: { reason: string; newSessionId: string; timestamp: number }) => void;
const autoPurgeListeners = new Set<AutoPurgeListener>();

export function subscribeToAutoPurge(listener: AutoPurgeListener): () => void {
  autoPurgeListeners.add(listener);
  return () => {
    autoPurgeListeners.delete(listener);
  };
}

function notifyAutoPurge(reason: string, newSessionId: string): void {
  autoPurgeListeners.forEach((fn) => {
    try {
      fn({ reason, newSessionId, timestamp: Date.now() });
    } catch {
      // Ignore
    }
  });
}

/**
 * Purgador AGRESIVO Y OBLIGATORIO:
 * Elimina sí o sí TODAS las cookies visibles, borra TODO localStorage y sessionStorage.
 * Lanza además Clear-Site-Data hacia el servidor.
 */
export function purgeAllCookiesAndStorageAggressively(): void {
  try {
    // 1. Limpieza absoluta de cookies
    if (typeof document !== 'undefined') {
      const cookies = document.cookie ? document.cookie.split(';') : [];
      const host = window.location.hostname;
      const pathVariations = ['/', '/api', ''];

      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = (eqPos > -1 ? cookie.substr(0, eqPos) : cookie).trim();
        if (!name) continue;

        // Borrar para múltiples variantes de ruta y dominios
        for (const p of pathVariations) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p || '/'};SameSite=Lax`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p || '/'};domain=${host};SameSite=Lax`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p || '/'};domain=.${host};SameSite=Lax`;
        }
      }
    }

    // 2. Limpieza total de localStorage (IndexedDB permanece intacto en su propio motor separado)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch {
        // Fallback key-by-key
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key) localStorage.removeItem(key);
        }
      }
    }

    // 3. Limpieza de sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch {
        // Ignore
      }
    }

    // 4. Solicitar Clear-Site-Data al servidor Express
    if (typeof fetch !== 'undefined') {
      fetch('/api/session/purge', { 
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' } 
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[SessionManager] Error durante la purga agresiva:', err);
  }
}

/**
 * Obtiene o crea la sesión única para el navegador del usuario actual
 */
export function getOrCreateClientSession(): ClientSessionInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Mozilla/5.0 Clean Browser';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || 'Web') : 'Web';
  const vendor = typeof navigator !== 'undefined' ? (navigator.vendor || '') : '';

  let sessionId: string | null = null;
  let consumed = 0;

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionId = sessionStorage.getItem(SESSION_STORAGE_ID_KEY);
      const rawConsumed = sessionStorage.getItem(CYCLE_COUNTER_KEY);
      consumed = rawConsumed ? parseInt(rawConsumed, 10) || 0 : 0;
    }
  } catch {
    // sessionStorage inaccesible
  }

  if (!sessionId) {
    const randomEntropy = Math.random().toString(36).substring(2, 9);
    const timeEntropy = Date.now().toString(36);
    sessionId = `usr_${randomEntropy}_${timeEntropy}`;
    consumed = 0;

    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_ID_KEY, sessionId);
        sessionStorage.setItem(CYCLE_COUNTER_KEY, '0');
      }
      if (typeof document !== 'undefined') {
        document.cookie = `${SESSION_COOKIE_NAME}=${sessionId}; path=/; SameSite=Lax`;
      }
    } catch {
      // Ignore
    }
  }

  return {
    sessionId,
    userAgent: ua,
    browserVendor: vendor,
    platform,
    createdAt: Date.now(),
    consumedInCycle: consumed,
  };
}

/**
 * Incrementa el contador de peticiones gastadas y comprueba si se llegó al umbral de 50.
 * Si se alcanza o supera 50: ejecuta la purga agresiva obligatoria y arranca nueva cuota limpia.
 */
export function registerRequestConsumed(): boolean {
  let consumed = 0;
  try {
    if (typeof sessionStorage !== 'undefined') {
      const current = sessionStorage.getItem(CYCLE_COUNTER_KEY);
      consumed = (current ? parseInt(current, 10) || 0 : 0) + 1;
      sessionStorage.setItem(CYCLE_COUNTER_KEY, consumed.toString());
    }
  } catch {
    consumed += 1;
  }

  // Comprobar umbral de 50 peticiones gastadas
  if (consumed >= AUTO_PURGE_THRESHOLD) {
    console.warn(`[SessionManager] ¡Umbral de ${AUTO_PURGE_THRESHOLD} peticiones gastadas alcanzado! Ejecutando purga agresiva...`);
    executeCycleReset('50_requests_consumed');
    return true;
  }

  return false;
}

/**
 * Reinicia el ciclo, purga cookies, localStorage y asigna nueva cuota
 */
export function executeCycleReset(reason: string = 'manual'): ClientSessionInfo {
  // 1. Purga total agresiva
  purgeAllCookiesAndStorageAggressively();

  // 2. Generar nueva sesión fresca
  const newSession = getOrCreateClientSession();

  // 3. Cuota renovada a 60 limpia
  const resetRate = {
    limit: 60,
    remaining: 60,
    resetTime: Math.floor(Date.now() / 1000) + 3600,
  };

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`${SESSION_RATE_PREFIX}${newSession.sessionId}`, JSON.stringify(resetRate));
      sessionStorage.setItem(CYCLE_COUNTER_KEY, '0');
    }
  } catch {
    // Ignore
  }

  notifyAutoPurge(reason, newSession.sessionId);
  return newSession;
}

/**
 * Obtiene la cuota aislada para la sesión actual
 */
export function getSessionRateLimit(customTokenActive: boolean = false): { limit: number; remaining: number; resetTime: number } {
  const session = getOrCreateClientSession();
  const defaultLimit = customTokenActive ? 5000 : 60;

  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(`${SESSION_RATE_PREFIX}${session.sessionId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.limit === 'number') {
          return parsed;
        }
      }
    }
  } catch {
    // Fallback
  }

  return {
    limit: defaultLimit,
    remaining: defaultLimit,
    resetTime: Math.floor(Date.now() / 1000) + 3600,
  };
}

/**
 * Guarda la cuota exclusivamente para la sesión actual y verifica umbral de 50 gastadas
 */
export function saveSessionRateLimit(rate: { limit: number; remaining: number; resetTime: number }): void {
  const session = getOrCreateClientSession();
  const consumed = Math.max(0, rate.limit - rate.remaining);

  // Si GitHub informa que se han consumido 50 o más solicitudes de la cuota:
  if (consumed >= AUTO_PURGE_THRESHOLD) {
    executeCycleReset('rate_limit_consumed_50');
    return;
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`${SESSION_RATE_PREFIX}${session.sessionId}`, JSON.stringify(rate));
      sessionStorage.setItem(CYCLE_COUNTER_KEY, consumed.toString());
    }
  } catch {
    // Ignore
  }
}

/**
 * Inicializa el ciclo de vida de sesión:
 * 1. Purga datos obsoletos al entrar
 * 2. Purga total al salir (beforeunload, pagehide)
 */
export function initSessionLifecycle(): void {
  if (typeof window === 'undefined') return;

  // Limpieza inicial de residuos al entrar
  purgeAllCookiesAndStorageAggressively();
  getOrCreateClientSession();

  // Limpieza al salir de la página
  const handleExit = () => {
    try {
      purgeAllCookiesAndStorageAggressively();
    } catch {
      // Ignore
    }
  };

  window.addEventListener('beforeunload', handleExit);
  window.addEventListener('pagehide', handleExit);
}
