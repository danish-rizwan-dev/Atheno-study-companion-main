<script>
    import Sidebar from "$lib/components/sidebar.svelte";
    import { user } from '$lib/stores/auth';
    import { supabase } from '$lib/supabase';
    import { goto } from "$app/navigation";
    import LandingFeatureCard from "$lib/components/landingFeatureCard.svelte";
    import Button from "$lib/components/Button.svelte";
    import Navbar from "$lib/components/Navbar.svelte";

    let features = [
        { title: "Smart Course Management", alt_title: "Course Management", description: "Organize your courses, syllabi, and materials in one place with AI-powered insights.", icon: "📚", href: "/courses" },
        { title: "AI Learning Roadmaps", alt_title: "Your Roadmaps", description: "Generate personalized study paths from your course materials and track your progress.", icon: "🗺️", href: "/roadmaps" },
        { title: "Smart Study Timer", alt_title: "Pomodoro Timer", description: "Stay focused with our Pomodoro timer and get insights into your study patterns.", icon: "⏱️", href: "/pomodoro" },
        { title: "Intelligent Flashcards", alt_title: "Your Flashcards", description: "Create and review flashcards with AI-generated questions to enhance retention.", icon: "🧠", href: "/flashcards" },
        { title: "Productivity Analytics", alt_title: "Your Analytics", description: "Get insights into your study habits and improve your productivity over time.", icon: "📊", href: "/analytics" },
        { title : "Task Management", alt_title: "Your Tasks", description: "Organize your tasks and assignments with a built-in task manager.", icon: "📝", href: "/tasks" }
    ];
</script>
<Navbar />

{#if !$user}
<div class="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 relative overflow-hidden">
    
    <!-- Animated blobs background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-20 -left-20 h-96 w-96 bg-indigo-400/30 blur-3xl rounded-full animate-blob"></div>
        <div class="absolute top-40 -right-20 h-96 w-96 bg-purple-400/30 blur-3xl rounded-full animate-blob animation-delay-2000"></div>
        <div class="absolute bottom-0 left-1/3 h-96 w-96 bg-pink-400/20 blur-3xl rounded-full animate-blob animation-delay-4000"></div>
    </div>

    <!-- Hero section -->
    <div class="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 text-center">
        <h1 class="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
            Atheno
            <span class="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Personalised AI-Powered Learning Companion
            </span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Transform your learning experience with smart course management, AI-generated study roadmaps,
            intelligent flashcards, and powerful productivity analytics.
        </p>

        <div class="mt-10 flex items-center justify-center gap-6">
            <Button href={'/auth'} variant="primary" text="Get Started" />
            <Button href={'#features'} variant="secondary" text="Explore Features" />
        </div>

        <!-- subtle bounce scroll indicator -->
        <div class="mt-20 flex justify-center animate-bounce text-indigo-600 font-semibold">
            ↓ Explore Features
        </div>
    </div>

    <!-- Glass feature section -->
    <section id="features" class="py-24 backdrop-blur-[2px]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 class="text-center text-4xl font-semibold mb-16 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Everything you need to level up your learning
            </h2>

            <div class="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                {#each features as feature, i}
                    <div class="opacity-0 animate-fade-up" style="animation-delay: {i * 120}ms">
                        <LandingFeatureCard title={feature.title} description={feature.description} icon={feature.icon} />
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 relative z-10">
        <p class="text-center text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none">
            <b>Atheno</b> — made with ❤️ by Danish • {new Date().getFullYear()}
        </p>
    </footer>
</div>

{:else}
<!-- Signed-in landing -->
<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-gray-900">
        Welcome back 👋
    </h1>
    <p class="mt-1 text-gray-600">
        Continue your learning journey from where you left off.
    </p>

    <div class="grid grid-cols-1 gap-6 mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {#each features as ft}
            <button class="transition duration-300 hover:scale-[1.03]" on:click={() => goto(ft.href)}>
                <LandingFeatureCard title={ft.alt_title} icon={ft.icon}/>
            </button>
        {/each}
    </div>
</div>
{/if}
