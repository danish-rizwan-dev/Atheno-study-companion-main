import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { clearCache } from './cache';

export function handleError(error) {
    console.error('Application error:', error);

    if (error.status === 401) {
        // Clear cache and redirect to auth page on unauthorized
        if (browser) {
            clearCache();
            goto('/auth');
        }
        return {
            message: 'Your session has expired. Please sign in again.'
        };
    }

    if (error.status === 404) {
        return {
            message: 'The requested resource was not found.'
        };
    }

    if (error.status === 403) {
        return {
            message: 'You don\'t have permission to access this resource.'
        };
    }

    // Database connection errors
    if (error.code === 'PGRST301') {
        return {
            message: 'Database connection error. Please try again later.'
        };
    }

    // Supabase specific errors
    if (error.code?.startsWith('P')) {
        return {
            message: 'A database error occurred. Please try again later.'
        };
    }

    return {
        message: 'An unexpected error occurred. Please try again later.'
    };
}