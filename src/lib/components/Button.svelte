<script>
    let {
        href = '#',
        variant = 'primary',
        text = 'Button'
    } = $props();
</script>

<a
    {href}
    class="rounded-xl px-8 py-4 text-lg font-semibold shadow-lg transition-all {variant === 'primary'
        ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-xl'
        : 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 hover:shadow-xl'}"
>
    {text}
</a>