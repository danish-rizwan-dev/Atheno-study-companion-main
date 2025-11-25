<script>
    import '../app.css';
    import { page } from '$app/stores';
    import { user, isLoading } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import Sidebar from '$lib/components/sidebar.svelte';
    import StatsFooter from '$lib/components/StatsFooter.svelte';

    // Public pages (no login required)
    const publicRoutes = ['/', '/auth', '/about', '/contact'];

    $effect(() => {
        if ($isLoading) return;

        const pathname = $page.url.pathname;
        const search = $page.url.search; // ?mode=login or ?mode=signup

        const isPublic = publicRoutes.includes(pathname);

        /** NOT LOGGED IN → block private pages */
        if (!$user && !isPublic) {
            goto('/auth?mode=login');
        }

        /** LOGGED IN → DO NOT block auth when login or signup has mode */
        const visitingAuthWithMode =
            pathname === '/auth' &&
            (search.includes('mode=login') || search.includes('mode=signup'));

        if ($user && pathname === '/auth' && !visitingAuthWithMode) {
            goto('/dashboard');
        }
    });

    /** Sidebar only on private pages after login */
    let showSidebar = $derived(
        $user && !publicRoutes.includes($page.url.pathname)
    );
</script>

{#if $isLoading}
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
    </div>
{:else}
    <div class="flex min-h-screen flex-col bg-gray-50">
        {#if showSidebar}
            <Sidebar />
            <main class="flex-1 pb-24 md:ml-64">
                <div class="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
                    <slot />
                </div>
                <StatsFooter />
            </main>
        {:else}
            <main class="flex-1">
                <slot />
            </main>
        {/if}
    </div>
{/if}
