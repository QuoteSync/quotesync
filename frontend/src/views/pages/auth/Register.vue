<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { signup, getSession } from "@/api";
import FloatingConfigurator from "@/components/FloatingConfigurator.vue";
import Logo from "@/components/Logo.vue";

const username = ref("");
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const loading = ref(false);
const router = useRouter();

// Check if user is already logged in when the component mounts
onMounted(async () => {
  try {
    const sessionData = await getSession();
    if (sessionData?.data?.user) {
      // If already authenticated, redirect to dashboard
      router.push('/');
    }
  } catch (error) {
    console.error("Error checking session:", error);
  }
});

const register = async () => {
  errorMessage.value = ""; // Reset the error message

  // Validate that both passwords match
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match";
    return;
  }

  // Create the user data object with the required fields
  const userData = {
    username: username.value,
    email: email.value,
    password: password.value,
    // These are commented out but available if needed
    // first_name: firstName.value,
    // last_name: lastName.value,
  };

  console.log("Sending registration data:", userData);

  try {
    // Call the signup API endpoint with all required fields.
    const response = await signup(userData);
    console.log("Signup response:", response);
    // On successful signup, redirect to the login page.
    router.push({ name: "login" });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      errorMessage.value = `Signup error: ${JSON.stringify(error.response.data)}`;
    } else {
      errorMessage.value = "Signup error. Please verify the entered information.";
    }
  }
};
</script>

<template>
  <FloatingConfigurator />
  <div class="auth-background flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
    <div class="flex flex-col items-center justify-center">
      <div class="w-full max-w-[600px] p-6 sm:p-8 bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-surface-200/20 dark:border-surface-700/20">
        <div class="text-center mb-4">
          <div class="flex justify-center mb-4">
            <Logo />
          </div>
          <div class="text-surface-900 dark:text-surface-0 text-2xl font-bold mb-1">
            Create Your Account
          </div>
          <span class="text-surface-600 dark:text-surface-400 text-base">Register to get started</span>
        </div>

        <div class="space-y-4">
          <!-- Username field -->
          <div class="space-y-1">
            <label
              for="username"
              class="block text-surface-900 dark:text-surface-0 text-base font-medium"
            >
              Username
            </label>
            <InputText
              id="username"
              type="text"
              placeholder="Enter your username"
              class="w-full p-2"
              v-model="username"
            />
          </div>

          <!-- Name fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label
                for="firstName"
                class="block text-surface-900 dark:text-surface-0 text-base font-medium"
              >
                First Name
              </label>
              <InputText
                id="firstName"
                type="text"
                placeholder="Enter first name"
                class="w-full p-2"
                v-model="firstName"
              />
            </div>
            <div class="space-y-1">
              <label
                for="lastName"
                class="block text-surface-900 dark:text-surface-0 text-base font-medium"
              >
                Last Name
              </label>
              <InputText
                id="lastName"
                type="text"
                placeholder="Enter last name"
                class="w-full p-2"
                v-model="lastName"
              />
            </div>
          </div>

          <!-- Email field -->
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
            />
          </div>

          <!-- Password fields -->
          <div class="space-y-1">
            <label
              for="password"
              class="block text-surface-900 dark:text-surface-0 text-base font-medium"
            >
              Password
            </label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :toggleMask="true"
              class="w-full"
              :feedback="false"
            />
          </div>

          <div class="space-y-1">
            <label
              for="confirmPassword"
              class="block text-surface-900 dark:text-surface-0 text-base font-medium"
            >
              Confirm Password
            </label>
            <Password
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="Confirm your password"
              :toggleMask="true"
              class="w-full"
              :feedback="false"
              @keyup.enter="register"
            />
          </div>

          <Button
            label="Create Account"
            class="w-full p-2 text-base"
            @click="register"
            :loading="loading"
          />

          <div class="text-center">
            <span class="text-surface-600 dark:text-surface-400">Already have an account? </span>
            <span
              class="font-medium text-primary hover:text-primary-600 transition-colors cursor-pointer"
              @click="router.push({ name: 'login' })"
            >
              Sign In
            </span>
          </div>

          <p v-if="errorMessage" class="text-red-500 text-center mt-2">{{ errorMessage }}</p>
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
