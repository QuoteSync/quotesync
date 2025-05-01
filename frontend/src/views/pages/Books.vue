<template>
  <div class="flex flex-col">
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <div class="font-semibold text-xl">Libros</div>
        <div class="flex gap-2">
          <Button 
            label="Update Book Covers" 
            icon="pi pi-refresh" 
            severity="info" 
            @click="fetchBookCovers"
            :loading="updatingCovers"
          />
        </div>
      </div>

      <!-- Si está cargando, se muestran los skeletons -->
      <div v-if="loading" class="grid grid-cols-12 gap-4">
        <div
          v-for="n in skeletonCount"
          :key="n"
          class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
        >
          <div
            class="p-6 h-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg animate-pulse"
          >
            <div class="rounded-lg w-[200px] h-[300px] min-h-[300px] max-h-[300px] bg-gray-300 mx-auto"></div>
            <div class="mt-4 text-center">
              <div class="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
              <div class="flex items-center justify-center mb-2">
                <div class="w-10 h-10 rounded-full bg-gray-300"></div>
                <div class="ml-2 h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
              <div class="h-4 bg-gray-300 rounded w-5/6 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cuando ya cargaron los datos, se muestra el DataView -->
      <DataView v-else :value="books" :layout="layout">
        <!-- Header con botón para cambiar layout (solo en pantallas grandes) -->
        <template #header>
          <div class="flex justify-end">
            <SelectButton
              v-if="!isSmallScreen"
              v-model="layout"
              :options="options"
              :allowEmpty="false"
            >
              <template #option="{ option }">
                <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']"></i>
              </template>
            </SelectButton>
          </div>
        </template>

        <!-- Layout tipo lista -->
        <template #list="slotProps">
          <div class="flex flex-col">
            <div v-for="(book, index) in slotProps.items" :key="index">
              <div
                class="flex flex-col sm:flex-row md:items-center p-6 gap-4 hover:scale-105 hover:shadow-xl transition-transform duration-300 cursor-pointer"
                :class="{ 'border-t border-surface': index !== 0 }"
                @click="goToBookDetail(book.id)"
              >
                <!-- Contenedor de la portada (300x200 px) -->
                <div class="flex-shrink-0 w-[200px]">
                  <!-- Fixed size container to prevent layout shifts -->
                  <div class="relative w-[200px] h-[300px] min-h-[300px] max-h-[300px] mx-auto">
                    <!-- Skeleton loader that shows during loading -->
                    <div 
                      v-if="book.cover && coverLoadingStates[book.id]" 
                      class="absolute inset-0 rounded-lg overflow-hidden bg-gray-200"
                      :class="coverTransitionClass"
                    >
                      <!-- Skeleton animation -->
                      <div class="absolute inset-0 w-full h-full animate-pulse">
                        <div class="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
                      </div>
                      
                      <!-- Loading spinner in the center -->
                      <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                    
                    <!-- Actual book cover image -->
                    <img
                      v-if="book.cover && !book.imageFailed"
                      :src="book.cover"
                      :alt="book.title"
                      class="absolute inset-0 h-full w-full object-contain rounded-lg book-cover"
                      :class="[coverTransitionClass, coverLoadingStates[book.id] ? 'opacity-0' : 'opacity-100']"
                      @error="handleImageError(book.id)"
                      @load="handleImageLoad(book.id)"
                    />
                    
                    <!-- Error fallback for failed images -->
                    <div 
                      v-if="book.cover && book.imageFailed" 
                      class="absolute inset-0 flex flex-col items-center justify-center rounded-lg book-cover"
                      :class="coverTransitionClass"
                      :style="{ background: book.gradient.background }"
                    >
                      <!-- Book-like cover design -->
                      <div class="w-full h-full flex flex-col p-4 relative overflow-hidden">
                        <!-- Light reflection effect -->
                        <div class="absolute top-0 right-0 w-20 h-[150%] bg-white opacity-10 rotate-30 -translate-x-10 -translate-y-10"></div>
                        
                        <!-- Title area -->
                        <div class="mt-auto flex flex-col p-3 text-center z-10">
                          <span class="text-white font-bold text-base leading-tight">{{ book.title.split(' ').slice(0, 8).join(' ') }}{{ book.title.split(' ').length > 8 ? '...' : '' }}</span>
                          <span class="text-white/80 text-xs mt-2">by {{ book.author.name }}</span>
                          <div class="mt-3 flex flex-col items-center">
                            <i class="pi pi-image text-white/60 text-sm"></i>
                            <span class="text-white/60 text-xs mt-1">Image unavailable</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Fallback if no cover is available -->
                    <div
                      v-if="!book.cover"
                      class="absolute inset-0 rounded-lg overflow-hidden book-cover"
                      :class="coverTransitionClass"
                      :style="{ background: book.gradient.background }"
                    >
                      <!-- Book-like cover design -->
                      <div class="w-full h-full flex flex-col p-4 relative">
                        <!-- Light reflection effect -->
                        <div class="absolute top-0 right-0 w-20 h-[150%] bg-white opacity-10 rotate-30 -translate-x-10 -translate-y-10"></div>
                        
                        <!-- Decorative book elements -->
                        <div class="flex-1 flex flex-col items-center justify-center relative">
                          <!-- Decorative circle -->
                          <div class="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center mb-4">
                            <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                              <span class="text-white/80 text-xl font-serif">{{ book.title.charAt(0) }}</span>
                            </div>
                          </div>
                          
                          <!-- Decorative lines -->
                          <div class="w-16 h-0.5 bg-white/20 mb-1"></div>
                          <div class="w-24 h-0.5 bg-white/20 mb-4"></div>
                        </div>
                        
                        <!-- Title area -->
                        <div class="mt-auto flex flex-col p-3 text-center z-10">
                          <span class="text-white font-bold text-lg leading-tight uppercase tracking-wide">{{ book.title.split(' ').slice(0, 8).join(' ') }}{{ book.title.split(' ').length > 8 ? '...' : '' }}</span>
                          <div class="w-12 h-0.5 bg-white/40 mx-auto my-2"></div>
                          <span class="text-white/80 text-xs mt-2 italic">by {{ book.author.name }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Información del libro -->
                <div class="flex flex-col justify-between flex-1">
                  <div>
                    <h2 class="text-3xl font-bold fancy-font">{{ book.title }}</h2>
                    <div class="flex items-center mt-2">
                      <!-- Author image with loading state and fallback -->
                      <div class="relative w-10 h-10 rounded-full overflow-hidden">
                        <!-- Loading skeleton -->
                        <div 
                          v-if="book.author.cover && authorImageLoadingStates[book.author.id]" 
                          class="absolute inset-0 w-full h-full rounded-full bg-gray-200 animate-pulse"
                        ></div>
                        
                        <!-- Author image -->
                        <img
                          v-if="book.author.cover && !authorImageFailedStates[book.author.id]"
                          :src="book.author.cover"
                          :alt="book.author.name"
                          class="w-10 h-10 rounded-full object-cover transition-transform duration-300 hover:scale-105"
                          @error="handleAuthorImageError(book.author.id, book.author.name)"
                          @load="handleAuthorImageLoad(book.author.id)"
                        />
                        
                        <!-- Gradient fallback -->
                        <div
                          v-if="!book.author.cover || authorImageFailedStates[book.author.id]"
                          class="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105"
                          :style="{ 
                            background: book.author.gradient || 
                              (book.author.gradientPrimary && book.author.gradientSecondary ? 
                                `linear-gradient(135deg, ${book.author.gradientPrimary}, ${book.author.gradientSecondary})` : 
                                getRandomGradient().background)
                          }"
                        >
                          <span class="text-white text-sm font-bold">{{ book.author.name.charAt(0) }}</span>
                        </div>
                      </div>
                      <span class="ml-2 text-lg font-semibold">{{
                        book.author.name
                      }}</span>
                    </div>
                    <p class="text-sm mt-2">{{ book.description }}</p>
                  </div>
                  <!-- Add quote count badge -->
                  <div class="mt-4 flex flex-col md:items-end gap-4">
                    <div
                      class="bg-surface-100 p-1 rounded-full"
                      style="border-radius: 30px"
                    >
                      <div
                        class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2 rounded-full"
                        style="
                          box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.04),
                            0px 1px 2px rgba(0, 0, 0, 0.06);
                        "
                      >
                        <span class="text-surface-900 font-medium text-sm">{{ book.quotes_count || 0 }}</span>
                        <i class="pi pi-comment text-primary-500"></i>
                      </div>
                    </div>
                    <div class="flex flex-row-reverse md:flex-row gap-2">
                      <Button
                        :icon="book.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        outlined
                        @click.stop="toggleLike(book.id)"
                      ></Button>
                      <Button
                        icon="pi pi-book"
                        label="Leer más"
                        class="flex-auto whitespace-nowrap"
                        @click="goToBookDetail(book.id)"
                      ></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Layout tipo grid -->
        <template #grid="slotProps">
          <div class="grid grid-cols-12 gap-4 auto-rows-fr">
            <div
              v-for="(book, index) in slotProps.items"
              :key="index"
              class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
            >
              <div
                @click="goToBookDetail(book.id)"
                class="p-6 h-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg flex flex-col hover:scale-105 hover:shadow-xl mx-auto transition-transform duration-300 cursor-pointer"
              >
                <!-- Portada para grid (200x300 px) -->
                <div class="relative w-[200px] h-[300px] min-h-[300px] max-h-[300px] mx-auto mb-4">
                  <!-- Skeleton loader that shows during loading -->
                  <div 
                    v-if="book.cover && coverLoadingStates[book.id]" 
                    class="absolute inset-0 rounded-lg overflow-hidden bg-gray-200"
                    :class="coverTransitionClass"
                  >
                    <!-- Skeleton animation -->
                    <div class="absolute inset-0 w-full h-full animate-pulse">
                      <div class="h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
                    </div>
                    
                    <!-- Loading spinner in the center -->
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                  
                  <!-- Actual book cover image -->
                  <img
                    v-if="book.cover && !book.imageFailed"
                    :src="book.cover"
                    :alt="book.title"
                    class="absolute inset-0 w-full h-full rounded-lg object-contain book-cover"
                    :class="[coverTransitionClass, coverLoadingStates[book.id] ? 'opacity-0' : 'opacity-100']"
                    @error="handleImageError(book.id)"
                    @load="handleImageLoad(book.id)"
                  />
                  
                  <!-- Error fallback for failed images -->
                  <div 
                    v-if="book.cover && book.imageFailed" 
                    class="absolute inset-0 flex flex-col items-center justify-center rounded-lg book-cover"
                    :class="coverTransitionClass"
                    :style="{ background: book.gradient.background }"
                  >
                    <!-- Book-like cover design -->
                    <div class="w-full h-full flex flex-col p-4 relative overflow-hidden">
                      <!-- Light reflection effect -->
                      <div class="absolute top-0 right-0 w-20 h-[150%] bg-white opacity-10 rotate-30 -translate-x-10 -translate-y-10"></div>
                      
                      <!-- Title area -->
                      <div class="mt-auto flex flex-col p-3 text-center z-10">
                        <span class="text-white font-bold text-base leading-tight">{{ book.title.split(' ').slice(0, 8).join(' ') }}{{ book.title.split(' ').length > 8 ? '...' : '' }}</span>
                        <span class="text-white/80 text-xs mt-2">by {{ book.author.name }}</span>
                        <div class="mt-3 flex flex-col items-center">
                          <i class="pi pi-image text-white/60 text-sm"></i>
                          <span class="text-white/60 text-xs mt-1">Image unavailable</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Fallback if no cover is available -->
                  <div
                    v-if="!book.cover"
                    class="absolute inset-0 rounded-lg overflow-hidden book-cover"
                    :class="coverTransitionClass"
                    :style="{ background: book.gradient.background }"
                  >
                    <!-- Book-like cover design -->
                    <div class="w-full h-full flex flex-col p-4 relative">
                      <!-- Light reflection effect -->
                      <div class="absolute top-0 right-0 w-20 h-[150%] bg-white opacity-10 rotate-30 -translate-x-10 -translate-y-10"></div>
                      
                      <!-- Decorative book elements -->
                      <div class="flex-1 flex flex-col items-center justify-center relative">
                        <!-- Decorative circle -->
                        <div class="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center mb-4">
                          <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                            <span class="text-white/80 text-xl font-serif">{{ book.title.charAt(0) }}</span>
                          </div>
                        </div>
                        
                        <!-- Decorative lines -->
                        <div class="w-16 h-0.5 bg-white/20 mb-1"></div>
                        <div class="w-24 h-0.5 bg-white/20 mb-4"></div>
                      </div>
                      
                      <!-- Title area -->
                      <div class="mt-auto flex flex-col p-3 text-center z-10">
                        <span class="text-white font-bold text-lg leading-tight uppercase tracking-wide">{{ book.title.split(' ').slice(0, 8).join(' ') }}{{ book.title.split(' ').length > 8 ? '...' : '' }}</span>
                        <div class="w-12 h-0.5 bg-white/40 mx-auto my-2"></div>
                        <span class="text-white/80 text-xs mt-2 italic">by {{ book.author.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Detalles del libro -->
                <div class="mt-4 text-center">
                  <h2 class="text-3xl font-bold fancy-font">{{ book.title }}</h2>
                  <div class="flex items-center justify-center mt-2">
                    <!-- Author image with loading state and fallback -->
                    <div class="relative w-10 h-10 rounded-full overflow-hidden">
                      <!-- Loading skeleton -->
                      <div 
                        v-if="book.author.cover && authorImageLoadingStates[book.author.id]" 
                        class="absolute inset-0 w-full h-full rounded-full bg-gray-200 animate-pulse"
                      ></div>
                      
                      <!-- Author image -->
                      <img
                        v-if="book.author.cover && !authorImageFailedStates[book.author.id]"
                        :src="book.author.cover"
                        :alt="book.author.name"
                        class="w-10 h-10 rounded-full object-cover transition-transform duration-300 hover:scale-105"
                        @error="handleAuthorImageError(book.author.id, book.author.name)"
                        @load="handleAuthorImageLoad(book.author.id)"
                      />
                      
                      <!-- Gradient fallback -->
                      <div
                        v-if="!book.author.cover || authorImageFailedStates[book.author.id]"
                        class="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105"
                        :style="{ 
                          background: book.author.gradient || 
                            (book.author.gradientPrimary && book.author.gradientSecondary ? 
                              `linear-gradient(135deg, ${book.author.gradientPrimary}, ${book.author.gradientSecondary})` : 
                              getRandomGradient().background)
                        }"
                      >
                        <span class="text-white text-sm font-bold">{{ book.author.name.charAt(0) }}</span>
                      </div>
                    </div>
                    <span class="ml-2 text-lg font-semibold">{{ book.author.name }}</span>
                  </div>
                  <p class="text-sm mt-2">{{ book.description }}</p>
                </div>
                <!-- Sección de rating y botones -->
                <div class="mt-auto pt-4">
                  <div class="flex flex-row justify-between items-center">
                    <div
                      class="bg-surface-100 p-1 rounded-full"
                      style="border-radius: 30px"
                    >
                      <div
                        class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2 rounded-full"
                        style="
                          box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.04),
                            0px 1px 2px rgba(0, 0, 0, 0.06);
                        "
                      >
                        <span class="text-surface-900 font-medium text-sm">{{ book.quotes_count || 0 }}</span>
                        <i class="pi pi-comment text-primary-500"></i>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <Button
                        icon="pi pi-book"
                        label="Leer más"
                        class="flex-auto whitespace-nowrap"
                        @click="goToBookDetail(book.id)"
                      ></Button>
                      <Button
                        :icon="book.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        outlined
                        @click.stop="toggleLike(book.id)"
                      ></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </div>
    
    <!-- Cover Preview Dialog -->
    <Dialog 
      v-model:visible="coverPreviewDialog" 
      :style="{width: '800px'}" 
      header="Book Cover Preview" 
      :modal="true"
      :closable="true"
      @hide="exitCoverProcess"
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
              />
              <div v-else class="text-gray-400">No cover selected</div>
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
                  />
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

// Actualiza el layout según el tamaño de la ventana
const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 768;
  if (isSmallScreen.value) layout.value = "grid";
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
    booksToProcess.value = books.value.filter(book => !book.cover);
    
    if (booksToProcess.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No Books to Update',
        detail: 'All books already have covers',
        life: 3000
      });
      updatingCovers.value = false;
      return;
    }
    
    // Start the cover approval process
    currentBookIndex.value = 0;
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
  
  // Fetch cover options from OpenLibrary
  const result = await BookService.fetchBookCovers(
    searchTitle, 
    currentBook.value.author.name
  );
  
  coverOptions.value = result.covers;
  
  if (coverOptions.value.length > 0) {
    // Set the first cover as the preview by default
    previewCoverUrl.value = coverOptions.value[0].url;
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
};

// Select a cover from the options
const selectCover = (coverUrl) => {
  previewCoverUrl.value = coverUrl;
};

// Accept the current cover and save it to the database
const acceptCover = async () => {
  if (!previewCoverUrl.value || !currentBook.value) return;
  
  try {
    // Update the book with the cover URL
    await BookService.updateBook(currentBook.value.id, {
      ...currentBook.value,
      cover: previewCoverUrl.value
    });
    
    // Update local state
    const bookIndex = books.value.findIndex(b => b.id === currentBook.value.id);
    if (bookIndex !== -1) {
      books.value[bookIndex].cover = previewCoverUrl.value;
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
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: `Error saving cover for "${currentBook.value.title}"`,
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
  try {
    new URL(customCoverUrl.value);
    // Set the preview to the custom URL
    previewCoverUrl.value = customCoverUrl.value;
    
    // Add to cover options if not already there
    const exists = coverOptions.value.some(option => option.url === customCoverUrl.value);
    if (!exists) {
      coverOptions.value.push({
        url: customCoverUrl.value,
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
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Invalid URL',
      detail: 'The URL format is invalid',
      life: 3000
    });
  }
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
</style>
