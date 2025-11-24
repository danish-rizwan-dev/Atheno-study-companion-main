<script>
    let {title, description, icon} = $props();
</script>

<div class="group relative rounded-2xl bg-white/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-105 transform-3d hover:hue-rotate-60 duration-500">
    <div class="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 blur transition-all group-hover:opacity-20"></div>
    <div class="relative">
        <div class="mb-4 inline-block rounded-lg bg-indigo-600/10 p-3 text-indigo-600">
            {icon}
        </div>
        <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
        <p class="mt-2 text-gray-600">{description}</p>
    </div>
</div>