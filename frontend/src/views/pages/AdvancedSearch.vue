<template>
  <div class="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-900 rounded-3xl">
    <!-- Header Section -->
    <div class="sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 rounded-t-3xl">
      <div class="container mx-auto px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 class="text-4xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent rounded text-center sm:text-left">
            Advanced Quote Search
          </h1>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8">
      <div class="grid">
        <div class="col-12">
          <div class="bg-surface-ground dark:bg-surface-800 rounded-3xl p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                  <i class="pi pi-search text-2xl text-primary-500"></i>
                </div>
                <p class="text-lg text-500 dark:text-400 m-0">
                  Use our advanced search to find quotes by content, author, book, tags, and more. You can combine multiple criteria to narrow down your results.
                </p>
              </div>
            </div>

            <!-- Search Component -->
            <QuoteGraphSearch />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import QuoteGraphSearch from '@/components/QuoteGraphSearch.vue';
</script>

<style scoped>
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--surface-300);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--surface-400);
}

.dark ::-webkit-scrollbar-thumb {
  background: var(--surface-600);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: var(--surface-500);
}
</style> 