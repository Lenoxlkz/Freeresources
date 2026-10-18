import { GitHubRepoStats, ReleaseAsset, GitHubRelease } from '../types/app';
import { 
  getOrCreateClientSession, 
  getSessionRateLimit, 
  saveSessionRateLimit, 
  executeCycleReset, 
  registerRequestConsumed,
  initSessionLifecycle,
  subscribeToAutoPurge,
  AUTO_PURGE_THRESHOLD,
  ClientSessionInfo
} from './sessionManager';

// Inicializar el ciclo de vida de limpieza al entrar y salir
if (typeof window !== 'undefined') {
  initSessionLifecycle();
}

export { subscribeToAutoPurge, AUTO_PURGE_THRESHOLD };

const GITHUB_TOKEN_KEY = 'openfreedom_github_pat_token';
const GITHUB_CACHE_KEY = 'openfreedom_github_live_cache_v3';
const GITHUB_RELEASES_CACHE_KEY = 'openfreedom_github_multi_releases_cache_v3';
const CACHE_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours

const GITHUB_TIMESTAMP_KEY = 'openfreedom_github_stats_timestamp';

export function getClientSession(): ClientSessionInfo {
  return getOrCreateClientSession();
}

export function resetClientSessionAndQuota(): ClientSessionInfo {
  const newSession = executeCycleReset('user_requested_reset');
  const resetRate: RateLimitState = {
    limit: 60,
    remaining: 60,
    resetTime: Math.floor(Date.now() / 1000) + 3600,
  };
  notifyRateLimitChanged(resetRate);
  return newSession;
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(GITHUB_TIMESTAMP_KEY);
  } catch {
    return null;
  }
}

export function setLastSyncTime(timeIso: string): void {
  try {
    localStorage.setItem(GITHUB_TIMESTAMP_KEY, timeIso);
  } catch {
    // Ignore
  }
}

export interface RateLimitState {
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
}

export const DEFAULT_GITHUB_TOKEN = '';

export function getUserCustomToken(): string | null {
  try {
    return localStorage.getItem(GITHUB_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function isUsingDefaultToken(): boolean {
  const custom = getUserCustomToken();
  return !custom || custom === DEFAULT_GITHUB_TOKEN;
}

export function getStoredGitHubToken(): string {
  const custom = getUserCustomToken();
  if (custom && custom.trim().length > 0) {
    return custom.trim();
  }
  return DEFAULT_GITHUB_TOKEN;
}

export function setStoredGitHubToken(token: string): void {
  try {
    if (!token.trim() || token.trim() === DEFAULT_GITHUB_TOKEN) {
      localStorage.removeItem(GITHUB_TOKEN_KEY);
    } else {
      localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
    }
  } catch {
    // Ignore storage errors
  }
}

export function resetToDefaultToken(): void {
  try {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

export function getStoredRateLimit(): RateLimitState {
  const custom = getUserCustomToken();
  return getSessionRateLimit(!!custom);
}

type RateLimitListener = (rate: RateLimitState) => void;
const rateLimitListeners = new Set<RateLimitListener>();

export function subscribeToRateLimit(listener: RateLimitListener): () => void {
  rateLimitListeners.add(listener);
  return () => {
    rateLimitListeners.delete(listener);
  };
}

export function notifyRateLimitChanged(rate: RateLimitState): void {
  rateLimitListeners.forEach((fn) => {
    try {
      fn(rate);
    } catch {
      // Ignore listener error
    }
  });
}

function updateRateLimitFromHeaders(headers: Headers): void {
  const limitHeader = headers.get('x-ratelimit-limit');
  const remainingHeader = headers.get('x-ratelimit-remaining');
  const resetHeader = headers.get('x-ratelimit-reset');

  if (limitHeader && remainingHeader && resetHeader) {
    const state: RateLimitState = {
      limit: parseInt(limitHeader, 10),
      remaining: parseInt(remainingHeader, 10),
      resetTime: parseInt(resetHeader, 10),
    };
    saveSessionRateLimit(state);
    notifyRateLimitChanged(state);
  }
}

/**
 * Consulta de forma activa e inmediata el endpoint /rate_limit de GitHub con la clave activa
 * y sincroniza todos los componentes suscritos.
 */
export async function fetchRateLimitNow(): Promise<RateLimitState> {
  const token = getStoredGitHubToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch('https://api.github.com/rate_limit', { headers });
    updateRateLimitFromHeaders(res.headers);

    if (res.ok) {
      const data = await res.json();
      const rate = data.rate || {};
      const state: RateLimitState = {
        limit: rate.limit ?? (token ? 5000 : 60),
        remaining: rate.remaining ?? 0,
        resetTime: rate.reset ?? (Math.floor(Date.now() / 1000) + 3600),
      };
      saveSessionRateLimit(state);
      notifyRateLimitChanged(state);
      return state;
    }
  } catch (err) {
    console.warn('No se pudo sincronizar la cuota de GitHub en vivo:', err);
  }

  return getStoredRateLimit();
}

export function getCachedStatsMap(): Record<string, GitHubRepoStats> {
  try {
    const raw = localStorage.getItem(GITHUB_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveStatsToCache(repo: string, stats: GitHubRepoStats): void {
  try {
    const current = getCachedStatsMap();
    current[repo] = stats;
    localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify(current));
  } catch {
    // Storage quota or error
  }
}

// In-flight request deduplication map
const pendingRequests = new Map<string, Promise<GitHubRepoStats | null>>();

/**
 * Direct call to GitHub REST API with official headers and optional Bearer token
 */
export async function fetchRepoFromGitHubAPI(
  repoOwnerAndName: string,
  force: boolean = false
): Promise<GitHubRepoStats | null> {
  const cached = getCachedStatsMap()[repoOwnerAndName];
  if (cached && !force) {
    const isFresh = cached.fetchedAt && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS;
    if (isFresh) {
      return cached;
    }
  }

  // Deduplicate simultaneous requests for same repo
  if (pendingRequests.has(repoOwnerAndName)) {
    return pendingRequests.get(repoOwnerAndName)!;
  }

  const promise = (async () => {
    const token = getStoredGitHubToken();
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      // 1. Fetch Repository Details
      const repoRes = await fetch(`https://api.github.com/repos/${repoOwnerAndName}`, {
        headers,
      });

      updateRateLimitFromHeaders(repoRes.headers);
      registerRequestConsumed();

      if (repoRes.status === 403 || repoRes.status === 429) {
        // Rate limited
        return cached || null;
      }

      if (!repoRes.ok) {
        return cached || null;
      }

      const repoData = await repoRes.json();

      let latestReleaseTag: string | undefined = undefined;
      let latestReleaseUrl: string | undefined = undefined;
      let latestReleaseDate: string | undefined = undefined;
      let releaseAssets: ReleaseAsset[] = [];

      // 2. Fetch Latest Release Details (if available)
      try {
        const releaseRes = await fetch(
          `https://api.github.com/repos/${repoOwnerAndName}/releases/latest`,
          { headers }
        );
        updateRateLimitFromHeaders(releaseRes.headers);

        if (releaseRes.ok) {
          const relData = await releaseRes.json();
          latestReleaseTag = relData.tag_name;
          latestReleaseUrl = relData.html_url;
          latestReleaseDate = relData.published_at ? relData.published_at.split('T')[0] : undefined;

          if (Array.isArray(relData.assets)) {
            releaseAssets = relData.assets.map((asset: any) => ({
              name: asset.name,
              downloadUrl: asset.browser_download_url,
              size: asset.size,
            }));
          }
        }
      } catch {
        // Releases endpoint optional failure
      }

      const freshStats: GitHubRepoStats = {
        stars: repoData.stargazers_count ?? 0,
        forks: repoData.forks_count ?? 0,
        latestReleaseTag,
        latestReleaseUrl: latestReleaseUrl || `${repoData.html_url}/releases`,
        latestReleaseDate,
        releaseAssets,
        pushedAt: repoData.pushed_at ? repoData.pushed_at.split('T')[0] : undefined,
        openIssues: repoData.open_issues_count ?? 0,
        verifiedHtmlUrl: repoData.html_url,
        licenseSpdx: repoData.license?.spdx_id || repoData.license?.name,
        fetchedAt: new Date().toISOString(),
      };

      saveStatsToCache(repoOwnerAndName, freshStats);
      return freshStats;
    } catch {
      return cached || null;
    } finally {
      pendingRequests.delete(repoOwnerAndName);
    }
  })();

  pendingRequests.set(repoOwnerAndName, promise);
  return promise;
}

/**
 * Checks authentication status and rate limit against /rate_limit endpoint
 */
export async function verifyGitHubConnection(token?: string): Promise<{
  valid: boolean;
  user?: string;
  rateLimit: RateLimitState;
  errorMessage?: string;
}> {
  const activeToken = token !== undefined ? token : getStoredGitHubToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  try {
    const res = await fetch('https://api.github.com/rate_limit', { headers });
    updateRateLimitFromHeaders(res.headers);

    if (res.status === 401) {
      return {
        valid: false,
        errorMessage: 'Token no válido o revocado por GitHub.',
        rateLimit: getStoredRateLimit(),
      };
    }

    const data = await res.json();
    const rate = data.rate || {};
    const rateLimitState: RateLimitState = {
      limit: rate.limit ?? (activeToken ? 5000 : 60),
      remaining: rate.remaining ?? 0,
      resetTime: rate.reset ?? Math.floor(Date.now() / 1000) + 3600,
    };
    notifyRateLimitChanged(rateLimitState);

    let user: string | undefined = undefined;
    if (activeToken) {
      try {
        const userRes = await fetch('https://api.github.com/user', { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          user = userData.login;
        }
      } catch {
        // Ignore
      }
    }

    return {
      valid: true,
      user,
      rateLimit: rateLimitState,
    };
  } catch (err: any) {
    return {
      valid: false,
      errorMessage: err.message || 'Error de conexión con la API de GitHub.',
      rateLimit: getStoredRateLimit(),
    };
  }
}

/**
 * Consulta la lista de lanzamientos históricos y recientes (/releases) de un repositorio
 */
export async function fetchAppReleases(
  repoOwnerAndName: string,
  force: boolean = false
): Promise<GitHubRelease[]> {
  const cacheKey = `${GITHUB_RELEASES_CACHE_KEY}_${repoOwnerAndName}`;
  if (!force) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          return parsed.releases;
        }
      }
    } catch {
      // Ignore
    }
  }

  const token = getStoredGitHubToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repoOwnerAndName}/releases?per_page=10`,
      { headers }
    );
    updateRateLimitFromHeaders(res.headers);
    registerRequestConsumed();

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const releases: GitHubRelease[] = data.map((rel: any) => ({
      id: rel.id,
      tagName: rel.tag_name || 'Sin versión',
      name: rel.name || rel.tag_name || 'Release',
      htmlUrl: rel.html_url,
      publishedAt: rel.published_at ? rel.published_at.split('T')[0] : '',
      prerelease: !!rel.prerelease,
      body: rel.body || '',
      assets: Array.isArray(rel.assets)
        ? rel.assets.map((asset: any) => ({
            name: asset.name,
            downloadUrl: asset.browser_download_url,
            size: asset.size || 0,
            downloadCount: asset.download_count || 0,
          }))
        : [],
    }));

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ releases, timestamp: Date.now() }));
    } catch {
      // Ignore
    }

    return releases;
  } catch {
    return [];
  }
}
