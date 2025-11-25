import { user, isLoading } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { handleError } from '$lib/utils/errors';

// Public (no login needed) routes
const publicRoutes = [
    '/',
    '/auth',
    '/about',
    '/contact',
    '/share/roadmaps/[id]/view'
];

export const load = async ({ url, error }) => {
    if (error) {
        return { error: handleError(error) };
    }

    const loadingState = get(isLoading);
    const currentUser = get(user);
    const pathname = url.pathname;

    // Loading phase → no redirect yet
    if (loadingState) {
        return { loading: true, user: currentUser };
    }

    // Check if current path is one of the public routes
    const isPublicRoute =
        publicRoutes.includes(pathname) ||
        pathname.startsWith('/share/roadmaps/');

    // User not logged in & path is private → redirect
    if (!currentUser && !isPublicRoute) {
        throw redirect(303, '/auth?mode=login');
    }

    return {
        loading: false,
        user: currentUser
    };
};
