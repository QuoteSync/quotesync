<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { TagService } from "@/service/TagService";
import { QuoteService } from "@/service/QuoteService";
import QuoteCard from "@/components/QuoteCard.vue"; // Import the reusable QuoteCard component
import QuoteModal from '@/components/QuoteModal.vue'; // Import QuoteModal

const route = useRoute();
const tag = ref(null);
const tagId = route.params.id;
const quotes = ref([]);

// Function to generate a random gradient for the tag
const getRandomGradient = () => {
  // Book cover themed gradient combinations
  const gradients = [
    { primary: "#1E3A8A", secondary: "#3B82F6" },  // Blue theme
    { primary: "#9D174D", secondary: "#EC4899" },  // Pink theme
    { primary: "#064E3B", secondary: "#10B981" },  // Green theme
    { primary: "#723B13", secondary: "#D97706" },  // Amber theme
    { primary: "#581C87", secondary: "#8B5CF6" },  // Purple theme
    { primary: "#831843", secondary: "#BE185D" },  // Deep pink theme
    { primary: "#134E4A", secondary: "#0F766E" },  // Teal theme
    { primary: "#7F1D1D", secondary: "#DC2626" },  // Red theme
  ];
  
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];
  return {
    primary: gradient.primary, 
    secondary: gradient.secondary,
    background: `linear-gradient(135deg, ${gradient.primary}, ${gradient.secondary})`
  };
};

// Reactive states for like and editing functionality on quotes
const likedQuotes = ref({});
const editingQuoteId = ref(null);
const editedQuoteText = ref("");

// Reactive states for filters
const selectedBook = ref("");
const showFavorites = ref(false);

// Add modal state variables
const showQuoteModal = ref(false);
const selectedQuote = ref(null);
const selectedQuoteIndex = ref(-1);

// Computed: List of all available books from the quotes
const allBooks = computed(() => {
  if (!quotes.value || quotes.value.length === 0) return [];
  const booksSet = new Set();
  
  quotes.value.forEach((quote) => {
    if (quote.book && quote.book.title) {
      booksSet.add(quote.book.title);
    }
  });
  
  return Array.from(booksSet);
});

// Computed: Quotes filtered based on selected book and favorites flag
const filteredQuotes = computed(() => {
  if (!quotes.value || quotes.value.length === 0) return [];
  
  return quotes.value.filter((quote) => {
    let bookMatch = true;
    let favoriteMatch = true;
    
    if (selectedBook.value) {
      bookMatch = quote.book && quote.book.title === selectedBook.value;
    }
    
    if (showFavorites.value) {
      favoriteMatch = quote.is_favorite;
    }
    
    return bookMatch && favoriteMatch;
  });
});

// Functions to handle quote actions
const toggleLikeQuote = async (quoteId) => {
  try {
    const response = await QuoteService.toggleFavorite(quoteId);
    // Update the local state based on the server response
    const quote = quotes.value.find(q => q.id === quoteId);
    if (quote) {
      quote.is_favorite = response.is_favorite;
      
      // If this quote was favorited, move it to the top of the list
      if (response.is_favorite) {
        // Remove the quote from its current position
        const index = quotes.value.findIndex(q => q.id === quoteId);
        if (index !== -1) {
          const [favoriteQuote] = quotes.value.splice(index, 1);
          // Add it to the beginning of the array
          quotes.value.unshift(favoriteQuote);
          
          // Scroll to the top to show the favorited quote
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    likedQuotes.value[quoteId] = response.is_favorite;
  } catch (error) {
    console.error("Error toggling favorite status:", error);
  }
};

const startEditingQuote = (quote) => {
  editingQuoteId.value = quote.id;
  editedQuoteText.value = quote.body;
};

const cancelEditingQuote = () => {
  editingQuoteId.value = null;
  editedQuoteText.value = "";
};

const saveEditedQuote = async (quote) => {
  console.log("Saving edited quote:", quote.tags);
  const updatedQuote = await QuoteService.updateQuote(quote.id, {
    body: quote.body,
    tags: quote.tags,
  });
  console.log("Quote updated:", updatedQuote);
  const index = quotes.value.findIndex((q) => q.id === quote.id);
  if (index !== -1) {
    quotes.value[index] = updatedQuote;
  }
  editingQuoteId.value = null;
  editedQuoteText.value = "";
};

// Add function to handle quote click
const openQuoteModal = (quote) => {
  // Find the index of the quote in filteredQuotes
  const index = filteredQuotes.value.findIndex(q => q.id === quote.id);
  selectedQuote.value = quote;
  selectedQuoteIndex.value = index;
  showQuoteModal.value = true;
};

// Add navigation functions
const navigateToPreviousQuote = () => {
  if (selectedQuoteIndex.value > 0) {
    selectedQuoteIndex.value -= 1;
    selectedQuote.value = filteredQuotes.value[selectedQuoteIndex.value];
  }
};

const navigateToNextQuote = () => {
  if (selectedQuoteIndex.value < filteredQuotes.value.length - 1) {
    selectedQuoteIndex.value += 1;
    selectedQuote.value = filteredQuotes.value[selectedQuoteIndex.value];
  }
};

onMounted(async () => {
  try {
    // Get tag details
    const tagData = await TagService.getTag(tagId);
    
    // Create gradient object - either from stored values or generate new one
    if (tagData.gradient_primary_color && tagData.gradient_secondary_color) {
      // Use the stored gradient colors from the database
      console.log(`Tag ${tagData.id} already has gradient colors:`, tagData.gradient_primary_color, tagData.gradient_secondary_color);
      tagData.gradient = {
        primary: tagData.gradient_primary_color,
        secondary: tagData.gradient_secondary_color,
        background: `linear-gradient(135deg, ${tagData.gradient_primary_color}, ${tagData.gradient_secondary_color})`
      };
    } else {
      // Generate a new random gradient and store it in the database
      console.log(`Tag ${tagData.id} needs new gradient colors`);
      tagData.gradient = getRandomGradient();
      console.log(`Generated colors for tag ${tagData.id}:`, tagData.gradient.primary, tagData.gradient.secondary);
      
      // Save the gradient colors to the database
      TagService.updateGradientColors(
        tagData.id,
        tagData.gradient.primary,
        tagData.gradient.secondary
      ).then(response => {
        console.log(`Successfully saved gradient colors for tag ${tagData.id}:`, response);
      }).catch(error => {
        console.error(`Error saving gradient colors for tag ${tagData.id}:`, error);
      });
    }
    
    tag.value = tagData;
    
    // Get quotes with this tag
    const quotesData = await TagService.getQuotesByTag(tagData.title);
    quotesData.forEach((quote) => {
      likedQuotes.value[quote.id] = quote.is_favorite;
    });
    quotes.value = quotesData;
  } catch (error) {
    console.error("Error loading tag data:", error);
  }
});
</script>

<template>
  <div v-if="tag" class="flex h-screen overflow-hidden">
    <!-- Tag Panel (1/4) -->
    <div class="w-1/4 h-screen p-6 flex flex-col items-center sticky top-0">
      <div class="w-full h-full bg-surface-0 dark:bg-surface-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-700 p-6 flex flex-col items-center">
        <!-- Tag Badge -->
        <div 
          class="relative group w-full" 
          style="aspect-ratio: 3/4;"
        >
          <div class="absolute inset-0 w-full h-full rounded-2xl shadow-lg transform transition-transform duration-300 group-hover:scale-105 overflow-hidden"
            :style="{ background: tag.gradient.background }"
          >
            <!-- Light reflection effect -->
            <div class="absolute top-0 right-0 w-16 h-[150%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-5px) translateY(-5px);"></div>
            
            <!-- Decorative elements -->
            <div class="w-full h-full flex flex-col items-center justify-center p-4 relative">
              <!-- Decorative circle -->
              <div class="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center mb-4">
                <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <span class="text-white/90 text-4xl font-serif">{{ tag.title.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              
              <!-- Tag name -->
              <div class="mt-4 text-center z-10">
                <span class="text-white font-bold text-3xl">#{{ tag.title }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tag Name -->
        <h1 class="text-3xl font-bold fancy-font mt-6 mb-4 text-center bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">#{{ tag.title }}</h1>

        <!-- Tag Stats -->
        <div class="text-center text-surface-600 dark:text-surface-400">
          <p class="text-lg">{{ quotes.length }} quotes with this tag</p>
        </div>
      </div>
    </div>

    <!-- Content Panel (3/4) -->
    <div class="w-3/4 h-screen overflow-y-auto pl-8">
      <div class="max-w-6xl mx-auto p-8 space-y-12">
        <!-- Quotes Section -->
        <div class="relative">
          <div class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-3xl hover:shadow-xl transition-all duration-300 relative">
            <h2 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Tagged Quotes</h2>

            <!-- Filters -->
            <div class="mb-8 flex flex-col md:flex-row items-center justify-center gap-6 bg-surface-50 dark:bg-surface-800 p-6 rounded-2xl shadow-sm">
              <!-- Book filter -->
              <div v-if="allBooks.length > 0" class="filter-item">
                <label class="mr-2 font-semibold text-surface-700 dark:text-surface-200">Book:</label>
                <select 
                  v-model="selectedBook" 
                  class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                >
                  <option value="">All Books</option>
                  <option v-for="book in allBooks" :key="book" :value="book">{{ book }}</option>
                </select>
              </div>
              
              <!-- Favorites filter -->
              <div class="filter-item flex items-center">
                <label class="mr-2 font-semibold text-surface-700 dark:text-surface-200">Favorites:</label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="showFavorites" 
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-surface-200 dark:bg-surface-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            <!-- Quotes List -->
            <div v-if="filteredQuotes && filteredQuotes.length" class="flex flex-col gap-6 mt-8">
              <div v-for="(quote, index) in filteredQuotes" :key="quote.id" class="relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-2xl transform rotate-2 group-hover:rotate-3 transition-transform duration-300"></div>
                <QuoteCard
                  :quote="quote"
                  :liked="likedQuotes[quote.id]"
                  :has-previous="index > 0"
                  :has-next="index < filteredQuotes.length - 1"
                  @toggle-like="toggleLikeQuote"
                  @save-edit="saveEditedQuote"
                  @cancel-edit="cancelEditingQuote"
                  @click="openQuoteModal(quote)"
                  class="transform transition-all duration-300 hover:-translate-y-1 relative"
                />
              </div>
            </div>
            <div v-else class="text-center text-surface-500 p-8">
              <i class="pi pi-quote-right text-4xl mb-4"></i>
              <p class="text-lg">No quotes available with these filters.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QuoteModal -->
    <QuoteModal
      v-if="selectedQuote"
      v-model:visible="showQuoteModal"
      :quote="selectedQuote"
      :liked="selectedQuote ? likedQuotes[selectedQuote.id] : false"
      :has-previous="selectedQuoteIndex > 0"
      :has-next="selectedQuoteIndex < (filteredQuotes?.length || 0) - 1"
      @toggle-like="toggleLikeQuote"
      @previous-quote="navigateToPreviousQuote"
      @next-quote="navigateToNextQuote"
    />
  </div>
  <div v-else class="flex justify-center items-center h-screen">
    <div class="text-center">
      <i class="pi pi-spin pi-spinner text-primary text-4xl mb-4"></i>
      <p class="text-lg text-surface-600">Loading tag details...</p>
    </div>
  </div>
</template>

<style scoped>
/* Book cover styling */
.book-cover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
  background-repeat: repeat;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  position: relative;
  transition-property: transform;
  transition-duration: 300ms;
}

.book-cover:hover {
  transform: scale(1.05);
}

/* Add new styles for the layout */
.h-screen {
  height: 100vh;
  max-height: 100vh;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}

/* Custom scrollbar for the content panel */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--surface-300);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--surface-400);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--surface-600);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--surface-500);
}

/* Add new styles for the floating tag panel */
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.dark .shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Add a subtle hover effect to the tag panel */
.w-1\/4 > div {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.w-1\/4 > div:hover {
  transform: translateY(-2px);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.3);
}

.dark .w-1\/4 > div:hover {
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6);
}
</style>
