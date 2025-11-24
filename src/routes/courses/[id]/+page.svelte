<script>
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { generateLearningRoadmap } from '$lib/utils/ai';
    import { browser } from '$app/environment';
    import { courses } from '$lib/stores/data';
    import StatsFooter from '$lib/components/StatsFooter.svelte';
    import { user } from "$lib/stores/auth";
    import { fade, slide, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- State (Runes) ---
    let course = $state(null);
    let loading = $state(true);
    let error = $state(null);
    let generatingRoadmap = $state(false);
    let isOffline = $state(browser ? !navigator.onLine : false);

    // --- Logic ---

    async function loadCourse() {
        try {
            loading = true;
            error = null;
            
            // Cache Check
            const cachedCourse = $courses.find(c => c.id === $page.params.id);
            if (cachedCourse) {
                course = cachedCourse;
                loading = false;
                return;
            }

            // Network Fetch
            if (!isOffline) {
                const { data, error: err } = await supabase
                    .from('courses')
                    .select('*')
                    .eq('id', $page.params.id)
                    .single();

                if (err) throw err;
                course = data;
            }
        } catch (err) {
            error = err.message;
            console.error('Error loading course:', err);
        } finally {
            loading = false;
        }
    }

    async function generateRoadmap() {
        if (!course.syllabus_text) {
            error = "Please add a syllabus to generate a roadmap";
            return;
        }

        try {
            generatingRoadmap = true;
            error = null;

            if (isOffline) {
                error = "Roadmap generation is not available offline";
                return;
            }

            const roadmap = await generateLearningRoadmap(course.syllabus_text);

            const { error: err } = await supabase
                .from('roadmaps')
                .insert({
                    course_id: course.id,
                    title: `${course.title} - Learning Roadmap`,
                    description: JSON.stringify(roadmap),
                    is_course_related: true
                });

            if (err) throw err;

            window.location.href = '/roadmaps';
        } catch (err) {
            error = err.message;
        } finally {
            generatingRoadmap = false;
        }
    }

    // Effects
    $effect(() => {
        if ($page.params.id) {
            loadCourse();
        }
    });

    if (browser) {
        window.addEventListener('online', () => isOffline = false);
        window.addEventListener('offline', () => isOffline = true);
    }
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
</div>

<div class="space-y-8 px-2 sm:px-0 pb-20 max-w-5xl mx-auto min-h-[80vh]">

    {#if loading}
        <div class="animate-pulse space-y-8" in:fade>
            <div class="flex justify-between items-end">
                <div class="space-y-3">
                    <div class="h-10 w-64 bg-white/40 rounded-xl"></div>
                    <div class="h-6 w-32 bg-white/30 rounded-lg"></div>
                </div>
                <div class="h-10 w-40 bg-white/40 rounded-xl"></div>
            </div>
            <div class="h-32 bg-white/40 rounded-3xl"></div>
            <div class="h-96 bg-white/40 rounded-3xl"></div>
        </div>

    {:else if error}
        <div transition:slide class="rounded-2xl bg-red-50/90 backdrop-blur border border-red-200 p-6 text-center">
            <span class="text-4xl block mb-2">⚠️</span>
            <p class="text-red-700 font-medium">{error}</p>
            {#if isOffline}
                <p class="text-red-500 text-sm mt-1">You are currently offline.</p>
            {/if}
            <a href="/courses" class="inline-block mt-4 text-indigo-600 hover:underline">Return to Library</a>
        </div>

    {:else if course}
        
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-up">
            <div class="space-y-2">
                <a href="/courses" class="inline-flex items-center text-sm font-bold text-indigo-600/70 hover:text-indigo-600 transition mb-1">
                    ← Back to Courses
                </a>
                <h1 class="text-4xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-tight">
                    {course.title}
                </h1>
                {#if course.semester}
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-white/50 text-sm font-semibold text-indigo-600 backdrop-blur-sm shadow-sm">
                        <span>📅</span> {course.semester}
                    </div>
                {/if}
            </div>

            <button
                onclick={generateRoadmap}
                disabled={generatingRoadmap || !course.syllabus_text || isOffline}
                class="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div class="relative z-10 flex items-center gap-2 font-semibold">
                    {#if generatingRoadmap}
                        <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                        <span>Building Plan...</span>
                    {:else if isOffline}
                        <span>📡 Offline Mode</span>
                    {:else}
                        <span>✨ Generate Roadmap</span>
                    {/if}
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
        </div>

        <div class="grid gap-8 animate-fade-up" style="animation-delay: 100ms">
            
            {#if course.description}
                <div class="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md border border-white/50 p-8 shadow-sm">
                    <h2 class="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>📖</span> Overview
                    </h2>
                    <p class="text-gray-600 leading-relaxed">
                        {course.description}
                    </p>
                </div>
            {/if}

            <div class="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-lg group">
                <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

                <div class="flex items-center justify-between mb-6 relative z-10">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span>📑</span> Syllabus Content
                    </h2>
                    {#if !course.syllabus_text}
                        <span class="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                            Missing Content
                        </span>
                    {/if}
                </div>

                <div class="relative z-10">
                    {#if course.syllabus_text}
                        <div class="prose prose-indigo max-w-none">
                            <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-600 bg-white/50 border border-white/60 rounded-2xl p-6 shadow-inner">
{course.syllabus_text}
                            </pre>
                        </div>
                    {:else}
                        <div class="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
                            <span class="text-4xl mb-3 opacity-50">📝</span>
                            <p class="text-gray-900 font-medium">No syllabus added yet</p>
                            <p class="text-sm text-gray-500 mt-1">Go back and edit this course to add a syllabus.</p>
                        </div>
                    {/if}
                </div>
            </div>

        </div>

    {:else}
        <div class="flex flex-col items-center justify-center py-20 rounded-3xl bg-white/40 border border-white/50 backdrop-blur-sm text-center">
            <span class="text-4xl mb-4">🔍</span>
            <h3 class="text-lg font-bold text-gray-900">Course Not Found</h3>
            <a href="/courses" class="mt-4 text-indigo-600 font-medium hover:underline">Return to Library</a>
        </div>
    {/if}
</div>

<StatsFooter />