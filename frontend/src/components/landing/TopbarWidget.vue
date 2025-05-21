<script setup>
import Logo from '@/components/Logo.vue';
import Button from 'primevue/button';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isMobileMenuOpen = ref(false);

function smoothScroll(id) {
    const element = document.getElementById(id);
    if (element) {
        const navbarHeight = 80; // Adjust this value based on your navbar height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
    // Close mobile menu after clicking a link
    isMobileMenuOpen.value = false;
}

function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
}
</script>

<template>
    <div class="topbar-container">
        <div class="topbar-content">
            <!-- Logo and Brand -->
            <div class="brand-container" @click.prevent="smoothScroll('home')">
                <Logo class="logo" />
                <span class="brand-text">QuoteSync</span>
            </div>

            <!-- Mobile Menu Button -->
            <button class="mobile-menu-button" @click="toggleMobileMenu">
                <i class="pi pi-bars"></i>
            </button>

            <!-- Navigation Menu -->
            <div class="nav-container" :class="{ 'mobile-menu-open': isMobileMenuOpen }">
                <nav class="nav-menu">
                    <a href="#features" @click.prevent="smoothScroll('features')" class="nav-link">Features</a>
                    <a href="#highlights" @click.prevent="smoothScroll('highlights')" class="nav-link">Highlights</a>
                    <a href="#pricing" @click.prevent="smoothScroll('pricing')" class="nav-link">Pricing</a>

                </nav>

                <div class="auth-buttons">
                    <Button 
                        class="p-button-text p-button-rounded login-btn" 
                        @click="router.push('/auth/login')"
                    >
                        <i class="pi pi-sign-in mr-2"></i>
                        <span>Login</span>
                    </Button>
                    <Button 
                        class="p-button-rounded register-btn" 
                        @click="router.push('/auth/register')"
                    >
                        <i class="pi pi-user-plus mr-2"></i>
                        <span>Sign Up</span>
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.topbar-container {
    @apply w-full backdrop-blur-2xl bg-white/50 dark:bg-surface-900/50 border border-surface-200/20 dark:border-surface-700/20 rounded-2xl;
    position: fixed;
    top: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 3rem);
    max-width: 1400px;
    z-index: 50;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
}

.topbar-container:hover {
    @apply bg-white/60 dark:bg-surface-900/60;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.topbar-content {
    @apply flex items-center justify-between px-6 py-4 mx-auto;
}

.brand-container {
    @apply flex items-center gap-3 transition-all duration-300 hover:scale-105 ml-2;
    cursor: pointer;
}

.brand-text {
    @apply text-surface-900 dark:text-surface-0 font-bold text-2xl tracking-tight;
}

.mobile-menu-button {
    @apply lg:hidden;
}

.nav-container {
    @apply items-center grow justify-between hidden lg:flex absolute lg:static w-full left-0 top-full px-8 lg:px-0 z-20;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-menu {
    @apply list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row cursor-pointer gap-10 ml-16;
}

.nav-link {
    @apply px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-lg relative transition-all duration-300;
}

.nav-link::after {
    content: '';
    @apply absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300;
}

.nav-link:hover {
    @apply text-primary;
}

.nav-link:hover::after {
    @apply w-full;
}

.auth-buttons {
    @apply flex items-center gap-4;
}

.auth-buttons :deep(.p-button) {
    @apply px-6 py-2.5 text-base font-medium transition-all duration-300;
}

.auth-buttons :deep(.login-btn) {
    @apply text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400;
    position: relative;
    overflow: hidden;
}

.auth-buttons :deep(.login-btn::before) {
    content: '';
    @apply absolute inset-0 bg-primary-50 dark:bg-primary-900/20;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
}

.auth-buttons :deep(.login-btn:hover::before) {
    transform: translateX(0);
}

.auth-buttons :deep(.register-btn) {
    @apply bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5;
    position: relative;
    overflow: hidden;
}

.auth-buttons :deep(.register-btn::before) {
    content: '';
    @apply absolute inset-0 bg-white/10;
    transform: translateX(-100%) skewX(-15deg);
    transition: transform 0.3s ease;
}

.auth-buttons :deep(.register-btn:hover::before) {
    transform: translateX(100%) skewX(-15deg);
}

.auth-buttons :deep(.p-button .pi) {
    @apply text-lg transition-transform duration-300;
}

.auth-buttons :deep(.p-button:hover .pi) {
    transform: scale(1.1);
}

/* Mobile menu styles */
@media (max-width: 1024px) {
    .topbar-container {
        @apply w-full rounded-none border-x-0 border-t-0;
        top: 0;
        left: 0;
        transform: none;
        width: 100%;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .nav-container {
        @apply bg-white/80 dark:bg-surface-900/80 backdrop-blur-2xl border-b border-surface-200/20 dark:border-surface-700/20;
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .nav-container.mobile-menu-open {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
    }

    .nav-menu {
        @apply ml-0;
    }

    .nav-link {
        @apply w-full text-center py-5;
    }

    .auth-buttons {
        @apply w-full justify-center;
    }
}

/* Mobile adjustments */
@media (max-width: 768px) {
    .auth-buttons {
        @apply flex-col w-full gap-2 mt-4;
    }

    .auth-buttons :deep(.p-button) {
        @apply w-full justify-center;
    }
}

/* Animation classes */
.animate-scalein {
    animation: scalein 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-fadeout {
    animation: fadeout 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes scalein {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fadeout {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}

/* Add smooth scroll behavior to the whole page */
:deep(html) {
    scroll-behavior: smooth;
}
</style>

