<script>
    import { user } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import LandingFeatureCard from "$lib/components/landingFeatureCard.svelte";
    import Button from "$lib/components/Button.svelte";
    import Navbar from "$lib/components/Navbar.svelte";
    import { fade, fly } from 'svelte/transition';

    // Features Data
    const features = [
        { title: "Course Manager", description: "Organize syllabi & materials with AI insights.", icon: "📚", href: "/courses", color: "from-blue-500/20 to-cyan-500/20 text-blue-600" },
        { title: "AI Roadmaps", description: "Generate personalized study paths instantly.", icon: "🗺️", href: "/roadmaps", color: "from-purple-500/20 to-pink-500/20 text-purple-600" },
        { title: "Focus Timer", description: "Pomodoro timer with deep focus analytics.", icon: "⏱️", href: "/pomodoro", color: "from-amber-500/20 to-orange-500/20 text-amber-600" },
        { title: "Smart Flashcards", description: "AI-generated active recall decks.", icon: "🧠", href: "/flashcards", color: "from-emerald-500/20 to-teal-500/20 text-emerald-600" },
        { title: "Analytics", description: "Visualize your habits and growth.", icon: "📊", href: "/analytics", color: "from-indigo-500/20 to-violet-500/20 text-indigo-600" },
        { title: "Task Board", description: "Kanban-style assignment tracking.", icon: "📝", href: "/tasks", color: "from-rose-500/20 to-red-500/20 text-rose-600" }
    ];

    // Get user name safely
    let userName = $derived($user?.user_metadata?.full_name?.split(' ')[0] || 'Scholar');
</script>

{#if !$user}
    <Navbar />

    <div class="min-h-screen relative overflow-hidden bg-gray-50">
        
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-300/20 blur-[120px] mix-blend-multiply animate-blob"></div>
            <div class="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-300/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
            <div class="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-pink-300/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
            <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        <div class="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
            
            <div in:fly={{ y: 20, duration: 800 }} class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-indigo-100 shadow-sm mb-8">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span class="text-xs font-bold text-indigo-900 tracking-wide uppercase">The Future of Learning</span>
            </div>

            <h1 class="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-gray-900 leading-[1.1] mb-8">
                Supercharge your <br class="hidden md:block" />
                <span class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative">
                    Study Workflow.
                    <svg class="absolute w-full h-3 -bottom-1 left-0 text-indigo-300/50 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
                    </svg>
                </span>
            </h1>

            <p class="max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed mb-12">
                Atheno combines AI roadmaps, spaced repetition, and deep work tools into one beautiful OS for your education.
            </p>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button href="/auth?mode=signup" variant="primary" text="Start for Free" />
                <Button href="#features" variant="secondary" text="See how it works" />
            </div>
        </div>

        <section id="features" class="py-24 px-6 max-w-7xl mx-auto relative z-10">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Everything you need to excel.</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each features as f, i}
                    <div class="group relative p-1 rounded-3xl bg-gradient-to-b from-white/60 to-white/20 backdrop-blur-xl border border-white/50 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                        <div class="absolute inset-0 bg-gradient-to-br {f.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500"></div>
                        <div class="relative h-full bg-white/50 rounded-[20px] p-8 flex flex-col items-start">
                            <div class="text-4xl mb-4 filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                            <h3 class="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                            <p class="text-gray-600 leading-relaxed">{f.description}</p>
                        </div>
                    </div>
                {/each}
            </div>
        </section>

        <footer class="py-12 text-center text-gray-400 text-sm relative z-10">
            <p>&copy; {new Date().getFullYear()} Atheno. Crafted for the curious.</p>
        </footer>
    </div>

{:else}
    <div class="min-h-screen p-6 md:p-10 max-w-7xl mx-auto pb-32">
        
        <div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            <div class="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-indigo-200/20 rounded-full blur-[100px] mix-blend-multiply"></div>
            <div class="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-purple-200/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        </div>

        <header class="mb-12 animate-fade-up">
            <h1 class="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">
                Hello, <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{userName}</span> 👋
            </h1>
            <p class="text-lg text-gray-500 font-medium">What would you like to focus on today?</p>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {#each features as item, i}
                <button
                    onclick={() => goto(item.href)}
                    class="group relative flex flex-col text-left h-full p-6 rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/60 shadow-sm 
                           transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white/80 overflow-hidden animate-fade-up"
                    style="animation-delay: {i * 50}ms"
                >
                    <div class="absolute inset-0 bg-gradient-to-br {item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                    
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%] transition-all duration-1000 pointer-events-none"></div>

                    <div class="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10">
                        {item.icon}
                    </div>

                    <div class="relative z-10">
                        <h3 class="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
                            {item.title}
                        </h3>
                        <p class="text-sm text-gray-500 font-medium leading-relaxed">
                            {item.description}
                        </p>
                    </div>

                    <div class="absolute top-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-gray-400">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </button>
            {/each}

        </div>
    </div>
{/if}