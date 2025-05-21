<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { TagService } from "@/service/TagService";
import { QuoteService } from "@/service/QuoteService";
import { QuoteListService } from "@/service/QuoteListService";
import QuoteCard from "@/components/QuoteCard.vue"; // Import the reusable QuoteCard component
import QuoteModal from '@/components/QuoteModal.vue'; // Import QuoteModal
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import QuoteListMenu from '@/components/QuoteListMenu.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const tag = ref(null);
const tagId = route.params.id;
const quotes = ref([]);
const loading = ref(true);

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

const showQuoteListMenu = ref(false);
const selectedQuoteForList = ref(null);

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

const loadTag = async () => {
  try {
    const tagData = await TagService.getTag(tagId);
    tag.value = tagData;
    
    // Get quotes with this tag
    const quotesData = await TagService.getQuotesByTag(tagData.title);
    quotes.value = quotesData;
    
    // Initialize liked status for each quote
    quotesData.forEach(quote => {
      likedQuotes.value[quote.id] = quote.is_favorite || false;
    });
  } catch (error) {
    console.error('Error loading tag:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load tag',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const addAllQuotesToList = async (listId) => {
  try {
    // Add all quotes to the selected list
    for (const quote of quotes.value) {
      await QuoteListService.addQuoteToList(listId, quote.id);
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'All quotes added to the list',
      life: 3000
    });
  } catch (error) {
    console.error('Error adding quotes to list:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add quotes to list',
      life: 3000
    });
  }
};

onMounted(async () => {
  try {
    // Get tag details
    await loadTag();
    
    // Create gradient object - either from stored values or generate new one
    if (tag.value.gradient_primary_color && tag.value.gradient_secondary_color) {
      // Use the stored gradient colors from the database
      console.log(`Tag ${tag.value.id} already has gradient colors:`, tag.value.gradient_primary_color, tag.value.gradient_secondary_color);
      tag.value.gradient = {
        primary: tag.value.gradient_primary_color,
        secondary: tag.value.gradient_secondary_color,
        background: `linear-gradient(135deg, ${tag.value.gradient_primary_color}, ${tag.value.gradient_secondary_color})`
      };
    } else {
      // Generate a new random gradient and store it in the database
      console.log(`Tag ${tag.value.id} needs new gradient colors`);
      tag.value.gradient = getRandomGradient();
      console.log(`Generated colors for tag ${tag.value.id}:`, tag.value.gradient.primary, tag.value.gradient.secondary);
      
      // Save the gradient colors to the database
      TagService.updateGradientColors(
        tag.value.id,
        tag.value.gradient.primary,
        tag.value.gradient.secondary
      ).then(response => {
        console.log(`Successfully saved gradient colors for tag ${tag.value.id}:`, response);
      }).catch(error => {
        console.error(`Error saving gradient colors for tag ${tag.value.id}:`, error);
      });
    }
  } catch (error) {
    console.error("Error loading tag data:", error);
  }
});
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Tag Info Panel (1/4) -->
    <div class="w-1/4 p-4 md:p-2 flex flex-col items-center sticky top-4">
      <div class="w-full bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden flex flex-col group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in">
        <!-- Tag Cover -->
        <div class="relative aspect-[21/9] overflow-hidden">
          <!-- Tag Cover Background -->
          <div 
            class="absolute inset-0 flex items-center justify-center overflow-hidden"
            :style="{ background: tag?.gradient?.background || (tag?.gradient_primary_color && tag?.gradient_secondary_color ? 
              `linear-gradient(135deg, ${tag.gradient_primary_color}, ${tag.gradient_secondary_color})` : 
              getRandomGradient().background) }"
          >
            <div class="w-full h-full flex items-center justify-center p-4 relative">
              <!-- Light reflection effect -->
              <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
              
              <!-- Tag name -->
              <div class="relative z-10 text-center w-full px-4">
                <span class="text-white font-bold text-3xl fancy-font whitespace-normal break-words">{{ tag?.title || 'Loading...' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tag Info -->
        <div class="p-6 flex-1 flex flex-col">
          <p class="text-surface-600 dark:text-surface-400 mb-4">{{ tag?.description || 'No description' }}</p>
          
          <!-- Stats and Actions -->
          <div class="mt-auto flex items-center justify-between">
            <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-3 py-1 rounded-full">
              <i class="pi pi-comment text-primary-500"></i>
              <span class="text-sm font-medium">{{ tag?.quotes?.length || 0 }} quotes</span>
            </div>
            <div class="relative">
              <Button
                icon="pi pi-list"
                rounded
                text
                outlined
                size="small"
                class="fancy-list-button fancy-button transition-all duration-300"
                @click="showQuoteListMenu = true"
                v-tooltip.top="'Save to List'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Panel (3/4) -->
    <div class="w-3/4 h-screen overflow-y-auto pl-8 animate-slide-in">
      <div class="max-w-6xl mx-auto p-8 space-y-12">
        <!-- Quotes Section -->
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-3xl transform -rotate-0.25"></div>
          <div class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-3xl hover:shadow-xl transition-all duration-300 relative">
            <h2 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Quotes</h2>

            <!-- Loading state -->
            <div v-if="loading" class="grid grid-cols-12 gap-4">
              <div class="col-span-12">
                <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg animate-pulse">
                  <div class="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
                  <div class="h-4 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>

            <!-- Quotes Grid -->
            <div v-else-if="tag" class="mt-10">
              <div v-if="quotes && quotes.length" class="flex flex-col gap-6">
                <div v-for="(quote, index) in quotes" :key="quote.id" class="relative group">
                  <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-2xl transform rotate-2 group-hover:rotate-3 transition-transform duration-300"></div>
                  <QuoteCard
                    :quote="quote"
                    :liked="likedQuotes[quote.id]"
                    :showActions="true"
                    :has-previous="index > 0"
                    :has-next="index < quotes.length - 1"
                    @toggle-like="toggleLikeQuote"
                    @remove-quote="handleRemoveQuote"
                    @previous-quote="navigateToPreviousQuote"
                    @next-quote="navigateToNextQuote"
                    @click="openQuoteModal(quote, index)"
                    class="transform transition-all duration-300 hover:-translate-y-1 relative"
                  />
                  
                  <!-- Display chapter information if present -->
                  <div v-if="quote.chapter" class="text-sm text-gray-600 mt-2 ml-4">
                    <span class="font-medium">Chapter:</span> {{ quote.chapter }}
                  </div>
                  
                  <!-- Display link to Google Books if present -->
                  <div v-if="quote.book_url" class="text-sm text-blue-600 mt-1 ml-4">
                    <a :href="quote.book_url" target="_blank" class="flex items-center">
                      <i class="pi pi-external-link mr-1"></i>
                      <span>View in Google Books</span>
                    </a>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-surface-500 p-8">
                <i class="pi pi-quote-right text-4xl mb-4"></i>
                <p class="text-lg">No quotes available for this tag.</p>
              </div>
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

/* Add these new styles */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Add transition for the content panel */
.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* View transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

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

/* Line clamp utilities */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Dialog styles */
:deep(.fancy-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.fancy-dialog .p-dialog-header) {
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
  border-bottom: 1px solid var(--surface-border);
}

:deep(.fancy-dialog .p-dialog-content) {
  background: var(--surface-card);
}

/* Input styles */
:deep(.fancy-input) {
  border-radius: 12px;
  border: 2px solid var(--surface-border);
  transition: all 0.3s ease;
  background: var(--surface-ground);
}

:deep(.fancy-input:hover) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px rgba(var(--primary-500-rgb), 0.1);
}

:deep(.fancy-input:focus) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(var(--primary-500-rgb), 0.2);
}

/* Label styles */
.fancy-label {
  color: var(--text-color-secondary);
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.fancy-input:focus) + .fancy-label {
  color: var(--primary-500);
}

/* Button styles */
:deep(.fancy-cancel-button) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.fancy-cancel-button:hover) {
  background: rgba(var(--surface-500-rgb), 0.1);
  transform: translateY(-2px);
}

:deep(.fancy-create-button) {
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
  border: none;
  transition: all 0.3s ease;
}

:deep(.fancy-create-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.3);
}

/* Dark mode adjustments */
:root.dark {
  :deep(.fancy-dialog) {
    background: var(--surface-ground);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  }

  :deep(.fancy-dialog .p-dialog-header) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.15),
      rgba(var(--primary-400-rgb), 0.05)
    );
  }

  :deep(.fancy-input) {
    background: var(--surface-ground);
    border-color: var(--surface-border);
  }

  :deep(.fancy-input:hover) {
    border-color: var(--primary-400);
  }

  :deep(.fancy-input:focus) {
    border-color: var(--primary-400);
    box-shadow: 0 0 0 3px rgba(var(--primary-400-rgb), 0.2);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Update styles for the save to list button */
:deep(.save-to-list-button) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  transition: all 0.3s ease;
  border: none;
  padding: 0.75rem;
  border-radius: 12px;
  font-weight: 500;
}

:deep(.save-to-list-button:hover) {
  background: linear-gradient(135deg, rgba(var(--primary-500-rgb), 0.3), rgba(var(--primary-500-rgb), 0.1));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.2);
}

:deep(.save-to-list-button::after) {
  background: linear-gradient(45deg, var(--primary-500), var(--primary-400));
}

:deep(.save-to-list-button .p-button-icon) {
  margin-right: 0.5rem;
}

/* Update styles for the fancy list button */
:deep(.fancy-list-button) {
  background: transparent;
  border: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
  transition: all 0.3s ease;
}

:deep(.fancy-list-button:hover) {
  background: var(--surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.fancy-button) {
  position: relative;
  overflow: hidden;
}

:deep(.fancy-button::after) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, var(--primary-500), var(--primary-400));
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.fancy-button:hover::after) {
  opacity: 0.1;
}
</style>
