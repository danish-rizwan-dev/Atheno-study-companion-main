import { user, isLoading } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { handleError } from '$lib/utils/errors';

const publicRoutes = ['/', '/auth', '/share/roadmaps/[id]/view'].map(route => {
    return route.replace('[id]', '[a-zA-Z0-9-]+');
});

export const load = async ({ url, error }) => {
    // Handle any errors passed from child routes
    if (error) {
        return {
            error: handleError(error)
        };
    }

    const loadingState = get(isLoading);
    const currentUser = get(user);
    const isPublicRoute = publicRoutes.includes(url.pathname);

    // During loading, return loading state without redirecting
    if (loadingState) {
        return {
            loading: true,
            user: currentUser // Keep any existing user data during loading
        };
    }

    // Only redirect if we're certain the user is not authenticated and trying to access a protected route
    if (!isPublicRoute && !currentUser && !url.pathname.startsWith('/share/roadmaps')) {
        throw redirect(303, '/auth');  // Redirect to auth page instead of landing
    }

    return {
        loading: false,
        user: currentUser
    };
};