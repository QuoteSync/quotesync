<script setup>
import { onMounted, ref } from 'vue';
import { AuthorService } from '@/service/AuthorService';

const authors = ref([]);

// Generate a random gradient for fallbacks
const getRandomGradient = () => {
  const gradients = [
    { primary: '#667eea', secondary: '#764ba2' },
    { primary: '#6a11cb', secondary: '#2575fc' },
    { primary: '#a8c0ff', secondary: '#3f2b96' },
    { primary: '#f83600', secondary: '#f9d423' },
    { primary: '#11998e', secondary: '#38ef7d' },
    { primary: '#ff9966', secondary: '#ff5e62' },
    { primary: '#1a2a6c', secondary: '#b21f1f' },
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

onMounted(async () => {
  try {
    // Get all authors and sort by popularity
    const data = await AuthorService.getAuthors();
    authors.value = data
      .filter(author => author.books_count > 0)
      .sort((a, b) => (b.books_count || 0) - (a.books_count || 0))
      .slice(0, 5);
    
    // Add gradient colors to authors without them
    authors.value.forEach(author => {
      if (!author.gradient_primary_color || !author.gradient_secondary_color) {
        const gradient = getRandomGradient();
        author.gradient_primary_color = author.gradient_primary_color || gradient.primary;
        author.gradient_secondary_color = author.gradient_secondary_color || gradient.secondary;
      }
    });
  } catch (error) {
    console.error('Error fetching authors:', error);
    authors.value = [];
  }
});
</script>

<style scoped>
.author-card {
  transform: translateY(0);
  will-change: transform, box-shadow;
  transition: all 0.3s;
  border-radius: 1rem;
  overflow: hidden;
}

.author-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.author-image {
  transition: transform 0.3s;
}

.author-card:hover .author-image {
  transform: scale(1.1);
}
</style>

<template>
  <ul class="list-none p-0 m-0 grid">
    <li v-for="author in authors" :key="author.id" class="col-12 md:col-6 p-2">
      <router-link :to="`/authors/${author.id}`" class="block no-underline" style="color: inherit;">
        <div class="shadow-md author-card group relative">
          <!-- Overlay on hover -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100" style="border-radius: 1rem;">
            <div class="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
              <i class="pi pi-user text-primary" style="font-size: 1.3rem;"></i>
            </div>
          </div>
          
          <div class="flex overflow-hidden" style="border-radius: 1rem;">
            <!-- Author image/gradient -->
            <div class="w-1/3 h-auto overflow-hidden" style="min-height: 120px;">
              <img 
                v-if="author.cover" 
                :src="author.cover" 
                :alt="author.name" 
                class="w-full h-full object-cover author-image"
              />
              <div 
                v-else 
                class="w-full h-full author-image"
                :style="{ 
                  background: `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})` 
                }"
              >
                <div class="flex items-center justify-center h-full">
                  <div class="w-12 h-12 rounded-full border-2 border-white border-opacity-30 flex items-center justify-center">
                    <span class="text-white text-xl font-serif">{{ author.name ? author.name.charAt(0) : '?' }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Author info -->
            <div class="w-2/3 p-3 bg-white dark:bg-gray-800 flex flex-column justify-content-center">
              <span class="text-900 dark:text-white font-bold text-lg block mb-1 truncate">{{ author.name }}</span>
              <div class="flex align-items-center mt-2">
                <i class="pi pi-book text-orange-500 mr-2"></i>
                <span class="text-600 dark:text-gray-400 font-medium">{{ author.books_count || '0' }} Books</span>
              </div>
              <div class="mt-2 surface-300 border-round overflow-hidden w-full" style="height: 6px">
                <div class="bg-primary h-full group-hover:bg-orange-500 transition-colors duration-300" :style="{ width: `${Math.min(author.books_count * 10, 100)}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </router-link>
    </li>
    <li v-if="authors.length === 0" class="col-12 flex justify-content-center text-500 p-4">
      <div class="text-center">
        <i class="pi pi-users text-gray-400 text-4xl mb-3 block"></i>
        <p>No popular authors found</p>
      </div>
    </li>
  </ul>
</template>
