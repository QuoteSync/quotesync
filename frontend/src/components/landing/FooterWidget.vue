<template>
    <div class="py-12 px-6 lg:px-20 mx-0 mt-20 lg:mx-20 border-t border-surface-200 dark:border-surface-700">
        <div class="grid grid-cols-12 gap-8">
            <!-- Logo and Description -->
            <div class="col-span-12 md:col-span-4">
                <a @click="smoothScroll('#home')" class="flex flex-wrap items-center justify-center md:justify-start md:mb-0 mb-8 cursor-pointer">
                    <Logo class="h-14 mr-4" />
                    <span class="text-2xl font-semibold text-surface-900 dark:text-surface-0">QuoteSync</span>
                </a>
                <p class="text-lg text-surface-600 dark:text-surface-200 text-center md:text-left mt-4">
                    Your personal library of quotes, powered by AI. Collect, organize, and share your favorite literary moments.
                </p>
            </div>

            <!-- Links -->
            <div class="col-span-12 md:col-span-8">
                <div class="grid grid-cols-12 gap-8">
                    <div class="col-span-6 md:col-span-3">
                        <h4 class="font-semibold text-xl mb-4 text-surface-900 dark:text-surface-0">Company</h4>
                        <ul class="list-none p-0 m-0 flex flex-col gap-3">
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">About Us</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">News</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Careers</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Contact</a>
                            </li>
                        </ul>
                    </div>

                    <div class="col-span-6 md:col-span-3">
                        <h4 class="font-semibold text-xl mb-4 text-surface-900 dark:text-surface-0">Resources</h4>
                        <ul class="list-none p-0 m-0 flex flex-col gap-3">
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Get Started</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Documentation</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">API Reference</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Blog</a>
                            </li>
                        </ul>
                    </div>

                    <div class="col-span-6 md:col-span-3">
                        <h4 class="font-semibold text-xl mb-4 text-surface-900 dark:text-surface-0">Community</h4>
                        <ul class="list-none p-0 m-0 flex flex-col gap-3">
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Discord</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">
                                    Events
                                    <span class="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">New</span>
                                </a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">FAQ</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Support</a>
                            </li>
                        </ul>
                    </div>

                    <div class="col-span-6 md:col-span-3">
                        <h4 class="font-semibold text-xl mb-4 text-surface-900 dark:text-surface-0">Legal</h4>
                        <ul class="list-none p-0 m-0 flex flex-col gap-3">
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Privacy Policy</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Terms of Service</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Cookie Policy</a>
                            </li>
                            <li>
                                <a class="text-lg text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">Licenses</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Section -->
        <div class="mt-12 pt-8 border-t border-surface-200 dark:border-surface-700">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <div class="text-surface-600 dark:text-surface-200 text-lg">
                    © 2024 QuoteSync. All rights reserved.
                </div>
                <div class="flex gap-6">
                    <a class="text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">
                        <i class="pi pi-twitter text-2xl"></i>
                    </a>
                    <a class="text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">
                        <i class="pi pi-github text-2xl"></i>
                    </a>
                    <a class="text-surface-600 dark:text-surface-200 hover:text-primary transition-colors">
                        <i class="pi pi-linkedin text-2xl"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Logo from '@/components/Logo.vue';

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
