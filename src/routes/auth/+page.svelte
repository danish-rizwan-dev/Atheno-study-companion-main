<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import { user } from '$lib/stores/auth';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

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

	// Google Auth
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

<!-- Animated Background -->
<div class="fixed inset-0 -z-10 overflow-hidden">
	<div class="animate-blob absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-600 opacity-30 mix-blend-multiply blur-3xl" />
	<div class="animation-delay-2000 animate-blob absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-purple-600 opacity-30 mix-blend-multiply blur-3xl" />
	<div class="animation-delay-4000 animate-blob absolute -bottom-20 left-1/2 h-96 w-96 rounded-full bg-pink-500 opacity-20 mix-blend-multiply blur-3xl" />
</div>

<!-- Container -->
<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4 pt-24 pb-10">
	<div class="w-full max-w-md">
		<div class="rounded-2xl border border-white/50 bg-white/60 p-8 shadow-xl backdrop-blur-md">

			<!-- Heading -->
			<div class="space-y-1 text-center">
				<h2 class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent">
					{isSignUp ? 'Join Atheno' : 'Welcome Back'}
				</h2>
				<p class="text-sm text-gray-600">
					{isSignUp ? 'Already have an account?' : "Don't have an account?"}
					<button on:click={() => (isSignUp = !isSignUp)} class="font-semibold text-indigo-600 hover:underline">
						{isSignUp ? 'Sign in' : 'Sign up'}
					</button>
				</p>
			</div>

			<!-- Success message + Gmail button -->
			{#if statusMessage}
				<div transition:slide class="mt-4 space-y-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
					<p>{statusMessage}</p>
					<a
						href="https://mail.google.com"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
					>
						✉️ Open Gmail
					</a>
				</div>
			{/if}

			<!-- Error message -->
			{#if error}
				<div transition:slide class="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			{/if}

			<!-- Form -->
			<form class="mt-8 space-y-6" on:submit|preventDefault={handleAuth}>
				<div class="space-y-1">
					<label class="text-sm font-medium text-gray-700">Email</label>
					<input bind:value={email} type="email" required
						class="w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm transition outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500" />
				</div>

				<div class="space-y-1">
					<label class="text-sm font-medium text-gray-700">Password</label>
					<input bind:value={password} type="password" required
						class="w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm transition outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500" />
				</div>

				<!-- Email/Password Submit -->
				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-[1.01] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
				</button>

				<!-- Divider -->
				<div class="flex items-center gap-4 py-3">
					<div class="h-px flex-grow bg-gray-300"></div>
					<span class="text-xs font-medium text-gray-500">OR</span>
					<div class="h-px flex-grow bg-gray-300"></div>
				</div>

				<!-- Google Auth -->
				<button
					type="button"
					on:click={handleGoogleAuth}
					class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
				>
					<img src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png" alt="Google" class="h-5 w-5" />
					Continue with Google
				</button>
			</form>
		</div>

		<p class="mt-6 text-center text-sm text-gray-500">
			By continuing, you agree to our
			<a href="#" class="text-indigo-600 hover:underline">Terms</a> and
			<a href="#" class="text-indigo-600 hover:underline">Privacy Policy</a>.
		</p>
	</div>
</div>
