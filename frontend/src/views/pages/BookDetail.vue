<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BookService } from "@/service/BookService";
import { QuoteService } from "@/service/QuoteService";
import QuoteCard from "@/components/QuoteCard.vue";
import { getSession } from "@/api"; // Asegúrate de tener esta función configurada
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import { AuthorService } from "@/service/AuthorService";
import QuoteModal from '@/components/QuoteModal.vue';

const route = useRoute();
const router = useRouter();
const book = ref(null);
const bookId = route.params.id;
const toast = useToast();

// Estado reactivo para indicar la creación de una nueva cita
const isCreatingNewQuote = ref(false);

// Cover change dialog state
const coverOptions = ref([]);
const previewCoverUrl = ref(null);
const customSearchTitle = ref('');
const changingCover = ref(false);

// Cover management
const coverDialogVisible = ref(false);
const customUrlDialogVisible = ref(false);
const customCoverUrl = ref('');
const previewError = ref(false);
const showCustomPreview = ref(false);

// Simple direct URL dialog state
const simpleCoverDialogVisible = ref(false);
const directCoverUrl = ref('');
const directUrlError = ref(false);

// Quotes state
const likedQuotes = ref({});
const selectedTag = ref("");
const showFavorites = ref(false);
const selectedChapter = ref(""); // New: For chapter filtering

// Add the modal state variables
const showQuoteModal = ref(false);
const selectedQuote = ref(null);
const selectedQuoteIndex = ref(-1);

// Compute all unique chapters from quotes
const availableChapters = computed(() => {
  if (!book.value || !book.value.quotes) return [];
  
  const chapters = book.value.quotes
    .map(quote => quote.chapter)
    .filter(chapter => chapter) // Filter out empty/null chapters
    .reduce((unique, chapter) => {
      if (!unique.includes(chapter)) {
        unique.push(chapter);
      }
      return unique;
    }, []);
  
  return chapters.sort(); // Sort alphabetically
});

// Compute all unique tags from quotes
const allTags = computed(() => {
  if (!book.value || !book.value.quotes) return [];

  const tags = [];
  book.value.quotes.forEach((quote) => {
    if (quote.tags) {
      quote.tags.forEach((tag) => {
        if (!tags.includes(tag.title)) {
          tags.push(tag.title);
        }
      });
    }
  });

  return tags.sort();
});

// Filtered quotes based on selected filters
const filteredQuotes = computed(() => {
  if (!book.value || !book.value.quotes) return [];

  return book.value.quotes.filter((quote) => {
    // Filter by favorites
    if (showFavorites.value && !likedQuotes.value[quote.id]) {
      return false;
    }

    // Filter by tag
    if (selectedTag.value && 
        (!quote.tags || !quote.tags.some((tag) => tag.title === selectedTag.value))) {
      return false;
    }
    
    // Filter by chapter
    if (selectedChapter.value && quote.chapter !== selectedChapter.value) {
      return false;
    }

    return true;
  });
});

// Función para cambiar el like de una cita
const toggleLikeQuote = async (quoteId) => {
  try {
    const response = await QuoteService.toggleFavorite(quoteId);
    likedQuotes.value[quoteId] = response.is_favorite;
  } catch (error) {
    console.error("Error toggling favorite status:", error);
  }
};

// Función para guardar una cita editada
const saveEditedQuote = async (editedQuote) => {
  try {
    const response = await QuoteService.updateQuote(editedQuote.id, editedQuote);
    const index = book.value.quotes.findIndex(q => q.id === editedQuote.id);
    if (index !== -1) {
      book.value.quotes[index] = response;
    }
  } catch (error) {
    console.error("Error updating quote:", error);
  }
};

// Función para crear una nueva cita
const handleSaveNewQuote = async (newQuote) => {
  try {
    const quoteToCreate = {
      ...newQuote,
      book: book.value.id,
    };
    const response = await QuoteService.createQuote(quoteToCreate);
    
    // Add the new quote to the quotes array
    if (book.value.quotes) {
      book.value.quotes.unshift(response);
    } else {
      book.value.quotes = [response];
    }
    
    // Reset the creating state
    isCreatingNewQuote.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Quote Added',
      detail: 'Your new quote has been created successfully',
      life: 3000,
    });
  } catch (error) {
    console.error("Error creating quote:", error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create new quote',
      life: 3000,
    });
  }
};

// Función para cancelar la edición de una cita
const cancelEditingQuote = () => {
  // Nothing to do here since edits are handled in the QuoteCard component
};

// Función para generar un gradiente aleatorio en caso de que no haya cover
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

// Rest of your existing functions...

// Function to load the book details
const loadBook = async () => {
  try {
    const data = await BookService.getBook(bookId);
    book.value = data;
    
    // Prepare the gradient for book cover fallback if needed
    if (!book.value.gradient) {
      if (book.value.gradient_primary_color && book.value.gradient_secondary_color) {
        book.value.gradient = {
          primary: book.value.gradient_primary_color,
          secondary: book.value.gradient_secondary_color,
          background: `linear-gradient(135deg, ${book.value.gradient_primary_color}, ${book.value.gradient_secondary_color})`
        };
      } else {
        book.value.gradient = getRandomGradient();
        
        // Save the gradient colors to the database
        BookService.updateBook(
          book.value.id,
          {
            gradient_primary_color: book.value.gradient.primary,
            gradient_secondary_color: book.value.gradient.secondary
          }
        ).catch(error => {
          console.error(`Error saving gradient colors for book ${book.value.id}:`, error);
        });
      }
    }
    
    book.value.imageFailed = false;
    coverIsLoading.value = true;
  } catch (error) {
    console.error("Error loading book:", error);
    toast.add({
      severity: 'error',
      summary: 'Load Error',
      detail: 'Failed to load book details',
      life: 3000
    });
  }
};

// Track image loading state
const coverIsLoading = ref(true);

// Handle image load completion
const handleImageLoad = () => {
  // Use a small timeout to ensure the image is fully rendered
  // before hiding the skeleton for a smoother transition
  setTimeout(() => {
    coverIsLoading.value = false;
  }, 300);
};

// Style for transitions
const coverTransitionClass = "transition-opacity duration-300";

// Handle image loading errors by setting a gradient
const handleImageError = () => {
  coverIsLoading.value = false;
  
  // Set flag to show error fallback instead of the image
  if (book.value) {
    // Generate a gradient if not already set
    if (!book.value.gradient) {
      book.value.gradient = getRandomGradient();
      
      // Save the gradient colors to the database
      BookService.updateBook(
        book.value.id,
        {
          gradient_primary_color: book.value.gradient.primary,
          gradient_secondary_color: book.value.gradient.secondary
        }
      ).catch(error => {
        console.error(`Error saving gradient colors for book ${book.value.id}:`, error);
      });
    }
    
    // Mark the image as failed so we can show fallback
    book.value.imageFailed = true;
    
    toast.add({
      severity: 'warn',
      summary: 'Image Error',
      detail: 'Could not load book cover',
      life: 3000
    });
  }
};

// Function to fetch quotes for this book
const fetchQuotes = async () => {
  try {
    const quotes = await QuoteService.getQuotesByBook(bookId);
    quotes.forEach((quote) => {
      likedQuotes.value[quote.id] = quote.is_favorite;
    });
    
    if (book.value) {
      book.value.quotes = quotes;
    }
  } catch (error) {
    console.error("Error loading quotes:", error);
  }
};

// Call the existing onMounted hook
onMounted(async () => {
  await loadBook();
  await fetchQuotes();
});

// Handle author image errors by setting a gradient
const handleAuthorImageError = (author) => {
  console.log(`Handling author image error for: ${author.name}`);
  
  // Check if author already has gradient colors
  if (author.gradient_primary_color && author.gradient_secondary_color) {
    author.gradient = `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})`;
    console.log(`Using stored gradient for ${author.name}:`, author.gradient);
  } else {
    // Generate and store new gradient
    const gradient = getRandomGradient();
    author.gradient = gradient.background;
    
    // Save the gradient colors to the database
    AuthorService.updateGradientColors(
      author.id,
      gradient.primary,
      gradient.secondary
    ).catch(error => {
      console.error(`Error saving gradient colors for author ${author.id}:`, error);
    });
    
    // Update local properties
    author.gradient_primary_color = gradient.primary;
    author.gradient_secondary_color = gradient.secondary;
  }
};

// Add functions to handle the modal
const openQuoteModal = (quote) => {
  // Find the index of the quote in filteredQuotes
  const index = filteredQuotes.value.findIndex(q => q.id === quote.id);
  selectedQuote.value = quote;
  selectedQuoteIndex.value = index;
  showQuoteModal.value = true;
};

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

const handleEditFromModal = (quote) => {
  showQuoteModal.value = false;
  // Any additional logic for editing would go here
};

// Function to open the cover change dialog
const openCoverDialog = async () => {
  coverDialogVisible.value = true;
  previewCoverUrl.value = null;
  coverOptions.value = [];
  customSearchTitle.value = '';
  customCoverUrl.value = '';
  previewError.value = false;
  showCustomPreview.value = false;
  
  // Search for covers using the current book title
  await searchCoverForBook();
};

// Function to search for book covers
const searchCoverForBook = async (customTitle) => {
  try {
    changingCover.value = true;
    
    // Use the provided custom title or the book's title
    const searchTitle = customTitle || book.value.title;
    
    // Reset cover errors
    previewError.value = false;
    
    // Fetch cover options from OpenLibrary
    const result = await BookService.fetchBookCovers(
      searchTitle, 
      book.value.author.name
    );
    
    // Filter out problematic covers
    coverOptions.value = result.covers.filter(cover => {
      // Skip covers with ID 0 from OpenLibrary (known to cause errors)
      if (cover.url && cover.url.includes('openlibrary.org')) {
        if (cover.url.includes('/id/0-') || 
            cover.url.includes('/id/0.') || 
            cover.url.match(/\/id\/0($|\?)/)) {
          console.warn('Filtered out invalid OpenLibrary cover with ID 0');
          return false;
        }
      }
      
      // Validate URL format
      try {
        new URL(cover.url);
      } catch (urlError) {
        console.warn('Filtered out cover with invalid URL format:', cover.url);
        return false;
      }
      
      return true;
    });
    
    if (coverOptions.value.length > 0) {
      // Set the first cover as the preview by default
      previewCoverUrl.value = coverOptions.value[0].url;
      
      toast.add({
        severity: 'success',
        summary: 'Covers Found',
        detail: `Found ${coverOptions.value.length} covers for "${book.value.title}"`,
        life: 2000
      });
    } else {
      previewCoverUrl.value = null;
      toast.add({
        severity: 'info',
        summary: 'No Covers Found',
        detail: `Could not find covers for "${book.value.title}"`,
        life: 2000
      });
    }
  } catch (error) {
    console.error('Error searching for covers:', error);
    coverOptions.value = [];
    previewCoverUrl.value = null;
    toast.add({
      severity: 'error',
      summary: 'Search Failed',
      detail: `Error searching for covers: ${error.message || 'Unknown error'}`,
      life: 3000
    });
  } finally {
    changingCover.value = false;
  }
};

// Function to select a cover from the options
const selectCover = (coverUrl) => {
  previewCoverUrl.value = coverUrl;
};

// Function to preview a custom cover URL
const previewCustomCoverUrl = () => {
  if (!customCoverUrl.value) return;
  
  // Validate the URL format
  try {
    new URL(customCoverUrl.value);
    previewError.value = false;
    showCustomPreview.value = true;
  } catch (urlError) {
    previewError.value = true;
    showCustomPreview.value = false;
    toast.add({
      severity: 'error',
      summary: 'Invalid URL',
      detail: 'The URL format is invalid. Make sure it starts with http:// or https://',
      life: 3000
    });
  }
};

// Function to handle custom URL preview error
const handleCustomUrlError = () => {
  previewError.value = true;
};

// Function to handle custom URL preview success
const handleCustomUrlSuccess = () => {
  previewError.value = false;
};

// Function to use a custom cover URL
const useCustomCoverUrl = () => {
  if (!customCoverUrl.value || previewError.value) return;
  
  previewCoverUrl.value = customCoverUrl.value;
  showCustomPreview.value = false;
};

// Function to save the cover change
const saveCoverChange = async () => {
  if (!previewCoverUrl.value || !book.value) return;
  
  try {
    changingCover.value = true;
    
    // Validate URL format
    try {
      new URL(previewCoverUrl.value);
    } catch (urlError) {
      toast.add({
        severity: 'error',
        summary: 'Invalid URL',
        detail: 'The cover URL format is invalid',
        life: 3000
      });
      return;
    }
    
    // Get cover value to save - for OpenLibrary, extract just the ID
    let coverValue = previewCoverUrl.value;
    
    // If it's an OpenLibrary URL, extract just the ID to store
    if (previewCoverUrl.value.includes('openlibrary.org/b/id/')) {
      const match = previewCoverUrl.value.match(/\/b\/id\/(\d+)/);
      if (match && match[1]) {
        coverValue = match[1]; // Just store the numeric ID
        console.log('Extracted OpenLibrary ID:', coverValue);
      }
    }
    
    // Create a minimal update object with ONLY the cover field
    const updateData = {
      cover: coverValue
    };
    
    // Update the book with minimal data
    await BookService.updateBook(book.value.id, updateData);
    
    // Update local state
    book.value.cover = coverValue;
    book.value.imageFailed = false;
    
    // Close the dialog
    coverDialogVisible.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Cover Updated',
      detail: `Cover for "${book.value.title}" has been updated`,
      life: 2000
    });
  } catch (error) {
    console.error('Error saving cover:', error);
    
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    }
    
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update book cover. Please try again.',
      life: 3000
    });
  } finally {
    changingCover.value = false;
  }
};
</script>

<template>
  <div v-if="book" class="flex h-screen overflow-hidden">
    <!-- Book Cover Panel (1/4) -->
    <div class="w-1/4 p-4 md:p-2 flex flex-col items-center sticky top-4">
      <div class="w-full bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden flex flex-col group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in">
        <!-- Book Cover -->
        <div class="relative aspect-[2/3] overflow-hidden cover-container">
          <!-- Loading State -->
          <div 
            v-if="book.cover && coverIsLoading" 
            class="absolute inset-0 w-full h-full bg-gray-200 animate-pulse"
          >
            <div class="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
          </div>
          
          <!-- Book Cover Image -->
          <img 
            v-if="book.cover && !book.imageFailed" 
            :src="book.cover" 
            :alt="book.title" 
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            :class="[coverTransitionClass, coverIsLoading ? 'opacity-0' : 'opacity-100']"
            @error="handleImageError"
            @load="handleImageLoad"
          />
          
          <!-- Fallback Cover -->
          <div 
            v-if="!book.cover || book.imageFailed" 
            class="absolute inset-0 w-full h-full"
            :style="{ background: book.gradient.background }"
          >
            <div class="w-full h-full flex flex-col p-4 relative">
              <!-- Light reflection effect -->
              <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
              
              <!-- Decorative book elements -->
              <div class="flex-1 flex flex-col items-center justify-center relative">
                <!-- Decorative circle -->
                <div class="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center mb-4">
                  <div class="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                    <span class="text-white/80 text-3xl font-serif">{{ book.title.charAt(0) }}</span>
                  </div>
                </div>
                
                <!-- Decorative lines -->
                <div class="w-20 h-0.5 bg-white/20 mb-1"></div>
                <div class="w-32 h-0.5 bg-white/20 mb-4"></div>
              </div>
            </div>
          </div>

          <!-- Overlay with Actions -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button 
              icon="pi pi-image" 
              rounded 
              severity="secondary" 
              @click="openCoverDialog"
            />
          </div>
        </div>

        <!-- Book Info -->
        <div class="p-4 flex-1 flex flex-col">
          <h2 class="text-2xl font-bold fancy-font mb-3 line-clamp-2">{{ book.title }}</h2>
          
          <!-- Author Info -->
          <div 
            class="flex items-center mb-4 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 p-2 rounded-lg transition-colors duration-200"
            @click="$router.push({ name: 'authorDetail', params: { id: book.author.id } })"
          >
            <div class="relative w-10 h-10 rounded-full overflow-hidden mr-3">
              <img
                v-if="book.author.cover"
                class="w-full h-full object-cover"
                :src="book.author.cover"
                :alt="book.author.name"
                @error="handleAuthorImageError(book.author)"
              />
              <div 
                v-else
                class="w-full h-full flex items-center justify-center"
                :style="{ 
                  background: book.author.gradient || 
                    (book.author.gradient_primary_color && book.author.gradient_secondary_color ? 
                      `linear-gradient(135deg, ${book.author.gradient_primary_color}, ${book.author.gradient_secondary_color})` : 
                      getRandomGradient().background) 
                }"
              >
                <span class="text-white font-bold text-sm">{{ book.author.name.charAt(0) }}</span>
              </div>
            </div>
            <span class="text-surface-600 dark:text-surface-400 group-hover:text-primary-500 dark:group-hover:text-primary-400">{{ book.author.name }}</span>
          </div>

          <!-- Stats and Actions -->
          <div class="mt-auto flex items-center justify-between">
            <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-3 py-1 rounded-full">
              <i class="pi pi-comment text-primary-500"></i>
              <span class="text-sm font-medium">{{ book.quotes?.length || 0 }}</span>
            </div>
            <Button 
              icon="pi pi-heart-fill" 
              rounded 
              severity="danger"
              :class="{ 'p-button-outlined': !book.is_favorite }"
              @click="toggleBookFavorite"
            />
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

            <!-- Filtros de Citas -->
            <div class="mb-8 flex flex-col md:flex-row items-center justify-center gap-6 bg-surface-50 dark:bg-surface-800 p-6 rounded-2xl shadow-sm">
              <!-- Chapter filter -->
              <div v-if="availableChapters.length > 0" class="filter-item">
                <label class="mr-2 font-semibold text-surface-700 dark:text-surface-200">Chapter:</label>
                <select v-model="selectedChapter" class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
                  <option value="">All Chapters</option>
                  <option v-for="chapter in availableChapters" :key="chapter" :value="chapter">
                    {{ chapter }}
                  </option>
                </select>
              </div>
              
              <!-- Tag filter -->
              <div v-if="allTags.length > 0" class="filter-item">
                <label class="mr-2 font-semibold text-surface-700 dark:text-surface-200">Tag:</label>
                <select v-model="selectedTag" class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
                  <option value="">All Tags</option>
                  <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
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

              <!-- Add New Quote Button -->
              <div class="filter-item">
                <Button
                  icon="pi pi-plus-circle"
                  label="Add Quote"
                  @click="isCreatingNewQuote = true"
                  class="p-button-sm p-button-rounded p-button-outlined"
                />
              </div>
            </div>

            <!-- Formulario para crear nueva cita -->
            <div v-if="isCreatingNewQuote" class="mt-8">
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-2xl transform rotate-2 group-hover:rotate-3 transition-transform duration-300"></div>
                <div class="bg-surface-50 dark:bg-surface-800 rounded-2xl shadow-lg p-6 transform transition-all duration-300 animate-fade-in relative">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
                      <i class="pi pi-pencil mr-2"></i>
                      New Quote
                    </h3>
                    <button 
                      @click="isCreatingNewQuote = false"
                      class="text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
                    >
                      <i class="pi pi-times text-xl"></i>
                    </button>
                  </div>

                  <QuoteCard
                    :quote="{ body: '', tags: [] }"
                    :isNew="true"
                    @save-new="handleSaveNewQuote"
                    @cancel-edit="isCreatingNewQuote = false"
                    class="transform transition-all duration-300 hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            <!-- Sección de Citas usando el componente QuoteCard -->
            <div class="mt-10">
              <div v-if="filteredQuotes && filteredQuotes.length" class="flex flex-col gap-6">
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
                    @previous-quote="navigateToPreviousQuote"
                    @next-quote="navigateToNextQuote"
                    @click="openQuoteModal(quote)"
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
                <p class="text-lg">No quotes available with these filters.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cover Change Dialog -->
    <Dialog
      v-model:visible="coverDialogVisible"
      header="Change Book Cover"
      :style="{width: '800px'}"
      :modal="true"
    >
      <div class="flex flex-col items-center p-4">
        <h3 class="text-xl font-semibold mb-2">{{ book.title }}</h3>
        <p class="text-sm mb-4">by {{ book.author.name }}</p>
        
        <div class="grid grid-cols-2">
          <!-- Selected cover preview (large) -->
          <div class="col-span-1 flex flex-col items-center">
            <h4 class="font-medium mb-2">Selected Cover:</h4>
            <div class="relative mb-4 w-64 h-96 bg-gray-100 flex items-center justify-center border rounded shadow-sm">
              <img 
                v-if="previewCoverUrl" 
                :src="previewCoverUrl" 
                :alt="book.title"
                class="max-w-full max-h-full object-contain"
                @error="(e) => e.target.src = 'https://via.placeholder.com/200x300?text=Image+Error'"
              />
              <div v-else class="text-gray-400">No cover selected</div>
            </div>
            <div v-if="previewCoverUrl" class="text-xs text-center mt-1 p-1 w-full overflow-hidden">
              <div class="truncate max-w-[250px]">{{ previewCoverUrl }}</div>
            </div>
          </div>
          
          <!-- Cover options grid -->
          <div class="col-span-1 flex flex-col">
            <h4 class="font-medium mb-2">Available Covers ({{ coverOptions.length }}):</h4>
            <div v-if="coverOptions.length > 0" class="grid grid-cols-2 gap-2 overflow-y-auto max-h-96 p-2">
              <div 
                v-for="(cover, index) in coverOptions" 
                :key="index" 
                class="cursor-pointer border rounded hover:shadow-md transition-shadow p-1"
                :class="{ 'border-blue-500 ring-2 ring-blue-300': previewCoverUrl === cover.url }"
                @click="selectCover(cover.url)"
              >
                <div class="w-full h-40 flex items-center justify-center bg-gray-100">
                  <img 
                    :src="cover.url" 
                    :alt="`Cover option ${index+1}`"
                    class="max-w-full max-h-full object-contain"
                    @error="(e) => e.target.src = 'https://via.placeholder.com/200x300?text=Image+Error'"
                  />
                </div>
                <div v-if="previewCoverUrl === cover.url" class="bg-blue-100 text-blue-800 text-xs text-center mt-1 p-1 rounded">
                  Selected
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 p-4 text-center border rounded bg-gray-50">
              No cover options found
            </div>
          </div>
        </div>
        
        <!-- Manual search section -->
        <div class="w-full my-4">
          <h4 class="font-medium mb-2">Search for more covers:</h4>
          <div class="flex gap-2">
            <InputText 
              v-model="customSearchTitle" 
              placeholder="Enter alternative title" 
              class="flex-1"
              @keydown.enter="searchCoverForBook(customSearchTitle)"
            />
            <Button 
              icon="pi pi-search" 
              @click="searchCoverForBook(customSearchTitle)"
              :loading="changingCover"
            />
          </div>
          <small class="text-gray-500 mt-1 block">
            Tip: Try with a more general title or series name
          </small>
        </div>
        
        <!-- Custom URL input directly in change cover dialog -->
        <div class="w-full my-4 border-t pt-4">
          <h4 class="font-medium mb-2">Or enter a custom cover URL:</h4>
          <div class="flex gap-2">
            <InputText 
              v-model="customCoverUrl" 
              placeholder="https://example.com/book-cover.jpg" 
              class="flex-1"
              @keydown.enter="previewCustomCoverUrl"
            />
            <Button 
              icon="pi pi-image" 
              @click="previewCustomCoverUrl"
              :disabled="!customCoverUrl"
            />
          </div>
          <small class="text-gray-500 mt-1 block">
            Enter the full URL to an image you want to use as the cover
          </small>
          
          <!-- Preview for custom URL -->
          <div v-if="customCoverUrl && showCustomPreview" class="mt-3 border rounded p-2 flex flex-col items-center">
            <div class="w-full h-40 flex items-center justify-center bg-gray-100">
              <img 
                :src="customCoverUrl" 
                :alt="book.title" 
                class="max-w-full max-h-full object-contain"
                @error="handleCustomUrlError"
                @load="handleCustomUrlSuccess"
              />
              <div v-if="previewError" class="text-red-500">
                Invalid image URL
              </div>
            </div>
            <Button 
              v-if="!previewError" 
              class="mt-2" 
              label="Use This URL" 
              icon="pi pi-check" 
              @click="useCustomCoverUrl"
            />
          </div>
        </div>
        
        <div class="flex justify-center gap-3 mt-4 w-full">
          <Button 
            icon="pi pi-times" 
            label="Cancel" 
            severity="secondary" 
            @click="coverDialogVisible = false"
          />
          <Button 
            icon="pi pi-check" 
            label="Save Cover" 
            :disabled="!previewCoverUrl"
            @click="saveCoverChange"
            :loading="changingCover"
          />
        </div>
      </div>
    </Dialog>
    
    <!-- Custom URL Dialog -->
    <Dialog
      v-model:visible="customUrlDialogVisible"
      header="Set Custom Cover URL"
      :style="{width: '500px'}"
      :modal="true"
    >
      <div class="flex flex-col p-4">
        <div class="mb-4">
          <label for="customUrl" class="block font-medium mb-2">Enter Cover URL:</label>
          <InputText 
            id="customUrl"
            v-model="customCoverUrl" 
            placeholder="https://example.com/cover.jpg" 
            class="w-full"
          />
          <small class="text-gray-500 block mt-1">
            Enter a full URL to an image online
          </small>
        </div>
        
        <div class="mb-4" v-if="customCoverUrl">
          <label class="block font-medium mb-2">Preview:</label>
          <div class="border rounded p-2 flex items-center justify-center bg-gray-50 h-64">
            <img 
              :src="customCoverUrl" 
              :alt="book.title" 
              class="max-w-full max-h-full object-contain"
              @error="previewError = true"
              @load="previewError = false"
            />
            <div v-if="previewError" class="text-red-500">
              Invalid image URL
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button 
            label="Cancel" 
            class="p-button-text" 
            @click="customUrlDialogVisible = false"
          />
          <Button 
            label="Set Cover" 
            icon="pi pi-check" 
            @click="setCustomCover"
            :disabled="!customCoverUrl || previewError"
          />
        </div>
      </div>
    </Dialog>
    
    <!-- Simple direct URL dialog -->
    <Dialog
      v-model:visible="simpleCoverDialogVisible"
      header="Set Cover URL Directly"
      :style="{width: '500px'}"
      :modal="true"
    >
      <div class="flex flex-col p-4 gap-4">
        <div>
          <label for="directUrl" class="block font-medium mb-2">Enter Cover URL:</label>
          <InputText 
            id="directUrl"
            v-model="directCoverUrl" 
            placeholder="https://example.com/cover.jpg" 
            class="w-full"
          />
          <small class="text-gray-500 block mt-1">
            Enter a full URL to an image online
          </small>
        </div>
        
        <div v-if="directCoverUrl" class="border rounded p-3 bg-gray-50">
          <label class="block font-medium mb-2">Preview:</label>
          <div class="flex justify-center">
            <img 
              :src="directCoverUrl" 
              :alt="book.title" 
              class="max-h-[200px] object-contain"
              @error="directUrlError = true"
              @load="directUrlError = false"
            />
          </div>
          <div v-if="directUrlError" class="text-red-500 text-center mt-2">
            Invalid image URL
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-2">
          <Button 
            label="Cancel" 
            class="p-button-text" 
            @click="simpleCoverDialogVisible = false"
          />
          <Button 
            label="Save Cover" 
            icon="pi pi-check" 
            @click="saveDirectCoverUrl"
            :disabled="!directCoverUrl || directUrlError"
          />
        </div>
      </div>
    </Dialog>

    <!-- Add the QuoteModal component -->
    <QuoteModal
      v-if="selectedQuote"
      v-model:visible="showQuoteModal"
      :quote="selectedQuote"
      :liked="selectedQuote ? likedQuotes[selectedQuote.id] : false"
      :has-previous="selectedQuoteIndex > 0"
      :has-next="selectedQuoteIndex < (filteredQuotes?.length || 0) - 1"
      @toggle-like="toggleLikeQuote"
      @edit-quote="handleEditFromModal"
      @previous-quote="navigateToPreviousQuote"
      @next-quote="navigateToNextQuote"
    />
  </div>
  <div v-else class="flex justify-center items-center h-full">
    <p>Loading...</p>
  </div>
</template>

<style scoped>
.filter-item {
  @apply mb-2 md:mb-0;
}

.quote-container {
  @apply border-b pb-4 mb-4 border-gray-200 dark:border-gray-700 last:border-0;
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

/* Add transition animations */
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

/* Your existing styles */
.rotate-30 {
  transform: rotate(30deg);
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

/* Add new styles for the floating book panel */
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.dark .shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Add a subtle hover effect to the book panel */
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

/* Book detail entrance animation */
@keyframes bookEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-book-enter {
  animation: bookEnter 0.3s ease-out;
}

/* Add styles for the cover container */
.cover-container {
  animation: coverEnter 0.3s ease-out;
}

@keyframes coverEnter {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
