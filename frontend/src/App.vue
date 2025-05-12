<script setup>
import { useLayout } from './layout/composables/layout';
import { onMounted } from 'vue';
import Toast from 'primevue/toast';

// Import our SpotlightOverlay component
import SpotlightOverlay from './components/SpotlightOverlay.vue';

const { isDarkTheme } = useLayout();

onMounted(() => {
  // Add animation keyframes for search overlay
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out forwards;
    }
    
    .animate-scaleIn {
      animation: scaleIn 0.3s ease-out forwards;
    }
  `;
  document.head.appendChild(styleSheet);
});
</script>

<template>
  <div :class="{ 'dark': isDarkTheme }">
    <Toast position="top-right" />
    <router-view />
    <SpotlightOverlay />
  </div>
</template>

<style scoped></style>
