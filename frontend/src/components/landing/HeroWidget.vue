<template>
    <div id="hero" class="hero-container">
        <div class="hero-background"></div>
        <div class="hero-content">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <!-- Left Content -->
                <div class="text-center lg:text-left">
                    <h1 class="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        Your Personal Quote Library
                    </h1>
                    <p class="text-xl text-surface-600 dark:text-surface-400 mb-8">
                        Save, organize, and discover meaningful quotes from your favorite books. Powered by AI to help you find exactly what you're looking for.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Button 
                            label="Get Started" 
                            class="p-button-lg" 
                            as="router-link" 
                            to="/auth/register"
                        />
                        <Button 
                            label="Learn More" 
                            class="p-button-lg p-button-outlined" 
                            @click="smoothScroll('features')"
                        />
                    </div>
                </div>

                <!-- Right Content - Large Logo -->
                <div class="relative">
                    <div class="hero-logo-container">
                        <Logo class="hero-logo" />
                        <!-- Decorative elements -->
                        <div class="absolute -top-4 -right-4 w-32 h-32 bg-primary-200 dark:bg-primary-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div class="absolute -bottom-8 left-20 w-32 h-32 bg-secondary-200 dark:bg-secondary-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div class="absolute top-1/2 -left-4 w-32 h-32 bg-accent-200 dark:bg-accent-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Logo from '@/components/Logo.vue';

function smoothScroll(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}
</script>

<style scoped>
.hero-container {
    @apply relative min-h-screen w-full overflow-hidden;
    padding-top: 10rem;
    scroll-margin-top: 8rem;
}

.hero-background {
    @apply absolute inset-0 w-full h-full;
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
    margin-top: -4rem;
}

.hero-background::before {
    content: '';
    @apply absolute inset-0;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.5;
}

.hero-content {
    @apply relative z-10 container mx-auto px-6 py-12;
    margin-top: 2rem;
}

.hero-logo-container {
    @apply relative w-full h-[400px] flex items-center justify-center;
}

.hero-logo {
    @apply w-64 h-64;
    filter: drop-shadow(0 20px 25px rgba(0, 0, 0, 0.1));
    transition: transform 0.3s ease;
}

.hero-logo-container:hover .hero-logo {
    transform: scale(1.05);
}

/* Dark mode adjustments */
:root.dark {
    .hero-background {
        background: linear-gradient(135deg, var(--surface-900) 0%, var(--surface-800) 100%);
    }
    
    .hero-logo {
        filter: drop-shadow(0 20px 25px rgba(0, 0, 0, 0.2));
    }
}

/* Mobile adjustments */
@media (max-width: 768px) {
    .hero-container {
        padding-top: 8rem;
        scroll-margin-top: 6rem;
    }
    
    .hero-content {
        margin-top: 1rem;
    }
    
    .hero-logo-container {
        height: 300px;
    }
    
    .hero-logo {
        @apply w-48 h-48;
    }
}

/* Animation classes */
.animate-blob {
    animation: blob 7s infinite;
}

.animation-delay-2000 {
    animation-delay: 2s;
}

.animation-delay-4000 {
    animation-delay: 4s;
}

@keyframes blob {
    0% {
        transform: translate(0px, 0px) scale(1);
    }
    33% {
        transform: translate(30px, -50px) scale(1.1);
    }
    66% {
        transform: translate(-20px, 20px) scale(0.9);
    }
    100% {
        transform: translate(0px, 0px) scale(1);
    }
}
</style>