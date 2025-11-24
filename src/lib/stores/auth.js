import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { createCachedStore } from '$lib/utils/cache';

// Create cached user store with debounced loading state
export const user = createCachedStore('user', null, async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user ?? null;
}, { cacheTime: 5 * 60 * 1000 }); // Cache for 5 minutes

// Create loading store with 300ms debounce to prevent flashing
export const isLoading = createCachedStore('auth_loading', !browser, async () => false, { debounceTime: 300 });

// Initialize store with cached session if available
if (browser) {
    const cachedSession = localStorage.getItem('sb-session');
    if (cachedSession) {
        try {
            const session = JSON.parse(cachedSession);
            if (session?.user && new Date(session.expires_at) > new Date()) {
                user.set(session.user);
                isLoading.set(false);
            }
        } catch (e) {
            console.warn('Failed to parse cached session:', e);
        }
    }
}

// Listen for auth changes with debounced updates
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        user.set(null);
    } else if (session?.user) {
        user.set(session.user);
    }
    isLoading.set(false);
});