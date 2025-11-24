<script>
    let {
        href = '#',
        variant = 'primary',
        text = 'Button',
        ...rest // Capture onclick, class, etc.
    } = $props();
</script>

<a
    {href}
    {...rest}
    class="group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-8 py-3.5 text-base font-bold tracking-wide transition-all duration-300 ease-out active:scale-95
    {variant === 'primary'
        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5'
        : 'bg-white/80 backdrop-blur-md border border-white/60 text-indigo-600 shadow-sm hover:bg-white hover:shadow-md hover:-translate-y-0.5 hover:text-indigo-700'}"
>
    <span class="relative z-10 flex items-center gap-2">
        {text}
    </span>

    {#if variant === 'primary'}
        <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"></div>
    {/if}
    
    {#if variant === 'secondary'}
        <div class="absolute inset-0 bg-indigo-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
    {/if}
</a>