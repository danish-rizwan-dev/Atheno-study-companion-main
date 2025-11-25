<script>
    import { page } from '$app/stores';
    import { user } from '$lib/stores/auth';
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { requestQueue } from '$lib/utils/queue';
    import { fade, slide } from 'svelte/transition';

    // --- State (Runes) ---
    let isSidebarOpen = $state(false);
    
    const navItems = [
        { href: '/dashboard', label: 'Dashboard', path: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
        { href: '/courses', label: 'Courses', path: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
        { href: '/roadmaps', label: 'Roadmaps', path: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z' },
        { href: '/flashcards', label: 'Flashcards', path: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99' },
        { href: '/tasks', label: 'Tasks', path: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z' },
        { href: '/pomodoro', label: 'Pomodoro', path: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
        { href: '/study-logs', label: 'Study Logs', path: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
        { href: '/analytics', label: 'Analytics', path: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z' }
    ];

    let activeIndex = $derived(navItems.findIndex(i => i.href === $page.url.pathname));
    let pendingChanges = $derived($requestQueue.length);

    const toggleSidebar = () => (isSidebarOpen = !isSidebarOpen);

    async function handleSignOut() {
        await supabase.auth.signOut();
        goto('/');
    }
</script>

{#if !isSidebarOpen}
<button
    transition:fade={{ duration: 150 }}
    class="fixed top-4 left-4 z-[60] md:hidden p-2.5 rounded-xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg text-indigo-600 transition-transform active:scale-95"
    onclick={toggleSidebar}
>
    <span class="text-xl font-bold">☰</span>
</button>
{/if}

{#if isSidebarOpen}
    <div 
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 z-40 bg-indigo-950/20 backdrop-blur-sm md:hidden" 
        onclick={toggleSidebar}
    ></div>
{/if}

<aside class={`fixed top-0 left-0 z-50 w-64 h-[100dvh] transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1)
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
    
    <div class="relative h-full w-full flex flex-col bg-white/70 backdrop-blur-2xl border-r border-white/40 shadow-[8px_0_40px_rgba(0,0,0,0.03)]">
        
        <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none"></div>

        <div class="relative z-10 flex h-24 items-center justify-between px-7 shrink-0">
            <div class="flex items-center gap-3 group">
                <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                    <span class="text-white font-black text-lg tracking-tighter">A</span>
                </div>
                <h1 class="text-2xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">
                    Atheno
                </h1>
            </div>
            <button class="md:hidden text-gray-500 hover:text-indigo-600" onclick={toggleSidebar}>
                 ✕
            </button>
        </div>

        <nav class="relative flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
            {#each navItems as { href, label, path }, i}
                {@const isActive = $page.url.pathname === href}
                
                <a
                    {href}
                    onclick={() => (isSidebarOpen = false)}
                    class="group relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 overflow-hidden
                    {isActive ? 'bg-white shadow-sm border border-indigo-100/50' : 'hover:bg-white/50 hover:shadow-sm border border-transparent'}"
                >
                    <span class="relative z-10 transition-transform duration-300 group-hover:scale-110
                        {isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={isActive ? 2 : 1.5}>
                            <path stroke-linecap="round" stroke-linejoin="round" d={path} />
                        </svg>
                    </span>

                    <span class="relative z-10 text-[14px] font-medium tracking-wide transition-colors duration-300
                        {isActive ? 'text-gray-900 font-bold' : 'text-gray-600 group-hover:text-gray-900'}">
                        {label}
                    </span>

                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 -translate-x-[100%] group-hover:opacity-100 group-hover:translate-x-[100%] transition-all duration-1000 pointer-events-none"></div>
                    
                    {#if isActive}
                        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                    {/if}
                </a>
            {/each}
        </nav>

        <div class="relative z-10 p-4 shrink-0 pb-8 md:pb-4"> {#if pendingChanges > 0}
                <div transition:slide class="mb-3 px-4 py-2.5 rounded-xl bg-amber-50/80 border border-amber-100 text-amber-700 text-[11px] font-bold flex items-center gap-2.5 shadow-sm backdrop-blur-sm">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Syncing data...
                </div>
            {/if}

            <div class="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/70 to-white/40 border border-white/60 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/80">
                
                <div class="absolute -right-6 -top-6 h-20 w-20 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>

                <div class="flex items-center gap-3 relative z-10">
                    <div class="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border border-white/20">
                        <span class="font-bold text-sm tracking-wide">
                            {$user?.email?.[0]?.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <p class="text-xs font-extrabold text-gray-900 truncate tracking-tight">
                            {$user?.user_metadata?.full_name || 'Scholar'}
                        </p>
                        <p class="text-[10px] font-medium text-gray-400 truncate">
                             {$user?.email}
                        </p>
                    </div>

                    <button 
                        onclick={handleSignOut}
                        class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Sign Out"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                             <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                         </svg>
                    </button>
                </div>
            </div>
        </div>

    </div>
</aside>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>