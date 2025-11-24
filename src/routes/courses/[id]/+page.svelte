<script>
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { generateLearningRoadmap } from '$lib/utils/ai';
    import { browser } from '$app/environment';
    import { courses } from '$lib/stores/data';
    import { addToQueue } from '$lib/utils/queue';
    import StatsFooter from '$lib/components/StatsFooter.svelte';
    import { user } from "$lib/stores/auth";

    let currentUserId = null;
    user.subscribe(value => currentUserId = value?.id);

    let course = null;
    let loading = true;
    let error = null;
    let generatingRoadmap = false;
    let isOffline = browser ? !navigator.onLine : false;

    $: {
        // Try to get course from cache first
        const cachedCourse = $courses.find(c => c.id === $page.params.id);
        if (cachedCourse) {
            course = cachedCourse;
            loading = false;
        } else if (!isOffline) {
            loadCourse();
        }
    }

    async function loadCourse() {
        try {
            loading = true;
            error = null;
            const { data, error: err } = await supabase
                .from('courses')
                .select('*')
                .eq('id', $page.params.id)
                .single();

            if (err) throw err;
            course = data;
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

            // If offline, show message
            if (isOffline) {
                error = "Roadmap generation is not available offline";
                return;
            }

            // Generate roadmap using AI
            const roadmap = await generateLearningRoadmap(course.syllabus_text);

            // Save roadmap to database
            const { error: err } = await supabase
                .from('roadmaps')
                .insert({
                    course_id: course.id,
                    title: `${course.title} - Learning Roadmap`,
                    description: JSON.stringify(roadmap),
                    is_course_related: true
                });

            if (err) throw err;

            // Navigate to the new roadmap
            window.location.href = '/roadmaps';
        } catch (err) {
            error = err.message;
            console.error('Error generating roadmap:', err);
        } finally {
            generatingRoadmap = false;
        }
    }

    // Update offline status
    if (browser) {
        window.addEventListener('online', () => isOffline = false);
        window.addEventListener('offline', () => isOffline = true);
    }
</script>

<div class="space-y-8">
    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
    {:else if error}
        <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
        </div>
    {:else if course}
        <!-- Course Header -->
        <div class="flex items-start justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">{course.title}</h1>
                {#if course.semester}
                    <p class="mt-1 text-lg text-indigo-600">{course.semester}</p>
                {/if}
            </div>
            <div class="flex gap-4">
                <a
                    href="/courses"
                    class="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    Back to Courses
                </a>
                <button
                    on:click={generateRoadmap}
                    disabled={generatingRoadmap || !course.syllabus_text || isOffline}
                    class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                    {#if generatingRoadmap}
                        Generating...
                    {:else if isOffline}
                        Offline - Cannot Generate
                    {:else}
                        Generate Learning Roadmap
                    {/if}
                </button>
            </div>
        </div>

        <!-- Course Description -->
        {#if course.description}
            <div class="rounded-lg bg-white p-6 shadow-sm">
                <h2 class="text-lg font-semibold text-gray-900">Description</h2>
                <p class="mt-2 text-gray-600">{course.description}</p>
            </div>
        {/if}

        <!-- Syllabus -->
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900">Syllabus</h2>
            {#if course.syllabus_text}
                <div class="mt-4 prose max-w-none">
                    <pre class="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-700">{course.syllabus_text}</pre>
                </div>
            {:else}
                <p class="mt-2 text-gray-600">No syllabus has been added yet. Edit the course to add a syllabus.</p>
            {/if}
        </div>
    {:else}
        <div class="rounded-md bg-yellow-50 p-4">
            <p class="text-sm text-yellow-700">Course not found. {#if isOffline}You are currently offline and this course is not cached.{/if}</p>
        </div>
    {/if}
</div>

<StatsFooter />