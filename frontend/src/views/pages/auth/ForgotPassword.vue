<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import FloatingConfigurator from "@/components/FloatingConfigurator.vue";
import Logo from "@/components/Logo.vue";

const email = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const loading = ref(false);
const router = useRouter();

const handleSubmit = async () => {
    errorMessage.value = "";
    successMessage.value = "";
    loading.value = true;

    try {
        // TODO: Implement password reset request
        // const response = await resetPasswordRequest(email.value);
        successMessage.value = "If an account exists with this email, you will receive password reset instructions.";
    } catch (error) {
        console.error("Password reset request error:", error);
        errorMessage.value = "An error occurred. Please try again later.";
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <FloatingConfigurator />
    <div class="auth-background flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="w-full max-w-[500px] p-6 sm:p-8 bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-surface-200/20 dark:border-surface-700/20">
                <div class="text-center mb-4">
                    <div class="flex justify-center mb-4">
                        <Logo />
                    </div>
                    <div class="text-surface-900 dark:text-surface-0 text-2xl font-bold mb-1">
                        Forgot Password
                    </div>
                    <span class="text-surface-600 dark:text-surface-400 text-base">
                        Enter your email to reset your password
                    </span>
                </div>

                <div class="space-y-4">
                    <div class="space-y-1">
                        <label
                            for="email"
                            class="block text-surface-900 dark:text-surface-0 text-base font-medium"
                        >
                            Email
                        </label>
                        <InputText
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            class="w-full p-2"
                            v-model="email"
                            @keyup.enter="handleSubmit"
                        />
                    </div>

                    <Button
                        label="Reset Password"
                        class="w-full p-2 text-base"
                        @click="handleSubmit"
                        :loading="loading"
                    />

                    <div class="text-center">
                        <span class="text-surface-600 dark:text-surface-400">Remember your password? </span>
                        <span
                            class="font-medium text-primary hover:text-primary-600 transition-colors cursor-pointer"
                            @click="router.push({ name: 'login' })"
                        >
                            Sign In
                        </span>
                    </div>

                    <p v-if="errorMessage" class="text-red-500 text-center mt-2">{{ errorMessage }}</p>
                    <p v-if="successMessage" class="text-green-500 text-center mt-2">{{ successMessage }}</p>
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

:deep(.p-button) {
    font-weight: 600;
}

:deep(.p-inputtext) {
    padding: 0.75rem;
    border-radius: 0.5rem;
}
</style> 