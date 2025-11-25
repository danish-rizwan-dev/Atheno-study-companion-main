<script>
    import { user } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { slide, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    let mobileOpen = $state(false);

    // ✅ Correct Links for multi-page routing
    const navItems = [
        { name: 'Features', href: '/#features' }, // Keeps anchor for Home
        { name: 'About', href: '/about' },        // Points to About Page
        { name: 'Contact', href: '/contact' }     // Points to Contact Page
    ];
</script>

<!-- Only hide navbar if the user is LOGGED IN -->
{#if !$user}
    <nav 
        transition:fade
        class="fixed top-0 left-0 right-0 z-50 border-b border-white/40 bg-white/70 shadow-sm backdrop-blur-2xl transition-all duration-300"
    >
        <div class="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 lg:px-10">
            
            <!-- Brand -->
            <div class="flex cursor-pointer items-center gap-3 select-none group" onclick={() => goto('/')}>
                <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
                    <span class="text-white font-black text-lg">A</span>
                </div>
                <span class="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-black tracking-tight text-transparent group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                    Atheno
                </span>
            </div>

            <!-- Desktop Navigation -->
            <div class="hidden items-center gap-10 lg:flex">
                {#each navItems as item}
                    <a
                        href={item.href}
                        class="relative text-base font-bold text-gray-600 transition-colors hover:text-indigo-600 py-2 group"
                    >
                        {item.name}
                        <!-- Hover Dot (Only shows on hover) -->
                        <span class="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-indigo-600 opacity-0 transition-all duration-300 group-hover:opacity-100"></span>
                    </a>
                {/each}
            </div>

            <!-- Desktop Actions -->
            <div class="hidden items-center gap-6 lg:flex">
                <!-- Login Link -->
                <a href="/auth?mode=login" 
                    class="text-base font-bold text-gray-600 hover:text-indigo-600 transition">
                    Log in
                </a>
                
                <!-- CTA Button -->
                <a href="/auth?mode=signup"
                   class="group relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-2.5 text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95">
                    <span class="relative z-10 font-bold text-sm tracking-wide">Get Started</span>
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </a>
            </div>

            <!-- Mobile Menu Toggle -->
            <button 
                class="lg:hidden p-2 text-gray-600 hover:text-indigo-600 transition" 
                onclick={() => (mobileOpen = !mobileOpen)}
            >
                <span class="text-3xl">{mobileOpen ? '✕' : '☰'}</span>
            </button>
        </div>

        <!-- Mobile Menu -->
        {#if mobileOpen}
            <div 
                transition:slide={{ duration: 300, easing: quintOut }}
                class="lg:hidden border-t border-white/50 bg-white/90 backdrop-blur-3xl shadow-2xl absolute w-full left-0 h-screen"
            >
                <div class="flex flex-col p-8 space-y-6">
                    {#each navItems as item}
                        <a
                            href={item.href}
                            class="block text-xl font-bold text-gray-800 hover:text-indigo-600 transition"
                            onclick={() => (mobileOpen = false)}
                        >
                            {item.name}
                        </a>
                    {/each}

                    <div class="h-px w-full bg-gray-200 my-4"></div>

                    <div class="flex flex-col gap-4">
                        <a href="/auth?mode=login" onclick={() => mobileOpen = false}
                           class="w-full rounded-xl border-2 border-gray-200 py-3 text-center text-lg font-bold text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition">
                            Log in
                        </a>
                        <a href="/auth?mode=signup" onclick={() => mobileOpen = false}
                           class="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-center text-lg font-bold text-white shadow-lg transition active:scale-95">
                            Get Started
                        </a>
                    </div>
                </div>
            </div>
        {/if}
    </nav>
{/if}