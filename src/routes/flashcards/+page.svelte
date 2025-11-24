<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { user } from '$lib/stores/auth';
    import { supabase } from '$lib/supabase';
    import { courses } from '$lib/stores/data';
    import { generateFlashcards } from '$lib/utils/ai';
    import { fade, fly, slide, scale } from 'svelte/transition';
    import { quintOut, elasticOut } from 'svelte/easing';

    // State (Runes)
    let loading = $state(false);
    let error = $state(null);
    let showForm = $state(false);
    let studyMode = $state(false);
    let currentIndex = $state(0);
    let showAnswer = $state(false);

    // Form data
    let title = $state('');
    let topic = $state('');
    let content = $state('');
    let selectedCourseId = $state('');
    let difficulty = $state('beginner');
    let numCards = $state(10);
    let generatingCards = $state(false);

    // Flashcard sets and current cards
    let flashcardSets = $state([]);
    let currentCards = $state([]);

    function isPublicRoute(path) {
        return ['/', '/auth'].includes(path);
    }

    onMount(() => {
        const unsubscribe = user.subscribe(($user) => {
            if (!$user && !loading && !isPublicRoute($page.url.pathname)) {
                goto('/');
            }
        });
        loadFlashcardSets();
        return () => unsubscribe();
    });

    async function loadFlashcardSets() {
        try {
            loading = true;
            const { data, error: err } = await supabase
                .from('flashcard_sets')
                .select(`*, course:courses(id, title), flashcards(*)`)
                .eq('user_id', $user.id)
                .order('created_at', { ascending: false });

            if (err) throw err;
            flashcardSets = data;
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function generateFlashcardSet() {
        if (!title || !topic) {
            error = "Please provide a title and a topic";
            return;
        }
        try {
            generatingCards = true;
            error = null;

            let cards = await generateFlashcards(topic, content, difficulty, numCards);
            cards.flashcards = cards.flashcards.slice(0, numCards);
            const cardData = cards.flashcards;

            const { data: set, error: setErr } = await supabase
                .from('flashcard_sets')
                .insert({
                    user_id: $user.id,
                    title,
                    topic,
                    course_id: selectedCourseId || null,
                    description: content || null,
                    num_cards: numCards
                })
                .select()
                .single();

            if (setErr) throw setErr;

            for (const card of cardData) {
                const { error: cardErr } = await supabase
                    .from('flashcards')
                    .insert({
                        set_id: set.id,
                        front_content: card.front_content,
                        back_content: card.back_content,
                        hint: card.hint,
                    });
                if (cardErr) throw cardErr;
            }

            // Reset
            title = ''; topic = ''; content = ''; selectedCourseId = '';
            difficulty = 'beginner'; numCards = 10; showForm = false;
            await loadFlashcardSets();
        } catch (err) {
            error = err.message;
        } finally {
            generatingCards = false;
        }
    }

    function startStudying(setId) {
        const set = flashcardSets.find(s => s.id === setId);
        if (set?.flashcards?.length) {
            currentCards = [...set.flashcards].sort(() => Math.random() - 0.5);
            currentIndex = 0;
            showAnswer = false;
            studyMode = true;
        }
    }

    function nextCard() {
        if (currentIndex < currentCards.length - 1) {
            showAnswer = false; // Flip back first
            setTimeout(() => currentIndex++, 200); // Wait for flip
        } else {
            studyMode = false;
        }
    }

    function prevCard() {
        if (currentIndex > 0) {
            showAnswer = false;
            setTimeout(() => currentIndex--, 200);
        }
    }

    async function deleteSet(id) {
        if (!confirm('Delete this flashcard set?')) return;
        try {
            const { error: err } = await supabase.from('flashcard_sets').delete().eq('id', id);
            if (err) throw err;
            flashcardSets = flashcardSets.filter(set => set.id !== id);
        } catch (err) {
            error = err.message;
        }
    }
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div class="absolute top-0 right-1/4 w-96 h-96 bg-yellow-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
    <div class="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
    <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
</div>

<div class="space-y-8 px-2 sm:px-0 pb-20 max-w-6xl mx-auto">

    {#if !studyMode}
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
        <div>
            <h1 class="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Flashcards
            </h1>
            <p class="mt-2 text-gray-600 text-lg">
                AI-powered spaced repetition for rapid learning.
            </p>
        </div>
        <button
            onclick={() => showForm = !showForm}
            class="group relative inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white transition-all duration-200 bg-gray-900 rounded-full hover:shadow-lg hover:-translate-y-0.5"
        >
            {showForm ? 'Close Designer' : '✨ Create New Deck'}
        </button>
    </div>
    {/if}

    {#if error}
        <div transition:slide class="rounded-xl bg-red-50/90 backdrop-blur border border-red-200 p-4 text-red-700 flex items-center gap-3">
            <span>⚠️</span> {error}
        </div>
    {/if}

    {#if showForm}
    <div transition:slide={{duration:400, easing:quintOut}} class="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl p-6 md:p-8 animate-fade-up">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>

        <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 relative z-10">
            <span class="text-2xl">🪄</span> Deck Designer
        </h2>

        <div class="space-y-6 relative z-10">
            <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Deck Title</label>
                    <input bind:value={title} placeholder="e.g., Biochemistry 101" 
                        class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"/>
                </div>
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Link Course (Optional)</label>
                    <select bind:value={selectedCourseId} class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all">
                        <option value="">Independent Deck</option>
                        {#each $courses as course}
                            <option value={course.id}>{course.title}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Difficulty</label>
                    <div class="grid grid-cols-3 gap-2">
                        {#each ['beginner', 'intermediate', 'advanced'] as level}
                            <button 
                                onclick={() => difficulty = level}
                                class="px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize
                                {difficulty === level 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-white/50 text-gray-600 hover:bg-white border border-transparent hover:border-indigo-100'}">
                                {level}
                            </button>
                        {/each}
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="text-sm font-semibold text-gray-700 ml-1">Card Count: {numCards}</label>
                    <input type="range" min="5" max="20" bind:value={numCards} class="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                </div>
            </div>

            <div class="space-y-2">
                <label class="text-sm font-semibold text-gray-700 ml-1">Topic or Source Material</label>
                <textarea bind:value={topic} rows="3" placeholder="Paste your notes or type a topic..." 
                    class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 shadow-sm focus:ring-2 focus:ring-indigo-200 transition-all resize-none"></textarea>
            </div>

            <div class="flex justify-end pt-2">
                <button onclick={generateFlashcardSet} disabled={generatingCards || !title || !topic}
                    class="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {#if generatingCards}
                        <span class="flex items-center gap-2">
                            <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                            Generating...
                        </span>
                    {:else}
                        Generate Cards ✨
                    {/if}
                </button>
            </div>
        </div>
    </div>
    {/if}

    {#if studyMode && currentCards.length}
        <div transition:scale={{start:0.95, duration:300}} class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-100/90 backdrop-blur-xl p-4">
            
            <div class="absolute top-6 left-6 right-6 flex justify-between items-center max-w-4xl mx-auto w-full">
                <div class="flex flex-col">
                    <h2 class="text-lg font-bold text-gray-900">Studying</h2>
                    <span class="text-sm text-gray-500">Card {currentIndex + 1} / {currentCards.length}</span>
                </div>
                <button onclick={() => studyMode = false} class="p-2 rounded-full bg-white/80 hover:bg-red-50 text-gray-500 hover:text-red-600 transition shadow-sm">
                    ✕ <span class="sr-only">Exit</span>
                </button>
            </div>

            <div class="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-300" style="width: {((currentIndex + 1) / currentCards.length) * 100}%"></div>

            <div class="perspective-container w-full max-w-2xl h-[400px] cursor-pointer group" onclick={() => showAnswer = !showAnswer}>
                <div class="card-inner relative w-full h-full transition-transform duration-500 transform-style-3d {showAnswer ? 'rotate-y-180' : ''}">
                    
                    <div class="card-face absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-white shadow-2xl flex flex-col items-center justify-center p-10 border border-gray-100">
                        <span class="absolute top-6 left-6 text-xs font-bold tracking-widest text-indigo-400 uppercase">Question</span>
                        <p class="text-2xl md:text-3xl font-medium text-gray-800 text-center leading-relaxed">
                            {currentCards[currentIndex].front_content}
                        </p>
                        {#if currentCards[currentIndex].hint}
                            <p class="mt-6 text-sm text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity">
                                💡 Hint available
                            </p>
                        {/if}
                        <span class="absolute bottom-6 text-gray-400 text-sm opacity-50">Click to flip</span>
                    </div>

                    <div class="card-face card-back absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl flex flex-col items-center justify-center p-10 text-white rotate-y-180">
                        <span class="absolute top-6 left-6 text-xs font-bold tracking-widest text-white/60 uppercase">Answer</span>
                        <p class="text-xl md:text-2xl font-medium text-center leading-relaxed">
                            {currentCards[currentIndex].back_content}
                        </p>
                    </div>

                </div>
            </div>

            <div class="mt-10 flex items-center gap-6">
                <button onclick={prevCard} disabled={currentIndex === 0}
                    class="p-4 rounded-full bg-white shadow-lg text-gray-600 hover:text-indigo-600 hover:scale-110 transition disabled:opacity-30 disabled:hover:scale-100">
                    ←
                </button>

                <button onclick={() => showAnswer = !showAnswer}
                    class="px-8 py-3 rounded-full bg-white shadow-lg font-semibold text-gray-800 hover:bg-gray-50 transition min-w-[140px]">
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>

                <button onclick={nextCard}
                    class="p-4 rounded-full bg-white shadow-lg text-gray-600 hover:text-indigo-600 hover:scale-110 transition">
                    {currentIndex === currentCards.length - 1 ? 'Finish' : '→'}
                </button>
            </div>

        </div>
    {/if}

    {#if !studyMode}
        {#if loading}
             <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {#each Array(3) as _}
                    <div class="h-48 rounded-2xl bg-white/40 animate-pulse"></div>
                {/each}
            </div>
        {:else if flashcardSets.length === 0}
            <div class="rounded-3xl border border-dashed border-gray-300 bg-white/30 p-12 text-center">
                <div class="text-4xl mb-4">📇</div>
                <h3 class="text-xl font-bold text-gray-900">No decks found</h3>
                <p class="mt-2 text-gray-500">Create your first AI flashcard deck to start learning.</p>
            </div>
        {:else}
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {#each flashcardSets as set, i (set.id)}
                    <div class="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl p-6 flex flex-col justify-between h-full animate-fade-up"
                        style="animation-delay: {i * 100}ms">
                        
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%] transition duration-[1.2s] pointer-events-none z-10"></div>

                        <button onclick={(e) => { e.stopPropagation(); deleteSet(set.id); }}
                            class="absolute top-4 right-4 p-2 rounded-lg bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition z-20">
                            🗑️
                        </button>

                        <div>
                            <div class="flex gap-2 mb-3">
                                <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-600/20">
                                    {set.flashcards?.length || 0} Cards
                                </span>
                                {#if set.course}
                                    <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-purple-50 text-purple-700 ring-purple-600/20">
                                        📚 {set.course.title}
                                    </span>
                                {/if}
                            </div>
                            
                            <h3 class="text-xl font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                                {set.title}
                            </h3>
                            <p class="text-sm text-gray-500 mt-2 line-clamp-2">
                                {set.description || "No description provided."}
                            </p>
                        </div>

                        <div class="mt-6 pt-4 border-t border-gray-100/50 flex items-center justify-between">
                            <span class="text-xs text-gray-400">
                                {new Date(set.created_at).toLocaleDateString()}
                            </span>
                            <button onclick={() => startStudying(set.id)}
                                class="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold shadow-md hover:bg-indigo-600 transition z-20">
                                Study Now →
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style>
    /* 3D Flip Mechanics */
    .perspective-container {
        perspective: 1000px;
    }
    .transform-style-3d {
        transform-style: preserve-3d;
    }
    .backface-hidden {
        backface-visibility: hidden;
    }
    .rotate-y-180 {
        transform: rotateY(180deg);
    }
    .card-back {
        transform: rotateY(180deg);
    }
</style>