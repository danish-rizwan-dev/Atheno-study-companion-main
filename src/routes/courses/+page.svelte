<script>
    import { courses } from '$lib/stores/data';
    import { user } from '$lib/stores/auth';
    import { supabase } from '$lib/supabase';
    import StatsFooter from '$lib/components/StatsFooter.svelte';

    let loading = false;
    let error = null;
    let isFormOpen = false;
    let title = '';
    let description = '';
    let semester = '';
    let syllabusText = '';
    let editingCourseId = null;

    async function handleSubmit() {
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
                result = await supabase
                    .from('courses')
                    .update(courseData)
                    .eq('id', editingCourseId)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('courses')
                    .insert(courseData)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;
            
            // Refresh cached courses
            // courses.refresh();
            resetForm();
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function deleteCourse(id) {
        if (!confirm('Are you sure you want to delete this course?')) return;
        
        try {
            loading = true;
            const { error: err } = await supabase
                .from('courses')
                .delete()
                .eq('id', id);

            if (err) throw err;
            // courses.refresh();
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
    }

    function resetForm() {
        editingCourseId = null;
        title = '';
        description = '';
        semester = '';
        syllabusText = '';
        isFormOpen = false;
    }
</script>

<div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Your Courses</h1>
            <p class="mt-1 text-sm text-gray-500">Manage your courses and study materials</p>
        </div>
        <button
            on:click={() => isFormOpen = !isFormOpen}
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
            {isFormOpen ? 'Cancel' : 'Add Course'}
        </button>
    </div>

    <!-- Error Display -->
    {#if error}
        <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
        </div>
    {/if}

    <!-- Course Form -->
    {#if isFormOpen}
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900">{editingCourseId ? 'Edit' : 'Add'} Course</h2>
            <form class="mt-6 space-y-6" on:submit|preventDefault={handleSubmit}>
                <div>
                    <label for="title" class="block text-sm font-medium text-gray-700">Course Title</label>
                    <input
                        bind:value={title}
                        type="text"
                        required
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        bind:value={description}
                        rows="3"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    ></textarea>
                </div>

                <div>
                    <label for="semester" class="block text-sm font-medium text-gray-700">Semester</label>
                    <input
                        bind:value={semester}
                        type="text"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label for="syllabusText" class="block text-sm font-medium text-gray-700">Syllabus</label>
                    <textarea
                        bind:value={syllabusText}
                        rows="6"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    ></textarea>
                </div>

                <div class="flex justify-end gap-4">
                    <button
                        type="button"
                        on:click={resetForm}
                        class="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        {loading ? 'Saving...' : 'Save Course'}
                    </button>
                </div>
            </form>
        </div>
    {/if}

    <!-- Course List -->
    {#if loading && !$courses.length}
        <div class="flex items-center justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        </div>
    {:else}
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each $courses as course (course.id)}
                <div class="group relative overflow-hidden rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div class="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                    <div class="relative">
                        <h3 class="text-lg font-semibold text-gray-900">
                            <a 
                                href="/courses/{course.id}" 
                                class="hover:text-indigo-600 after:absolute after:inset-0"
                            >
                                {course.title}
                            </a>
                        </h3>
                        {#if course.semester}
                            <p class="mt-1 text-sm text-indigo-600">{course.semester}</p>
                        {/if}
                        {#if course.description}
                            <p class="mt-2 text-sm text-gray-600 line-clamp-2">{course.description}</p>
                        {/if}
                        
                        <!-- Actions -->
                        <div class="mt-4 flex gap-2">
                            <button
                                on:click={() => editCourse(course)}
                                class="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                            >
                                Edit
                            </button>
                            <button
                                on:click={() => deleteCourse(course.id)}
                                class="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<StatsFooter />