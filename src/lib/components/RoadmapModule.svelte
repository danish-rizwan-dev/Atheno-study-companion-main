<script>
    import { supabase } from '$lib/supabase';
    import { addToQueue } from '$lib/utils/queue';
    import { createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';
    import { slide, fade } from 'svelte/transition';

    // --- Props ---
    let { module, roadmapId, progress = {} } = $props();

    const dispatch = createEventDispatcher();

    // --- State (Runes) ---
    let isOpen = $state(false);

    // --- Computed (Derived) ---
    let completedCount = $derived(Object.values(progress).filter(Boolean).length);
    let totalTopics = $derived(module.keyTopics?.length || 0);
    let progressPercentage = $derived(totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0);
    
    let youtubeResource = $derived(module.resources?.find(r => r.includes('youtube.com')));
    let otherResources = $derived(module.resources?.filter(r => !r.includes('youtube.com')) || []);

    // --- Logic ---

    async function toggleTopic(topicIndex) {
        const updatedProgress = {
            ...progress,
            [topicIndex]: !progress[topicIndex]
        };

        // Optimistic Update
        dispatch('updateProgress', {
            moduleOrder: module.order,
            progress: updatedProgress
        });

        // Offline Queue
        if (browser && !navigator.onLine) {
            addToQueue({
                type: 'UPDATE_ROADMAP_PROGRESS',
                data: {
                    roadmapId,
                    progress: updatedProgress
                }
            });
            return;
        }

        // Direct DB Update
        try {
            const { error } = await supabase
                .from('roadmaps')
                .update({ 
                    progress: {
                        [module.order]: updatedProgress 
                    }
                })
                .eq('id', roadmapId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating progress:', err);
            // Fallback to queue if failed
            addToQueue({
                type: 'UPDATE_ROADMAP_PROGRESS',
                data: {
                    roadmapId,
                    progress: updatedProgress
                }
            });
        }
    }
</script>

<div class="group relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-[2px]">
    
    <div class="absolute inset-0 bg-indigo-50/30 pointer-events-none transition-all duration-1000" style="width: {progressPercentage}%"></div>

    <div 
        onclick={() => isOpen = !isOpen}
        class="relative p-6 cursor-pointer z-10"
    >
        <div class="flex items-start gap-4">
            
            <div class="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
                {module.order}
            </div>

            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-4">
                    <h3 class="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                        {module.title}
                    </h3>
                    <div class="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <span>{module.estimatedDuration}</span>
                        <svg class="w-5 h-5 transition-transform duration-300 {isOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
                
                <p class="mt-1 text-sm text-gray-600 line-clamp-1 group-hover:text-gray-700 transition-colors">
                    {module.description}
                </p>

                <div class="mt-3 flex items-center gap-3">
                    <div class="flex-1 h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style="width: {progressPercentage}%"></div>
                    </div>
                    <span class="text-xs font-bold text-indigo-600">{Math.round(progressPercentage)}%</span>
                </div>
            </div>
        </div>
    </div>

    {#if isOpen}
        <div transition:slide={{ duration: 300, easing: quintOut }} class="relative z-10 border-t border-gray-100/50 bg-white/40 backdrop-blur-sm">
            <div class="p-6 pt-4 grid gap-8 md:grid-cols-2">
                
                <div>
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Topics</h4>
                    <ul class="space-y-2">
                        {#each module.keyTopics || [] as topic, index}
                            <li class="group/item flex items-start gap-3">
                                <button
                                    onclick={() => toggleTopic(index)}
                                    class="mt-0.5 flex-shrink-0 h-5 w-5 rounded border transition-all duration-200 flex items-center justify-center
                                    {progress[index] ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-gray-300 hover:border-indigo-400'}"
                                >
                                    {#if progress[index]}
                                        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                    {/if}
                                </button>
                                <span class="text-sm text-gray-700 group-hover/item:text-indigo-800 transition-colors {progress[index] ? 'line-through opacity-60' : ''}">
                                    {topic}
                                </span>
                            </li>
                        {/each}
                    </ul>
                </div>

                <div class="space-y-6">
                    
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Objectives</h4>
                        <ul class="space-y-2">
                            {#each module.learningObjectives || [] as objective}
                                <li class="flex items-start gap-2 text-sm text-gray-600">
                                    <svg class="mt-1 h-4 w-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{objective}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>

                    {#if youtubeResource || otherResources.length > 0}
                        <div>
                            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Resources</h4>
                            <div class="space-y-2">
                                {#if youtubeResource}
                                    <a href={youtubeResource} target="_blank" rel="noopener noreferrer"
                                       class="flex items-center gap-3 p-2 rounded-lg bg-white/60 border border-white/60 hover:border-red-200 hover:bg-red-50 transition group/link">
                                        <div class="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                            <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                        </div>
                                        <span class="text-sm font-medium text-gray-700 group-hover/link:text-red-700">Watch Video Tutorial</span>
                                        <svg class="ml-auto w-4 h-4 text-gray-400 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                {/if}

                                {#each otherResources as resource}
                                    <a href={resource} target="_blank" rel="noopener noreferrer"
                                       class="flex items-center gap-3 p-2 rounded-lg bg-white/60 border border-white/60 hover:border-indigo-200 hover:bg-indigo-50 transition group/link">
                                        <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <span class="text-xs font-bold">🔗</span>
                                        </div>
                                        <span class="text-sm font-medium text-gray-700 group-hover/link:text-indigo-700 truncate">{resource}</span>
                                    </a>
                                {/each}
                            </div>
                        </div>
                    {/if}

                </div>
            </div>
        </div>
    {/if}
</div>