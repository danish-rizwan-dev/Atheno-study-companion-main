<script>
	import { user } from '$lib/stores/auth';
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';

	let navItems = [
		{ name: 'Features', href: '#features' },
		{ name: 'About', href: '#about' },
		{ name: 'Contact', href: '#contact' }
	];

	let mobileOpen = false;
</script>

<nav
	class="fixed top-0 right-0 left-0 z-50 border-b border-white/40 bg-white/70 shadow-sm backdrop-blur-xl"
>
	<div class="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Logo -->
		<div class="flex cursor-pointer items-center gap-2 select-none" on:click={() => goto('/')}>
			<span
				class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-black tracking-tight text-transparent"
			>
				Atheno
			</span>
		</div>

		<!-- Desktop Navigation -->
		<div class="hidden items-center gap-10 lg:flex">
			{#each navItems as item}
				<a
					href={item.href}
					class="relative text-sm font-medium text-gray-700 transition after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-indigo-600 after:transition-all hover:text-indigo-600 hover:after:w-full"
				>
					{item.name}
				</a>
			{/each}
		</div>

		<!-- Desktop Buttons (small buttons override) -->
		<div
			class="hidden items-center gap-2 lg:flex
			[&_button]:!rounded-md [&_button]:!px-3 [&_button]:!py-1.5 [&_button]:!text-[13px] [&_button]:!font-medium"
		>
			{#if !$user}
				<Button href="/auth?mode=login" variant="secondary" text="Login" />
				<Button href="/auth?mode=signup" variant="primary" text="Signup" />
			{:else}
				<Button href="/dashboard" variant="primary" text="Dashboard" />
			{/if}
		</div>

		<!-- Mobile toggle -->
		<button class="text-3xl lg:hidden" on:click={() => (mobileOpen = !mobileOpen)}>
			{mobileOpen ? '✖' : '☰'}
		</button>
	</div>

	<!-- Mobile Menu -->
	{#if mobileOpen}
		<div
			class="animate-fade-down origin-top border-t border-white/50 bg-white/80 shadow-lg backdrop-blur-xl lg:hidden"
		>
			<div class="flex flex-col space-y-6 p-6 text-lg">
				{#each navItems as item}
					<a
						href={item.href}
						class="font-medium text-gray-700 hover:text-indigo-600"
						on:click={() => (mobileOpen = false)}
					>
						{item.name}
					</a>
				{/each}

				<!-- Mobile Buttons (slightly compact) -->
				<div
					class="flex flex-col gap-3 pt-4
					[&_button]:!rounded-md [&_button]:!py-2 [&_button]:!text-[15px] [&_button]:!font-medium"
				>
					{#if !$user}
						<Button href="/auth?mode=login" variant="secondary" text="Login" size="sm" />
						<Button href="/auth?mode=signup" variant="primary" text="Signup" size="sm" />
					{:else}
						<Button href="/dashboard" variant="primary" text="Dashboard" size="sm" />
					{/if}
				</div>
			</div>
		</div>
	{/if}
</nav>
