<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiClient } from '@/api';
import axios from 'axios';
import FloatingConfigurator from "@/components/FloatingConfigurator.vue";

const route = useRoute();
const router = useRouter();
const status = ref('verifying');
const message = ref('');

onMounted(async () => {
  try {
    const key = route.params.key;
    
    // Use the correct headless API endpoint
    const response = await apiClient.post(`/_allauth/browser/v1/auth/confirm-email/`, { key });
    
    // If successful, update the status
    if (response.status === 200) {
      status.value = 'success';
      message.value = 'Your email has been verified successfully! You can now log in.';
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push({ name: 'login' });
      }, 3000);
    } else {
      status.value = 'error';
      message.value = 'Failed to verify your email. The link may be invalid or expired.';
    }
  } catch (error) {
    status.value = 'error';
    console.error('Email verification error:', error);
    
    if (error.response && error.response.data) {
      message.value = error.response.data.detail || 'Failed to verify your email. The link may be invalid or expired.';
    } else {
      message.value = 'Failed to verify your email. The link may be invalid or expired.';
    }
  }
});
</script>

<template>
  <FloatingConfigurator />
  <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
    <div class="flex flex-col items-center justify-center p-8">
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
            <!-- SVG icon -->
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
            
            <!-- Verification status -->
            <div v-if="status === 'verifying'" class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
              Verifying your email...
              <i class="pi pi-spin pi-spinner ml-2"></i>
            </div>
            
            <div v-else-if="status === 'success'" class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
              Email Verified!
              <i class="pi pi-check-circle ml-2 text-green-500"></i>
            </div>
            
            <div v-else class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
              Verification Failed
              <i class="pi pi-times-circle ml-2 text-red-500"></i>
            </div>
            
            <!-- Message -->
            <p class="text-muted-color">{{ message }}</p>
            
            <!-- Buttons -->
            <div class="mt-8">
              <Button v-if="status === 'error'" 
                      label="Back to Login" 
                      @click="router.push({name: 'login'})" 
                      class="px-5 py-2 mr-2" />
              
              <Button v-if="status === 'error'" 
                      label="Try Again" 
                      @click="window.location.reload()" 
                      class="px-5 py-2 p-button-outlined" />
              
              <div v-if="status === 'success'" class="text-sm text-muted-color mt-4">
                Redirecting to login...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* You can add custom styles here if needed */
</style> 