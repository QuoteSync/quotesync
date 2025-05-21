<template>
  <div v-if="author" class="flex h-screen overflow-hidden">
    <!-- Author Panel (1/4) -->
    <div class="w-1/4 p-6 flex flex-col items-center sticky top-0">
      <div class="w-full bg-surface-0 dark:bg-surface-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-700 p-6 flex flex-col items-center animate-fade-in">
        <!-- Author Cover -->
        <div class="relative group w-full" style="aspect-ratio: 3/4;">
          <div class="absolute inset-0 w-full h-full rounded-2xl shadow-lg transform transition-transform duration-300 group-hover:scale-105 overflow-hidden">
            <!-- Loading State -->
            <div v-if="author.cover && coverIsLoading" 
              class="absolute inset-0 w-full h-full rounded-2xl shadow-lg overflow-hidden bg-surface-200 dark:bg-surface-700"
              :class="coverTransitionClass"
            >
              <div class="absolute inset-0 w-full h-full animate-pulse">
                <div class="h-full w-full bg-gradient-to-r from-surface-200 via-surface-300 to-surface-200 dark:from-surface-700 dark:via-surface-600 dark:to-surface-700"></div>
              </div>
              
              <!-- Loading spinner -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            
            <!-- Author Cover Image -->
            <img 
              v-if="author.cover && !author.imageFailed" 
              :src="author.cover" 
              :alt="author.name" 
              class="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-110"
              :class="[coverTransitionClass, coverIsLoading ? 'opacity-0' : 'opacity-100']"
              @error="handleAuthorImageError(author)"
              @load="handleImageLoad"
            />
            
            <!-- Fallback Cover -->
            <div 
              v-if="(!author.cover || author.imageFailed)" 
              class="absolute inset-0 w-full h-full rounded-2xl shadow-lg overflow-hidden flex items-center justify-center"
              :class="coverTransitionClass"
              :style="{ 
                background: author.gradient || 
                  (author.gradient_primary_color && author.gradient_secondary_color ? 
                    `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})` : 
                    getRandomGradient().background) 
              }"
            >
              <div class="w-full h-full flex flex-col p-4 relative">
                <!-- Light reflection effect -->
                <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
                
                <!-- Decorative author elements -->
                <div class="flex-1 flex flex-col items-center justify-center relative">
                  <!-- Decorative circle -->
                  <div class="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center mb-4">
                    <div class="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                      <span class="text-white/80 text-3xl font-serif">{{ author.name.charAt(0) }}</span>
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
                @click.stop="openCoverDialog"
              />
            </div>
          </div>
        </div>

        <!-- Author Name -->
        <h1 class="text-3xl font-bold fancy-font mt-6 mb-4 text-center bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">{{ author.name }}</h1>

        <!-- Author Stats and Actions -->
        <div class="w-full flex items-center justify-between mt-6">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 p-3 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-200">
              <i class="pi pi-book text-primary-500 text-lg"></i>
              <span class="font-semibold text-lg">{{ author.books?.length || 0 }}</span>
            </div>
            
            <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 p-3 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-200">
              <i class="pi pi-comment text-primary-500 text-lg"></i>
              <span class="font-semibold text-lg">{{ author.quotes_count || 0 }}</span>
            </div>
          </div>

          <Button 
            :icon="author.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'" 
            rounded
            :severity="author.is_favorite ? 'danger' : 'secondary'"
            @click="toggleLike(author.id)"
            class="p-button-outlined"
          />
        </div>
      </div>
    </div>

    <!-- Content Panel (3/4) -->
    <div class="w-3/4 overflow-y-auto pl-8 animate-slide-in">
      <div class="max-w-6xl mx-auto p-8 space-y-12">
        <!-- Books Section -->
        <div class="relative">
          <div class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-3xl hover:shadow-xl transition-all duration-300 relative">
            <h2 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Books by {{ author.name }}</h2>
      <div
        v-if="author.books && author.books.length"
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <div
          v-for="book in author.books"
          :key="book.id"
                class="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2"
          @click="$router.push({ name: 'bookDetail', params: { id: book.id } })"
        >
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-2xl transform rotate-2 group-hover:rotate-3 transition-transform duration-300"></div>
                  <div class="p-4 border border-surface-200 dark:border-surface-700 rounded-2xl hover:shadow-lg transition-all duration-300 bg-surface-0 dark:bg-surface-900 relative">
          <div class="flex-grow">
            <template v-if="book.cover">
              <img
                          class="rounded-xl w-full h-60 object-cover transition-transform duration-300 group-hover:scale-105"
                :src="book.cover + '?nocache=' + new Date().getTime()"
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
                          class="rounded-xl w-full h-60 flex flex-col book-cover overflow-hidden"
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
                    <div class="mt-4 text-center">
                      <h3 class="font-semibold text-lg truncate group-hover:text-primary-500 transition-colors duration-300">{{ book.title }}</h3>
          </div>
        </div>
      </div>
              </div>
            </div>
            <div v-else class="text-center text-surface-500 p-8">
              <i class="pi pi-book text-4xl mb-4"></i>
              <p class="text-lg">No books available for this author.</p>
            </div>
      </div>
    </div>

        <!-- Quotes Section -->
        <div class="relative">
          <div class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-3xl hover:shadow-xl transition-all duration-300 relative">
            <h2 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Quotes</h2>

            <!-- Filters -->
            <div class="mb-8 flex flex-col md:flex-row items-center justify-center gap-6 bg-surface-50 dark:bg-surface-800 p-6 rounded-2xl shadow-sm">
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

            <!-- New Quote Form -->
            <div v-if="isCreatingNewQuote" class="mt-8">
              <div class="relative group">
                <div class="bg-surface-50 dark:bg-surface-800 rounded-2xl shadow-lg p-6 transform transition-all duration-300 animate-fade-in relative">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-semibold text-surface-900 dark:text-surface-100">
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

                  <!-- Book selection dropdown -->
                  <div v-if="author.books && author.books.length" class="mb-6">
                    <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Select Book:
                    </label>
                    <select 
                      v-model="selectedBookId" 
                      class="w-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-3 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
          <option v-for="book in author.books" :key="book.id" :value="book.id">
            {{ book.title }}
          </option>
        </select>
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

            <!-- Quotes List -->
      <div
        v-if="filteredQuotes && filteredQuotes.length"
              class="flex flex-col gap-6 mt-8"
      >
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
      @edit-quote="handleEditFromModal"
      @previous-quote="navigateToPreviousQuote"
      @next-quote="navigateToNextQuote"
    />

    <!-- Cover Change Dialog -->
    <Dialog 
      v-model:visible="coverDialogVisible" 
      modal 
      header="Change Author Image" 
      :style="{ width: '90vw', maxWidth: '800px' }"
      class="cover-dialog"
    >
      <div class="p-4">
        <!-- Preview Section -->
        <div class="mb-6">
          <h3 class="text-xl font-semibold mb-4">Preview</h3>
          <div class="relative w-1/3 mx-auto" style="aspect-ratio: 3/4;">
            <div class="absolute inset-0 rounded-xl overflow-hidden">
              <img 
                v-if="previewCoverUrl" 
                :src="previewCoverUrl" 
                class="w-full h-full object-cover"
                @error="handleCustomUrlError"
                @load="handleCustomUrlSuccess"
              />
              <div 
                v-else 
                class="w-full h-full book-cover flex items-center justify-center"
                :style="{ 
                  background: author?.gradient || 
                    (author?.gradient_primary_color && author?.gradient_secondary_color ? 
                      `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})` : 
                      getRandomGradient().background) 
                }"
              >
                <div class="text-white text-xl font-bold">
                  <div class="w-12 h-12 mx-auto rounded-full border-2 border-white/30 flex items-center justify-center mb-2">
                    <span class="text-2xl">{{ author?.name?.charAt(0) }}</span>
                  </div>
                  <div class="text-base">{{ author?.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Search Options -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Wikipedia Search -->
          <div class="space-y-4">
            <h3 class="text-xl font-semibold">Search Wikipedia</h3>
            <div class="flex gap-2">
              <InputText 
                v-model="wikipediaSearchTerm" 
                placeholder="Search term..." 
                class="flex-grow"
              />
              <Button 
                icon="pi pi-search" 
                @click="searchWithWikipedia"
                :loading="changingCover"
              />
            </div>
            <div v-if="coverOptions.length > 0" class="grid grid-cols-2 gap-4 mt-4">
              <div 
                v-for="option in coverOptions" 
                :key="option.url"
                class="relative cursor-pointer rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
                :class="{ 'ring-2 ring-primary-500': previewCoverUrl === option.url }"
                @click="selectCover(option.url)"
              >
                <img 
                  :src="option.url" 
                  class="w-full h-32 object-cover"
                  :alt="option.title || 'Cover option'"
                />
              </div>
            </div>
          </div>

          <!-- Custom URL -->
          <div class="space-y-4">
            <h3 class="text-xl font-semibold">Custom URL</h3>
            <div class="flex gap-2">
              <InputText 
                v-model="customCoverUrl" 
                placeholder="Enter image URL..." 
                class="flex-grow"
              />
              <Button 
                icon="pi pi-eye" 
                @click="previewCustomCoverUrl"
              />
            </div>
            <div v-if="showCustomPreview" class="mt-4">
              <div v-if="previewError" class="text-red-500">
                Invalid image URL
              </div>
              <div v-else class="flex gap-2">
                <Button 
                  label="Use This Image" 
                  @click="useCustomCoverUrl"
                  :disabled="previewError"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Remove Image Option -->
        <div class="mt-6 text-center">
          <Button 
            label="Remove Image" 
            icon="pi pi-trash" 
            class="p-button-danger p-button-outlined"
            @click="removeAuthorImage"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="coverDialogVisible = false" 
            class="p-button-text"
          />
          <Button 
            label="Save" 
            icon="pi pi-check" 
            @click="saveCoverChange"
            :loading="changingCover"
          />
        </div>
      </template>
    </Dialog>
  </div>
  <div v-else class="flex justify-center items-center h-screen">
    <div class="text-center">
      <i class="pi pi-spin pi-spinner text-primary text-4xl mb-4"></i>
      <p class="text-lg text-surface-600">Loading author details...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { AuthorService } from "@/service/AuthorService";
import { BookService } from "@/service/BookService";
import { QuoteService } from "@/service/QuoteService";
import QuoteCard from "@/components/QuoteCard.vue";
import QuoteModal from '@/components/QuoteModal.vue';
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
      summary: 'Searching Wikipedia',
      detail: `Looking for images for ${author.value.name}...`,
      life: 3000
    });
    
    // Search Wikipedia for author images
    const options = await AuthorService.fetchAuthorCoverFromOpenLibrary(
      author.value.name,
      true
    );
    
    if (options && options.length > 0) {
      coverOptions.value = options;
      // Select first option automatically
      if (options.length > 0 && !previewCoverUrl.value) {
        previewCoverUrl.value = options[0].url;
      }
      
      toast.add({
        severity: 'success',
        summary: 'Wikipedia Search Complete',
        detail: `Found ${options.length} images from Wikipedia`,
        life: 3000
      });
    } else {
      toast.add({
        severity: 'warn',
        summary: 'No Images Found',
        detail: 'No images found in Wikipedia. Try adding terms like "author" or "writer" to your search.',
        life: 5000
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

// Add the modal state variables
const showQuoteModal = ref(false);
const selectedQuote = ref(null);
const selectedQuoteIndex = ref(-1);

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

// Add toggleLike function for author favorites
const toggleLike = async (authorId) => {
  try {
    const response = await AuthorService.toggleFavorite(authorId);
    // Update the local state based on the server response
    if (author.value) {
      author.value.is_favorite = response.is_favorite;
    }
    
    // Show toast notification
    toast.add({
      severity: response.is_favorite ? 'success' : 'info',
      summary: response.is_favorite ? 'Added to Favorites' : 'Removed from Favorites',
      detail: response.is_favorite ? 'Author has been added to your favorites' : 'Author has been removed from your favorites',
      life: 3000
    });
  } catch (error) {
    console.error("Error toggling favorite status:", error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update favorite status',
      life: 3000
    });
  }
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

/* Dark mode adjustments */
.dark .book-cover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

.dark .book-cover::before {
  background: rgba(255,255,255,0.1);
}

.dark .book-cover::after {
  background: rgba(0,0,0,0.2);
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

/* Add new styles for the floating author panel */
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.dark .shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Add a subtle hover effect to the author panel */
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

/* Add styles for the cover dialog */
.cover-dialog :deep(.p-dialog-header) {
  background: linear-gradient(to right, var(--surface-50), var(--surface-100));
  border-bottom: 1px solid var(--surface-200);
}

.dark .cover-dialog :deep(.p-dialog-header) {
  background: linear-gradient(to right, var(--surface-800), var(--surface-900));
  border-bottom: 1px solid var(--surface-700);
}

.cover-dialog :deep(.p-dialog-content) {
  padding: 0;
}

.cover-dialog :deep(.p-dialog-footer) {
  background: var(--surface-50);
  border-top: 1px solid var(--surface-200);
  padding: 1rem;
}

.dark .cover-dialog :deep(.p-dialog-footer) {
  background: var(--surface-800);
  border-top: 1px solid var(--surface-700);
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
.w-3\/4 {
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
</style>
