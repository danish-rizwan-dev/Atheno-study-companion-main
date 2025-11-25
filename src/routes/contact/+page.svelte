<script>
    import Navbar from '$lib/components/navbar.svelte';
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // --- State (Runes) ---
    let name = $state('');
    let email = $state('');
    let message = $state('');
    let isSubmitting = $state(false);
    let isSent = $state(false);

    // --- Logic ---
    async function handleSubmit() {
        isSubmitting = true;

        // ---------------------------------------------------------
        // TODO: Replace this URL with your unique Formspree Endpoint
        // Register at https://formspree.io/ to get your ID
        // ---------------------------------------------------------
        const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqaodlne";

        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    message: message
                })
            });

            if (response.ok) {
                isSent = true;
                // Reset form fields
                name = '';
                email = '';
                message = '';

                // Hide success message after delay
                setTimeout(() => {
                    isSent = false;
                }, 5000);
            } else {
                alert("Oops! There was a problem submitting your form.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error sending message. Please check your connection.");
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Navbar />

<!-- Ambient Background -->
<div class="fixed inset-0 -z-10 overflow-hidden bg-gray-50">
    <div
        class="animate-blob absolute top-0 right-1/4 h-[600px] w-[600px] rounded-full bg-indigo-300/20 opacity-60 mix-blend-multiply blur-[100px] filter"
    ></div>
    <div
        class="animate-blob animation-delay-2000 absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-300/20 opacity-60 mix-blend-multiply blur-[100px] filter"
    ></div>
    <div
        class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"
    ></div>
</div>

<div class="relative flex min-h-screen items-center justify-center px-6 pt-32 pb-20">
    <div class="grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
        <!-- Left: Info & Socials -->
        <div class="animate-fade-up space-y-8">
            <div>
                <h1 class="mb-6 text-5xl font-black tracking-tighter text-gray-900 md:text-6xl">
                    Let's build the <br />
                    <span
                        class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                    >
                        future of learning.
                    </span>
                </h1>
                <p class="max-w-md text-lg leading-relaxed text-gray-600">
                    Have a question, feature request, or just want to say hi? We'd love to hear from you.
                </p>
            </div>

            <!-- Contact Tiles -->
            <div class="grid gap-4">
                <a
                    href="mailto:danishriz8287@gmail.com"
                    class="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/50 bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/80 hover:shadow-md"
                >
                    <div
                        class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition-transform duration-300 group-hover:scale-110"
                    >
                        📧
                    </div>
                    <div>
                        <p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Email Us</p>
                        <p class="font-bold text-gray-900">Danishriz8287@gmail.com</p>
                    </div>
                    <!-- Shine -->
                    <div
                        class="pointer-events-none absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-1000 group-hover:translate-x-[100%] group-hover:opacity-100"
                    ></div>
                </a>

                <a
                    href="https://github.com/danish-rizwan-dev/Atheno-study-companion-main"
                    target="_blank"
                    class="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/50 bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/80 hover:shadow-md"
                >
                    <div
                        class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl transition-transform duration-300 group-hover:scale-110"
                    >
                        👾
                    </div>
                    <div>
                        <p class="text-xs font-bold tracking-wider text-gray-400 uppercase">GitHub</p>
                        <p class="font-bold text-gray-900">Atheno Open Source</p>
                    </div>
                </a>

                <a
                    href="https://www.linkedin.com/in/danish-rizwan-050539258/"
                    target="_blank"
                    class="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/50 bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/80 hover:shadow-md"
                >
                    <div
                        class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-transform duration-300 group-hover:scale-110"
                    >
                        <svg
                            class="h-6 w-6 fill-current"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.234-1.66-2.234-.906 0-1.445.61-1.682 1.197-.085.21-.106.498-.106.787v5.82h-3.555s.047-9.444 0-10.42h3.555v1.478h-.024c.472-.727 1.317-1.766 3.203-1.766 2.338 0 4.09 1.527 4.09 4.81v5.897zM5.337 8.533c-1.213 0-2.07.797-2.07 1.844 0 1.036.845 1.843 2.058 1.843h.013c1.225 0 2.07-.807 2.07-1.843-.024-1.047-.845-1.844-2.07-1.844zm-1.778 11.92h3.555v-10.42h-3.555v10.42z"
                            />
                        </svg>
                    </div>
                    <div>
                        <p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Linkedin</p>
                        <p class="font-bold text-gray-900">@Danish Rizwan</p>
                    </div>
                </a>
            </div>
        </div>

        <!-- Right: Contact Form -->
        <div in:fly={{ y: 20, duration: 800, delay: 200 }} class="relative">
            <!-- Decor -->
            <div
                class="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur"
            ></div>

            <div
                class="relative rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur-2xl md:p-10"
            >
                {#if isSent}
                    <div
                        in:fade
                        class="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[2rem] bg-white/90 p-8 text-center backdrop-blur-sm"
                    >
                        <div
                            class="mb-4 flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-green-100 text-4xl text-green-600"
                        >
                            ✨
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900">Message Sent!</h3>
                        <p class="mt-2 text-gray-600">
                            Thanks for reaching out. We'll get back to you shortly.
                        </p>
                    </div>
                {/if}

                <h2 class="mb-6 text-2xl font-bold text-gray-900">Send a Message</h2>

                <form
                    onsubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    class="space-y-5"
                >
                    <div class="space-y-1.5">
                        <label class="ml-1 text-xs font-bold text-gray-500 uppercase">Name</label>
                        <input
                            bind:value={name}
                            type="text"
                            required
                            placeholder="Jane Doe"
                            class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200/50"
                        />
                    </div>

                    <div class="space-y-1.5">
                        <label class="ml-1 text-xs font-bold text-gray-500 uppercase">Email</label>
                        <input
                            bind:value={email}
                            type="email"
                            required
                            placeholder="jane@example.com"
                            class="w-full rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200/50"
                        />
                    </div>

                    <div class="space-y-1.5">
                        <label class="ml-1 text-xs font-bold text-gray-500 uppercase">Message</label>
                        <textarea
                            bind:value={message}
                            rows="4"
                            required
                            placeholder="How can we help?"
                            class="w-full resize-none rounded-xl border-gray-200 bg-white/50 px-4 py-3 text-gray-800 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200/50"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        class="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <span class="relative z-10 flex items-center justify-center gap-2">
                            {#if isSubmitting}
                                <span
                                    class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                ></span>
                                <span>Sending...</span>
                            {:else}
                                <span>Send Message</span>
                                <span class="transition-transform group-hover:translate-x-1">→</span>
                            {/if}
                        </span>
                        <!-- Shine -->
                        <div
                            class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
                        ></div>
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>