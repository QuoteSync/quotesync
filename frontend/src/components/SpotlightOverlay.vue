<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useSearchStore } from '@/stores/searchStore';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const searchStore = useSearchStore();
const router = useRouter();
const searchInput = ref(null);

// Accessing store state
const isOpen = computed(() => searchStore.isOpen);
const query = computed({
  get: () => searchStore.query,
  set: (value) => searchStore.search(value)
});
const results = computed(() => searchStore.results);
const loading = computed(() => searchStore.loading);
const selectedSection = computed(() => searchStore.selectedSection);
const selectedIndex = computed(() => searchStore.selectedIndex);
const hasResults = computed(() => searchStore.hasResults);

// Focus search input when overlay is opened
watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
});

// Handle keyboard events
const handleKeydown = (event) => {
  if (!isOpen.value) return;
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      searchStore.navigateDown();
      scrollToSelectedResult();
      break;
    case 'ArrowUp':
      event.preventDefault();
      searchStore.navigateUp();
      scrollToSelectedResult();
      break;
    case 'Enter':
      event.preventDefault();
      searchStore.selectResult();
      break;
    case 'Escape':
      event.preventDefault();
      searchStore.closeOverlay();
      break;
  }
};

// Function to scroll the selected result into view
const scrollToSelectedResult = () => {
  nextTick(() => {
    const selectedElement = document.querySelector(`.result-item.selected-result`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
};

// Watch for selected index/section changes to update the selected class
watch([selectedSection, selectedIndex], () => {
  nextTick(() => {
    // Remove selected class from all items
    document.querySelectorAll('.result-item').forEach(item => {
      item.classList.remove('selected-result');
    });
    
    // Add selected class to current item
    const section = selectedSection.value;
    const index = selectedIndex.value;
    const selector = `.${section}-section .result-item:nth-child(${index + 1})`;
    const selectedElement = document.querySelector(selector);
    
    if (selectedElement) {
      selectedElement.classList.add('selected-result');
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
});

// Navigation functions
const navigateToResult = (section, item, index) => {
  switch (section) {
    case 'books':
      router.push(`/books/${item.id}`);
      break;
    case 'authors':
      router.push(`/authors/${item.id}`);
      break;
    case 'tags':
      router.push(`/tags/${item.id}`);
      break;
    case 'quotes':
      router.push(`/quotes/${item.id}`);
      break;
  }
  searchStore.closeOverlay();
};

// Global keyboard shortcut (Cmd+K / Ctrl+K)
const handleGlobalKeydown = (event) => {
  // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    searchStore.toggleOverlay();
  }
};

// Setup and cleanup
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});

// Close overlay when clicking on backdrop
const handleBackdropClick = (event) => {
  // Only close if clicking directly on the backdrop, not on the search modal
  if (event.target === event.currentTarget) {
    searchStore.closeOverlay();
  }
};
</script>

<template>
  <!-- Spotlight overlay backdrop -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="spotlight-overlay fixed inset-0 flex items-start justify-center pt-[15vh] z-50"
      @click="handleBackdropClick"
      @keydown="handleKeydown"
    >
      <!-- Backdrop with blur effect -->
      <div 
        class="absolute inset-0 bg-black/30 dark:bg-gray-900/60 backdrop-blur-sm"
        :class="{ 'animate-fadeIn': isOpen }"
      ></div>
      
      <!-- Search modal -->
      <div 
        class="spotlight-modal relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out"
        :class="{ 'animate-scaleIn': isOpen }"
      >
        <!-- Search input -->
        <div class="p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
          <i class="pi pi-search mr-3 text-gray-500"></i>
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            placeholder="Search books, authors, tags..."
            class="w-full bg-transparent border-none focus:outline-none text-lg text-gray-800 dark:text-gray-100"
            autocomplete="off"
          />
          <div v-if="loading" class="flex-shrink-0 ml-2">
            <i class="pi pi-spin pi-spinner text-gray-500"></i>
          </div>
        </div>
        
        <!-- Search results -->
        <div class="spotlight-results max-h-[60vh] overflow-y-auto p-2">
          <!-- Recent searches (when no query is entered) -->
          <div v-if="!query && searchStore.recentSearches.length > 0" class="mb-4">
            <div class="flex justify-between items-center">
              <h3 class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 p-2">Recent Searches</h3>
              <button 
                @click="searchStore.clearRecentSearches" 
                class="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2"
              >
                Clear
              </button>
            </div>
            <div class="space-y-1">
              <div
                v-for="(recentSearch, index) in searchStore.recentSearches"
                :key="`recent-${index}`"
                @click="query = recentSearch"
                class="result-item p-2 rounded-md flex items-center cursor-pointer transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <div class="w-8 h-8 rounded-md flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                  <i class="pi pi-history text-gray-600 dark:text-gray-400"></i>
                </div>
                <div class="font-medium text-gray-900 dark:text-white">{{ recentSearch }}</div>
              </div>
            </div>
          </div>
          
          <!-- No results message -->
          <div v-if="query && !hasResults && !loading" class="py-8 text-center text-gray-500">
            <i class="pi pi-search mb-2 text-2xl"></i>
            <p>No results found for "{{ query }}"</p>
          </div>
          
          <!-- Loading placeholder -->
          <div v-if="loading && !hasResults" class="py-8 text-center text-gray-500">
            <i class="pi pi-spin pi-spinner mb-2 text-2xl"></i>
            <p>Searching...</p>
          </div>
          
          <!-- Books section -->
          <div v-if="results.books.length > 0" class="mb-4 books-section">
            <h3 class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 p-2">Books</h3>
            <div class="space-y-1">
              <div
                v-for="(book, index) in results.books"
                :key="`book-${book.id}`"
                @click="navigateToResult('books', book, index)"
                class="result-item p-2 rounded-md flex items-center cursor-pointer transition-colors duration-150"
                :class="{
                  'bg-blue-50 dark:bg-blue-900/30 selected-result': selectedSection === 'books' && selectedIndex === index,
                  'hover:bg-gray-100 dark:hover:bg-gray-700/50': !(selectedSection === 'books' && selectedIndex === index)
                }"
              >
                <div class="w-8 h-8 rounded-md flex-shrink-0 bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-3">
                  <i class="pi pi-book text-blue-600 dark:text-blue-300"></i>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ book.title }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400" v-if="book.author">by {{ book.author.name }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Authors section -->
          <div v-if="results.authors.length > 0" class="mb-4 authors-section">
            <h3 class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 p-2">Authors</h3>
            <div class="space-y-1">
              <div
                v-for="(author, index) in results.authors"
                :key="`author-${author.id}`"
                @click="navigateToResult('authors', author, index)"
                class="result-item p-2 rounded-md flex items-center cursor-pointer transition-colors duration-150"
                :class="{
                  'bg-purple-50 dark:bg-purple-900/30 selected-result': selectedSection === 'authors' && selectedIndex === index,
                  'hover:bg-gray-100 dark:hover:bg-gray-700/50': !(selectedSection === 'authors' && selectedIndex === index)
                }"
              >
                <div class="w-8 h-8 rounded-md flex-shrink-0 bg-purple-100 dark:bg-purple-800 flex items-center justify-center mr-3">
                  <i class="pi pi-user text-purple-600 dark:text-purple-300"></i>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ author.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400" v-if="author.books_count">{{ author.books_count }} books</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tags section -->
          <div v-if="results.tags.length > 0" class="mb-4 tags-section">
            <h3 class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 p-2">Tags</h3>
            <div class="space-y-1">
              <div
                v-for="(tag, index) in results.tags"
                :key="`tag-${tag.id}`"
                @click="navigateToResult('tags', tag, index)"
                class="result-item p-2 rounded-md flex items-center cursor-pointer transition-colors duration-150"
                :class="{
                  'bg-green-50 dark:bg-green-900/30 selected-result': selectedSection === 'tags' && selectedIndex === index,
                  'hover:bg-gray-100 dark:hover:bg-gray-700/50': !(selectedSection === 'tags' && selectedIndex === index)
                }"
              >
                <div class="w-8 h-8 rounded-md flex-shrink-0 bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3">
                  <i class="pi pi-tag text-green-600 dark:text-green-300"></i>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ tag.title }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400" v-if="tag.quotes && tag.quotes.length">{{ tag.quotes.length }} quotes</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quotes section -->
          <div v-if="results.quotes && results.quotes.length > 0" class="mb-4 quotes-section">
            <h3 class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 p-2">Quotes</h3>
            <div class="space-y-1">
              <div
                v-for="(quote, index) in results.quotes"
                :key="`quote-${quote.id}`"
                @click="navigateToResult('quotes', quote, index)"
                class="result-item p-2 rounded-md flex items-start cursor-pointer transition-colors duration-150"
                :class="{
                  'bg-amber-50 dark:bg-amber-900/30 selected-result': selectedSection === 'quotes' && selectedIndex === index,
                  'hover:bg-gray-100 dark:hover:bg-gray-700/50': !(selectedSection === 'quotes' && selectedIndex === index)
                }"
              >
                <div class="w-8 h-8 rounded-md flex-shrink-0 bg-amber-100 dark:bg-amber-800 flex items-center justify-center mr-3 mt-1">
                  <i class="pi pi-comment text-amber-600 dark:text-amber-300"></i>
                </div>
                <div class="flex-1 overflow-hidden">
                  <div class="font-medium text-gray-900 dark:text-white">{{ quote.title }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{{ quote.body }}</div>
                  <div class="text-xs text-gray-400 dark:text-gray-500 mt-1" v-if="quote.book">
                    From: {{ quote.book.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- No query and no recent searches -->
          <div v-if="!query && searchStore.recentSearches.length === 0" class="py-8 text-center text-gray-500">
            <i class="pi pi-search mb-2 text-2xl"></i>
            <p>Start typing to search books, authors, and tags</p>
          </div>
          
          <!-- Keyboard shortcuts help -->
          <div v-if="hasResults || (!query && searchStore.recentSearches.length > 0)" class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
            <div class="flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400 p-2">
              <span><kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd> <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd> to navigate</span>
              <span><kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> to select</span>
              <span><kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.spotlight-overlay {
  animation: fadeIn 0.2s ease-out;
}

.spotlight-modal {
  animation: scaleIn 0.3s ease-out forwards;
}

.result-item {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger the animation of result items */
.result-item:nth-child(1) { animation-delay: 0.05s; }
.result-item:nth-child(2) { animation-delay: 0.1s; }
.result-item:nth-child(3) { animation-delay: 0.15s; }
.result-item:nth-child(4) { animation-delay: 0.2s; }
.result-item:nth-child(5) { animation-delay: 0.25s; }
.result-item:nth-child(6) { animation-delay: 0.3s; }
.result-item:nth-child(7) { animation-delay: 0.35s; }
.result-item:nth-child(8) { animation-delay: 0.4s; }
.result-item:nth-child(9) { animation-delay: 0.45s; }
.result-item:nth-child(10) { animation-delay: 0.5s; }
</style> 