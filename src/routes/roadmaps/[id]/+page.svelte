<script>
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { roadmaps } from '$lib/stores/data';
    import { onMount } from 'svelte';
    import RoadmapModule from '$lib/components/RoadmapModule.svelte';
    import { user } from "$lib/stores/auth";
    import { fade, slide, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    let currentUserId = null;
    user.subscribe(value => currentUserId = value?.id);

    let roadmap = null;
    let loading = true;
    let saving = false;
    let error = null;
    let totalProgress = 0;
    let parsedContent = null;
    let showCreateFlashcards = false;
    let selectedTopic = null;

    // Find roadmap in cache or fetch from API
    $: {
        const cachedRoadmap = $roadmaps.find(r => r.id === $page.params.id);
        if (cachedRoadmap) {
            roadmap = cachedRoadmap;
            parsedContent = parseRoadmapContent();
            calculateTotalProgress();
            loading = false;
        } else {
            loadRoadmap();
        }
    }

    function parseRoadmapContent() {
        if (!roadmap?.description) return null;
        try {
            return typeof roadmap.description === 'string' ? 
                JSON.parse(roadmap.description) : roadmap.description;
        } catch {
            return null;
        }
    }

    async function loadRoadmap() {
        try {
            loading = true;
            error = null;
            const { data, error: err } = await supabase
                .from('roadmaps')
                .select(`
                    *,
                    course:courses (
                        title,
                        syllabus_text
                    ),
                    flashcard_sets (*)
                `)
                .eq('id', $page.params.id)
                .single();

            if (err) throw err;
            roadmap = data;
            parsedContent = parseRoadmapContent();
            calculateTotalProgress();
        } catch (err) {
            error = err.message;
            console.error('Error loading roadmap:', err);
        } finally {
            loading = false;
        }
    }

    function calculateTotalProgress() {
        if (!parsedContent?.modules) return;

        let totalTopics = 0;
        let completedTopics = 0;

        parsedContent.modules.forEach(module => {
            totalTopics += module.keyTopics?.length || 0;
            if (roadmap.progress?.[module.order]) {
                completedTopics += Object.values(roadmap.progress[module.order]).filter(Boolean).length;
            }
        });

        totalProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    }

    async function handleModuleProgress(event) {
        const { moduleOrder, progress } = event.detail;
        
        try {
            error = null;
            const updatedProgress = {
                ...(roadmap.progress || {}),
                [moduleOrder]: progress
            };

            // Optimistic update
            roadmap.progress = updatedProgress;
            calculateTotalProgress();

            // Update database
            const { error: err } = await supabase
                .from('roadmaps')
                .update({ progress: updatedProgress })
                .eq('id', roadmap.id);

            if (err) throw err;
            
            // Update cache
            roadmaps.update(maps => 
                maps.map(m => m.id === roadmap.id ? { ...m, progress: updatedProgress } : m)
            );
        } catch (err) {
            error = err.message;
            console.error('Error updating progress:', err);
            // Revert optimistic update if failed
            await loadRoadmap();
        }
    }

    async function createFlashcards() {
        if (!selectedTopic) return;

        try {
            const module = parsedContent.modules.find(m => m.title === selectedTopic);
            if (!module) return;

            const { data, error: err } = await supabase
                .from('flashcard_sets')
                .insert({
                    user_id: currentUserId,
                    title: `${selectedTopic} - Flashcards`,
                    description: module.description,
                    course_id: roadmap.course_id,
                    roadmap_item_id: roadmap.id
                })
                .select()
                .single();

            if (err) throw err;

            // Redirect to flashcards page
            window.location.href = '/flashcards';
        } catch (err) {
            error = err.message;
            console.error('Error creating flashcard set:', err);
        }
    }

    // Saving only what is necessary - access the roadmap for new user from the original source
    async function savePublicRoadmap() {
        try {
            saving = true;
            const { error: err } = await supabase
                .from('roadmaps')
                .insert({
                    user_id: currentUserId,
                    is_public: false,
                    original_roadmap_id: roadmap.id,
                    created_at : new Date().toISOString(),
                    // Only store unique/changed data, reference original for other fields
                    progress: {} // Initialize empty progress for the new user
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


    onMount(() => {
        if (!currentUserId) {
            error = "You must be logged in to view this roadmap.";
            return;
        }

        if (!roadmap) {
            loadRoadmap();
        }
    });
</script>

<svelte:head>
    <title>{roadmap ? (roadmap.title).replace(" - Learning Roadmap", " Roadmap") : 'Loading...'} | Atheno</title>
</svelte:head>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
    <div class="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
</div>

<div class="space-y-8 px-2 sm:px-0 pb-20 max-w-5xl mx-auto">
    
    {#if loading}
        <div class="space-y-6 animate-pulse" transition:fade>
            <div class="h-32 rounded-3xl bg-white/40 backdrop-blur-sm border border-white/40"></div>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="h-24 rounded-2xl bg-white/30"></div>
                <div class="h-24 rounded-2xl bg-white/30"></div>
            </div>
            <div class="space-y-4 pt-4">
                <div class="h-40 rounded-2xl bg-white/50"></div>
                <div class="h-40 rounded-2xl bg-white/50"></div>
                <div class="h-40 rounded-2xl bg-white/50"></div>
            </div>
        </div>
    
    {:else if error}
        <div class="rounded-2xl bg-red-50/80 backdrop-blur-md p-6 border border-red-200 shadow-lg" transition:slide>
            <div class="flex items-center gap-4">
                <div class="p-3 bg-red-100 rounded-full text-red-600">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-red-800">Unable to load roadmap</h3>
                    <p class="text-sm text-red-700 mt-1">{error}</p>
                </div>
            </div>
            <button on:click={loadRoadmap} class="mt-4 px-4 py-2 bg-white text-red-700 font-semibold rounded-lg shadow-sm hover:bg-red-50 transition">
                Try Again
            </button>
        </div>
    
    {:else if roadmap && parsedContent}
        
        <div class="animate-fade-up">
            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div class="space-y-2">
                    <a href="/roadmaps" class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition mb-2">
                        ← Back to My Roadmaps
                    </a>
                    <h1 class="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight" 
                        title={roadmap.title}>
                        {roadmap.title}
                    </h1>
                    {#if roadmap.course?.title}
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium">
                            <span>📚</span> {roadmap.course.title}
                        </div>
                    {/if}
                    {#if roadmap.original_roadmap_id}
                        <span class="inline-flex items-center text-xs text-gray-400 ml-2">
                            <span class="mr-1">📎</span> Saved copy
                        </span>
                    {/if}
                </div>

                <div class="flex flex-wrap gap-3">
                    {#if $user.id != roadmap.user_id}
                        <button
                            on:click={savePublicRoadmap}
                            disabled={saving}
                            class="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
                        >
                            {#if saving} Saving... {:else} Save to My Roadmaps {/if}
                        </button>
                    {/if}

                    <button
                        on:click={() => showCreateFlashcards = !showCreateFlashcards}
                        class="group flex items-center gap-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white hover:text-indigo-600 hover:shadow-md"
                    >
                        <span>⚡</span> Create Flashcards
                    </button>
                </div>
            </div>

            {#if showCreateFlashcards}
                <div transition:slide={{duration: 300, easing: quintOut}} class="mt-6">
                    <div class="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-indigo-100 shadow-xl p-6">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-200/40 to-orange-200/40 blur-2xl -mr-10 -mt-10"></div>

                        <div class="relative z-10">
                            <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span class="text-xl">⚡</span> Quick Study Mode
                            </h3>
                            <p class="text-sm text-gray-500 mt-1">Select a specific module to generate an AI flashcard deck.</p>
                            
                            <div class="mt-4 flex flex-col sm:flex-row gap-4">
                                <select bind:value={selectedTopic}
                                    class="flex-1 rounded-xl border-gray-200 bg-white/50 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    <option value="">Select a topic...</option>
                                    {#each parsedContent.modules as module}
                                        <option value={module.title}>{module.title}</option>
                                    {/each}
                                </select>
                                
                                <div class="flex gap-3">
                                    <button on:click={() => showCreateFlashcards = false}
                                        class="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition">
                                        Cancel
                                    </button>
                                    <button on:click={createFlashcards} disabled={!selectedTopic}
                                        class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm shadow-md hover:bg-indigo-700 hover:shadow-lg transition disabled:opacity-50 disabled:shadow-none">
                                        Generate Deck
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

            <div class="mt-8 relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 p-6 shadow-md group">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-lg font-bold text-gray-800">Overall Progress</h2>
                    <span class="text-3xl font-black bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {Math.round(totalProgress)}%
                    </span>
                </div>
                
                <div class="relative h-4 w-full rounded-full bg-gray-200/50 overflow-hidden shadow-inner">
                    <div class="absolute h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-gradient transition-all duration-700 ease-out"
                        style="width: {totalProgress}%">
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"
                         style="left: {totalProgress - 100}%">
                    </div>
                </div>
                <p class="mt-3 text-xs text-gray-500 font-medium">
                    Keep going! You're mastering this subject step by step.
                </p>
            </div>
        </div>

        <div class="space-y-6 pt-4">
            {#each parsedContent.modules as module, i (module.order)}
                <div class="animate-fade-up" style="animation-delay: {i * 100}ms">
                    <RoadmapModule 
                        {module}
                        roadmapId={roadmap.id}
                        progress={roadmap.progress?.[module.order] || {}}
                        on:updateProgress={handleModuleProgress}
                    />
                </div>
            {/each}
        </div>
    
    {:else}
        <div class="flex flex-col items-center justify-center py-20 rounded-3xl bg-white/50 border border-dashed border-gray-300">
            <span class="text-4xl mb-4">🗺️</span>
            <p class="text-lg font-medium text-gray-900">Roadmap not found</p>
            <a href="/roadmaps" class="mt-4 text-indigo-600 hover:underline">Return to Library</a>
        </div>
    {/if}
</div>

<style>
    /* Custom Shimmer for progress bar */
    @keyframes shimmer {
        100% { transform: translateX(100%); }
    }
</style>