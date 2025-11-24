<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { user } from '$lib/stores/auth';
    import { supabase } from '$lib/supabase';
    import { courses } from '$lib/stores/data';
    import { generateFlashcards } from '$lib/utils/ai';

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

    // Function to check if the current route is public
    function isPublicRoute(path) {
        return ['/', '/auth'].includes(path);
    }

    // Redirect to home if not authenticated and not on a public route
    onMount(() => {
        const unsubscribe = user.subscribe(($user) => {
            if (!$user && !isLoading && !isPublicRoute($page.url.pathname)) {
                goto('/');
            }
        });

        return () => unsubscribe();
    });

    // Load flashcard sets
    async function loadFlashcardSets() {
        try {
            loading = true;
            const { data, error: err } = await supabase
                .from('flashcard_sets')
                .select(`
                    *,
                    course:courses (
                        id,
                        title
                    ),
                    flashcards (*)
                `)
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

    // Generate flashcards
    async function generateFlashcardSet() {
        if (!title || !topic) {
            error = "Please provide a title and a topic";
            return;
        }

        try {
            generatingCards = true;
            error = null;

            // Generate flashcards using AI
            let cards = await generateFlashcards(topic, content, difficulty, numCards);
            // trim the cards to the first num_cards in case of more 
            cards.flashcards = cards.flashcards.slice(0, numCards);
            cards = cards.flashcards
            // console.log("client side cards : ", cards.flashcards);
            // console.log("cards as arr : ", Array.isArray(cards.flashcards));
            // console.log("cards : ", Array(cards.flashcards));
            // console.log("cards obj :", Object(cards.flashcards));

            // Save flashcard set
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

            // print individual flashcards for debugging
            for (const card of cards) {
                console.log("question : ", card.front_content);
                console.log("answer : ", card.back_content);
                console.log("hint : ", card.hint);
            }

            // Save individual flashcards
            // Insert flashcards one by one
            for (const card of cards) {
                const { error: setErr } = await supabase
                    .from('flashcards')
                    .insert({
                        set_id: set.id,
                        front_content: card.front_content,
                        back_content: card.back_content,
                        hint: card.hint,
                    });

                if (setErr) throw setErr;
            }

            if (setErr) throw setErr;

            // Reset form
            title = '';
            topic = '';
            content = '';
            selectedCourseId = '';
            difficulty = 'beginner';
            numCards = 10;
            showForm = false;

            // Reload flashcard sets
            await loadFlashcardSets();
        } catch (err) {
            error = err.message;
        } finally {
            generatingCards = false;
        }
    }

    // Study mode functions
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
            currentIndex++;
            showAnswer = false;
        } else {
            studyMode = false;
        }
    }

    function prevCard() {
        if (currentIndex > 0) {
            currentIndex--;
            showAnswer = false;
        }
    }

    // Delete flashcard set
    async function deleteSet(id) {
        if (!confirm('Are you sure you want to delete this flashcard set?')) return;
        
        try {
            const { error: err } = await supabase
                .from('flashcard_sets')
                .delete()
                .eq('id', id);

            if (err) throw err;
            flashcardSets = flashcardSets.filter(set => set.id !== id);
        } catch (err) {
            error = err.message;
        }
    }

    // Load data on mount
    // onMount(() => {loadFlashcardSets()});
    onMount(loadFlashcardSets);
</script>

<div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Flashcards</h1>
            <p class="mt-1 text-sm text-gray-500">Create and study AI-generated flashcards</p>
        </div>
        <button
            onclick={() => showForm = !showForm}
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
            {showForm ? 'Cancel' : 'Create Flashcards'}
        </button>
    </div>

    {#if error}
        <div class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-700">{error}</p>
        </div>
    {/if}

    {#if showForm}
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900">Create New Flashcards</h2>
            <div class="mt-4 grid gap-6">
                <div>
                    <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        id="title"
                        bind:value={title}
                        type="text"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="e.g., Basic Mathematics"
                    />
                </div>

                <div class="grid gap-6 sm:grid-cols-2">
                    <div>
                        <label for="courseSelect" class="block text-sm font-medium text-gray-700">Course (Optional)</label>
                        <select
                            id="courseSelect"
                            bind:value={selectedCourseId}
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                            <option value="">No course</option>
                            {#each $courses as course}
                                <option value={course.id}>{course.title}</option>
                            {/each}
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
                        <label for="numCards" class="block text-sm font-medium text-gray-700">Number of Cards</label>
                        <input
                            id="numCards"
                            bind:value={numCards}
                            type="number"
                            min="1"
                            max="20"
                            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                    </div>
                </div>

                <div>
                    <label for="topic" class="block text-sm font-medium text-gray-700">Topic/Content</label>
                    <textarea
                        id="topic"
                        bind:value={topic}
                        rows="4"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Enter the topic or paste content to generate flashcards from..."
                    ></textarea>
                </div>

                <div class="flex justify-end">
                    <button
                        onclick={generateFlashcardSet}
                        disabled={generatingCards || !title || !topic}
                        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {generatingCards ? 'Generating...' : 'Generate Flashcards'}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Study Mode -->
    {#if studyMode && currentCards.length}
        <div class="rounded-lg bg-white p-6 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">Study Mode</h2>
                <button
                    onclick={() => studyMode = false}
                    class="text-sm text-gray-500 hover:text-gray-700"
                >
                    Exit
                </button>
            </div>

            <div class="min-h-[200px] rounded-lg bg-gray-50 p-6">
                <div class="mb-4 text-sm text-gray-500">
                    Card {currentIndex + 1} of {currentCards.length}
                </div>
                
                <div class="space-y-4">
                    <div class="text-lg font-medium text-gray-900">
                        {currentCards[currentIndex].front_content}
                    </div>
                    
                    {#if currentCards[currentIndex].hint && !showAnswer}
                        <div class="mt-2 text-sm text-indigo-600">
                            Hint: {currentCards[currentIndex].hint}
                        </div>
                    {/if}
                    
                    {#if showAnswer}
                        <div class="mt-4 text-gray-700">
                            {currentCards[currentIndex].back_content}
                        </div>
                    {/if}
                </div>
            </div>

            <div class="mt-6 flex items-center justify-between">
                <button
                    onclick={prevCard}
                    disabled={currentIndex === 0}
                    class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>

                <button
                    onclick={() => showAnswer = !showAnswer}
                    class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>

                <button
                    onclick={nextCard}
                    disabled={currentIndex === currentCards.length - 1}
                    class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    {currentIndex === currentCards.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    {/if}

    <!-- Flashcard Sets List -->
    {#if !studyMode}
        {#if loading}
            <div class="flex items-center justify-center py-12">
                <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            </div>
        {:else if flashcardSets.length === 0}
            <div class="rounded-lg bg-gray-50 p-8 text-center">
                <h3 class="text-lg font-medium text-gray-900">No flashcard sets yet</h3>
                <p class="mt-2 text-sm text-gray-500">
                    Create your first set of flashcards to start studying.
                </p>
            </div>
        {:else}
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {#each flashcardSets as set (set.id)}
                    <div class="group relative overflow-hidden rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100">
                            <button
                                onclick={() => deleteSet(set.id)}
                                class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                aria-label="Delete set"
                            >
                                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        
                        <h3 class="text-lg font-medium text-gray-900">{set.title}</h3>
                        {#if set.course}
                            <p class="mt-1 text-sm text-indigo-600">{set.course.title}</p>
                        {/if}
                        
                        <div class="mt-4 flex items-center justify-between">
                            <span class="text-sm text-gray-500">
                                {set.flashcards?.length || 0} cards
                            </span>
                            <button
                                onclick={() => startStudying(set.id)}
                                class="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
                            >
                                Study Now
                            </button>
                        </div>
                        
                        <div class="mt-2 text-sm text-gray-500">
                            Last studied: {set.last_reviewed ? new Date(set.last_reviewed).toLocaleDateString() : 'Never'}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</div>