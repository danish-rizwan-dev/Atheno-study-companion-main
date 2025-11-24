<script>
  import { page } from '$app/stores';
  import { user } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { requestQueue } from '$lib/utils/queue';

  let isSidebarOpen = false;
  const toggleSidebar = () => (isSidebarOpen = !isSidebarOpen);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/courses', label: 'Courses', icon: '📚' },
    { href: '/roadmaps', label: 'Roadmaps', icon: '🗺️' },
    { href: '/flashcards', label: 'Flashcards', icon: '🎴' },
    { href: '/tasks', label: 'Tasks', icon: '📝' },
    { href: '/pomodoro', label: 'Pomodoro', icon: '⏱️' },
    { href: '/study-logs', label: 'Study Logs', icon: '📈' },
    { href: '/analytics', label: 'Analytics', icon: '📊' }
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    goto('/');
  }

  $: pendingChanges = $requestQueue.length;
</script>

<!-- Mobile Toggle -->
<button
  class="fixed top-4 left-4 z-[60] md:hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2.5 rounded-lg shadow-lg transition hover:scale-105 active:scale-95"
  on:click={toggleSidebar}
>
  {isSidebarOpen ? '✕' : '☰'}
</button>

<!-- Sidebar Wrapper -->
<div class={`fixed inset-y-0 left-0 z-50 transition-transform duration-500 ease-out
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
  
  <aside
    class="relative h-full w-64 flex flex-col backdrop-blur-2xl bg-white/60 shadow-[0_0_40px_rgba(0,0,0,0.14)] border-r border-white/40 overflow-hidden"
  >
    <!-- subtle glass layer -->
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-white/10 to-transparent"></div>

    <!-- Brand -->
    <div class="flex h-20 items-center justify-center border-b border-white/40 select-none">
      <h1
        class="text-[1.8rem] font-extrabold tracking-wide bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(99,102,241,0.35)]"
      >
        Atheno
      </h1>
    </div>

    <!-- Navigation -->
    <nav class="relative flex-1 px-5 pt-4 space-y-1 overflow-y-auto">

      <!-- Active sliding indicator bar -->
      <div
        class="absolute left-0 w-[6px] rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500 shadow-md transition-all duration-500"
        style={`height: 46px; transform: translateY(calc(${navItems.findIndex(i => i.href === $page.url.pathname)} * 51px));`}
      ></div>

      {#each navItems as { href, label, icon }, i}
        <a
          href={href}
          on:click={() => (isSidebarOpen = false)}
          class={`group flex items-center gap-4 ps-6 pe-4 py-3 rounded-xl relative transition-all duration-300 overflow-hidden
          ${$page.url.pathname === href ? 'text-indigo-700 font-semibold' : 'text-gray-700 hover:text-indigo-600'}`}
          style="height: 51px"
        >
          <span class="text-[1.4rem] transition-all group-hover:scale-[1.15]">{icon}</span>
          <span class="text-[0.97rem]">{label}</span>

          <span class="absolute inset-0 opacity-0 group-hover:opacity-[0.25] bg-gradient-to-r from-transparent via-white to-transparent rounded-xl transition"></span>
        </a>
      {/each}
    </nav>

    <!-- Pending Queue Indicator -->
    {#if pendingChanges > 0}
      <div class="mx-5 mt-3 mb-4 rounded-xl bg-yellow-100 border border-yellow-300 p-3 text-yellow-800 font-semibold shadow-sm text-sm flex items-center gap-2 animate-pulse">
        ⏳ {pendingChanges} pending change{pendingChanges === 1 ? '' : 's'}
      </div>
    {/if}

    <!-- User -->
    <div class="mt-auto p-6 border-t border-white/40 bg-white/50 backdrop-blur-md">
      <div class="flex items-center gap-4">
        <div class="h-11 w-11 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-200 to-purple-300 shadow-md border border-white/60 ring-2 ring-indigo-300/50">
          <span class="text-sm font-bold text-indigo-700">
            {$user?.email?.[0]?.toUpperCase()}
          </span>
        </div>

        <div class="flex-1">
          <p class="text-sm font-semibold text-gray-800 truncate">{$user?.email}</p>
          <button on:click={handleSignOut}
            class="text-xs text-gray-500 hover:text-indigo-600 transition underline-offset-2 hover:underline">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </aside>
</div>

<!-- Mobile Overlay -->
{#if isSidebarOpen}
  <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" on:click={toggleSidebar}></div>
{/if}
