<script>
    import { supabase } from '$lib/supabase';
    import { browser } from '$app/environment';
    import { courses, roadmaps } from '$lib/stores/data';
    import { user } from '$lib/stores/auth';
    import { generateLearningRoadmap } from '$lib/utils/ai';
    import { fade, fly, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- State Management ---
    let error = null;
    let showForm = false;
    let topicInput = '';
    let selectedCourseId = '';
    let generatingRoadmap = false;

    // Form Defaults
    let classLevel = 'college';
    let difficulty = 'intermediate';
    let timeline = '1 month';
    let priorKnowledge = '';

    // Toast Logic
    let toast = null;
    const showToast = (msg, type = 'success') => {
        toast = { msg, type };
        setTimeout(() => toast = null, 3000);
    };

    // --- Core Logic (Preserved) ---
    async function generateRoadmap() {
        if (!topicInput && !selectedCourseId) {
            error = "Please enter a topic or select a course";
            return;
        }
        try {
            generatingRoadmap = true;
            error = null;
            const tempId = crypto.randomUUID();
            const course = selectedCourseId ? $courses.find(c => c.id === selectedCourseId) : null;

            const tempRoadmap = {
                id: tempId,
                title: selectedCourseId ? `${course.title} - Learning Roadmap` : `${topicInput} - Learning Roadmap`,
                course,
                is_course_related: !!selectedCourseId,
                created_at: new Date().toISOString(),
                description: null,
                progress: {},
                xp: 0,
                loading: true
            };

            roadmaps.update(m => [tempRoadmap, ...m]);
            showForm = false; // Close form immediately for better UX
            showToast("Generating roadmap...", "info");

            const roadmapData = await generateLearningRoadmap({
                syllabusText: selectedCourseId ? course.syllabus_text : topicInput,
                subject: selectedCourseId ? course.title : topicInput,
                classLevel,
                difficulty,
                timeline,
                priorKnowledge
            });

            const { data: saved, error: saveErr } = await supabase
                .from('roadmaps')
                .insert({
                    user_id: $user.id,
                    course_id: selectedCourseId || null,
                    title: tempRoadmap.title,
                    description: JSON.stringify(roadmapData),
                    is_course_related: !!selectedCourseId,
                    progress: {},
                    xp: 0
                })
                .select(`*, course:courses(title)`)
                .single();

            if (saveErr) throw saveErr;

            roadmaps.update(m => m.map(r => r.id === tempId ? { ...saved, loading: false } : r));
            topicInput = '';
            selectedCourseId = '';
            showToast("Roadmap ready!");
        } catch (e) {
            error = e.message;
            roadmaps.update(m => m.filter(r => !r.loading));
            showToast("Generation failed", "error");
        } finally {
            generatingRoadmap = false;
        }
    }

    async function deleteRoadmap(id) {
        if (!confirm("Are you sure you want to delete this roadmap?")) return;
        const removed = $roadmaps.find(r => r.id === id);
        roadmaps.update(m => m.filter(r => r.id !== id));
        const { error: err } = await supabase.from('roadmaps').delete().eq('id', id);
        if (err) {
            roadmaps.update(m => [removed, ...m]);
            showToast(err.message, "error");
        } else showToast("Roadmap deleted");
    }

    async function makeRoadmapPublic(id) {
        const { error: err } = await supabase.from('roadmaps').update({ is_public: true }).eq('id', id);
        if (err) error = err.message;
        else {
            navigator.clipboard.writeText(`${window.location.origin}/share/roadmaps/${id}/view`);
            showToast("Public link copied to clipboard!");
        }
    }

    async function exportPDF(roadmap) {
        const detail = JSON.parse(roadmap.description);
        const w = window.open('', '', 'width=1000,height=1024');
        w.document.write(`
            <html><head><title>${roadmap.title} PDF</title>
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1f2937; }
                h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                .module { margin-bottom: 24px; break-inside: avoid; }
                h2 { color: #111827; font-size: 18px; margin-bottom: 8px; }
                .task { margin-left: 0; padding: 4px 0; font-size: 14px; border-bottom: 1px dashed #f3f4f6; }
            </style>
            </head><body>
                <h1>${roadmap.title}</h1>
                ${detail.modules.map(m => `
                    <div class="module"><h2>${m.title}</h2>
                        ${m.tasks.map(t => `<div class="task">☐ ${t.title}</div>`).join("")}
                    </div>`).join("")}
            </body></html>
        `);
        w.document.close();
        setTimeout(() => w.print(), 500);
    }

    $: courseRoadmaps = $roadmaps.filter(r => r.is_course_related);
    $: independentRoadmaps = $roadmaps.filter(r => !r.is_course_related);
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
    <div class="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
</div>

{#if toast}
    <div transition:fly={{y:-20, duration: 300}} class="fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/20
        {toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-white/90 text-gray-800'}">
        <div class="flex items-center gap-2">
            <span>{toast.type === 'success' || toast.type === 'info' ? '✨' : '⚠️'}</span>
            <span class="font-medium">{toast.msg}</span>
        </div>
    </div>
{/if}

<div class="space-y-10 px-2 sm:px-0 pb-20">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
        <div class="relative">
            <h1 class="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                Learning Roadmaps
            </h1>
            <p class="mt-2 text-gray-600 text-lg">
                Your AI-powered curriculum and progress tracker.
            </p>
        </div>

        {#if $user}
            <button 
                on:click={() => showForm = !showForm}
                class="group relative inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 active:scale-95"
            >
                {#if showForm}
                    <span>Cancel</span>
                {:else}
                    <span>✨ Generate New Roadmap</span>
                {/if}
            </button>
        {/if}
    </div>

    {#if error}
        <div transition:slide class="rounded-xl bg-red-50/80 backdrop-blur-sm p-4 text-red-700 border border-red-200 animate-fade-up">
            {error}
        </div>
    {/if}

    {#if showForm}
    <div transition:slide={{duration: 400, easing: quintOut}} class="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl p-6 md:p-8 animate-fade-up">
        <div class="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>

        <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span class="text-2xl">🤖</span> Configure your AI Roadmap
        </h2>

        <div class="space-y-6 relative z-10">
            <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Based on Course</label>
                    <div class="relative">
                        <select bind:value={selectedCourseId} disabled={!!topicInput}
                            class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-700 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:bg-gray-100/50">
                            <option value="">Select a course...</option>
                            {#each $courses as course}
                                <option value={course.id}>{course.title}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Or Specific Topic</label>
                    <input bind:value={topicInput} disabled={!!selectedCourseId}
                        placeholder="e.g., Advanced React Patterns"
                        class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-700 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:bg-gray-100/50"/>
                </div>
            </div>

            <div class="grid gap-6 md:grid-cols-3">
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Academic Level</label>
                    <select bind:value={classLevel} class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="college">College / University</option>
                        <option value="advanced">Professional / Advanced</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Complexity</label>
                    <select bind:value={difficulty} class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all">
                        <option value="beginner">Easy</option>
                        <option value="intermediate">Moderate</option>
                        <option value="advanced">Hard</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Target Timeline</label>
                    <select bind:value={timeline} class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all">
                        <option value="1 week">Sprint (1 Week)</option>
                        <option value="1 month">Standard (1 Month)</option>
                        <option value="3 months">Semester (3 Months)</option>
                        <option value="6 months">Deep Dive (6 Months)</option>
                    </select>
                </div>
            </div>

            <div class="space-y-2">
                <label class="text-sm font-semibold text-gray-700 ml-1">Prior Knowledge (Optional)</label>
                <textarea bind:value={priorKnowledge} rows="2"
                    placeholder="Tell the AI what you already know so it skips the basics..."
                    class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all resize-none"></textarea>
            </div>

            <div class="flex justify-end pt-2">
                <button on:click={generateRoadmap}
                    disabled={generatingRoadmap || (!topicInput && !selectedCourseId)}
                    class="relative overflow-hidden rounded-xl bg-gray-900 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-gray-800 hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {#if generatingRoadmap}
                        <span class="flex items-center gap-2">
                            <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                            Thinking...
                        </span>
                    {:else}
                        Generate Plan 🚀
                    {/if}
                </button>
            </div>
        </div>
    </div>
    {/if}

    {#if !$roadmaps.length}
    <div transition:fade class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white/30 p-16 text-center animate-fade-up">
        <div class="rounded-full bg-indigo-50 p-4 mb-4">
            <span class="text-4xl">🗺️</span>
        </div>
        <h3 class="text-xl font-bold text-gray-900">No roadmaps generated yet</h3>
        <p class="text-gray-500 mt-2 max-w-md">
            Create a custom study plan for any topic or link it to your existing courses to get started.
        </p>
    </div>
    {/if}

    {#each [
        { label: "Course Curricula", data: courseRoadmaps, icon: '🎓' },
        { label: "Self-Learning Topics", data: independentRoadmaps, icon: '💡' }
    ] as list (list.label)}
        {#if list.data.length}
        <div class="animate-fade-up">
            <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 px-2">
                <span>{list.icon}</span> {list.label}
            </h2>
            
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {#each list.data as roadmap, i (roadmap.id)}
                <a href="/roadmaps/{roadmap.id}" 
                   class="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl p-6 flex flex-col justify-between h-full"
                   style="animation-delay: {i * 100}ms">
                   
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%] transition duration-[1.2s] pointer-events-none z-10"></div>

                    <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <button on:click|preventDefault={() => exportPDF(roadmap)} 
                            class="p-2 rounded-lg bg-white/80 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 shadow-sm transition" title="Export PDF">
                            📄
                        </button>
                        <button on:click|preventDefault={() => makeRoadmapPublic(roadmap.id)} 
                            class="p-2 rounded-lg bg-white/80 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 shadow-sm transition" title="Share Link">
                            🔗
                        </button>
                        <button on:click|preventDefault={() => deleteRoadmap(roadmap.id)} 
                            class="p-2 rounded-lg bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 shadow-sm transition" title="Delete">
                            🗑️
                        </button>
                    </div>

                    <div>
                        <div class="flex gap-2 mb-3">
                            {#if roadmap.loading}
                                <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 ring-1 ring-inset ring-indigo-600/20 animate-pulse">
                                    ✨ Generating
                                </span>
                            {:else}
                                <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset
                                    {roadmap.is_course_related ? 'bg-purple-50 text-purple-700 ring-purple-600/20' : 'bg-blue-50 text-blue-700 ring-blue-600/20'}">
                                    {roadmap.is_course_related ? 'Academic' : 'Personal'}
                                </span>
                            {/if}
                        </div>

                        <h3 class="text-lg font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                            {roadmap.title.length > 60 ? roadmap.title.slice(0, 60) + "…" : roadmap.title}
                        </h3>
                        
                        {#if roadmap.course?.title}
                            <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                📚 {roadmap.course.title}
                            </p>
                        {/if}
                    </div>

                    <div class="mt-6 pt-4 border-t border-gray-100/50">
                        {#if roadmap.progress}
                            <div class="flex justify-between items-end mb-2">
                                <span class="text-xs font-medium text-gray-500">Progress</span>
                                <span class="text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                    {roadmap.xp ?? 0} XP
                                </span>
                            </div>
                            
                            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                                    style="width: {Math.min(Object.values(roadmap.progress).filter(Boolean).length / Object.keys(roadmap.progress).length * 100 || 0, 100)}%">
                                </div>
                            </div>
                            
                            <p class="mt-2 text-xs text-gray-400">
                                {Object.values(roadmap.progress).filter(Boolean).length} of {Object.keys(roadmap.progress).length} modules completed
                            </p>
                        {/if}
                    </div>
                </a>
                {/each}
            </div>
        </div>
        {/if}
    {/each}
</div>