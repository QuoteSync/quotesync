<script setup>
import { useSearchStore } from '@/stores/searchStore';

const searchStore = useSearchStore();

// Toggle the search overlay when the button is clicked
const toggleSearch = () => {
  searchStore.toggleOverlay();
};
</script>

<template>
  <button 
    type="button" 
    class="layout-topbar-action flex items-center space-x-1" 
    @click="toggleSearch"
    title="Search (Cmd+K / Ctrl+K)"
  >
    <i class="pi pi-search"></i>
    <span class="hidden md:inline-block text-sm">Search</span>
  </button>
</template>

<style scoped>
.layout-topbar-action {
  transition: all 0.2s ease;
}

.layout-topbar-action:hover {
  background-color: var(--surface-hover);
}
</style> 