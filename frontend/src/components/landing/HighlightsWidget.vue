<template>
    <div id="highlights" class="py-6 px-6 lg:px-20 mx-0 my-12 lg:mx-20">
        <div class="text-center mb-16">
            <div class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-4xl">QuoteSync Everywhere</div>
            <span class="text-muted-color text-2xl">Access your quote library on any device, anytime</span>
        </div>
        
        <!-- Mobile Experience -->
        <div class="grid grid-cols-12 gap-8 items-center mb-24">
            <div class="flex justify-center col-span-12 lg:col-span-6 order-1 lg:order-none">
                <div class="relative w-full max-w-md">
                    <div class="absolute -inset-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-3xl blur-xl opacity-50"></div>
                    <img src="/demo/images/landing/mockup.svg" class="relative w-full transform hover:scale-105 transition-transform duration-300" alt="QuoteSync mobile app" />
                </div>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-6 text-center lg:text-left">
                <div class="flex items-center justify-center lg:justify-start">
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-800/30 w-16 h-16 rounded-xl">
                        <i class="pi pi-fw pi-mobile !text-3xl text-purple-600 dark:text-purple-400"></i>
                    </div>
                </div>
                <h3 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Take Your Quotes Anywhere</h3>
                <p class="text-xl text-surface-600 dark:text-surface-200 leading-relaxed">
                    Browse your quote collection on the go, add new quotes while reading, and share inspiration with friends directly from your phone. The QuoteSync mobile experience brings your entire library to your fingertips.
                </p>
            </div>
        </div>
        
        <!-- Desktop Experience -->
        <div class="grid grid-cols-12 gap-8 items-center mb-24">
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-6 text-center lg:text-left order-1 lg:order-none">
                <div class="flex items-center justify-center lg:justify-start">
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-800/30 w-16 h-16 rounded-xl">
                        <i class="pi pi-fw pi-desktop !text-3xl text-blue-600 dark:text-blue-400"></i>
                    </div>
                </div>
                <h3 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Advanced AI Features</h3>
                <p class="text-xl text-surface-600 dark:text-surface-200 leading-relaxed">
                    Access the full power of QuoteSync on your desktop with our AI-powered tools. Automatically tag your quotes, get personalized recommendations, and use our AI Chat Assistant to gain deeper insights into your favorite literary works.
                </p>
            </div>
            <div class="flex justify-center col-span-12 lg:col-span-6">
                <div class="relative w-full max-w-md">
                    <div class="absolute -inset-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl blur-xl opacity-50"></div>
                    <img src="/demo/images/landing/mockup-desktop.svg" class="relative w-full transform hover:scale-105 transition-transform duration-300" alt="QuoteSync desktop dashboard" />
                </div>
            </div>
        </div>
        
        <!-- Social Experience -->
        <div class="grid grid-cols-12 gap-8 items-center">
            <div class="flex justify-center col-span-12 lg:col-span-6 order-1 lg:order-none">
                <div class="relative w-full max-w-md">
                    <div class="absolute -inset-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl blur-xl opacity-50"></div>
                    <img src="/demo/images/landing/mockup.svg" class="relative w-full transform hover:scale-105 transition-transform duration-300" alt="QuoteSync social sharing" />
                </div>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-6 text-center lg:text-left">
                <div class="flex items-center justify-center lg:justify-start">
                    <div class="flex items-center justify-center bg-emerald-100 dark:bg-emerald-800/30 w-16 h-16 rounded-xl">
                        <i class="pi pi-fw pi-users !text-3xl text-emerald-600 dark:text-emerald-400"></i>
                    </div>
                </div>
                <h3 class="text-3xl font-semibold text-surface-900 dark:text-surface-0">Social Reading Experience</h3>
                <p class="text-xl text-surface-600 dark:text-surface-200 leading-relaxed">
                    Connect with friends and fellow book lovers through our social features. Create reading groups, share your favorite quotes, and discover new books through recommendations from people who share your literary taste.
                </p>
            </div>
        </div>
    </div>
</template>
