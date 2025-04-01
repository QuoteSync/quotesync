<template>
  <div v-if="author" class="max-w-6xl mx-auto p-8 space-y-10">
    <!-- Detalles del Autor -->
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300 flex flex-col md:flex-row gap-6 items-center"
    >
      <div class="flex flex-col justify-center">
        <div class="relative" style="width: 200px; height: 250px;">
          <!-- Fixed size container to prevent layout shifts -->
          <div class="absolute inset-0 w-full h-full bg-gray-100 rounded-md shadow-md">
            <!-- Image loading skeleton -->
            <div 
              v-if="author.cover && coverIsLoading" 
              class="absolute inset-0 w-full h-full rounded-md shadow-md overflow-hidden bg-gray-200"
              :class="coverTransitionClass"
            >
              <div class="absolute inset-0 w-full h-full animate-pulse">
                <div class="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
              </div>
              
              <!-- Author name placeholder -->
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="w-1/2 h-6 bg-gray-300 rounded-md mb-4"></div>
                <div class="w-1/3 h-4 bg-gray-300 rounded-md"></div>
                
                <!-- Loading spinner -->
                <div class="mt-8">
                  <div class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            </div>
            
            <!-- Actual author image -->
            <img 
              v-if="author.cover && !author.imageFailed" 
              :src="author.cover + '?nocache=' + new Date().getTime()" 
              :alt="author.name" 
              class="absolute inset-0 w-full h-full object-cover rounded-md shadow-md"
              :class="[coverTransitionClass, coverIsLoading ? 'opacity-0' : 'opacity-100']"
              @error="handleAuthorImageError(author)"
              @load="handleImageLoad"
            />
            
            <!-- Gradient fallback when no image or image error -->
            <div 
              v-if="(!author.cover || author.imageFailed)" 
              class="absolute inset-0 w-full h-full rounded-md shadow-md book-cover overflow-hidden flex items-center justify-center"
              :class="coverTransitionClass"
              :style="{ 
                background: author.gradient || 
                  (author.gradient_primary_color && author.gradient_secondary_color ? 
                    `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})` : 
                    getRandomGradient().background) 
              }"
            >
              <!-- Author placeholder -->
              <div class="text-white text-2xl font-bold p-4 text-center">
                <div class="w-20 h-20 mx-auto rounded-full border-2 border-white/30 flex items-center justify-center mb-4">
                  <span class="text-4xl">{{ author.name.charAt(0) }}</span>
                </div>
                <div>{{ author.name }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Button for image management positioned below the image -->
        <div class="mt-4 text-center">
          <Button 
            icon="pi pi-image" 
            label="Change Image" 
            @click="openCoverDialog"
            class="p-button-sm"
          />
        </div>
      </div>
      <div class="text-center md:text-left">
        <h1 class="text-4xl font-bold fancy-font">{{ author.name }}</h1>
        <p class="mt-4 text-lg">{{ author.bio }}</p>
      </div>
    </div>

    <!-- Cover Change Dialog -->
    <Dialog
      v-model:visible="coverDialogVisible"
      header="Change Author Image"
      :style="{width: '800px'}"
      :modal="true"
    >
      <div class="flex flex-col items-center p-4">
        <h3 class="text-xl font-semibold mb-2">{{ author.name }}</h3>
        
        <div class="grid grid-cols-2">
          <!-- Selected image preview (large) -->
          <div class="col-span-1 flex flex-col items-center">
            <h4 class="font-medium mb-2">Selected Image:</h4>
            <div class="relative mb-4 w-64 h-64 bg-gray-100 flex items-center justify-center border rounded shadow-sm">
              <img 
                v-if="previewCoverUrl" 
                :src="previewCoverUrl" 
                :alt="author.name"
                class="max-w-full max-h-full object-contain"
                @error="(e) => e.target.src = 'https://via.placeholder.com/200x200?text=Image+Error'"
              />
              <!-- Show gradient preview if no image is selected -->
              <div 
                v-else 
                class="w-full h-full rounded book-cover flex items-center justify-center"
                :style="{ 
                  background: author.gradient || 
                    (author.gradient_primary_color && author.gradient_secondary_color ? 
                      `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})` : 
                      getRandomGradient().background) 
                }"
              >
                <!-- Author placeholder -->
                <div class="text-white text-xl font-bold p-4 text-center">
                  <div class="w-16 h-16 mx-auto rounded-full border-2 border-white/30 flex items-center justify-center mb-3">
                    <span class="text-3xl">{{ author.name.charAt(0) }}</span>
                  </div>
                  <div>Gradient Only</div>
                </div>
              </div>
            </div>
            <div v-if="previewCoverUrl" class="text-xs text-center mt-1 p-1 w-full overflow-hidden">
              <div class="truncate max-w-[250px]">{{ previewCoverUrl }}</div>
            </div>
            <!-- Add a "Remove Image" button -->
            <Button 
              v-if="previewCoverUrl || author.cover" 
              icon="pi pi-trash" 
              label="Remove Image" 
              severity="danger" 
              class="p-button-sm mt-2" 
              @click="removeAuthorImage"
              text
            />
            <small v-if="!previewCoverUrl" class="text-gray-500 mt-1 block text-center">
              Showing gradient background only
            </small>
          </div>
          
          <!-- Cover options grid -->
          <div class="col-span-1 flex flex-col">
            <h4 class="font-medium mb-2">Available Images ({{ coverOptions.length }}):</h4>
            <div v-if="coverOptions.length > 0" class="grid grid-cols-2 gap-2 overflow-y-auto max-h-96 p-2">
              <div 
                v-for="(cover, index) in coverOptions" 
                :key="index" 
                class="cursor-pointer border rounded hover:shadow-md transition-shadow p-1"
                :class="{ 'border-blue-500 ring-2 ring-blue-300': previewCoverUrl === cover.url }"
                @click="selectCover(cover.url)"
              >
                <div class="w-full h-32 flex items-center justify-center bg-gray-100">
                  <img 
                    :src="cover.url" 
                    :alt="`Image option ${index+1}`"
                    class="max-w-full max-h-full object-contain"
                    @error="(e) => e.target.src = 'https://via.placeholder.com/200x200?text=Image+Error'"
                  />
                </div>
                <div v-if="previewCoverUrl === cover.url" class="bg-blue-100 text-blue-800 text-xs text-center mt-1 p-1 rounded">
                  Selected
                </div>
                <div class="bg-gray-100 text-gray-800 text-xs text-center mt-1 p-1">
                  <span class="font-semibold">Source: </span>{{ cover.source === 'wikipedia' ? 'Wikipedia' : 'OpenLibrary' }}
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 p-4 text-center border rounded bg-gray-50">
              No image options found
            </div>
            
            <!-- Refresh OpenLibrary search button -->
            <Button 
              icon="pi pi-refresh" 
              label="Search OpenLibrary Again" 
              class="mt-2" 
              @click="searchCoverForAuthor"
              :loading="changingCover"
            />
          </div>
        </div>
        
        <!-- Search sections with separate tabs for each method -->
        <div class="w-full my-4 border-t pt-4">
          <h3 class="text-lg font-semibold mb-3">Search for Author Images</h3>
          
          <!-- OpenLibrary and Wikipedia tabs -->
          <TabView>
            <!-- OpenLibrary search tab -->
            <TabPanel header="OpenLibrary Search" class="p-3">
              <p class="mb-2 text-sm text-gray-600">
                OpenLibrary is the default source and usually provides high-quality author photos. 
                Search results are automatically loaded when opening this dialog.
              </p>
              <div class="flex gap-2 mt-3">
                <InputText 
                  v-model="openLibrarySearchTerm" 
                  placeholder="Custom OpenLibrary search term" 
                  class="flex-1"
                  @keydown.enter="searchCoverForAuthor"
                />
                <Button 
                  icon="pi pi-search" 
                  label="Search OpenLibrary"
                  @click="searchCoverForAuthor"
                  :loading="changingCover"
                />
              </div>
            </TabPanel>
            
            <!-- Wikipedia search tab -->
            <TabPanel header="Wikipedia Search" class="p-3">
              <p class="mb-2 text-sm text-gray-600">
                Try Wikipedia if OpenLibrary doesn't have images. Adding terms like "writer", "novelist", 
                or "author" may improve results.
              </p>
              <div class="flex gap-2 mt-3">
                <InputText 
                  v-model="wikipediaSearchTerm" 
                  placeholder="e.g. J.K. Rowling writer" 
                  class="flex-1"
                  @keydown.enter="searchWithWikipedia"
                />
                <Button 
                  icon="pi pi-search" 
                  label="Search Wikipedia"
                  @click="searchWithWikipedia"
                  :loading="changingCover"
                  :disabled="!wikipediaSearchTerm"
                />
              </div>
            </TabPanel>
          </TabView>
        </div>
        
        <!-- Custom URL input -->
        <div class="w-full my-4 border-t pt-4">
          <h4 class="font-medium mb-2">Or enter a custom image URL:</h4>
          <div class="flex gap-2">
            <InputText 
              v-model="customCoverUrl" 
              placeholder="https://example.com/author-image.jpg" 
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
            Enter the full URL to an image you want to use
          </small>
          
          <!-- Preview for custom URL -->
          <div v-if="customCoverUrl && showCustomPreview" class="mt-3 border rounded p-2 flex flex-col items-center">
            <div class="w-full h-40 flex items-center justify-center bg-gray-100">
              <img 
                :src="customCoverUrl" 
                :alt="author.name" 
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
            label="Save Changes" 
            @click="saveCoverChange"
            :loading="changingCover"
          />
        </div>
      </div>
    </Dialog>

    <!-- Sección de Libros del Autor -->
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
    >
      <h2 class="text-3xl font-bold mb-4 text-center">Books by {{ author.name }}</h2>
      <div
        v-if="author.books && author.books.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="book in author.books"
          :key="book.id"
          class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col"
          @click="$router.push({ name: 'bookDetail', params: { id: book.id } })"
        >
          <div class="flex-grow">
            <template v-if="book.cover">
              <img
                class="rounded-lg w-full h-60 object-cover transition-transform duration-300 hover:scale-105"
                :src="book.cover"
                :alt="book.title"
                @error="handleBookImageError(book)"
              />
            </template>
            <template v-else>
              <div
                :style="{ background: (book.gradient?.background || 
                  (book.gradient_primary_color && book.gradient_secondary_color) ? 
                  `linear-gradient(135deg, ${book.gradient_primary_color}, ${book.gradient_secondary_color})` : 
                  getRandomGradient().background) }"
                class="rounded-lg w-full h-60 flex flex-col book-cover overflow-hidden"
              >
                <!-- Book-like cover design -->
                <div class="w-full h-full flex flex-col p-4 relative">
                  <!-- Light reflection effect -->
                  <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
                  
                  <!-- Decorative book elements -->
                  <div class="flex-1 flex flex-col items-center justify-center relative">
                    <!-- Decorative circle -->
                    <div class="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-3">
                      <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <span class="text-white/80 text-2xl font-serif">{{ book.title.charAt(0) }}</span>
                      </div>
                    </div>
                    
                    <!-- Decorative lines -->
                    <div class="w-12 h-0.5 bg-white/20 mb-1"></div>
                    <div class="w-20 h-0.5 bg-white/20 mb-2"></div>
                  </div>
                  
                  <!-- Title area -->
                  <div class="mt-auto flex flex-col p-2 text-center z-10">
                    <span class="text-white font-bold text-lg leading-tight uppercase tracking-wide">{{ book.title.split(' ').slice(0, 3).join(' ') }}{{ book.title.split(' ').length > 3 ? '...' : '' }}</span>
                    <div class="w-10 h-0.5 bg-white/40 mx-auto my-1"></div>
                    <span class="text-white/80 text-xs mt-1 italic">by {{ author.name }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <!-- Book title shown below the cover -->
          <div class="mt-3 text-center">
            <h3 class="font-semibold text-lg truncate">{{ book.title }}</h3>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-gray-500">
        <p>No books available for this author.</p>
      </div>
    </div>

    <!-- Sección de Citas del Autor -->
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
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

      <!-- Botón para agregar una nueva cita -->
      <div class="mb-6 text-center">
        <button
          class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          @click="isCreatingNewQuote = true"
        >
          Add New Quote
        </button>
      </div>

      <!-- Dropdown para seleccionar el libro (solo al crear nueva cita) -->
      <div v-if="isCreatingNewQuote && author.books && author.books.length" class="mb-4">
        <label class="mr-2 font-semibold">Select Book:</label>
        <select v-model="selectedBookId" class="border p-1 rounded">
          <option v-for="book in author.books" :key="book.id" :value="book.id">
            {{ book.title }}
          </option>
        </select>
      </div>

      <!-- Componente para crear una nueva cita -->
      <div v-if="isCreatingNewQuote">
        <!-- Se pasa una cita vacía y la propiedad isNew para mostrar el formulario de creación -->
        <QuoteCard
          :quote="{ body: '', tags: [] }"
          :isNew="true"
          @save-new="handleSaveNewQuote"
          @cancel-edit="isCreatingNewQuote = false"
        />
      </div>

      <!-- Lista de citas existentes -->
      <div
        v-if="filteredQuotes && filteredQuotes.length"
        class="flex flex-col gap-6 mt-6"
      >
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
  <div v-else class="flex justify-center items-center h-full">
    <p>Loading...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { AuthorService } from "@/service/AuthorService";
import { BookService } from "@/service/BookService";
import { QuoteService } from "@/service/QuoteService";
import QuoteCard from "@/components/QuoteCard.vue";
import { getSession } from "@/api";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";

const route = useRoute();
const author = ref(null);
const authorId = route.params.id;
const toast = useToast();

// Variable reactiva para almacenar el ID del libro seleccionado en la creación de cita
const selectedBookId = ref(null);

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

// Handle image loading errors by setting a gradient
const handleAuthorImageError = async (authorObj) => {
  console.log("Handling author image error");
  coverIsLoading.value = false;
  
  // Set flag to show error fallback instead of the image
  if (authorObj) {
    // Mark the image as failed so we can show fallback gradient
    authorObj.imageFailed = true;
    
    // Check if we already have gradient colors
    if (authorObj.gradient_primary_color && authorObj.gradient_secondary_color) {
      // Use existing gradient colors
      console.log("Using existing gradient colors");
      authorObj.gradient = `linear-gradient(135deg, ${authorObj.gradient_primary_color}, ${authorObj.gradient_secondary_color})`;
    } else {
      // Generate new gradient colors
      console.log("Generating new gradient colors");
      const newGradient = getRandomGradient();
      authorObj.gradient_primary_color = newGradient.primary;
      authorObj.gradient_secondary_color = newGradient.secondary;
      authorObj.gradient = newGradient.background;
      
      // Save the gradient colors to the database
      try {
        await AuthorService.updateGradientColors(
          authorObj.id, 
          authorObj.gradient_primary_color, 
          authorObj.gradient_secondary_color
        );
        console.log("Gradient colors saved to database");
      } catch (error) {
        console.error("Error saving gradient colors:", error);
      }
    }
    
    // Show a toast notification
    toast.add({
      severity: 'warn',
      summary: 'Image Error',
      detail: 'Could not load author image, showing gradient instead',
      life: 3000
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

// Estado para creación de nueva cita
const isCreatingNewQuote = ref(false);

// Computed: lista de todos los tags disponibles de las citas
const allTags = computed(() => {
  if (!author.value?.quotes) return [];
  const tagsSet = new Set();
  author.value.quotes.forEach((quote) => {
    quote.tags.forEach((tag) => {
      tagsSet.add(tag.title);
    });
  });
  return Array.from(tagsSet);
});

// Computed: citas filtradas por tag y favorites
const filteredQuotes = computed(() => {
  if (!author.value?.quotes) return [];
  return author.value.quotes.filter((quote) => {
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

// Alternar el estado "like" para una cita
const toggleLikeQuote = async (quoteId) => {
  try {
    const response = await QuoteService.toggleFavorite(quoteId);
    // Update the local state based on the server response
    const quote = author.value.quotes.find(q => q.id === quoteId);
    if (quote) {
      quote.is_favorite = response.is_favorite;
      
      // If this quote was favorited, move it to the top of the list
      if (response.is_favorite) {
        // Remove the quote from its current position
        const index = author.value.quotes.findIndex(q => q.id === quoteId);
        if (index !== -1) {
          const [favoriteQuote] = author.value.quotes.splice(index, 1);
          // Add it to the beginning of the array
          author.value.quotes.unshift(favoriteQuote);
          
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

// Iniciar la edición de una cita
const startEditingQuote = (quote) => {
  editingQuoteId.value = quote.id;
  editedQuoteText.value = quote.body;
};

// Cancelar la edición
const cancelEditingQuote = () => {
  editingQuoteId.value = null;
  editedQuoteText.value = "";
};

// Guardar la cita editada y actualizar la lista
const saveEditedQuote = async (quote) => {
  console.log("Saving quote...");
  const updatedQuote = await QuoteService.updateQuote(quote.id, {
    body: quote.body,
    tags: quote.tags, // Se espera que sea un array de strings
  });
  console.log(updatedQuote);
  const index = author.value.quotes.findIndex((q) => q.id === quote.id);
  if (index !== -1) {
    author.value.quotes[index] = updatedQuote;
  }
  editingQuoteId.value = null;
  editedQuoteText.value = "";
};

// Manejar la creación de una nueva cita
const handleSaveNewQuote = async (newQuoteData) => {
  // Await the session promise and then extract the user id
  const session = await getSession();
  const owner_id = session.data.user.id;
  console.log(owner_id);

  const payload = {
    body: newQuoteData.body,
    tags: newQuoteData.tags,
    book_id: selectedBookId.value,
    title: newQuoteData.body.split(" ").slice(0, 4).join(" "),
    owner_id: owner_id,
    owner: owner_id,
  };
  const createdQuote = await QuoteService.createQuote(payload);
  author.value.quotes.push(createdQuote);
  isCreatingNewQuote.value = false;
};

const handleBookImageError = (book) => {
  // Check for existing stored gradient colors in the database
  if (book.id && book.gradient_primary_color && book.gradient_secondary_color) {
    // Use stored colors if available
    book.gradient = {
      primary: book.gradient_primary_color,
      secondary: book.gradient_secondary_color,
      background: `linear-gradient(135deg, ${book.gradient_primary_color}, ${book.gradient_secondary_color})`
    };
  } 
  // If no gradient or string gradient (old format), generate a new one
  else if (!book.gradient || typeof book.gradient === 'string') {
    book.gradient = getRandomGradient();
    
    // Store the new gradient colors for consistency
    if (book.id) {
      BookService.updateGradientColors(
        book.id,
        book.gradient.primary,
        book.gradient.secondary
      ).catch(error => {
        console.error(`Error saving gradient colors for book ${book.id}:`, error);
      });
    }
  }
  
  // Replace the image with a gradient div using Vue reactive properties
  book.cover = null; // This will trigger the v-else template with the gradient
};

// Reactive variables for author cover management
const coverDialogVisible = ref(false);
const coverOptions = ref([]);
const previewCoverUrl = ref("");
const customCoverUrl = ref("");
const showCustomPreview = ref(false);
const previewError = ref(false);
const changingCover = ref(false);
const wikipediaSearchTerm = ref("");
const openLibrarySearchTerm = ref("");
const coverIsLoading = ref(true);

// Functions for author cover management
const openCoverDialog = () => {
  coverDialogVisible.value = true;
  
  // Set the initial preview to the current cover or null if no cover
  if (author.value.cover && !author.value.imageFailed) {
    previewCoverUrl.value = author.value.cover;
  } else {
    // If no cover or image failed, set to null to show gradient option
    previewCoverUrl.value = null;
  }
  
  // Reset Wikipedia search term with author name for better results
  wikipediaSearchTerm.value = author.value.name + " writer";
  
  // Reset custom URL fields
  customCoverUrl.value = '';
  showCustomPreview.value = false;
  previewError.value = false;
  
  // Start searching for cover options
  searchCoverForAuthor();
};

// Search for cover options for the current author
const searchCoverForAuthor = async () => {
  changingCover.value = true;
  coverOptions.value = [];
  
  try {
    toast.add({
      severity: 'info',
      summary: 'Searching OpenLibrary',
      detail: `Looking for images for ${openLibrarySearchTerm.value || author.name}...`,
      life: 3000
    });
    
    // Explicitly set prioritizeWikipedia to false to search OpenLibrary first
    const options = await AuthorService.fetchAuthorCoverFromOpenLibrary(
      openLibrarySearchTerm.value || author.name, 
      false
    );
    
    if (options && options.length > 0) {
      coverOptions.value = options;
      // Select first option automatically
      if (options.length > 0 && !previewCoverUrl.value) {
        previewCoverUrl.value = options[0].url;
      }
      
      toast.add({
        severity: 'success',
        summary: 'OpenLibrary Search Complete',
        detail: `Found ${options.length} images from OpenLibrary`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'warn',
        summary: 'No Images Found',
        detail: 'No images found in OpenLibrary. Try the Wikipedia search tab for more options.',
        life: 5000
      });
    }
  } catch (error) {
    console.error("Error searching for author covers:", error);
    toast.add({
      severity: 'error',
      summary: 'Search Error',
      detail: 'There was an error searching for author images',
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
    summary: 'Image Selected',
    detail: 'Image selected, click Save to apply changes',
    life: 2000
  });
};

// Save the selected cover and update the author
const saveCoverChange = async () => {
  try {
    changingCover.value = true;
    
    // If previewCoverUrl is null, we're removing the image
    if (previewCoverUrl.value === null) {
      // Use the dedicated cover update method with null to properly remove the image
      await AuthorService.updateAuthorCover(author.value.id, null);
      
      // Update local state
      author.value.cover = null;
      author.value.imageFailed = false;
      
      // Ensure we have a gradient
      if (!author.value.gradient_primary_color || !author.value.gradient_secondary_color) {
        const gradient = getRandomGradient();
        author.value.gradient_primary_color = gradient.primary;
        author.value.gradient_secondary_color = gradient.secondary;
        author.value.gradient = gradient.background;
        
        // Save the gradient colors to the database
        try {
          await AuthorService.updateGradientColors(
            author.value.id,
            gradient.primary,
            gradient.secondary
          );
        } catch (error) {
          console.error("Error saving gradient colors:", error);
        }
      }
    } else {
      // Regular image update (using the dedicated cover update method)
      await AuthorService.updateAuthorCover(author.value.id, previewCoverUrl.value);
      
      // Update local state
      author.value.cover = previewCoverUrl.value;
      author.value.imageFailed = false;
      coverIsLoading.value = true;
    }
    
    // Close dialog
    coverDialogVisible.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Image Updated',
      detail: previewCoverUrl.value ? 'Author image has been updated' : 'Author image has been removed',
      life: 3000
    });
    
  } catch (error) {
    console.error("Error updating author image:", error);
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update author image',
      life: 3000
    });
  } finally {
    changingCover.value = false;
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
    detail: 'Custom URL selected, click Save to apply changes',
    life: 2000
  });
};

// Handle image load completion
const handleImageLoad = () => {
  // Use a small timeout to ensure the image is fully rendered
  setTimeout(() => {
    coverIsLoading.value = false;
  }, 300);
};

// Style for transitions
const coverTransitionClass = "transition-opacity duration-300";

// Search for images in Wikipedia
const searchWithWikipedia = async () => {
  if (!wikipediaSearchTerm.value) {
    toast.add({
      severity: 'error',
      summary: 'Empty Search',
      detail: 'Please enter a search term for Wikipedia',
      life: 3000
    });
    return;
  }
  
  changingCover.value = true;
  
  try {
    toast.add({
      severity: 'info',
      summary: 'Searching Wikipedia',
      detail: `Looking for "${wikipediaSearchTerm.value}" in Wikipedia...`,
      life: 3000
    });
    
    // Explicitly set prioritizeWikipedia to true to search Wikipedia first
    const options = await AuthorService.fetchAuthorCoverFromOpenLibrary(
      wikipediaSearchTerm.value,
      true
    );
    
    if (options && options.length > 0) {
      // Add new results to the existing options rather than replacing them
      const newOptions = options.filter(
        option => !coverOptions.value.some(existing => existing.url === option.url)
      );
      
      if (newOptions.length > 0) {
        coverOptions.value = [...coverOptions.value, ...newOptions];
        // Select first new option if no image is currently selected
        if (!previewCoverUrl.value && newOptions.length > 0) {
          previewCoverUrl.value = newOptions[0].url;
        }
        
        toast.add({
          severity: 'success',
          summary: 'Wikipedia Search Complete',
          detail: `Found ${newOptions.length} new images from Wikipedia`,
          life: 3000
        });
      } else {
        toast.add({
          severity: 'info',
          summary: 'No New Images',
          detail: 'No new images found from Wikipedia',
          life: 3000
        });
      }
    } else {
      toast.add({
        severity: 'warn',
        summary: 'No Wikipedia Results',
        detail: 'No images found in Wikipedia. Try adding terms like "author" or "writer" to your search.',
        life: 5000
      });
    }
  } catch (error) {
    console.error("Error searching for author images in Wikipedia:", error);
    toast.add({
      severity: 'error',
      summary: 'Search Error',
      detail: 'There was an error searching for images in Wikipedia',
      life: 3000
    });
  } finally {
    changingCover.value = false;
  }
};

// Add the removeAuthorImage method to the script
const removeAuthorImage = () => {
  // Set previewCoverUrl to null to indicate we want no image
  previewCoverUrl.value = null;
  
  toast.add({
    severity: 'info',
    summary: 'Image Removed',
    detail: 'The author will be displayed with gradient background only',
    life: 3000
  });
};

onMounted(async () => {
  try {
    // Obtener datos del autor
    const data = await AuthorService.getAuthor(authorId);
    console.log("Author data:", data);

    // Check if author has stored gradient colors
    if (!data.cover && data.gradient_primary_color && data.gradient_secondary_color) {
      // Use stored gradient colors
      data.gradient = `linear-gradient(135deg, ${data.gradient_primary_color}, ${data.gradient_secondary_color})`;
      console.log(`Using stored gradient for ${data.name}:`, data.gradient);
    } 
    // If no cover and no gradient, try to find cover
    else if (!data.cover) {
      console.log(`No cover or stored gradient for ${data.name}, trying to find cover`);
      
      try {
        // Try to fetch cover from OpenLibrary
        const coverData = await AuthorService.fetchAuthorCoverFromOpenLibrary(data.name);
        
        if (coverData.covers && coverData.covers.length > 0) {
          // Found a cover
          const coverUrl = coverData.covers[0].url;
          console.log(`Found cover for ${data.name}:`, coverUrl);
          
          // Update in database
          await AuthorService.updateAuthorCover(data.id, coverUrl);
          
          // Update locally
          data.cover = coverUrl;
        } else {
          // No cover found, generate and save gradient
          console.log(`No cover found for ${data.name}, generating gradient`);
          const gradient = getRandomGradient();
          data.gradient = gradient.background;
          
          // Save gradient colors to database
          await AuthorService.updateGradientColors(
            data.id,
            gradient.primary,
            gradient.secondary
          );
          
          // Update local properties
          data.gradient_primary_color = gradient.primary;
          data.gradient_secondary_color = gradient.secondary;
        }
      } catch (error) {
        console.error(`Error fetching author cover:`, error);
        // Generate gradient as fallback
        const gradient = getRandomGradient();
        data.gradient = gradient.background;
      }
    }
    
    // Add UI-related properties
    data.imageFailed = false;
    coverIsLoading.value = true;

    // Obtener las citas del autor
    const quotes = await QuoteService.getQuotesByAuthor(authorId);
    quotes.forEach((quote) => {
      likedQuotes.value[quote.id] = quote.is_favorite || false;
    });
    data.quotes = quotes;

    // Obtener los libros del autor
    const books = await BookService.getBooksByAuthor(authorId);
    
    // Assign gradients to books using stored colors from database when available
    books.forEach(book => {
      if (book.gradient_primary_color && book.gradient_secondary_color) {
        // If we have stored gradient colors, use them
        book.gradient = {
          primary: book.gradient_primary_color,
          secondary: book.gradient_secondary_color,
          background: `linear-gradient(135deg, ${book.gradient_primary_color}, ${book.gradient_secondary_color})`
        };
      } else if (!book.cover) {
        // Generate a new gradient only if there's no cover and no stored colors
        const gradient = getRandomGradient();
        book.gradient = gradient;
        
        // Save the new gradient colors to the database for future consistency
        if (book.id) {
          BookService.updateGradientColors(
            book.id,
            gradient.primary,
            gradient.secondary
          ).catch(error => {
            console.error(`Error saving gradient colors for book ${book.id}:`, error);
          });
        }
      } else {
        // Generate a fallback gradient in case the cover fails to load later
        // but don't save it yet - will be saved if the image fails to load
        book.gradient = getRandomGradient();
      }
    });
    
    data.books = books;

    // Si hay libros, asignar el ID del primero como valor por defecto para creación
    if (books && books.length > 0) {
      selectedBookId.value = books[0].id;
    }

    author.value = data;
  } catch (error) {
    console.error("Error loading author details:", error);
  }
});
</script>

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

/* Spine effect */
.book-cover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
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
</style>
