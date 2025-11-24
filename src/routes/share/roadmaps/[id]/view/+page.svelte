<script>
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { user } from "$lib/stores/auth";
    import { fade } from 'svelte/transition';

    let roadmap = null;
    let loading = true;
    let error = null;
    let showSignUpModal = false;
    let parsedContent = null;
    let saving = false;
    let title = '';

    async function loadRoadmap() {
        try {
            loading = true;
            error = null;
            const { data, error: err } = await supabase
                .from('roadmaps')
                .select('*')
                .eq('id', $page.params.id)
                .single();

            if (err) throw err;
            if (!data.is_public) throw new Error("This roadmap is not publicly accessible");
            
            roadmap = data;
            parsedContent = typeof data.description === 'string' ? 
                JSON.parse(data.description) : data.description;
        } catch (err) {
            error = err.message;
            console.error('Error loading roadmap:', err);
        } finally {
            // update the roadmap title once it is fetched from supabase
            title = roadmap.title || '';
            loading = false;
        }
    }

    async function saveToMyRoadmaps() {
        if (!$user) {
            showSignUpModal = true;
            return;
        }

        try {
            saving = true;
            const { error: err } = await supabase
                .from('roadmaps')
                .insert({
                    title: roadmap.title,
                    description: roadmap.description,
                    user_id: $user.id,
                    is_public: false,
                    original_roadmap_id: roadmap.id
                });

            if (err) throw err;
            window.location.href = '/roadmaps';
        } catch (err) {
            error = err.message;
            console.error('Error saving roadmap:', err);
        } finally {
            saving = false;
        }
    }

    $: {
        if ($page.params.id) {
            loadRoadmap();
        }
    }

    let button_class;
    $: {
        if (!$user) {
            button_class = "text-xs text-gray-500 hidden md:block";
        } else if ($user.id === roadmap?.user_id) {
            button_class = "text-xs text-gray-500 hidden md:block";
        } else {
            button_class = "rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50";
        }
    }
    // console.log($user, button_class);
</script>

<svelte:head>
    <title>{title.replace('Learning Roadmap', '')} Shared Roadmap | Atheno</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
    {:else if error}
        <div class="rounded-md bg-red-50 p-4" transition:fade>
            <p class="text-sm text-red-700">{error}</p>
            <a
                href="/"
                class="mt-4 inline-block text-sm font-medium text-red-800 hover:text-red-700"
            >
                Head to Atheno
            </a>
        </div>
    {:else if roadmap && parsedContent}
        <!-- Sign Up Modal -->
        {#if showSignUpModal}
            <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-10" transition:fade>
                <div class="bg-white rounded-lg p-6 max-w-md w-full z-50">
                    <h2 class="text-lg font-semibold text-gray-900">Sign Up to Save Roadmap</h2>
                    <p class="mt-2 text-sm text-gray-500">
                        Create an account to save this roadmap and track your progress, create flashcards, and more!
                    </p>
                    <div class="mt-6 flex justify-end gap-4">
                        <button
                            on:click={() => showSignUpModal = false}
                            class="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Maybe Later
                        </button>
                        <a
                            href="/auth"
                            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Sign Up Now
                        </a>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Roadmap Header -->
        <div class="flex items-start justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">{roadmap.title}</h1>
                <p class="mt-1 text-sm text-gray-500">A learning roadmap generated on <a href="/" class="text-indigo-500 hover:cursor-pointer">Atheno</a></p>
            </div>
            <div class="flex gap-4">
                <button
                    on:click={saveToMyRoadmaps}
                    disabled={saving}
                    class={button_class}
                >
                    {#if saving}
                        Saving...
                    {:else if $user?.id === roadmap.user_id}
                        <span>
                            {"this is your roadmap"}
                        </span>
                    {:else}
                        {@html $user ? 'Save to My Roadmaps' : 'Made with &hearts; by Danish'}
                    {/if}
                </button>
                <a
                    href={$user?.id ? '/roadmaps' : '/auth'}
                    class="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    {$user ? 'Back to Your Roadmaps' : 'Sign Up'}
                </a>
            </div>
        </div>

        <!-- CTA component -->
        {#if !$user}
            <div class="rounded-lg bg-indigo-50 p-6">
                <h3 class="text-lg font-semibold text-indigo-900">Get More with Atheno</h3>
                <p class="mt-2 text-sm text-indigo-700">
                    Sign up to track your progress, create flashcards, set study timers, and more!
                </p>
                <div class="mt-4">
                    <a
                        href="/"
                        class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        Get Started
                        <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            </div>
        {/if}

        <!-- Modules -->
        <div class="space-y-8">
            {#each parsedContent.modules as module (module.order)}
                <div class="relative rounded-lg border border-gray-200 p-6 hover:border-indigo-200">
                    <div class="absolute -left-3 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
                        {module.order}
                    </div>

                    <div class="ml-6">
                        <div class="flex items-start justify-between">
                            <div>
                                <h3 class="text-xl font-semibold text-gray-900">{module.title}</h3>
                                <p class="mt-1 text-sm text-gray-600">{module.description}</p>
                            </div>
                        </div>
                        
                        <div class="mt-6 grid gap-6 md:grid-cols-2">
                            <!-- Learning Objectives -->
                            <div class="space-y-4">
                                <h4 class="font-medium text-gray-900">Learning Resources</h4>
                                <ul class="space-y-2 text-sm text-gray-600">
                                    {#each module.resources || [] as objective}
                                        <li class="flex items-start gap-2">
                                            <svg class="mt-1 h-4 w-4 flex-shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                            </svg>
                                            <span>{objective}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>

                            <!-- Key Topics -->
                            <div>
                                <h4 class="font-medium text-gray-900">Key Topics</h4>
                                <ul class="mt-4 space-y-3">
                                    {#each module.keyTopics || [] as topic}
                                        <li class="flex items-start gap-3">
                                            <span class="text-sm text-gray-600">{topic}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>

                        <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                            <div class="text-sm text-gray-500">
                                Estimated Duration: {module.estimatedDuration}
                            </div>
                            {#if !$user}
                                <a
                                    href="/auth"
                                    class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Sign up to track progress →
                                </a>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
    <div class="text-center">
        <p class="mt-4 block bg-gradient-to-r from-indigo-600 to-purple-600 hover:hue-rotate-60 duration-700 bg-clip-text text-transparent text-center select-none font-normal"><b class="font-semibold">Atheno</b> | made with &hearts; by Danish | {new Date().getFullYear()}</p>
    </div>
</div>