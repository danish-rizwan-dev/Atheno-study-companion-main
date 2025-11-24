<script>
    import { courses } from '$lib/stores/data';
    import { user } from '$lib/stores/auth';
    import { supabase } from '$lib/supabase';
    import StatsFooter from '$lib/components/StatsFooter.svelte';
    import { slide, fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- State (Runes) ---
    let loading = $state(false);
    let error = $state(null);
    let isFormOpen = $state(false);
    
    // Form Fields
    let title = $state('');
    let description = $state('');
    let semester = $state('');
    let syllabusText = $state('');
    let editingCourseId = $state(null);

    // --- Logic ---

    async function handleSubmit() {
        if (!title) {
            error = "Course title is required";
            return;
        }

        try {
            loading = true;
            error = null;
            const courseData = { 
                user_id: $user.id, 
                title, 
                description, 
                semester, 
                syllabus_text: syllabusText 
            };

            let result;
            if (editingCourseId) {
                result = await supabase.from('courses').update(courseData).eq('id', editingCourseId).select().single();
            } else {
                result = await supabase.from('courses').insert(courseData).select().single();
            }

            if (result.error) throw result.error;
            
            // Note: If you have a realtime subscription setup in your store, it updates automatically.
            // Otherwise, you might need to manually update the local store here.
            
            resetForm();
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function deleteCourse(id) {
        if (!confirm('Are you sure you want to delete this course? All associated roadmaps and logs will be affected.')) return;
        
        try {
            loading = true;
            const { error: err } = await supabase.from('courses').delete().eq('id', id);
            if (err) throw err;
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function editCourse(course) {
        editingCourseId = course.id;
        title = course.title;
        description = course.description;
        semester = course.semester;
        syllabusText = course.syllabus_text;
        isFormOpen = true;
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        editingCourseId = null;
        title = '';
        description = '';
        semester = '';
        syllabusText = '';
        isFormOpen = false;
        error = null;
    }
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
    <div class="absolute top-40 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
</div>

<div class="space-y-10 px-2 sm:px-0 pb-20 max-w-7xl mx-auto">

    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
        <div>
            <h1 class="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Your Courses
            </h1>
            <p class="mt-2 text-gray-600 text-lg">
                Manage your curriculum and syllabi.
            </p>
        </div>
        <button
            onclick={() => isFormOpen = !isFormOpen}
            class="group relative inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white transition-all duration-200 bg-gray-900 rounded-full hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
        >
            {#if isFormOpen}
                <span>Cancel</span>
            {:else}
                <span>+ Add Course</span>
            {/if}
        </button>
    </div>

    {#if error}
        <div transition:slide class="rounded-xl bg-red-50/90 backdrop-blur border border-red-200 p-4 text-red-700 shadow-sm animate-fade-up">
            {error}
        </div>
    {/if}

    {#if isFormOpen}
        <div transition:slide={{duration:400, easing:quintOut}} class="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl p-6 md:p-8 animate-fade-up">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>

            <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 relative z-10">
                <span>{editingCourseId ? '✏️' : '🎓'}</span> 
                {editingCourseId ? 'Edit Course Details' : 'Add New Course'}
            </h2>

            <form class="space-y-6 relative z-10" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                
                <div class="grid gap-6 md:grid-cols-2">
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-500 uppercase ml-1">Course Title</label>
                        <input bind:value={title} placeholder="e.g. Introduction to Psychology" 
                            class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all"/>
                    </div>

                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-500 uppercase ml-1">Semester / Year</label>
                        <input bind:value={semester} placeholder="e.g. Fall 2025" 
                            class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all"/>
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-500 uppercase ml-1">Description (Optional)</label>
                    <textarea bind:value={description} rows="2" placeholder="Brief summary of the course..." 
                        class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all resize-none"></textarea>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-500 uppercase ml-1">Syllabus Content</label>
                    <textarea bind:value={syllabusText} rows="5" placeholder="Paste your syllabus here. This helps AI generate better roadmaps for you." 
                        class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all"></textarea>
                </div>

                <div class="flex justify-end pt-2">
                    <button type="submit" disabled={loading}
                        class="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50">
                        {loading ? 'Saving...' : (editingCourseId ? 'Update Course' : 'Create Course')}
                    </button>
                </div>
            </form>
        </div>
    {/if}

    {#if loading && !$courses.length}
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
            {#each Array(3) as _}
                <div class="h-48 rounded-3xl bg-white/40 border border-white/30"></div>
            {/each}
        </div>
    {:else if !$courses.length}
        <div in:fade class="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-gray-300 bg-white/30 text-center animate-fade-up">
            <span class="text-4xl mb-4">📚</span>
            <h3 class="text-lg font-medium text-gray-900">No courses added yet</h3>
            <p class="mt-2 text-gray-500 text-sm">Add a course to start generating roadmaps and tracking tasks.</p>
        </div>
    {:else}
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each $courses as course, i (course.id)}
                <div
                    class="group relative bg-white/70 border border-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-sm 
                           transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-default overflow-hidden animate-fade-up flex flex-col justify-between"
                    style="animation-delay: {i * 100}ms"
                >
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%] transition duration-[1.2s] pointer-events-none z-10"></div>

                    <div class="relative z-20">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {course.title}
                            </h3>
                            {#if course.semester}
                                <span class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 whitespace-nowrap ml-2">
                                    {course.semester}
                                </span>
                            {/if}
                        </div>
                        
                        {#if course.description}
                            <p class="text-sm text-gray-600 line-clamp-3 mb-4">{course.description}</p>
                        {:else}
                            <p class="text-sm text-gray-400 italic mb-4">No description provided.</p>
                        {/if}
                    </div>

                    <div class="relative z-20 pt-4 border-t border-gray-100/50 flex gap-2">
                        <button onclick={() => editCourse(course)}
                            class="flex-1 rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition shadow-sm">
                            Edit
                        </button>
                        <button onclick={() => deleteCourse(course.id)}
                            class="flex-1 rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-sm">
                            Delete
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <div class="pt-8">
        <StatsFooter />
    </div>
</div>