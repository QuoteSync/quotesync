<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';

const props = defineProps({
  books: {
    type: Array,
    required: true,
    default: () => []
  },
  viewMoreRoute: {
    type: String,
    default: '/books'
  }
});

// Window width for responsive layout
const windowWidth = ref(window.innerWidth);

// Get responsive width for book cards based on screen width
const getBookWidth = computed(() => {
  const width = windowWidth.value;
  
  // Return appropriate percentage based on breakpoints
  if (width >= 1400) {
    // XL screens: 5 items per row
    return '20%';
  } else if (width >= 1024) {
    // Large screens: 4 items per row
    return '25%';
  } else if (width >= 768) {
    // Medium screens: 3 items per row
    return '33.333%';
  } else if (width >= 640) {
    // Small screens: 2 items per row
    return '50%';
  } else {
    // Extra small screens: 1 item per row
    return '100%';
  }
});

// Generate a random gradient for books without covers
const getRandomGradient = () => {
  const gradients = [
    { background: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { background: 'linear-gradient(135deg, #6a11cb, #2575fc)' },
    { background: 'linear-gradient(135deg, #a8c0ff, #3f2b96)' },
    { background: 'linear-gradient(135deg, #f83600, #f9d423)' },
    { background: 'linear-gradient(135deg, #ff4e50, #f9d423)' },
    { background: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { background: 'linear-gradient(135deg, #ff9966, #ff5e62)' },
    { background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)' },
    { background: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
    { background: 'linear-gradient(135deg, #fc00ff, #00dbde)' }
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

// Handler for window resize
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// Add window resize listener on mounted
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

// Clean up on unmounted
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.book-card-hover {
  transform: translateY(0);
  will-change: transform, box-shadow;
  transition: all 0.3s;
}

.book-card-hover:hover {
  transform: translateY(-5px) scale(1.05);
  z-index: 10;
}
</style>

<template>
  <div>
    <div class="flex justify-between mb-4">
      <h5 class="m-0 font-semibold text-xl">Popular Books</h5>
      <Button 
        label="More Books" 
        icon="pi pi-external-link" 
        size="small"
        class="p-button-text"
        @click="$router.push(viewMoreRoute)"
      />
    </div>
    
    <div class="overflow-x-hidden" v-if="books && books.length > 0">
      <div style="display: flex; flex-wrap: wrap; margin: 0;" class="pb-3">
        <div 
          v-for="(book, index) in (books || []).slice(0, 5)" 
          :key="book?.id || index" 
          :style="{
            padding: '12px',
            width: getBookWidth,
          }"
        >
          <!-- Book Card - Wrapped in router-link to make entire card clickable -->
          <router-link 
            :to="`/books/${book && book.id ? book.id : ''}`"
            class="block cursor-pointer"
            style="text-decoration: none; color: inherit;"
          >
            <div class="shadow-md overflow-hidden transition-all duration-200 hover:shadow-xl hover:transform hover:scale-105 group book-card-hover relative" style="border-radius: 1rem; transform-origin: center center;">
              <!-- Overlay on hover -->
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100" style="border-radius: 1rem;">
                <div class="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                  <i class="pi pi-eye text-primary" style="font-size: 1.5rem;"></i>
                </div>
              </div>

              <!-- Book Cover -->
              <div style="width: 100%; height: 300px; position: relative; border-top-left-radius: 1rem; border-top-right-radius: 1rem; overflow: hidden;">
                <img 
                  v-if="book && book.cover" 
                  :src="book.cover" 
                  :alt="book.title || ''" 
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  style="border-top-left-radius: 1rem; border-top-right-radius: 1rem;"
                />
                <div 
                  v-else 
                  class="transition-all duration-300 group-hover:bg-opacity-90"
                  style="width: 100%; height: 100%; position: relative; overflow: hidden; border-top-left-radius: 1rem; border-top-right-radius: 1rem;"
                  :style="{ 
                    background: book && book.gradient_primary_color && book.gradient_secondary_color 
                      ? `linear-gradient(135deg, ${book.gradient_primary_color}, ${book.gradient_secondary_color})` 
                      : getRandomGradient().background 
                  }"
                >
                  <!-- Fallback design -->
                  <div style="width: 100%; height: 100%; display: flex; flex-direction: column; padding: 1rem; position: relative;">
                    <!-- Light reflection -->
                    <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 150%; background: rgba(255,255,255,0.1); transform: rotate(30deg); z-index: 10;"></div>
                    
                    <!-- Center content -->
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2;">
                      <!-- Circle with initial -->
                      <div style="width: 5rem; height: 5rem; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 0 15px rgba(255,255,255,0.1);">
                        <div style="width: 4rem; height: 4rem; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;">
                          <span style="color: rgba(255,255,255,0.8); font-size: 1.5rem; font-family: serif;">{{ book && book.title ? book.title.charAt(0) : '?' }}</span>
                        </div>
                      </div>
                      
                      <!-- Decorative lines -->
                      <div style="width: 4rem; height: 2px; background: rgba(255,255,255,0.2); margin-bottom: 0.25rem; border-radius: 1px;"></div>
                      <div style="width: 6rem; height: 2px; background: rgba(255,255,255,0.2); border-radius: 1px;"></div>
                    </div>
                    
                    <!-- Title area -->
                    <div style="margin-top: auto; text-align: center; z-index: 2;">
                      <span style="color: white; font-weight: bold; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; display: block; line-height: 1.2;">
                        {{ book && book.title ? book.title : 'Unknown' }}
                      </span>
                      <div style="width: 3rem; height: 2px; background: rgba(255,255,255,0.4); margin: 0.5rem auto; border-radius: 1px;"></div>
                      <span style="color: rgba(255,255,255,0.8); font-size: 0.75rem; font-style: italic; display: block;">
                        by {{ book && book.author && book.author.name ? book.author.name : 'Unknown Author' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Book Details (below the cover) -->
              <div style="padding: 0.75rem; border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem;" class="bg-white dark:bg-gray-800">
                <!-- Quote count -->
                <div style="display: flex; align-items: center; justify-content: center;padding: 0.5rem; border-radius: 0.75rem;" class="bg-gray-50 dark:bg-gray-900/20 transition-colors duration-200 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/10">
                  <i class="pi pi-bookmark-fill transition-colors duration-200 group-hover:text-orange-500" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                  <span style="font-weight: 500;" class="transition-colors duration-200 group-hover:text-orange-600 dark:group-hover:text-orange-300">{{ book && book.quotes_count ? book.quotes_count : 0 }} quotes</span>
                </div>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    
    <div class="text-center p-5" v-else>
      <i class="pi pi-book text-gray-400 text-4xl mb-3 block"></i>
      <p class="text-600">No popular books found. Start adding books to your collection!</p>
      <Button label="Add Books" icon="pi pi-plus" class="mt-2" @click="$router.push(viewMoreRoute)"/>
    </div>
  </div>
</template> 