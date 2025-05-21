<template>
  <div class="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-900 rounded-3xl">
    <!-- Header Section -->
    <div class="sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 rounded-t-3xl">
      <div class="container mx-auto px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 class="text-4xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent rounded text-center sm:text-left">
            Library Collection
          </h1>
          <div class="flex gap-3 justify-center sm:justify-end mt-4 sm:mt-0">
            <Button 
              label="Update Book Covers" 
              icon="pi pi-refresh" 
              severity="info" 
              @click="fetchBookCovers"
              :loading="updatingCovers"
              class="p-button-rounded"
            />
            <SelectButton
              v-model="layout"
              :options="options"
              :allowEmpty="false"
              class="p-button-rounded"
            >
              <template #option="{ option }">
                <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']"></i>
              </template>
            </SelectButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div v-for="n in skeletonCount" :key="n" class="animate-pulse">
          <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden">
            <div class="aspect-[2/3] bg-surface-200 dark:bg-surface-700"></div>
            <div class="p-6 space-y-4">
              <div class="h-6 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700"></div>
                <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3"></div>
              </div>
              <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Books Grid/List View -->
      <div v-else>
        <Transition name="fade" mode="out-in">
          <template v-if="layout === 'grid'">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <div v-for="book in books" :key="book.id" 
                :data-book-id="book.id"
                class="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
                @click="goToBookDetail(book.id)"
              >
                <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col">
                  <!-- Book Cover -->
                  <div class="relative aspect-[2/3] overflow-hidden">
                    <!-- Loading State -->
                    <div v-if="book.cover && coverLoadingStates[book.id]" 
                      class="absolute inset-0 bg-surface-200 dark:bg-surface-700 animate-pulse flex items-center justify-center">
                      <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <!-- Book Cover Image -->
                    <img v-if="book.cover && !book.imageFailed"
                      :src="book.cover"
                      :alt="book.title"
                      class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      @error="handleImageError(book.id)"
                      @load="handleImageLoad(book.id)"
                    />

                    <!-- Fallback Cover -->
                    <div v-if="!book.cover || book.imageFailed"
                      class="absolute inset-0 flex items-center justify-center overflow-hidden"
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
                        icon="pi pi-book" 
                        rounded 
                        severity="secondary" 
                        @click.stop="goToBookDetail(book.id)"
                      />
                    </div>
                  </div>

                  <!-- Book Info -->
                  <div class="p-6 flex-1 flex flex-col">
                    <h2 class="text-2xl font-bold fancy-font mb-3 line-clamp-2">{{ book.title }}</h2>
                    
                    <!-- Author Info -->
                    <div class="flex items-center mb-4">
                      <div class="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                        <img v-if="book.author.cover && !authorImageFailedStates[book.author.id]"
                          :src="book.author.cover"
                          :alt="book.author.name"
                          class="w-full h-full object-cover"
                          @error="handleAuthorImageError(book.author.id, book.author.name)"
                          @load="handleAuthorImageLoad(book.author.id)"
                        />
                        <div v-else
                          class="w-full h-full flex items-center justify-center"
                          :style="{ background: book.author.gradient || getRandomGradient().background }"
                        >
                          <span class="text-white text-sm font-bold">{{ book.author.name.charAt(0) }}</span>
                        </div>
                      </div>
                      <span class="text-surface-600 dark:text-surface-400">{{ book.author.name }}</span>
                    </div>

                    <!-- Description -->
                    <p class="text-surface-600 dark:text-surface-400 text-sm line-clamp-3 mb-4">{{ book.description }}</p>

                    <!-- Stats and Actions -->
                    <div class="mt-auto flex items-center justify-between">
                      <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-3 py-1 rounded-full">
                        <i class="pi pi-comment text-primary-500"></i>
                        <span class="text-sm font-medium">{{ book.quotes_count || 0 }}</span>
                      </div>
                      <Button 
                        :icon="book.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                        rounded 
                        :severity="book.is_favorite ? 'danger' : 'secondary'"
                        @click.stop="toggleLike(book.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="space-y-4">
              <div v-for="book in books" :key="book.id" 
                :data-book-id="book.id"
                class="group bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                @click="goToBookDetail(book.id)"
              >
                <div class="flex h-48">
                  <!-- Book Cover -->
                  <div class="relative w-32 flex-shrink-0">
                    <!-- Loading State -->
                    <div v-if="book.cover && coverLoadingStates[book.id]" 
                      class="absolute inset-0 bg-surface-200 dark:bg-surface-700 animate-pulse flex items-center justify-center">
                      <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <!-- Book Cover Image -->
                    <img v-if="book.cover && !book.imageFailed"
                      :src="book.cover"
                      :alt="book.title"
                      class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      @error="handleImageError(book.id)"
                      @load="handleImageLoad(book.id)"
                    />

                    <!-- Fallback Cover -->
                    <div v-if="!book.cover || book.imageFailed"
                      class="absolute inset-0 flex items-center justify-center overflow-hidden"
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
                  </div>

                  <!-- Book Info -->
                  <div class="flex-1 p-6 flex flex-col">
                    <div class="flex items-start justify-between">
                      <div>
                        <h2 class="text-2xl font-bold fancy-font mb-2">{{ book.title }}</h2>
                        <!-- Author Info -->
                        <div class="flex items-center mb-3">
                          <div class="relative w-8 h-8 rounded-full overflow-hidden mr-2">
                            <img v-if="book.author.cover && !authorImageFailedStates[book.author.id]"
                              :src="book.author.cover"
                              :alt="book.author.name"
                              class="w-full h-full object-cover"
                              @error="handleAuthorImageError(book.author.id, book.author.name)"
                              @load="handleAuthorImageLoad(book.author.id)"
                            />
                            <div v-else
                              class="w-full h-full flex items-center justify-center"
                              :style="{ background: book.author.gradient || getRandomGradient().background }"
                            >
                              <span class="text-white text-xs font-bold">{{ book.author.name.charAt(0) }}</span>
                            </div>
                          </div>
                          <span class="text-surface-600 dark:text-surface-400">{{ book.author.name }}</span>
                        </div>
                      </div>
                      <Button 
                        :icon="book.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'" 
                        rounded 
                        :severity="book.is_favorite ? 'danger' : 'secondary'"
                        @click.stop="toggleLike(book.id)"
                      />
                    </div>

                    <!-- Description -->
                    <p class="text-surface-600 dark:text-surface-400 text-sm line-clamp-2 mb-4">{{ book.description }}</p>

                    <!-- Stats -->
                    <div class="mt-auto flex items-center gap-4">
                      <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-3 py-1 rounded-full">
                        <i class="pi pi-comment text-primary-500"></i>
                        <span class="text-sm font-medium">{{ book.quotes_count || 0 }} quotes</span>
                      </div>
                      <Button 
                        icon="pi pi-book" 
                        rounded 
                        severity="secondary" 
                        @click.stop="goToBookDetail(book.id)"
                        class="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Transition>
      </div>
    </div>

    <!-- Cover Preview Dialog -->
    <Dialog 
      v-model:visible="coverPreviewDialog" 
      :style="{width: '800px'}" 
      header="Book Cover Preview" 
      :modal="true"
      :closable="true"
      @hide="exitCoverProcess"
      class="cover-preview-dialog"
    >
      <div class="flex flex-col items-center p-4">
        <h3 class="text-xl font-semibold mb-2">{{ currentBook?.title }}</h3>
        <p class="text-sm mb-4">by {{ currentBook?.author?.name }}</p>
        
        <div class="grid grid-cols-2">
          <!-- Selected cover preview (large) -->
          <div class="col-span-1 flex flex-col items-center">
            <h4 class="font-medium mb-2">Selected Cover:</h4>
            <div class="relative mb-4 w-64 h-96 bg-gray-100 flex items-center justify-center border rounded shadow-sm">
              <img 
                v-if="previewCoverUrl" 
                :src="previewCoverUrl" 
                :alt="currentBook?.title"
                class="max-w-full max-h-full object-contain"
                @error="handlePreviewImageError"
                @load="handlePreviewImageLoad"
              />
              <!-- No cover selected or error loading -->
              <div 
                v-if="!previewCoverUrl || previewImageError" 
                class="flex flex-col items-center justify-center text-gray-400 p-4 text-center"
              >
                <i class="pi pi-image text-4xl mb-2"></i>
                <div v-if="previewImageError" class="text-sm text-red-400">
                  Error loading selected cover
                </div>
                <div v-else class="text-sm">
                  No cover selected
                </div>
                <div class="mt-2 text-xs">
                  Select a cover from the options or upload a custom one
                </div>
              </div>
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
                <div class="w-full h-40 flex items-center justify-center bg-gray-100 relative">
                  <img 
                    :src="cover.url" 
                    :alt="`Cover option ${index+1}`"
                    class="max-w-full max-h-full object-contain"
                    @error="handleCoverOptionError($event, index)"
                    @load="handleCoverOptionLoad($event, index)"
                  />
                  <!-- Fallback si la imagen no se puede cargar -->
                  <div
                    v-if="coverLoadErrors[index]"
                    class="absolute inset-0 bg-gray-200 flex flex-col items-center justify-center text-gray-500"
                  >
                    <i class="pi pi-image-slash text-xl mb-1"></i>
                    <span class="text-xs">Image unavailable</span>
                  </div>
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
              @keydown.enter="searchCoverForCurrentBook(customSearchTitle)"
            />
            <Button 
              icon="pi pi-search" 
              @click="searchCoverForCurrentBook(customSearchTitle)"
            />
          </div>
          <small class="text-gray-500 mt-1 block">
            Tip: Try with a more general title or series name
          </small>
        </div>
        
        <!-- Custom URL input -->
        <div class="w-full my-4 border-t pt-4">
          <h4 class="font-medium mb-2">Or enter a custom cover URL:</h4>
          <div class="flex gap-2">
            <InputText 
              v-model="customCoverUrl" 
              placeholder="https://example.com/book-cover.jpg" 
              class="flex-1"
            />
            <Button 
              icon="pi pi-image" 
              @click="previewCustomUrl"
              :disabled="!customCoverUrl"
            />
          </div>
          <small class="text-gray-500 mt-1 block">
            Enter the full URL to an image you want to use as the cover
          </small>
        </div>
        
        <div class="flex justify-center gap-3 mt-4 w-full">
          <Button 
            icon="pi pi-times" 
            label="Reject" 
            severity="secondary" 
            @click="rejectCover"
          />
          <Button 
            icon="pi pi-check" 
            label="Accept" 
            :disabled="!previewCoverUrl"
            @click="acceptCover"
          />
          <Button 
            icon="pi pi-step-forward" 
            label="Skip" 
            class="p-button-outlined" 
            @click="processNextBook"
          />
        </div>
        
        <div class="w-full pt-4 mt-4 border-t border-gray-200 text-center">
          <Button 
            icon="pi pi-times-circle" 
            label="Exit Without Changes" 
            class="p-button-text p-button-danger"
            @click="exitCoverProcess"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { BookService } from "@/service/BookService";
import { AuthorService } from "@/service/AuthorService";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";

// Inicializar el servicio Toast y router
const toast = useToast();
const router = useRouter();

// Opciones de layout para DataView
const layout = ref("grid");
const options = ref(["list", "grid"]);

// Estado de pantalla pequeña
const isSmallScreen = ref(window.innerWidth < 768);

// Estado de carga y cantidad de skeletons a mostrar
const loading = ref(true);
const skeletonCount = 9; // Número de skeletons a mostrar mientras carga

// Estado para la actualización de portadas
const updatingCovers = ref(false);

// Lista de libros y estado de "me gusta" para cada libro
const books = ref([]);
const likedBooks = ref({});

// Track loading states for book covers
const coverLoadingStates = ref({});

// Track loading states for author images
const authorImageLoadingStates = ref({});
const authorImageFailedStates = ref({});

// Style for transitions
const coverTransitionClass = "transition-opacity duration-300";

// Cover preview dialog
const coverPreviewDialog = ref(false);
const currentBook = ref(null);
const previewCoverUrl = ref(null);
const booksToProcess = ref([]);
const currentBookIndex = ref(0);
const customSearchTitle = ref('');
const coverOptions = ref([]);
const customCoverUrl = ref('');
const coverLoadErrors = ref({}); // Estado para almacenar errores de carga de portada por índice

// Estado para el error de la imagen de vista previa
const previewImageError = ref(false);

// Actualiza el layout según el tamaño de la ventana
const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 768;
};

// Función para generar la URL de la portada usando cover_i
const getCoverUrl = (cover_i) => {
  return cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg` : null;
};

// Función para generar un degradado aleatorio cuando no hay portada
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

// Function to fetch book covers from OpenLibrary
const fetchBookCovers = async () => {
  try {
    updatingCovers.value = true;
    
    // Filter books without covers
    const booksWithoutCovers = books.value.filter(book => !book.cover);
    
    if (booksWithoutCovers.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No Books to Update',
        detail: 'All books already have covers',
        life: 3000
      });
      updatingCovers.value = false;
      return;
    }

    // Initialize booksToProcess with all books without covers
    booksToProcess.value = [...booksWithoutCovers];
    currentBookIndex.value = 0;
    
    // Start searching for covers in the background
    const searchCoversInBackground = async () => {
      const booksWithCoverOptions = [];
      
      // Search for covers for all books
      for (const book of booksWithoutCovers) {
        try {
          const result = await BookService.fetchBookCovers(
            book.title, 
            book.author.name
          );
          
          // Filter out problematic covers
          const validCovers = result.covers.filter(cover => {
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
          
          booksWithCoverOptions.push({
            book,
            coverOptions: validCovers
          });
        } catch (error) {
          console.error(`Error fetching covers for book "${book.title}":`, error);
          booksWithCoverOptions.push({
            book,
            coverOptions: []
          });
        }
      }
      
      // Sort books: those with cover options first
      booksWithCoverOptions.sort((a, b) => {
        // If both have covers or both don't have covers, maintain original order
        if ((a.coverOptions.length > 0) === (b.coverOptions.length > 0)) {
          return 0;
        }
        // Put books with covers first
        return a.coverOptions.length > 0 ? -1 : 1;
      });
      
      // Update booksToProcess with the sorted books
      booksToProcess.value = booksWithCoverOptions.map(item => item.book);
      
      // If we're not currently showing a book, start the process
      if (!coverPreviewDialog.value) {
        currentBookIndex.value = 0;
        await processCurrentBook();
      }
    };
    
    // Start the background search
    searchCoversInBackground();
    
    // Start with the first book immediately
    await processCurrentBook();
    
  } catch (error) {
    console.error('Error fetching book covers:', error);
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'There was an error updating book covers',
      life: 3000
    });
    updatingCovers.value = false;
  }
};

// Process the current book and fetch its cover for preview
const processCurrentBook = async () => {
  if (currentBookIndex.value >= booksToProcess.value.length) {
    finishCoverUpdate();
    return;
  }
  
  currentBook.value = booksToProcess.value[currentBookIndex.value];
  previewCoverUrl.value = null;
  coverPreviewDialog.value = true;
  
  try {
    await searchCoverForCurrentBook();
  } catch (error) {
    console.error('Error fetching cover:', error);
    toast.add({
      severity: 'error',
      summary: 'Cover Fetch Error',
      detail: `Error fetching cover for "${currentBook.value.title}"`,
      life: 2000
    });
  }
};

// Search for a cover for the current book
const searchCoverForCurrentBook = async (customTitle) => {
  // Use the provided custom title or the book's title
  const searchTitle = customTitle || currentBook.value.title;
  
  try {
    // Reset cover errors on new search
    coverLoadErrors.value = {};
    
    // Fetch cover options from OpenLibrary
    const result = await BookService.fetchBookCovers(
      searchTitle, 
      currentBook.value.author.name
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
      previewImageError.value = false;
      
      // Pre-load cover images to check availability
      coverOptions.value.forEach((cover, index) => {
        const img = new Image();
        img.onload = () => { coverLoadErrors.value[index] = false; };
        img.onerror = () => { coverLoadErrors.value[index] = true; };
        img.src = cover.url;
      });
      
      toast.add({
        severity: 'success',
        summary: 'Covers Found',
        detail: `Found ${coverOptions.value.length} covers for "${currentBook.value.title}"`,
        life: 2000
      });
    } else {
      previewCoverUrl.value = null;
      toast.add({
        severity: 'info',
        summary: 'No Covers Found',
        detail: `Could not find covers for "${currentBook.value.title}"`,
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
  }
};

// Select a cover from the options
const selectCover = (coverUrl) => {
  previewCoverUrl.value = coverUrl;
};

// Accept the current cover and save it to the database
const acceptCover = async () => {
  if (!previewCoverUrl.value || !currentBook.value) return;
  
  try {
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
    
    // Check if the URL is from OpenLibrary and contains ID 0
    if (previewCoverUrl.value.includes('openlibrary.org') && 
        (previewCoverUrl.value.includes('/id/0-') || 
         previewCoverUrl.value.includes('/id/0.') || 
         previewCoverUrl.value.match(/\/id\/0($|\?)/))) {
      toast.add({
        severity: 'error',
        summary: 'Invalid Cover',
        detail: 'This OpenLibrary cover ID is invalid (ID: 0)',
        life: 3000
      });
      return;
    }
    
    // Get cover value to save - for OpenLibrary, extract just the ID
    let coverValue = previewCoverUrl.value;
    
    // If it's an OpenLibrary URL, extract just the ID to store
    if (previewCoverUrl.value.includes('openlibrary.org/b/id/')) {
      // Extract the ID from OpenLibrary URL format like: 
      // https://covers.openlibrary.org/b/id/12345-L.jpg
      const match = previewCoverUrl.value.match(/\/b\/id\/(\d+)/);
      if (match && match[1]) {
        coverValue = match[1]; // Just store the numeric ID
        console.log('Extracted OpenLibrary ID:', coverValue);
      }
    }
    
    console.log('Saving cover value:', coverValue);
    
    // Create a minimal update object with ONLY the cover field
    const updateData = {
      cover: coverValue
    };
    
    // Log the exact data being sent
    console.log('Sending update data:', JSON.stringify(updateData, null, 2));
    
    // Update the book with minimal data
    await BookService.updateBook(currentBook.value.id, updateData);
    
    // Update local state
    const bookIndex = books.value.findIndex(b => b.id === currentBook.value.id);
    if (bookIndex !== -1) {
      books.value[bookIndex].cover = coverValue;
    }
    
    toast.add({
      severity: 'success',
      summary: 'Cover Accepted',
      detail: `Cover for "${currentBook.value.title}" has been saved`,
      life: 2000
    });
    
    // Process next book
    processNextBook();
    
  } catch (error) {
    console.error('Error saving cover:', error);
    console.log('Failed cover value:', previewCoverUrl.value);
    
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
      console.error('Request data:', error.config.data);
    }
    
    // More specific error message based on error type
    let errorMessage = `Error saving cover for "${currentBook.value.title}"`;
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage = `The server rejected the cover URL (400 Bad Request). Try a different URL format.`;
        if (error.response.data && typeof error.response.data === 'object') {
          // Try to extract specific validation errors
          const errors = Object.entries(error.response.data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          if (errors) {
            errorMessage += ` Validation errors: ${errors}`;
          }
        }
      } else if (error.response.status === 413) {
        errorMessage = `The cover URL is too long. Try a shorter URL.`;
      }
    }
    
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: errorMessage,
      life: 3000
    });
  }
};

// Reject the current cover and move to next book
const rejectCover = () => {
  toast.add({
    severity: 'info',
    summary: 'Cover Rejected',
    detail: `Cover for "${currentBook.value.title}" was rejected`,
    life: 2000
  });
  
  processNextBook();
};

// Move to the next book in the queue
const processNextBook = () => {
  currentBookIndex.value++;
  processCurrentBook();
};

// Finish the cover update process
const finishCoverUpdate = () => {
  coverPreviewDialog.value = false;
  updatingCovers.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'Process Completed',
    detail: 'Book cover update process is complete',
    life: 3000
  });
};

onMounted(async () => {
  window.addEventListener("resize", handleResize);
  handleResize();

  // Obtener datos de libros a través de BookService
  const data = await BookService.getBooks();

  // Procesa cada libro: asigna la URL de la portada si existe, o un degradado aleatorio
  data.forEach((book) => {
    // Create gradient object - either from stored values or generate new one
    if (book.gradient_primary_color && book.gradient_secondary_color) {
      // Use the stored gradient colors from the database
      console.log(`Book ${book.id} already has gradient colors:`, book.gradient_primary_color, book.gradient_secondary_color);
      book.gradient = {
        primary: book.gradient_primary_color,
        secondary: book.gradient_secondary_color,
        background: `linear-gradient(135deg, ${book.gradient_primary_color}, ${book.gradient_secondary_color})`
      };
    } else {
      // Generate a new random gradient and store it in the database
      console.log(`Book ${book.id} needs new gradient colors`);
      book.gradient = getRandomGradient();
      console.log(`Generated colors for book ${book.id}:`, book.gradient.primary, book.gradient.secondary);
      
      // Save the gradient colors to the database
      BookService.updateBook(
        book.id,
        {
          gradient_primary_color: book.gradient.primary,
          gradient_secondary_color: book.gradient.secondary
        }
      ).then(response => {
        console.log(`Successfully saved gradient colors for book ${book.id}:`, response);
        // Verify the colors were actually saved
        verifyGradientColors(book.id);
      }).catch(error => {
        console.error(`Error saving gradient colors for book ${book.id}:`, error);
      });
    }
    
    // Initialize UI state properties for book cover
    book.imageFailed = false;
    coverLoadingStates.value[book.id] = true;
    
    // Initialize UI state properties for author image
    if (book.author && book.author.id) {
      // Initialize author image loading state
      authorImageLoadingStates.value[book.author.id] = book.author.cover ? true : false;
      authorImageFailedStates.value[book.author.id] = false;
      
      // Create a gradient for the author if they don't have a cover
      if (!book.author.cover) {
        const gradient = getRandomGradient();
        book.author.gradient = gradient.background;
        book.author.gradientPrimary = gradient.primary;
        book.author.gradientSecondary = gradient.secondary;
      }
    }
    
    // Se espera que cada libro tenga un id único
    likedBooks.value[book.id] = book.is_favorite;
  });

  books.value = data;
  loading.value = false; // Finaliza el estado de carga
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// Función para alternar el estado "me gusta" de un libro
const toggleLike = async (bookId) => {
  try {
    const response = await BookService.toggleFavorite(bookId);
    // Update the local state based on the server response
    const book = books.value.find(b => b.id === bookId);
    if (book) {
      book.is_favorite = response.is_favorite;
      
      // If this book was favorited, move it to the top of the list
      if (response.is_favorite) {
        // Remove the book from its current position
        const index = books.value.findIndex(b => b.id === bookId);
        if (index !== -1) {
          const [favoriteBook] = books.value.splice(index, 1);
          // Add it to the beginning of the array
          books.value.unshift(favoriteBook);
          
          // Scroll to the top to show the favorited book
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    likedBooks.value[bookId] = response.is_favorite;
  } catch (error) {
    console.error("Error toggling favorite status:", error);
  }
};

// Exit the cover process
const exitCoverProcess = () => {
  coverPreviewDialog.value = false;
  updatingCovers.value = false;
  
  toast.add({
    severity: 'info',
    summary: 'Process Exited',
    detail: 'Cover update process has been canceled. No changes were made.',
    life: 3000
  });
};

// Handle image error
const handleImageError = (bookId) => {
  // Mark the image as failed
  if (books.value) {
    const book = books.value.find(b => b.id === bookId);
    if (book) {
      book.imageFailed = true;
      // Generate a gradient if not already set
      if (!book.gradient) {
        book.gradient = getRandomGradient();
        
        // Save the generated gradient to the database
        BookService.updateBook(
          book.id,
          {
            gradient_primary_color: book.gradient.primary,
            gradient_secondary_color: book.gradient.secondary
          }
        ).catch(error => {
          console.error(`Error saving gradient colors for book ${book.id}:`, error);
        });
      }
    }
  }
  
  // Set loading state to false
  coverLoadingStates.value[bookId] = false;
};

// Handle image load success
const handleImageLoad = (bookId) => {
  // Short delay for a smoother transition
  setTimeout(() => {
    coverLoadingStates.value[bookId] = false;
  }, 300);
};

// Preview a custom cover URL
const previewCustomUrl = () => {
  if (!customCoverUrl.value) return;
  
  // Validate the URL format
  let validUrl;
  try {
    validUrl = new URL(customCoverUrl.value).toString();
  } catch (urlError) {
    toast.add({
      severity: 'error',
      summary: 'Invalid URL',
      detail: 'The URL format is invalid. Make sure it starts with http:// or https://',
      life: 3000
    });
    return;
  }
  
  // Check if this is an OpenLibrary URL with a potential ID that could be extracted
  let coverValue = validUrl;
  
  if (validUrl.includes('openlibrary.org/b/id/')) {
    // Extract just the ID for OpenLibrary URLs
    const match = validUrl.match(/\/b\/id\/(\d+)/);
    if (match && match[1]) {
      // Just show the user we're normalizing the URL
      toast.add({
        severity: 'info',
        summary: 'OpenLibrary URL Detected',
        detail: 'The URL will be stored as just the cover ID for compatibility',
        life: 3000
      });
      
      // For preview purposes, keep showing the full URL
      coverValue = validUrl;
    }
  }
  
  // Set the preview to the custom URL
  previewCoverUrl.value = coverValue;
  previewImageError.value = false;
  
  // Add to cover options if not already there
  const exists = coverOptions.value.some(option => option.url === coverValue);
  if (!exists) {
    coverOptions.value.push({
      url: coverValue,
      source: 'custom',
      title: currentBook.value?.title || '',
      author: currentBook.value?.author?.name || ''
    });
  }
  
  toast.add({
    severity: 'success',
    summary: 'Custom URL Added',
    detail: 'Custom cover URL has been added to options',
    life: 2000
  });
};

// Navigate to book detail page
const goToBookDetail = (bookId) => {
  router.push({ name: 'bookDetail', params: { id: bookId } });
};

// Verify gradient colors were saved
const verifyGradientColors = async (bookId) => {
  try {
    // Wait a moment to ensure the update has been processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch the book data to check if colors were saved
    const book = await BookService.getBook(bookId);
    
    if (book && book.gradient_primary_color && book.gradient_secondary_color) {
      console.log(`VERIFICATION: Book ${bookId} has gradient colors saved:`, {
        gradient_primary_color: book.gradient_primary_color,
        gradient_secondary_color: book.gradient_secondary_color
      });
      return true;
    } else {
      console.warn(`VERIFICATION: Book ${bookId} does not have gradient colors saved!`);
      return false;
    }
  } catch (error) {
    console.error(`VERIFICATION: Error checking gradient colors for book ${bookId}:`, error);
    return false;
  }
};

// Handle author image error
const handleAuthorImageError = (authorId, authorName) => {
  // Mark the image as failed
  authorImageFailedStates.value[authorId] = true;
  authorImageLoadingStates.value[authorId] = false;
  
  // Find the book with this author
  const book = books.value.find(b => b.author.id === authorId);
  if (book && book.author) {
    // Generate gradient if not already set
    if (!book.author.gradient) {
      const gradient = getRandomGradient();
      book.author.gradient = gradient.background;
      book.author.gradientPrimary = gradient.primary;
      book.author.gradientSecondary = gradient.secondary;
      
      // Try to save the gradient colors to the database (if implemented)
      AuthorService.updateGradientColors(authorId, gradient.primary, gradient.secondary)
        .catch(error => console.error(`Error saving author gradient colors:`, error));
    }
  }
};

// Handle author image load success
const handleAuthorImageLoad = (authorId) => {
  // Set loading state to false with a slight delay for a smoother transition
  setTimeout(() => {
    authorImageLoadingStates.value[authorId] = false;
  }, 300);
};

// Handle cover option error
const handleCoverOptionError = (event, index) => {
  // Mark the image as failed
  coverLoadErrors.value[index] = true;
  
  console.warn(`Cover option ${index} failed to load: ${coverOptions.value[index]?.url}`);
  
  // If this was the selected cover, we should probably select another one
  if (previewCoverUrl.value === coverOptions.value[index]?.url) {
    // Find another cover that hasn't failed, if any
    const anotherCover = coverOptions.value.find((c, i) => !coverLoadErrors.value[i]);
    if (anotherCover) {
      previewCoverUrl.value = anotherCover.url;
    } else {
      previewCoverUrl.value = null; // No valid covers available
    }
  }
};

// Handle cover option load success
const handleCoverOptionLoad = (event, index) => {
  // Mark the image as loaded successfully
  coverLoadErrors.value[index] = false;
};

// Manejador de error para la imagen de vista previa
const handlePreviewImageError = () => {
  previewImageError.value = true;
  console.error(`Failed to load preview image: ${previewCoverUrl.value}`);
  
  toast.add({
    severity: 'error',
    summary: 'Cover Preview Error',
    detail: 'Failed to load the selected cover image.',
    life: 3000
  });
};

// Manejador de carga exitosa para la imagen de vista previa
const handlePreviewImageLoad = () => {
  previewImageError.value = false;
};
</script>

<style scoped>
.rotate-30 {
  transform: rotate(30deg);
}

.book-cover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  position: relative;
  height: 300px;
  min-height: 300px;
  max-height: 300px;
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

/* New styles */
.fancy-font {
  font-family: inherit;
}

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

/* Enhanced book cover styles */
.book-cover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
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

/* Dialog enhancements */
.cover-preview-dialog {
  .p-dialog-header {
    background: var(--surface-0);
    border-bottom: 1px solid var(--surface-200);
  }
  
  .p-dialog-content {
    background: var(--surface-0);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
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

/* Book transition styles */
.book-transition-out {
  transform: scale(1.1);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Add styles for the cover transition */
.cover-transition {
  position: fixed;
  z-index: 9999;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
