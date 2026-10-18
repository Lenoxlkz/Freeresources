/**
 * Sistema Aislado de Memoria de Posición de Usuario (IndexedDB Dedicado)
 * NUNCA es afectado por la purga de cookies, localStorage ni sessionStorage.
 * Recuerda scroll exacto, búsqueda, filtros y modal activo tras recargas.
 */

export interface UserNavigationPosition {
  scrollY: number;
  searchQuery: string;
  category: string;
  platforms: string[];
  sortBy: 'stars' | 'name' | 'recently-updated';
  viewMode: 'grid' | 'list';
  activeAppId?: string | null;
  updatedAt: number;
}

const DB_NAME = 'OpenFreedom_PreservedNavigation_DB';
const DB_VERSION = 1;
const STORE_NAME = 'navigation_state';
const STATE_KEY = 'current_position';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no soportado'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Guarda el estado de posición del usuario en la base de datos aislada
 */
export async function saveUserPosition(position: UserNavigationPosition): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(position, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Si IndexedDB falla o está bloqueado, usar fallback en window.name (que sobrevive recargas)
    try {
      if (typeof window !== 'undefined') {
        window.name = `OF_POS:${JSON.stringify(position)}`;
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Carga el estado de posición previo del usuario
 */
export async function loadUserPosition(): Promise<UserNavigationPosition | null> {
  try {
    const db = await getDB();
    return await new Promise<UserNavigationPosition | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    // Fallback desde window.name
    try {
      if (typeof window !== 'undefined' && window.name && window.name.startsWith('OF_POS:')) {
        const raw = window.name.substring(7);
        return JSON.parse(raw);
      }
    } catch {
      // Ignore
    }
    return null;
  }
}
