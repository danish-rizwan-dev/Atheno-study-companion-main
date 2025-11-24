<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { user } from '$lib/stores/auth';
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { fade, slide, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- State (Runes) ---
    let email = $state('');
    let password = $state('');
    let loading = $state(false);
    let error = $state(null);
    let isSignUp = $state(false);
    let statusMessage = $state('');

    onMount(() => {
        if ($user) goto('/');
    });

    async function handleAuth() {
        try {
            loading = true;
            error = null;

            if (isSignUp) {
                const { error: err } = await supabase.auth.signUp({ email, password });
                if (err) throw err;
                statusMessage = 'Check your email for a confirmation link';
            } else {
                const { error: err } = await supabase.auth.signInWithPassword({ email, password });
                if (err) throw err;
                goto('/');
            }

            setTimeout(() => (statusMessage = ''), 6000);
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function handleGoogleAuth() {
        try {
            loading = true;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }
</script>

<Navbar />

<div class="fixed inset-0 -z-10 overflow-hidden bg-gray-50/50">
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
    <div class="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
</div>

<div class="flex min-h-screen items-center justify-center px-4 py-28">
    
    <div class="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative">

        <div class="hidden lg:flex flex-col justify-center space-y-8 relative p-8">
            
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-10 pointer-events-none text-indigo-600 blur-3xl">
                 <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            </div>

            <div class="relative z-10 animate-fade-up">
                <h1 class="text-5xl font-black tracking-tight text-gray-900 leading-tight">
                    Master Your <br/>
                    <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Learning Journey.
                    </span>
                </h1>
                <p class="mt-6 text-lg text-gray-600 max-w-md leading-relaxed">
                    Atheno is your all-in-one workspace to organize courses, track tasks, and achieve deep focus.
                </p>
            </div>

            <div class="relative z-10 animate-fade-up" style="animation-delay: 200ms;">
                <div class="relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 p-6 shadow-sm">
                    <div class="absolute top-4 left-4 text-4xl text-indigo-500/20 select-none">“</div>
                    <p class="relative z-10 text-gray-700 italic font-medium text-lg pl-6">
                        The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.
                    </p>
                    <div class="mt-4 flex items-center gap-3 pl-6">
                        <div class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            BH
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-900">Brian Herbert</p>
                            <p class="text-xs text-gray-500">Author</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>


        <div class="flex justify-center lg:justify-end">
            <div class="w-full max-w-md relative">
                <div class="absolute -top-12 -left-12 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div class="absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse animation-delay-2000"></div>

                <div in:fly={{ y: 20, duration: 600, easing: quintOut }} 
                     class="relative overflow-hidden rounded-[2rem] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl p-8 md:p-10">
                    
                    <div class="text-center space-y-2 mb-8">
                        <div class="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 mb-2">
                            <span class="font-black text-xl">A</span>
                        </div>
                        <h2 class="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p class="text-sm font-medium text-gray-500">
                            {isSignUp ? 'Join the learning revolution' : 'Continue your learning journey'}
                        </p>
                    </div>

                    {#if statusMessage}
                        <div transition:slide class="mb-6 p-4 rounded-xl bg-green-50 border border-green-200/60 flex flex-col gap-2 text-center">
                            <p class="text-sm font-bold text-green-700">{statusMessage}</p>
                            <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer"
                               class="text-xs font-semibold text-green-600 hover:text-green-800 underline decoration-green-300">
                                Check Inbox &rarr;
                            </a>
                        </div>
                    {/if}

                    {#if error}
                        <div transition:slide class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/60 flex items-center gap-3">
                            <span class="text-xl">⚠️</span>
                            <p class="text-sm font-medium text-red-600">{error}</p>
                        </div>
                    {/if}

                    <form class="space-y-5" onsubmit={(e) => { e.preventDefault(); handleAuth(); }}>
                        
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
                            <input bind:value={email} type="email" required placeholder="you@example.com"
                                class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200/50 outline-none" />
                        </div>

                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
                            <input bind:value={password} type="password" required placeholder="••••••••"
                                class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200/50 outline-none" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            class="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            <span class="relative z-10 flex items-center justify-center gap-2">
                                {#if loading}
                                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                                    Processing...
                                {:else}
                                    {isSignUp ? 'Get Started' : 'Sign In'}
                                    <span class="transition-transform group-hover:translate-x-1">→</span>
                                {/if}
                            </span>
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        </button>

                    </form>

                    <div class="relative flex items-center py-6">
                        <div class="flex-grow border-t border-gray-200/60"></div>
                        <span class="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 uppercase">Or continue with</span>
                        <div class="flex-grow border-t border-gray-200/60"></div>
                    </div>

                    <button
                        type="button"
                        onclick={handleGoogleAuth}
                        class="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200/80 bg-white/80 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-white hover:border-gray-300 hover:shadow-md active:scale-95"
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png" alt="Google" class="h-5 w-5" />
                        <span>Google</span>
                    </button>

                    <p class="mt-8 text-center text-sm text-gray-500">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button onclick={() => (isSignUp = !isSignUp)} class="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition ml-1">
                            {isSignUp ? 'Log in' : 'Sign up'}
                        </button>
                    </p>

                </div>
            </div>
        </div>
    </div>
</div>