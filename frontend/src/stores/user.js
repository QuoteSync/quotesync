import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  // State
  const subscription_type = ref('free');
  const user = ref(null);

  // Getters
  const isFree = computed(() => subscription_type.value === 'free');
  const isReader = computed(() => subscription_type.value === 'reader');
  const isScholar = computed(() => subscription_type.value === 'scholar');
  const hasPaidSubscription = computed(() => ['reader', 'scholar'].includes(subscription_type.value));

  // Actions
  function setUser(userData) {
    user.value = userData;
    if (userData?.subscription_type) {
      subscription_type.value = userData.subscription_type;
    }
  }

  function setSubscription(type) {
    if (['free', 'reader', 'scholar'].includes(type)) {
      subscription_type.value = type;
    }
  }

  function clearUser() {
    user.value = null;
    subscription_type.value = 'free';
  }

  return {
    // State
    subscription_type,
    user,
    
    // Getters
    isFree,
    isReader,
    isScholar,
    hasPaidSubscription,
    
    // Actions
    setUser,
    setSubscription,
    clearUser
  };
}); 