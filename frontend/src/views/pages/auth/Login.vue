<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { loginApi, getSession, getSubscriptionPlan } from "@/api"; // Import getSession and getSubscriptionPlan
import FloatingConfigurator from "@/components/FloatingConfigurator.vue";
import { useUserStore } from '@/stores/user';
import Logo from "@/components/Logo.vue";

const username = ref("");
const password = ref("");
const checked = ref(false);
const errorMessage = ref("");
const router = useRouter();
const userStore = useUserStore();

// Check if user is already logged in when the component mounts
onMounted(async () => {
    try {
        const sessionData = await getSession();
        console.log('Initial Session Data:', sessionData); // Debug log
        
        if (sessionData?.data?.user) {
            const userData = sessionData.data.user;
            console.log('Initial User Data:', userData); // Debug log
            console.log('Initial Subscription Type:', userData.subscription_type); // Debug log
            
            // Set user data in store
            userStore.setUser(userData);
            
            // If user has subscription type, ensure it's set
            if (userData.subscription_type) {
                console.log('Setting initial subscription type to:', userData.subscription_type); // Debug log
                userStore.setSubscription(userData.subscription_type);
            }
            
            // Log store state after setting
            console.log('Initial Store State:', {
                user: userStore.user,
                subscription_type: userStore.subscription_type,
                isReader: userStore.isReader,
                isScholar: userStore.isScholar
            });
            
            // If already authenticated, redirect to dashboard
            router.push('/');
        }
    } catch (error) {
        console.error("Error checking session:", error);
    }
});

const login = async () => {
    errorMessage.value = "";
    try {
        const response = await loginApi(username.value, password.value);
        console.log('Login response:', response);
        
        // Get session data to check authentication
        const sessionData = await getSession();
        console.log('Session Data:', sessionData);
        
        if (sessionData?.data?.user) {
            const userData = sessionData.data.user;
            console.log('User Data:', userData);
            
            // Set user data in store
            userStore.setUser(userData);
            
            // Set subscription type directly from user data
            if (userData.subscription_type) {
                userStore.setSubscription(userData.subscription_type);
            }
            
            // Redirect to dashboard
            router.push('/');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.response && error.response.status === 409) {
            errorMessage.value = 'This account is already logged in on another device.';
        } else {
            errorMessage.value = 'Invalid username or password';
        }
    }
};
</script>

<template>
    <FloatingConfigurator />
    <div class="auth-background flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="w-full max-w-[500px] p-8 sm:p-12 bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-surface-200/20 dark:border-surface-700/20">
                <div class="text-center mb-8">
                    <div class="flex justify-center mb-6">
                        <Logo />
                    </div>
                    <div class="text-surface-900 dark:text-surface-0 text-3xl font-bold mb-2">
                        Welcome to QuoteSync!
                    </div>
                    <span class="text-surface-600 dark:text-surface-400 text-lg">Sign in to continue</span>
                </div>

                <div class="space-y-6">
                    <div class="space-y-2">
                        <label for="username1" class="block text-surface-900 dark:text-surface-0 text-lg font-medium">
                            Username or Email
                        </label>
                        <InputText 
                            id="username1" 
                            type="text" 
                            placeholder="Enter your username or email" 
                            class="w-full p-3" 
                            v-model="username"
                        />
                    </div>

                    <div class="space-y-2">
                        <label for="password1" class="block text-surface-900 dark:text-surface-0 text-lg font-medium">
                            Password
                        </label>
                        <Password 
                            id="password1" 
                            v-model="password" 
                            placeholder="Enter your password" 
                            :toggleMask="true"
                            class="w-full" 
                            :feedback="false" 
                            @keyup.enter="login"
                        />
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                            <label for="rememberme1" class="text-surface-600 dark:text-surface-400">Remember me</label>
                        </div>
                        <span 
                            class="font-medium text-primary hover:text-primary-600 transition-colors cursor-pointer" 
                            @click="router.push({ name: 'forgotPassword' })"
                        >
                            Forgot password?
                        </span>
                    </div>

                    <Button 
                        label="Sign In" 
                        class="w-full p-3 text-lg" 
                        @click="login"
                        :loading="loading"
                    />

                    <div class="text-center">
                        <span class="text-surface-600 dark:text-surface-400">Don't have an account? </span>
                        <span 
                            class="font-medium text-primary hover:text-primary-600 transition-colors cursor-pointer" 
                            @click="router.push({ name: 'register' })"
                        >
                            Sign Up
                        </span>
                    </div>

                    <div class="text-center">
                        <span 
                            class="font-medium text-primary hover:text-primary-600 transition-colors cursor-pointer" 
                            @click="router.push('/')"
                        >
                            <i class="pi pi-home mr-2"></i>
                            Back to Home
                        </span>
                    </div>

                    <p v-if="errorMessage" class="text-red-500 text-center mt-4">{{ errorMessage }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.auth-background {
    @apply relative min-h-screen w-full overflow-hidden;
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
}

.auth-background::before {
    content: '';
    @apply absolute inset-0;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.5;
}

/* Dark mode adjustments */
:root.dark {
    .auth-background {
        background: linear-gradient(135deg, var(--surface-900) 0%, var(--surface-800) 100%);
    }
}

.pi-eye,
.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}

:deep(.p-password-input) {
    width: 100%;
    padding: 0.75rem;
}

:deep(.p-button) {
    font-weight: 600;
}

:deep(.p-inputtext) {
    padding: 0.75rem;
    border-radius: 0.5rem;
}

:deep(.p-password) {
    width: 100%;
}

:deep(.p-checkbox) {
    width: 1.25rem;
    height: 1.25rem;
}

:deep(.p-checkbox .p-checkbox-box) {
    border-radius: 0.25rem;
}
</style>
