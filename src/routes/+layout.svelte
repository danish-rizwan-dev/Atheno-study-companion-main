<script>
    import '../app.css';
    import { page } from '$app/stores';
    import Navbar from '$lib/components/navbar.svelte';
    import Sidebar from '$lib/components/sidebar.svelte';
    import StatsFooter from '$lib/components/StatsFooter.svelte';
    import { page as PageData } from '$app/state';

    let {
        data
    } = $props();

    let { loading, user, error } = $derived(data);
    
    // Show sidebar only on authenticated routes except landing page
    let showSidebar = $derived(user && $page.url.pathname !== '/');
</script>

<svelte:head>
    <script defer src="https://cloud.umami.is/script.js" data-website-id="83a06199-c8e1-43be-be93-cdf1739dc15d"></script>
    <title>{PageData.url.pathname === '/' ? "" : (PageData.url.pathname.replace('/', '').trim()).slice(0,1).toUpperCase() + (PageData.url.pathname.replace('/', '').trim()).slice(1,(PageData.url.pathname.replace('/', '').trim()).length) + " - "} Atheno</title>
    <meta name="description" content="AI powered study companion" />
    <meta name="title" content="Atheno" />

    <!-- facebook SEO -->
    <meta property="og:title" content="Atheno" />
    <meta property="og:description" content="AI powered study companion application" />
    <meta property="og:image" content="%sveltekit.assets%/favicon.png" />
    <meta property="og:url" content="%sveltekit.url%" />
    
    <meta name="author" content="Danish" />

    <meta name="keywords" content="AI, study, flashcards, roadmaps, companion, application" />

    <meta property="og:type" content="website" />
	<meta property="og:site_name" content="Atheno" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:locale:alternate" content="en_IN" />
</svelte:head>

{#if loading}
    <div class="flex min-h-screen items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
    </div>
{:else if error}
    <div class="flex min-h-screen flex-col">
        <main class="flex-1 p-4">
            <div class="rounded-md bg-red-50 p-4">
                <div class="flex">
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error</h3>
                        <p class="mt-2 text-sm text-red-700">{error.message}</p>
                    </div>
                </div>
            </div>
        </main>
    </div>
{:else}
    <div class="flex min-h-screen flex-col">
        {#if user}
            <Sidebar />
            <main class="flex-1 pb-24 md:ml-64">
                <div class="px-4 py-8">
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