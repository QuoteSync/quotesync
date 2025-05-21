<template>
    <div id="pricing" class="py-6 px-6 lg:px-20 my-2 md:my-6">
        <div class="text-center mb-16">
            <div class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-4xl">Subscription Plans</div>
            <span class="text-muted-color text-2xl">Choose the perfect plan for your quote collection journey</span>
        </div>

        <div class="grid grid-cols-12 gap-8 justify-between">
            <!-- Free Plan -->
            <div class="col-span-12 lg:col-span-4">
                <div class="h-full p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border border-slate-200 dark:border-slate-800/50 hover:shadow-lg transition-all duration-300">
                    <div class="text-center mb-8">
                        <h3 class="text-3xl font-semibold text-surface-900 dark:text-surface-0 mb-4">Free</h3>
                        <img src="/demo/images/landing/free.svg" class="w-32 mx-auto mb-8" alt="free" />
                        <div class="flex items-center justify-center gap-2 mb-6">
                            <span class="text-5xl font-bold text-surface-900 dark:text-surface-0">$0</span>
                            <span class="text-xl text-surface-600 dark:text-surface-200">forever</span>
                        </div>
                        <Button 
                            label="Get Started" 
                            class="w-full !text-xl !py-3 bg-blue-500 hover:bg-blue-600 text-white border-0" 
                            rounded
                        />
                    </div>
                    <Divider class="w-full bg-surface-200 dark:bg-surface-700" />
                    <ul class="my-8 list-none p-0 flex flex-col gap-4">
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Up to 100 quotes</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Basic search</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Manual tagging</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Personal lists</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Reader Plan -->
            <div class="col-span-12 lg:col-span-4">
                <div class="h-full p-8 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary hover:shadow-lg transition-all duration-300 relative">
                    <div class="absolute -top-4 right-8 bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold">POPULAR</div>
                    <div class="text-center mb-8">
                        <h3 class="text-3xl font-semibold text-surface-900 dark:text-surface-0 mb-4">Reader</h3>
                        <img src="/demo/images/landing/startup.svg" class="w-32 mx-auto mb-8" alt="reader" />
                        <div class="flex items-center justify-center gap-2 mb-6">
                            <span class="text-5xl font-bold text-surface-900 dark:text-surface-0">$4.99</span>
                            <span class="text-xl text-surface-600 dark:text-surface-200">per month</span>
                        </div>
                        <Button 
                            label="Subscribe Now" 
                            class="w-full !text-xl !py-3 bg-primary hover:bg-primary-600 text-white border-0" 
                            rounded
                        />
                    </div>
                    <Divider class="w-full bg-surface-200 dark:bg-surface-700" />
                    <ul class="my-8 list-none p-0 flex flex-col gap-4">
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Unlimited quotes</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Advanced search</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">AI-powered tagging</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Social sharing</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Quote import tools</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Pro Plan -->
            <div class="col-span-12 lg:col-span-4">
                <div class="h-full p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border border-slate-200 dark:border-slate-800/50 hover:shadow-lg transition-all duration-300">
                    <div class="text-center mb-8">
                        <h3 class="text-3xl font-semibold text-surface-900 dark:text-surface-0 mb-4">Pro</h3>
                        <img src="/demo/images/landing/enterprise.svg" class="w-32 mx-auto mb-8" alt="pro" />
                        <div class="flex items-center justify-center gap-2 mb-6">
                            <span class="text-5xl font-bold text-surface-900 dark:text-surface-0">$9.99</span>
                            <span class="text-xl text-surface-600 dark:text-surface-200">per month</span>
                        </div>
                        <Button 
                            label="Subscribe Now" 
                            class="w-full !text-xl !py-3 bg-blue-500 hover:bg-blue-600 text-white border-0" 
                            rounded
                        />
                    </div>
                    <Divider class="w-full bg-surface-200 dark:bg-surface-700" />
                    <ul class="my-8 list-none p-0 flex flex-col gap-4">
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Everything in Reader</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">AI Chat Assistant</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Semantic search</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">Group collaboration</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="pi pi-fw pi-check text-xl text-cyan-500"></i>
                            <span class="text-xl text-surface-600 dark:text-surface-200">API access</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-16">
            <p class="text-surface-600 dark:text-surface-400 text-xl mb-6">All plans include a 14-day free trial. No credit card required.</p>
            <Button 
                label="Compare All Features" 
                class="!text-xl !px-8 !py-3 border-2 border-primary text-primary hover:bg-primary/10" 
                rounded
            />
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Divider from 'primevue/divider';
</script>
