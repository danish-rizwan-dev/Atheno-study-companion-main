<script>
    import Navbar from '$lib/components/navbar.svelte';
    import Button from '$lib/components/Button.svelte';
    import { fade } from 'svelte/transition';
</script>

<Navbar />

<!-- Ambient Background -->
<div class="fixed inset-0 -z-10 overflow-hidden bg-gray-50">
    <div class="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob"></div>
    <div class="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-300/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-blob animation-delay-4000"></div>
    <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
</div>

<div class="relative pt-32 pb-20 px-6 max-w-5xl mx-auto">

    <!-- 📜 Our Mission -->
    <div class="text-center mb-24 animate-fade-up">
        <span class="inline-block py-1 px-3 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
            Our Mission
        </span>
        <h1 class="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 mb-6">
            We believe studying should be <br class="hidden md:block" />
            <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                intelligent, not exhausting.
            </span>
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Atheno was built to end the fragmentation of student life. No more jumping between five different apps just to get through a single lecture.
        </p>
    </div>

    <!-- 💡 The Story -->
    <div class="grid md:grid-cols-2 gap-12 items-center mb-32 animate-fade-up" style="animation-delay: 100ms">
        <div class="relative">
            <!-- Decor -->
            <div class="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur-lg opacity-20"></div>
            
            <!-- Image / Graphic Placeholder -->
            <div class="relative aspect-square rounded-[2rem] bg-white/80 backdrop-blur-2xl border border-white/50 shadow-xl overflow-hidden flex items-center justify-center">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"></div>
                <div class="text-center p-8 relative z-10">
                    <span class="text-6xl mb-4 block">🧩</span>
                    <h3 class="text-2xl font-bold text-gray-900">The "Context Switch" Problem</h3>
                    <p class="text-sm text-gray-500 mt-2">Notes • Flashcards • Timers • Todo Lists</p>
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <h2 class="text-3xl font-bold text-gray-900">Why we built Atheno</h2>
            <div class="prose prose-lg text-gray-600">
                <p>
                    Every student knows the struggle: You have your syllabus in a PDF, your tasks in a to-do app, your flashcards in another tool, and your focus timer on your phone.
                </p>
                <p>
                    This fragmentation creates <strong>"Analysis Paralysis"</strong>. Instead of learning, you spend half your energy just managing your tools.
                </p>
                <p>
                    We asked a simple question: <span class="text-indigo-700 font-semibold">What if your study operating system could think for you?</span> What if it could read your syllabus and tell you exactly what to do next?
                </p>
            </div>
        </div>
    </div>

    <!-- 🛠️ The Tech Stack -->
    <div class="mb-32 animate-fade-up" style="animation-delay: 200ms">
        <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900">Built on the Bleeding Edge</h2>
            <p class="text-gray-500 mt-2">Powered by the latest web technologies for speed and resilience.</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each [
                { title: 'Svelte 5', desc: 'Next-gen Reactivity', icon: '🔥', color: 'text-orange-500', bg: 'bg-orange-50' },
                { title: 'Gemini 2.5', desc: 'Generative AI Model', icon: '✨', color: 'text-blue-500', bg: 'bg-blue-50' },
                { title: 'Supabase', desc: 'Realtime Database', icon: '⚡', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { title: 'Offline First', desc: 'Robust Sync Engine', icon: '📡', color: 'text-purple-500', bg: 'bg-purple-50' }
            ] as tech}
                <div class="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 text-center group">
                    <div class="w-12 h-12 mx-auto rounded-xl {tech.bg} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                        {tech.icon}
                    </div>
                    <h3 class="font-bold text-gray-900">{tech.title}</h3>
                    <p class="text-xs text-gray-500 mt-1">{tech.desc}</p>
                </div>
            {/each}
        </div>
    </div>

    <!-- 👨‍💻 The Creator -->
    <div class="relative rounded-[2.5rem] bg-gray-900 overflow-hidden shadow-2xl animate-fade-up" style="animation-delay: 300ms">
        <!-- Glow effects -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-[80px]"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-[80px]"></div>

        <div class="relative z-10 p-12 md:p-16 text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold shadow-xl mb-6 border-4 border-gray-800">
                D
            </div>
            
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Crafted by Danish</h2>
            <p class="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed mb-8">
                "I built Atheno because I wanted a tool that respected my time. It's not just about features; it's about creating a space where focus happens naturally."
            </p>

            <div class="flex justify-center gap-4">
                <Button href="https://github.com/danish-rizwan-dev" variant="primary" text="Follow on GitHub" target="_blank" />
                <Button href="/contact" variant="secondary" text="Get in Touch" class="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20" />
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="mt-20 text-center border-t border-gray-200/50 pt-8">
        <p class="text-sm text-gray-500">
            © {new Date().getFullYear()} Atheno. All rights reserved.
        </p>
    </footer>

</div>