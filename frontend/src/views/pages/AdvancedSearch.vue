<template>

  <div class="flex flex-col">
    <div class="card">
    <h1 class="text-3xl font-bold mb-4">Advanced Quote Search</h1>

      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p class="text-gray-600 dark:text-gray-400">
            Search across your quotes using advanced filtering and AI-powered semantic similarity.
            Find exactly what you're looking for with our powerful search capabilities.
          </p>
        </div>
      </div>
      
      <QuoteGraphSearch />
    </div>
  </div>
</template>

<script setup>
import QuoteGraphSearch from '@/components/QuoteGraphSearch.vue';
</script>

<style scoped>
.card {
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 2rem;
  background: var(--surface-card);
}

.card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.search-container {
  position: relative;
  background: var(--surface-ground);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.search-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

h2 {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-400) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

/* Dark mode adjustments */
:root.dark {
  .card {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  
  .search-container {
    background: var(--surface-ground);
  }
  
  .search-container:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card {
    padding: 1.5rem;
  }
  
  h2 {
    font-size: 1.75rem;
  }
}
</style> 