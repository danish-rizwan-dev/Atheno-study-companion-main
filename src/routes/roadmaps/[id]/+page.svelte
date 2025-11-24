<script>
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { roadmaps } from '$lib/stores/data';
    import { onMount } from 'svelte';
    import RoadmapModule from '$lib/components/RoadmapModule.svelte';
    import { user } from "$lib/stores/auth";
    import { fade } from 'svelte/transition';

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

    // BRUTE FORCE APPROACH - WILL WASTE DB SPACE
    // async function savePublicRoadmap() {
    //     try {
    //         saving = true;
    //         const { error: err } = await supabase
    //             .from('roadmaps')
    //             .insert({
    //                 title: roadmap.title,
    //                 description: roadmap.description,
    //                 user_id: currentUserId,
    //                 is_public: false,
    //                 original_roadmap_id: roadmap.id
    //             });

    //         if (err) throw err;
    //         window.location.href = '/roadmaps';
    //     } catch (err) {
    //         error = err.message;
    //         console.error('Error saving roadmap:', err);
    //     } finally {
    //         saving = false;
    //     }
    // }

    // saving only what is necessary - access the roadmap for new user from the original source for that particular roadmap
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
    <title>{(roadmap.title).replace(" - Learning Roadmap", " Roadmap")} | Atheno</title>
</svelte:head>

<div class="space-y-8">
    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
    {:else if error}
        <div class="rounded-md bg-red-50 p-4" transition:fade>
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error loading roadmap</h3>
                    <p class="mt-2 text-sm text-red-700">{error}</p>
                    <div class="mt-4">
                        <button
                            type="button"
                            on:click={loadRoadmap}
                            class="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {:else if roadmap && parsedContent}
        <!-- Roadmap Header -->
        <div>
            <div class="flex items-start justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900" title={roadmap.title}>{roadmap.title.length > 50 ? roadmap.title.slice(0, 50) + '...' : roadmap.title}</h1>
                    {#if roadmap.course?.title}
                        <p class="mt-1 text-lg text-indigo-600">From: {roadmap.course.title}</p>
                    {/if}
                </div>
                <div class="flex gap-4">
                    {#if roadmap.original_roadmap_id}
                        <p class="text-sm text-gray-500 mt-2">Saved from a shared roadmap</p>
                    {:else}
                    <!-- no need to save the roadmap if the user is already the original creator for the roadmap -->
                    {#if $user.id == roadmap.user_id}
                        <div class="text-sm text-center items-center flex flex-col justify-center text-gray-500 hidden md:flex">
                            your roadmap
                        </div>
                        {:else}
                        <button
                            on:click={savePublicRoadmap}
                            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Save to My Roadmaps
                        </button>
                    {/if}
                    {/if}
                    <button
                        on:click={() => showCreateFlashcards = !showCreateFlashcards}
                        class="rounded-md bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
                    >
                        Create Flashcards
                    </button>
                    <a
                        href="/roadmaps"
                        class="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Back to My Roadmaps
                    </a>
                </div>
            </div>

            <!-- Create Flashcards Dialog -->
            {#if showCreateFlashcards}
                <div class="mt-6 rounded-lg bg-white p-6 shadow-sm" transition:fade>
                    <h3 class="text-lg font-semibold text-gray-900">Create Flashcards</h3>
                    <p class="mt-2 text-sm text-gray-500">
                        Select a topic to generate flashcards for studying.
                    </p>
                    <div class="mt-4">
                        <select
                            bind:value={selectedTopic}
                            class="block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="">Select a topic...</option>
                            {#each parsedContent.modules as module}
                                <option value={module.title}>{module.title}</option>
                            {/each}
                        </select>
                        <div class="mt-4 flex justify-end gap-4">
                            <button
                                on:click={() => showCreateFlashcards = false}
                                class="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                on:click={createFlashcards}
                                disabled={!selectedTopic}
                                class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                Create Flashcards
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Overall Progress -->
            <div class="mt-6 rounded-lg bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-gray-900">Overall Progress</h2>
                    <span class="text-2xl font-bold text-indigo-600">{Math.round(totalProgress)}%</span>
                </div>
                <div class="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                        class="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style="width: {totalProgress}%"
                    ></div>
                </div>
            </div>
        </div>

        <!-- Modules -->
        <div class="space-y-8">
            {#each parsedContent.modules as module (module.order)}
                <RoadmapModule 
                    {module}
                    roadmapId={roadmap.id}
                    progress={roadmap.progress?.[module.order] || {}}
                    on:updateProgress={handleModuleProgress}
                />
            {/each}
        </div>
    {:else}
        <div class="rounded-md bg-yellow-50 p-4">
            <p class="text-sm text-yellow-700">Roadmap not found.</p>
            <a
                href="/roadmaps"
                class="mt-4 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-700"
            >
                Return to Roadmaps
            </a>
        </div>
    {/if}
</div>