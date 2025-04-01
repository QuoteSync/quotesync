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

// Función para abrir el diálogo de cambio de portada
const openCoverDialog = () => {
  coverDialogVisible.value = true;
  customSearchTitle.value = book.value.title;
  
  // Reset custom URL fields
  customCoverUrl.value = '';
  showCustomPreview.value = false;
  previewError.value = false;
  
  // Start searching for cover options
  searchCoverForBook();
};

// Search for covers for the current book
const searchCoverForBook = async (customTitle) => {
  changingCover.value = true;
  try {
    // Use the provided custom title or the book's title
    const searchTitle = customTitle || book.value.title;
    
    // Fetch cover options from OpenLibrary
    const result = await BookService.fetchCoverFromOpenLibrary(
      searchTitle, 
      book.value.author.name
    );
    
    coverOptions.value = result.covers;
    
    if (coverOptions.value.length > 0) {
      // Set the current cover as the preview or the first cover if not found
      if (book.value.cover && coverOptions.value.some(c => c.url === book.value.cover)) {
        previewCoverUrl.value = book.value.cover;
      } else {
        previewCoverUrl.value = coverOptions.value[0].url;
      }
      
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
    console.error("Error searching for covers:", error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to fetch book covers',
      life: 3000
    });
  } finally {
    changingCover.value = false;
  }
};

// Select a cover from the options
const selectCover = (coverUrl) => {
  console.log("Selected cover:", coverUrl);
  previewCoverUrl.value = coverUrl;
  
  // Show a toast notification
  toast.add({
    severity: 'info',
    summary: 'Cover Selected',
    detail: 'Cover selected, click Save Cover to apply changes',
    life: 2000
  });
};

// Save the selected cover and update the book
const saveCoverChange = async () => {
  if (!previewCoverUrl.value) return;
  
  try {
    console.log("Saving cover:", previewCoverUrl.value);
    
    // Use the direct PATCH method instead of BookService
    await directPatchCover(previewCoverUrl.value);
    
    // Update local state without reloading the book
    book.value.cover = previewCoverUrl.value;
    book.value.gradient = getRandomGradient();
    book.value.imageFailed = false;
    coverIsLoading.value = true;
    
    // Close dialog
    coverDialogVisible.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Cover Updated',
      detail: 'Book cover has been updated successfully',
      life: 3000
    });
    
    // Save the gradient colors to the database
    BookService.updateGradientColors(
      book.value.id,
      book.value.gradient.primary,
      book.value.gradient.secondary
    ).catch(error => {
      console.error(`Error saving gradient colors for book ${book.value.id}:`, error);
    });
    
  } catch (error) {
    console.error("Error updating book cover:", error);
    
    // Handle apiClient errors
    let errorMsg = "Unknown error";
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'object') {
        errorMsg = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      } else {
        errorMsg = String(error.response.data);
      }
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: `Failed to update book cover: ${errorMsg}`,
      life: 5000
    });
  }
};

// Estados reactivos para likes y edición de citas
const likedQuotes = ref({});
const editingQuoteId = ref(null);
const editedQuoteText = ref("");

// Estados para filtros
const selectedTag = ref("");
const showFavorites = ref(false);

// Computed: Lista de todos los tags disponibles de las citas
const allTags = computed(() => {
  if (!book.value?.quotes) return [];
  const tagsSet = new Set();
  book.value.quotes.forEach((quote) => {
    quote.tags.forEach((tag) => {
      tagsSet.add(tag.title);
    });
  });
  return Array.from(tagsSet);
});

// Computed: Citas filtradas según tag y favoritos
const filteredQuotes = computed(() => {
  if (!book.value?.quotes) return [];
  return book.value.quotes.filter((quote) => {
    let tagMatch = true;
    let favoriteMatch = true;
    if (selectedTag.value) {
      tagMatch = quote.tags.some((tag) => tag.title === selectedTag.value);
    }
    if (showFavorites.value) {
      favoriteMatch = likedQuotes.value[quote.id] === true;
    }
    return tagMatch && favoriteMatch;
  });
});

// Funciones para manejar las acciones de las citas
const toggleLikeQuote = async (quoteId) => {
  try {
    const response = await QuoteService.toggleFavorite(quoteId);
    // Update the local state based on the server response
    const quote = book.value.quotes.find(q => q.id === quoteId);
    if (quote) {
      quote.is_favorite = response.is_favorite;
      
      // If this quote was favorited, move it to the top of the list
      if (response.is_favorite) {
        // Remove the quote from its current position
        const index = book.value.quotes.findIndex(q => q.id === quoteId);
        if (index !== -1) {
          const [favoriteQuote] = book.value.quotes.splice(index, 1);
          // Add it to the beginning of the array
          book.value.quotes.unshift(favoriteQuote);
          
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
  const index = book.value.quotes.findIndex((q) => q.id === quote.id);
  if (index !== -1) {
    book.value.quotes[index] = updatedQuote;
  }
  editingQuoteId.value = null;
  editedQuoteText.value = "";
};

// Función para manejar la creación de una nueva cita
const handleSaveNewQuote = async (newQuoteData) => {
  // Se obtiene la sesión y se extrae el id del usuario autenticado
  const session = await getSession();
  const owner_id = session.data.user.id;
  console.log("Owner ID:", owner_id);

  const payload = {
    body: newQuoteData.body,
    tags: newQuoteData.tags,
    book_id: book.value.id, // Usamos el id del libro actual
    title: newQuoteData.body.split(" ").slice(0, 4).join(" "),
    owner_id: owner_id,
    owner: owner_id, // Dependiendo de cómo lo espere el serializer
  };
  const createdQuote = await QuoteService.createQuote(payload);
  book.value.quotes.push(createdQuote);
  isCreatingNewQuote.value = false;
};

const openCustomUrlDialog = () => {
  customUrlDialogVisible.value = true;
  customCoverUrl.value = book.value?.cover || '';
};

const setCustomCover = async () => {
  if (!customCoverUrl.value || previewError.value) return;
  
  try {
    console.log("Setting custom cover:", customCoverUrl.value);
    
    // Use the direct PATCH method instead of BookService
    await directPatchCover(customCoverUrl.value);
    
    // Update local book data without reloading
    book.value.cover = customCoverUrl.value;
    book.value.gradient = getRandomGradient();
    book.value.imageFailed = false;
    coverIsLoading.value = true;
    
    // Close dialog
    customUrlDialogVisible.value = false;
    
    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Cover Updated',
      detail: 'The book cover has been updated with your custom URL',
      life: 3000
    });
    
    // Save the gradient colors to the database
    BookService.updateGradientColors(
      book.value.id,
      book.value.gradient.primary,
      book.value.gradient.secondary
    ).catch(error => {
      console.error(`Error saving gradient colors for book ${book.value.id}:`, error);
    });
    
  } catch (error) {
    console.error('Error setting custom cover:', error);
    
    // Handle apiClient errors
    let errorMsg = "Unknown error";
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'object') {
        errorMsg = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      } else {
        errorMsg = String(error.response.data);
      }
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: `Failed to update the book cover: ${errorMsg}`,
      life: 5000
    });
  }
};

// Function to load book data
const loadBook = async () => {
  try {
    const data = await BookService.getBook(bookId);
    book.value = data;
    
    // Add UI-related properties
    if (book.value.gradient_primary_color && book.value.gradient_secondary_color) {
      // Use the stored gradient colors from the database
      book.value.gradient = {
        primary: book.value.gradient_primary_color,
        secondary: book.value.gradient_secondary_color,
        background: `linear-gradient(135deg, ${book.value.gradient_primary_color}, ${book.value.gradient_secondary_color})`
      };
    } else {
      // Generate a new random gradient and store it in the database
      book.value.gradient = getRandomGradient();
      
      // Save the gradient colors to the database
      BookService.updateGradientColors(
        book.value.id,
        book.value.gradient.primary,
        book.value.gradient.secondary
      ).catch(error => {
        console.error(`Error saving gradient colors for book ${book.value.id}:`, error);
      });
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
      BookService.updateGradientColors(
        book.value.id,
        book.value.gradient.primary,
        book.value.gradient.secondary
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

// Preview custom URL cover
const previewCustomCoverUrl = () => {
  if (!customCoverUrl.value) return;
  
  // Show the preview section and reset any previous errors
  showCustomPreview.value = true;
  previewError.value = false;
};

// Handle custom URL image load error
const handleCustomUrlError = () => {
  previewError.value = true;
  toast.add({
    severity: 'error',
    summary: 'Invalid URL',
    detail: 'The image URL could not be loaded',
    life: 3000
  });
};

// Handle custom URL image load success
const handleCustomUrlSuccess = () => {
  previewError.value = false;
};

// Use the custom URL as cover
const useCustomCoverUrl = () => {
  if (!customCoverUrl.value || previewError.value) return;
  
  // Set the custom URL as the preview URL
  previewCoverUrl.value = customCoverUrl.value;
  
  // Hide the custom preview
  showCustomPreview.value = false;
  
  toast.add({
    severity: 'info',
    summary: 'Custom URL Selected',
    detail: 'Custom URL selected, click Save Cover to apply changes',
    life: 2000
  });
};

const openSimpleCoverDialog = () => {
  simpleCoverDialogVisible.value = true;
  directCoverUrl.value = '';
  directUrlError.value = false;
};

// Create a direct PATCH method for updating the cover
const directPatchCover = async (coverUrl) => {
  try {
    // Import the API client to use its authentication
    const { apiClient } = await import("@/api");
    
    // Simplified API call with no cache handling
    const url = `/books/${bookId}/`;
    console.log("PATCH to:", url, "with cover:", coverUrl);
    
    // Just send the cover URL only
    const response = await apiClient.patch(url, {
      cover: coverUrl
    });
    
    console.log("PATCH success");
    return response.data;
  } catch (error) {
    console.error("PATCH error:", error);
    throw error;
  }
};

// Update the saveDirectCoverUrl function to use the direct PATCH method
const saveDirectCoverUrl = async () => {
  if (!directCoverUrl.value || directUrlError.value) return;
  
  try {
    console.log("Setting direct cover:", directCoverUrl.value);
    
    // Use the direct PATCH method instead of BookService
    await directPatchCover(directCoverUrl.value);
    
    // Update local book data without reloading
    book.value.cover = directCoverUrl.value;
    book.value.gradient = getRandomGradient();
    book.value.imageFailed = false;
    coverIsLoading.value = true;
    
    // Close dialog
    simpleCoverDialogVisible.value = false;
    
    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Cover Updated',
      detail: 'The book cover has been updated with your direct URL',
      life: 3000
    });
    
    // Save the gradient colors to the database
    BookService.updateGradientColors(
      book.value.id,
      book.value.gradient.primary,
      book.value.gradient.secondary
    ).catch(error => {
      console.error(`Error saving gradient colors for book ${book.value.id}:`, error);
    });
    
  } catch (error) {
    console.error('Error setting direct cover:', error);
    
    // Handle apiClient errors
    let errorMsg = "Unknown error";
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'object') {
        errorMsg = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      } else {
        errorMsg = String(error.response.data);
      }
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: `Failed to update the book cover: ${errorMsg}`,
      life: 5000
    });
  }
};

onMounted(async () => {
  await loadBook();
  await fetchQuotes();
});
</script>

<template>
  <div v-if="book" class="max-w-6xl mx-auto p-8">
    <!-- Detalles del Libro -->
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
        <!-- Portada del Libro -->
        <div class="flex flex-col justify-center">
          <div class="cover-container relative" style="width: 300px; height: 500px; margin: 0 auto;">
            <!-- Fixed size container to prevent layout shifts -->
            <div class="absolute inset-0 w-full h-full bg-gray-100 rounded-md shadow-md">
              <!-- Skeleton loader that shows during loading -->
              <div 
                v-if="book.cover && coverIsLoading" 
                class="absolute inset-0 w-full h-full rounded-md shadow-md overflow-hidden bg-gray-200"
                :class="coverTransitionClass"
              >
                <!-- Skeleton animation -->
                <div class="absolute inset-0 w-full h-full animate-pulse">
                  <div class="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
                </div>
                
                <!-- Book title placeholder -->
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="w-1/2 h-6 bg-gray-300 rounded-md mb-4"></div>
                  <div class="w-1/3 h-4 bg-gray-300 rounded-md"></div>
                  
                  <!-- Loading spinner -->
                  <div class="mt-8">
                    <div class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              </div>
              
              <!-- Actual book cover image -->
              <img 
                v-if="book.cover && !book.imageFailed" 
                :src="book.cover + '?nocache=' + new Date().getTime()" 
                :alt="book.title" 
                class="absolute inset-0 w-full h-full object-contain rounded-md shadow-md"
                :class="[coverTransitionClass, coverIsLoading ? 'opacity-0' : 'opacity-100']"
                @error="handleImageError"
                @load="handleImageLoad"
              />
              
              <!-- Error fallback for failed images -->
              <div 
                v-if="book.cover && book.imageFailed" 
                class="absolute inset-0 w-full h-full rounded-md shadow-md book-cover overflow-hidden"
                :class="coverTransitionClass"
                :style="{ background: book.gradient.background }"
              >
                <!-- Book-like cover design -->
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
                  
                  <!-- Title area -->
                  <div class="mt-auto flex flex-col p-3 text-center z-10">
                    <span class="text-white font-bold text-xl leading-tight">{{ book.title.split(' ').slice(0, 8).join(' ') }}{{ book.title.split(' ').length > 8 ? '...' : '' }}</span>
                    <div class="w-16 h-0.5 bg-white/40 mx-auto my-2"></div>
                    <span class="text-white/80 text-sm mt-2">by {{ book.author.name }}</span>
                    <div class="mt-3 flex flex-col items-center">
                      <i class="pi pi-image text-white/60 text-xl mb-2"></i>
                      <span class="text-white/60 text-sm">Image failed to load</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Fallback if no cover is available -->
              <div 
                v-if="!book.cover" 
                class="absolute inset-0 w-full h-full rounded-md shadow-md book-cover overflow-hidden"
                :class="coverTransitionClass"
                :style="{ background: book.gradient.background }"
              >
                <!-- Book-like cover design -->
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
                  
                  <!-- Title area -->
                  <div class="mt-auto flex flex-col p-3 text-center z-10">
                    <span class="text-white font-bold text-2xl leading-tight uppercase tracking-wide">{{ book.title.split(' ').slice(0, 8).join(' ') }}{{ book.title.split(' ').length > 8 ? '...' : '' }}</span>
                    <div class="w-16 h-0.5 bg-white/40 mx-auto my-2"></div>
                    <span class="text-white/80 text-sm mt-2 italic">by {{ book.author.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Button for cover management positioned below the cover -->
          <div class="mt-4 text-center">
            <Button 
              icon="pi pi-image" 
              label="Change Cover" 
              @click="openCoverDialog"
              class="p-button-sm"
            />
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
        </div>
        
        <!-- Información del Libro -->
        <div class="text-center md:text-left">
          <h1 class="text-4xl font-bold fancy-font">{{ book.title }}</h1>
          <div
            class="flex items-center justify-center md:justify-start mt-4 cursor-pointer hover:underline"
            @click="
              $router.push({
                name: 'authorDetail',
                params: { id: book.author.id },
              })
            "
          >
            <img
              class="w-10 h-10 rounded-full object-cover transition-transform duration-300 hover:scale-105"
              :src="book.author.cover"
              alt="Author Avatar"
            />
            <span class="ml-3 text-xl font-semibold">{{ book.author.name }}</span>
          </div>
          <p class="mt-4 text-lg">{{ book.description }}</p>
        </div>
      </div>
    </div>

    <!-- Filtros y listado de citas -->
    <div
      class="mt-10 p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
    >
      <h2 class="text-3xl font-bold mb-6 text-center">Quotes</h2>

      <!-- Filtros de Citas -->
      <div class="mb-6 flex flex-col md:flex-row items-center justify-center gap-4">
        <div>
          <label class="mr-2 font-semibold">Filter by Tag:</label>
          <select v-model="selectedTag" class="border p-1 rounded">
            <option value="">All</option>
            <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
          </select>
        </div>
        <div class="flex items-center">
          <label class="mr-2 font-semibold">Favorites:</label>
          <input type="checkbox" v-model="showFavorites" />
        </div>
      </div>

      <!-- Sección para agregar nueva cita -->
      <div class="mt-10 text-center">
        <button
          class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          @click="isCreatingNewQuote = true"
        >
          Add New Quote
        </button>
      </div>

      <!-- Formulario para crear nueva cita -->
      <div v-if="isCreatingNewQuote" class="mt-6">
        <QuoteCard
          :quote="{ body: '', tags: [] }"
          :isNew="true"
          @save-new="handleSaveNewQuote"
          @cancel-edit="isCreatingNewQuote = false"
        />
      </div>

      <!-- Sección de Citas usando el componente QuoteCard -->
      <div class="mt-10">
        <div v-if="filteredQuotes && filteredQuotes.length" class="flex flex-col gap-6">
          <QuoteCard
            v-for="quote in filteredQuotes"
            :key="quote.id"
            :quote="quote"
            :liked="likedQuotes[quote.id]"
            @toggle-like="toggleLikeQuote"
            @save-edit="saveEditedQuote"
            @cancel-edit="cancelEditingQuote"
          />
        </div>
        <div v-else class="text-center text-gray-500">
          <p>No quotes available with these filters.</p>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex justify-center items-center h-full">
    <p>Loading...</p>
  </div>
</template>

<style scoped>
.rotate-30 {
  transform: rotate(30deg);
}

.book-cover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
  background-repeat: repeat;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  position: relative;
  min-height: 500px;
  height: 100%;
  width: 100%;
}

/* Spine effect */
.book-cover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 100%;
  background: rgba(0,0,0,0.2);
  z-index: 1;
}

/* Page edge effect */
.book-cover::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
  background: rgba(255,255,255,0.1);
  z-index: 1;
}

/* Fix transform class */
.translate-n10 {
  transform: translateX(-10px) translateY(-10px);
}
</style>
