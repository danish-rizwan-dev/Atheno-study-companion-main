<script>
    import { page } from '$app/stores';
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4 text-center">
    <div class="rounded-2xl bg-white/60 p-8 shadow-lg backdrop-blur-sm">
        <!-- Error Icon -->
        <div class="mx-auto mb-8 h-24 w-24 text-indigo-600">
            {#if $page.status === 404}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            {/if}
        </div>

        <h1 class="mb-4 text-4xl font-bold text-gray-900">
            {#if $page.status === 404}
                Page Not Found
            {:else if $page.status === 403}
                Access Denied
            {:else}
                Oops! Something went wrong
            {/if}
        </h1>

        <p class="mb-8 text-lg text-gray-600">
            {#if $page.status === 404}
                The page you're looking for doesn't exist or has been moved.
            {:else if $page.status === 403}
                You don't have permission to access this resource.
            {:else}
                {$page.error?.message || "We encountered an unexpected error. Please try again later."}
            {/if}
        </p>

        <!-- Action Buttons -->
        <div class="flex justify-center gap-4">
            <button
                on:click={() => history.back()}
                class="rounded-lg border border-indigo-600 px-6 py-2 text-indigo-600 transition-colors hover:bg-indigo-50"
            >
                Go Back
            </button>
            <a
                href="/"
                class="rounded-lg bg-indigo-600 px-6 py-2 text-white transition-colors hover:bg-indigo-500"
            >
                Home
            </a>
        </div>
    </div>
</div>