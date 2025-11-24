<script>
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabase';
    import { courses, roadmaps } from '$lib/stores/data';
    import { generateLearningRoadmap } from '$lib/utils/ai';
    import { user } from '$lib/stores/auth';
    import RoadmapModule from '$lib/components/RoadmapModule.svelte';
    import { fade } from 'svelte/transition';

    let loading = false;
    let error = null;
    let showForm = false;
    let topicInput = '';
    let selectedCourseId = '';
    let generatingRoadmap = false;

    // New form fields
    let classLevel = 'college';
    let exam = 'general';
    let difficulty = 'intermediate';
    let timeline = '1 month';
    let priorKnowledge = '';

    async function generateRoadmap() {
        if (!topicInput && !selectedCourseId) {
            error = "Please enter a topic or select a course";
            return;
        }

        try {
            generatingRoadmap = true;
            error = null;

            let roadmapData;
            let course;
            
            if (selectedCourseId) {
                course = $courses.find(c => c.id === selectedCourseId);
                if (!course?.syllabus_text) {
                    throw new Error("Selected course has no syllabus");
                }
            }

            // Optimistically add the new roadmap
            const tempId = crypto.randomUUID();
            const tempRoadmap = {
                id: tempId,
                title: selectedCourseId ? 
                    `${course?.title} - Learning Roadmap` : 
                    `${topicInput} - Learning Roadmap`,
                course: course,
                is_course_related: !!selectedCourseId,
                created_at: new Date().toISOString(),
                progress: {},
                description: null, // Will be updated with real data
                loading: true
            };

            roadmaps.update(maps => [tempRoadmap, ...maps]);

            // Generate roadmap data
            roadmapData = await generateLearningRoadmap({
                syllabusText: selectedCourseId ? course.syllabus_text : topicInput,
                subject: selectedCourseId ? course.title : topicInput,
                classLevel,
                exam,
                difficulty,
                timeline,
                priorKnowledge
            });

            // Save roadmap to database
            const { data: savedRoadmap, error: err } = await supabase
                .from('roadmaps')
                .insert({
                    user_id: $user.id,
                    course_id: selectedCourseId || null,
                    title: tempRoadmap.title,
                    description: JSON.stringify(roadmapData),
                    is_course_related: !!selectedCourseId
                })
                .select(`
                    *,
                    course:courses (
                        title
                    )
                `)
                .single();

            if (err) throw err;

            // Update the roadmaps store with the real data
            roadmaps.update(maps => maps.map(m => 
                m.id === tempId ? { ...savedRoadmap, loading: false } : m
            ));

            // Reset form
            topicInput = '';
            selectedCourseId = '';
            showForm = false;

        } catch (err) {
            error = err.message;
            console.error('Error generating roadmap:', err);
            // Remove the temporary roadmap if there was an error
            roadmaps.update(maps => maps.filter(m => !m.loading));
        } finally {
            generatingRoadmap = false;
        }
    }

    async function deleteRoadmap(id) {
        if (!confirm('Are you sure you want to delete this roadmap?')) return;
        
        try {
            loading = true;
            error = null;
            
            // Optimistically remove the roadmap
            roadmaps.update(maps => maps.filter(m => m.id !== id));
            
            const { error: err } = await supabase
                .from('roadmaps')
                .delete()
                .eq('id', id);

            if (err) {
                // If deletion fails, add the roadmap back
                const deletedRoadmap = $roadmaps.find(m => m.id === id);
                if (deletedRoadmap) {
                    roadmaps.update(maps => [deletedRoadmap, ...maps]);
                }
                throw err;
            }
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function makeRoadmapPublic(roadmapId) {
        try {
            loading = true;
            const { error: err } = await supabase
                .from('roadmaps')
                .update({ is_public: true })
                .eq('id', roadmapId);

            if (err) throw err;

            // Show success message with share link
            const shareLink = `${window.location.origin}/share/roadmaps/${roadmapId}/view`;
            navigator.clipboard.writeText(shareLink);
            alert('Share link copied to clipboard!');
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    $: courseRoadmaps = $roadmaps.filter(r => r.is_course_related);
    $: independentRoadmaps = $roadmaps.filter(r => !r.is_course_related);
</script>

<div class="space-y-8">
    <!-- Only show form and generate button for authenticated users -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Learning Roadmaps</h1>
            <p class="mt-1 text-sm text-gray-500">Track your learning progress with AI-generated study paths</p>
        </div>
        {#if $user}
            <button
                on:click={() => showForm = !showForm}
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
                {showForm ? 'Cancel' : 'Generate Roadmap'}
            </button>
        {/if}
    </div>

    {#if error}
        <div class="rounded-md bg-red-50 p-4 animate-in fade-in" transition:fade>
            <p class="text-sm text-red-700">{error}</p>
        </div>
    {/if}

    {#if showForm && $user}
        <div class="rounded-lg bg-white p-6 shadow-sm animate-in slide-in-from-top" transition:fade>
            <h2 class="text-lg font-semibold text-gray-900">Generate New Roadmap</h2>
            <div class="mt-4 grid gap-6">
                <div class="grid gap-6 md:grid-cols-2">
                    <div>
                        <label for="courseSelect" class="block text-sm font-medium text-gray-700">
                            Generate from Course
                        </label>
                        <select
                            id="courseSelect"
                            bind:value={selectedCourseId}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            disabled={!!topicInput}
                        >
                            <option value="">Select a course...</option>
                            {#each $courses as course}
                                <option value={course.id}>{course.title}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label for="topicInput" class="block text-sm font-medium text-gray-700">
                            Or Enter a Topic
                        </label>
                        <input
                            id="topicInput"
                            bind:value={topicInput}
                            type="text"
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            placeholder="e.g., Machine Learning Basics"
                            disabled={!!selectedCourseId}
                        />
                    </div>
                </div>

                <div class="grid gap-6 md:grid-cols-3">
                    <div>
                        <label for="classLevel" class="block text-sm font-medium text-gray-700">Class Level</label>
                        <select
                            id="classLevel"
                            bind:value={classLevel}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="college">College</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>

                    <div>
                        <label for="difficulty" class="block text-sm font-medium text-gray-700">Difficulty</label>
                        <select
                            id="difficulty"
                            bind:value={difficulty}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>

                    <div>
                        <label for="timeline" class="block text-sm font-medium text-gray-700">Timeline</label>
                        <select
                            id="timeline"
                            bind:value={timeline}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="1 week">1 Week</option>
                            <option value="2 weeks">2 Weeks</option>
                            <option value="1 month">1 Month</option>
                            <option value="2 months">2 Months</option>
                            <option value="3 months">3 Months</option>
                            <option value="6 months">6 Months</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label for="priorKnowledge" class="block text-sm font-medium text-gray-700">Prior Knowledge</label>
                    <textarea
                        id="priorKnowledge"
                        bind:value={priorKnowledge}
                        rows="2"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Describe your current knowledge level in this subject (optional)"
                    ></textarea>
                </div>

                <div class="flex justify-end">
                    <button
                        on:click={generateRoadmap}
                        disabled={generatingRoadmap || (!topicInput && !selectedCourseId)}
                        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {#if generatingRoadmap}
                            <span class="flex items-center gap-2">
                                <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Generating...
                            </span>
                        {:else}
                            Generate Roadmap
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
    {:else}
        <!-- Course Roadmaps -->
        {#if courseRoadmaps.length > 0}
            <div>
                <h2 class="text-lg font-semibold text-gray-900">Course Roadmaps</h2>
                <div class="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {#each courseRoadmaps as roadmap (roadmap.id)}
                        <a
                            href="/roadmaps/{roadmap.id}"
                            class="group relative overflow-hidden rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md {roadmap.loading ? 'animate-pulse' : ''}"
                        >
                            <div class="absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100">
                                <button
                                    on:click|preventDefault={() => makeRoadmapPublic(roadmap.id)}
                                    class="rounded p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
                                    title="Share Roadmap"
                                >
                                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                                    </svg>
                                </button>
                                <button
                                    on:click|preventDefault={() => deleteRoadmap(roadmap.id)}
                                    class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                    title="Delete Roadmap"
                                >
                                    ×
                                </button>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900">
                                {roadmap.title.length > 50 ? roadmap.title.slice(0, 50) + '...' : roadmap.title}
                            </h3>
                            {#if roadmap.course?.title}
                                <p class="mt-1 text-sm text-indigo-600">{roadmap.course.title}</p>
                            {/if}
                            <div class="mt-4">
                                <div class="text-sm text-gray-500">
                                    Created {new Date(roadmap.created_at).toLocaleDateString()}
                                </div>
                                {#if roadmap.loading}
                                    <div class="mt-2 text-sm text-indigo-600">Generating roadmap...</div>
                                {/if}
                            </div>
                        </a>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Independent Roadmaps -->
        {#if independentRoadmaps.length > 0}
            <div>
                <h2 class="text-lg font-semibold text-gray-900">Topic Roadmaps</h2>
                <div class="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {#each independentRoadmaps as roadmap (roadmap.id)}
                        <a
                            href="/roadmaps/{roadmap.id}"
                            class="group relative overflow-hidden rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md {roadmap.loading ? 'animate-pulse' : ''}"
                        >
                            <div class="absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100">
                                <button
                                    on:click|preventDefault={() => makeRoadmapPublic(roadmap.id)}
                                    class="rounded p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
                                    title="Share Roadmap"
                                >
                                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                                    </svg>
                                </button>
                                <button
                                    on:click|preventDefault={() => deleteRoadmap(roadmap.id)}
                                    class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                    title="Delete Roadmap"
                                >
                                    ×
                                </button>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900">
                                {roadmap.title.length > 50 ? roadmap.title.slice(0, 50) + '...' : roadmap.title}
                            </h3>
                            <div class="mt-4">
                                <div class="text-sm text-gray-500">
                                    Created {new Date(roadmap.created_at).toLocaleDateString()}
                                </div>
                                {#if roadmap.loading}
                                    <div class="mt-2 text-sm text-indigo-600">Generating roadmap...</div>
                                {/if}
                            </div>
                        </a>
                    {/each}
                </div>
            </div>
        {/if}

        {#if $roadmaps.length === 0}
            <div class="rounded-lg bg-gray-50 p-8 text-center">
                <h3 class="text-lg font-medium text-gray-900">No roadmaps yet</h3>
                <p class="mt-2 text-sm text-gray-500">
                    Generate a roadmap from your courses or any topic you want to learn.
                </p>
            </div>
        {/if}
    {/if}
</div>