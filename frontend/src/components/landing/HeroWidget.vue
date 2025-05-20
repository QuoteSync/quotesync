<template>
    <div
        id="hero"
        class="flex flex-col pt-6 px-6 lg:px-20 overflow-hidden"
        style="background: linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, rgb(238, 239, 175) 0%, rgb(195, 227, 250) 100%); clip-path: ellipse(150% 87% at 93% 13%)"
    >
        <div class="mx-6 md:mx-20 mt-0 md:mt-6">
            <h1 class="text-6xl font-bold text-gray-900 leading-tight">
                <span class="font-light block">Collect and organize</span>
                your favorite quotes
            </h1>
            <p class="font-normal text-2xl leading-normal md:mt-4 text-gray-700">
                QuoteSync helps you build a personal library of quotes from your favorite books, share with friends, and discover insights with AI.
            </p>
            <div class="flex flex-wrap gap-4 mt-8">
                <Button label="Get Started" as="router-link" to="/auth/register" rounded class="!text-xl !px-6 !py-3 bg-primary"></Button>
                <Button label="See Features" @click="smoothScroll('features')" rounded outlined class="!text-xl !px-6 !py-3"></Button>
            </div>
        </div>
        <div class="flex justify-center md:justify-end">
            <div class="relative w-9/12 md:w-auto mt-8">
                <img src="/demo/images/landing/screen-1.png" alt="QuoteSync Dashboard" class="rounded-lg shadow-2xl" />
                <div class="absolute -top-4 -left-4 bg-yellow-100 px-4 py-2 rounded-full text-yellow-800 shadow-md">
                    <i class="pi pi-book mr-2"></i>
                    <span>1,000+ books</span>
                </div>
                <div class="absolute -bottom-4 -right-4 bg-indigo-100 px-4 py-2 rounded-full text-indigo-800 shadow-md">
                    <i class="pi pi-comment mr-2"></i>
                    <span>AI-powered</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
function smoothScroll(id) {
    document.body.click();
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}
</script>