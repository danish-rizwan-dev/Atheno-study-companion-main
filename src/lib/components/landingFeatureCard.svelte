<script>
    let { title, description, icon } = $props();
</script>

<div class="group relative h-full p-8 rounded-[2rem] bg-white/60 backdrop-blur-2xl border border-white/60 shadow-sm transition-all duration-500 hover:shadow-[0_8px_40px_rgba(99,102,241,0.12)] hover:-translate-y-2 hover:bg-white/80 overflow-hidden">
    
    <div class="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

    <div class="relative z-10 mb-6 inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-white to-indigo-50 shadow-md border border-white/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ease-out">
        <span class="text-3xl filter drop-shadow-sm select-none">{icon}</span>
    </div>

    <div class="relative z-10">
        <h3 class="text-xl font-extrabold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
            {title}
        </h3>
        <p class="text-gray-500 leading-relaxed font-medium text-[0.95rem]">
            {description}
        </p>
    </div>

    <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    
    <div class="absolute top-8 right-8 text-indigo-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
    </div>

</div>