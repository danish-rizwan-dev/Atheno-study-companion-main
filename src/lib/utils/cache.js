import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const CACHE_PREFIX = 'Atheno_cache_';
// set default expiry time for cache as 24 hours
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000;

export function setCache(key, value, expiryMs = DEFAULT_EXPIRY) {
    if (!browser) return;
    
    const item = {
        value,
        timestamp: Date.now(),
        expiry: expiryMs
    };

    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    console.log(`Cache set for key: ${key}`, item);
}

export function getCache(key) {
    if (!browser) return null;

    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;

    try {
        const parsed = JSON.parse(item);
        if (Date.now() - parsed.timestamp > parsed.expiry) {
            localStorage.removeItem(`${CACHE_PREFIX}${key}`);
            return null;
        }
        return parsed.value;
    } catch {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
    }
}

export function removeCache(key) {
    if (!browser) return;
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

export function clearCache() {
    if (!browser) return;
    
    // Only clear items with our prefix
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
}

export function getCacheKeys() {
    if (!browser) return [];
    
    return Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_PREFIX))
        .map(key => key.replace(CACHE_PREFIX, ''));
}

export function initializeCache() {
    if (!browser) return;

    // Clean up expired items and load data from localstorage cache
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                if ((Date.now() - item.timestamp) > item.expiry) {
                    localStorage.removeItem(key);
                }
            } catch {
                localStorage.removeItem(key);
            }
        }
    });
}

export function createCachedStore(key, initialValue, fetchFn) {
    const store = writable(initialValue);
    const { subscribe, set } = store;

    // Try to load from cache first
    if (browser) {
        const cachedValue = getCache(key);
        if (cachedValue !== null) {
            set(cachedValue);
        }
    }

    // If we have a fetch function, use it to initialize the store
    if (fetchFn) {
        fetchFn().then(value => {
            set(value);
            if (browser) {
                setCache(key, value);
            }
        });
    }

    return {
        subscribe,
        set: (value) => {
            set(value);
            if (browser) {
                setCache(key, value);
            }
        },
        update: (fn) => {
            store.update(value => {
                const newValue = fn(value);
                if (browser) {
                    setCache(key, newValue);
                }
                return newValue;
            });
        }
    };
}

// Initialize cache cleanup when module is imported
initializeCache();