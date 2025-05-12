<template>
  <div>
    <div class="card">
      <h2 class="text-3xl font-bold mb-4">Advanced Quote Search</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Search across your quotes using advanced filtering and AI-powered semantic similarity.
      </p>
      
      <QuoteGraphSearch />
    </div>
  </div>
</template>

<script setup>
import QuoteGraphSearch from '@/components/QuoteGraphSearch.vue';
</script> 