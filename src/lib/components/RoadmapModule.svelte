<script>
    import { supabase } from '$lib/supabase';
    import { addToQueue } from '$lib/utils/queue';
    import { createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';

    export let module;
    export let roadmapId;
    export let progress = {};

    const dispatch = createEventDispatcher();

    // Computed values
    $: completedCount = Object.values(progress).filter(Boolean).length;
    $: totalTopics = module.keyTopics?.length || 0;
    $: progressPercentage = totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0;
    $: youtubeResource = module.resources?.find(r => r.includes('youtube.com'));
    $: otherResources = module.resources?.filter(r => !r.includes('youtube.com')) || [];

    async function toggleTopic(topicIndex) {
        const updatedProgress = {
            ...progress,
            [topicIndex]: !progress[topicIndex]
        };

        // Dispatch the update immediately for optimistic UI update
        dispatch('updateProgress', {
            moduleOrder: module.order,
            progress: updatedProgress
        });

        // If offline, queue the update
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

        // If online, try to update directly
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
            // Queue the update if the direct update fails
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
            {#if youtubeResource}
                <a
                    href={youtubeResource}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Watch Tutorial
                </a>
            {/if}
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-4">
            <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Progress</span>
                <span class="font-medium text-indigo-600">{completedCount}/{totalTopics}</span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                    class="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style="width: {progressPercentage}%"
                ></div>
            </div>
        </div>

        <div class="mt-6 grid gap-6 md:grid-cols-2">
            <!-- Learning Objectives -->
            <div class="space-y-4">
                <h4 class="font-medium text-gray-900">Learning Objectives</h4>
                <ul class="space-y-2 text-sm text-gray-600">
                    {#each module.learningObjectives || [] as objective}
                        <li class="flex items-start gap-2">
                            <svg class="mt-1 h-4 w-4 flex-shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                            <span>{objective}</span>
                        </li>
                    {/each}
                </ul>
                
                {#if otherResources.length > 0}
                    <div class="rounded-lg bg-gray-50 p-4">
                        <h5 class="font-medium text-gray-900">Additional Resources</h5>
                        <ul class="mt-2 space-y-1">
                            {#each otherResources as resource}
                                <li>
                                    <a
                                        href={resource}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        {resource}
                                    </a>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>

            <!-- Key Topics -->
            <div>
                <h4 class="font-medium text-gray-900">Key Topics</h4>
                <ul class="mt-4 space-y-3">
                    {#each module.keyTopics || [] as topic, index}
                        <li class="flex items-start gap-3">
                            <button
                                on:click={() => toggleTopic(index)}
                                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border {progress[index] ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'}"
                            >
                                {#if progress[index]}
                                    <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none">
                                        <path d="M3 6l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                {/if}
                            </button>
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
            <div class="text-sm font-medium text-indigo-600">
                {Math.round(progressPercentage)}% Complete
            </div>
        </div>
    </div>
</div>