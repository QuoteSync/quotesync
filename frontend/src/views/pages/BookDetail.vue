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

// Quotes state
const likedQuotes = ref({});
const selectedTag = ref("");
const showFavorites = ref(false);
const selectedChapter = ref(""); // New: For chapter filtering

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
        BookService.updateGradientColors(
          book.value.id,
          book.value.gradient.primary,
          book.value.gradient.secondary
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

// Call the existing onMounted hook
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
        <!-- Chapter filter -->
        <div v-if="availableChapters.length > 0" class="filter-item">
          <label class="mr-2 font-semibold">Filter by Chapter:</label>
          <select v-model="selectedChapter" class="border p-1 rounded">
            <option value="">All Chapters</option>
            <option v-for="chapter in availableChapters" :key="chapter" :value="chapter">
              {{ chapter }}
            </option>
          </select>
        </div>
        
        <!-- Tag filter -->
        <div v-if="allTags.length > 0" class="filter-item">
          <label class="mr-2 font-semibold">Filter by Tag:</label>
          <select v-model="selectedTag" class="border p-1 rounded">
            <option value="">All Tags</option>
            <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
          </select>
        </div>
        
        <!-- Favorites filter -->
        <div class="filter-item flex items-center">
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
          <div v-for="quote in filteredQuotes" :key="quote.id" class="quote-container">
            <QuoteCard
              :quote="quote"
              :liked="likedQuotes[quote.id]"
              @toggle-like="toggleLikeQuote"
              @save-edit="saveEditedQuote"
              @cancel-edit="cancelEditingQuote"
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
.filter-item {
  @apply mb-2 md:mb-0;
}

.quote-container {
  @apply border-b pb-4 mb-4 border-gray-200 dark:border-gray-700 last:border-0;
}

/* Your existing styles */
.rotate-30 {
  transform: rotate(30deg);
}
</style>
