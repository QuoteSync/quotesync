<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { passwordResetWithKey } from "@/api";
import FloatingConfigurator from "@/components/FloatingConfigurator.vue";

const route = useRoute();
const router = useRouter();
const newPassword = ref("");
const confirmPassword = ref("");
const message = ref("");
const isError = ref(false);
const isSuccess = ref(false);
const loading = ref(false);
const key = ref("");

onMounted(() => {
  // Get the key from the route params
  key.value = route.params.key;
});

const resetPassword = async () => {
  // Validate passwords
  if (!newPassword.value) {
    message.value = "Please enter a new password";
    isError.value = true;
    isSuccess.value = false;
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    message.value = "Passwords do not match";
    isError.value = true;
    isSuccess.value = false;
    return;
  }

  try {
    loading.value = true;
    message.value = "";
    isError.value = false;
    isSuccess.value = false;
    
    // Call the API function to reset the password
    const response = await passwordResetWithKey(key.value, newPassword.value);
    
    // Show success message (handling both direct success and 401 from modified API function)
    isSuccess.value = true;
    isError.value = false;
    message.value = "Your password has been reset successfully!";
    
    // Redirect to login after a delay
    setTimeout(() => {
      router.push({ name: "login" });
    }, 3000);
    
  } catch (error) {
    isError.value = true;
    isSuccess.value = false;
    console.error("Password reset error:", error);
    
    if (error.response) {
      if (error.response.status === 400) {
        // Handle validation errors from the backend
        if (error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors;
          if (Array.isArray(errors) && errors.length > 0) {
            message.value = errors.map(err => err.message).join('. ');
          } else {
            message.value = "Invalid reset link or new password. Please try again or request a new reset link.";
          }
        } else {
          message.value = "Invalid reset link or new password. Please try again or request a new reset link.";
        }
      } else {
        message.value = "An error occurred. Please try again later.";
      }
    } else {
      message.value = "An error occurred. Please try again later.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <FloatingConfigurator />
  <div
    class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden"
  >
    <div class="flex flex-col items-center justify-center">
      <div
        style="
          border-radius: 56px;
          padding: 0.3rem;
          background: linear-gradient(
            180deg,
            var(--primary-color) 10%,
            rgba(33, 150, 243, 0) 30%
          );
        "
      >
        <div
          class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20"
          style="border-radius: 53px"
        >
          <div class="text-center mb-8">
            <!-- Logo -->
            <svg
              viewBox="0 0 54 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="mb-8 w-16 shrink-0 mx-auto"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467ZM33.3284 11.4538C31.6493 10.2396 29.5855 9.52381 27.3546 9.52381C25.1195 9.52381 23.0524 10.2421 21.3717 11.4603C20.0078 11.3232 18.6475 11.1387 17.2933 10.907C19.7453 8.11308 23.3438 6.34921 27.3546 6.34921C31.36 6.34921 34.9543 8.10844 37.4061 10.896C36.0521 11.1292 34.692 11.3152 33.3284 11.4538ZM43.826 18.0518C43.881 18.6003 43.9091 19.1566 43.9091 19.7194C43.9091 28.8568 36.4973 36.2642 27.3546 36.2642C18.2117 36.2642 10.8 28.8568 10.8 19.7194C10.8 19.1615 10.8276 18.61 10.8816 18.0663L7.75383 17.4411C7.66775 18.1886 7.62354 18.9488 7.62354 19.7194C7.62354 30.6102 16.4574 39.4388 27.3546 39.4388C38.2517 39.4388 47.0855 30.6102 47.0855 19.7194C47.0855 18.9439 47.0407 18.1789 46.9536 17.4267L43.826 18.0518ZM44.2613 9.54743L40.9084 10.2176C37.9134 5.95821 32.9593 3.1746 27.3546 3.1746C21.7442 3.1746 16.7856 5.96385 13.7915 10.2305L10.4399 9.56057C13.892 3.83178 20.1756 0 27.3546 0C34.5281 0 40.8075 3.82591 44.2613 9.54743Z"
                fill="var(--primary-color)"
              />
            </svg>
            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
              Reset Your Password
            </div>
            <span class="text-muted-color font-medium">Enter your new password</span>
          </div>

          <div>
            <!-- New Password field -->
            <label
              for="newPassword"
              class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
              >New Password</label
            >
            <div class="mb-8">
              <Password
                id="newPassword"
                v-model="newPassword"
                placeholder="Enter new password"
                toggleMask
                class="w-full"
                :feedback="true"
              />
            </div>

            <!-- Confirm Password field -->
            <label
              for="confirmPassword"
              class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
              >Confirm Password</label
            >
            <div class="mb-8">
              <Password
                id="confirmPassword"
                v-model="confirmPassword"
                placeholder="Confirm new password"
                toggleMask
                class="w-full"
                :feedback="false"
                @keyup.enter="resetPassword"
              />
            </div>

            <!-- Success/Error message -->
            <div
              v-if="message"
              class="mb-8 p-4 rounded-lg"
              :class="
                isSuccess
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
              "
            >
              {{ message }}
            </div>

            <!-- Submit button -->
            <Button
              label="Reset Password"
              class="w-full"
              @click="resetPassword"
              :loading="loading"
              :disabled="loading"
            />

            <!-- Back to login link -->
            <div class="text-center mt-4">
              <span class="cursor-pointer text-primary" @click="router.push({ name: 'login' })">
                Back to Login
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.p-password {
  width: 100%;
}
.p-password-input {
  width: 100%;
}
.pi-eye {
  font-size: 1rem;
}
.pi-eye-slash {
  font-size: 1rem;
}
</style> 