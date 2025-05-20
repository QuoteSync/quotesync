<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { AuthorService } from "@/service/AuthorService";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";

// Initialize the router and toast
const router = useRouter();
const toast = useToast();

// Opciones para el layout de DataView
const layout = ref("grid");
const options = ref(["list", "grid"]);

// Variable para detectar pantallas pequeñas
const isSmallScreen = ref(window.innerWidth < 768);

// Lista de autores
const authors = ref([]);

// Estado de los botones de "me gusta" para cada autor
const likedAuthors = ref({});

// Estado para rastrear si se están cargando imágenes
const loadingCovers = ref({});

// Add state variables for cover update functionality
const updatingCovers = ref(false);
const coverDialogVisible = ref(false);
const currentAuthor = ref(null);
const previewCoverUrl = ref(null);
const authorsToProcess = ref([]);
const currentAuthorIndex = ref(0);
const customSearchTitle = ref('');
const coverOptions = ref([]);
const customCoverUrl = ref('');
const coverLoadErrors = ref({});
const previewImageError = ref(false);
const changingCover = ref(false);
const wikipediaSearchTerm = ref("");
const showCustomPreview = ref(false);
const previewError = ref(false);

// Función para actualizar el estado según el tamaño de la ventana
const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 768;
  // Si es pantalla pequeña, forzamos el gridview
  if (isSmallScreen.value) {
    layout.value = "grid";
  }
};

onMounted(async () => {
  // Agregar listener para detectar cambios en el tamaño de la ventana
  window.addEventListener("resize", handleResize);
  // Llamada inicial para asignar el layout correcto
  handleResize();

  // Llamada al API para obtener los datos de los autores
  const data = await AuthorService.getAuthors();
  console.log("Authors data:", data);
  
  // Procesar cada autor
  for (const author of data) {
    likedAuthors.value[author.id] = author.is_favorite;
    
    // Verificar si el autor ya tiene colores de gradiente guardados
    if (author.gradient_primary_color && author.gradient_secondary_color) {
      author.gradient = `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})`;
      console.log(`Using stored gradient for ${author.name}:`, author.gradient);
    } 
    // Si no tiene cover ni gradiente, intentar buscar cover y generar gradiente si es necesario
    else if (!author.cover) {
      await handleAuthorImageError(author);
    }
  }
  
  authors.value = data;
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// Método para manejar errores de carga de imagen o cuando no hay cover
const handleAuthorImageError = async (author) => {
  console.log(`Handling author image for: ${author.name}`);
  
  // Evitar múltiples llamadas para el mismo autor
  if (loadingCovers.value[author.id]) {
    console.log(`Already loading cover for ${author.name}`);
    return;
  }
  
  loadingCovers.value[author.id] = true;
  
  try {
    // Primero verificar si ya tiene colores de gradiente guardados
    if (author.gradient_primary_color && author.gradient_secondary_color) {
      author.gradient = `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})`;
      console.log(`Using stored gradient for ${author.name}:`, author.gradient);
    } 
    // Si no tiene cover, intentar buscar uno en OpenLibrary
    else if (!author.cover) {
      console.log(`Attempting to fetch cover for ${author.name} from OpenLibrary`);
      
      const coverData = await AuthorService.fetchAuthorCoverFromOpenLibrary(author.name);
      
      if (coverData.covers && coverData.covers.length > 0) {
        // Encontramos un cover, actualizarlo en la base de datos
        const coverUrl = coverData.covers[0].url;
        console.log(`Found cover for ${author.name}:`, coverUrl);
        
        // Actualizar en la base de datos
        await AuthorService.updateAuthorCover(author.id, coverUrl);
        
        // Actualizar localmente
        author.cover = coverUrl;
      } else {
        // No se encontró cover, generar y guardar un gradiente
        console.log(`No cover found for ${author.name}, using gradient`);
        const gradient = getRandomGradient();
        author.gradient = gradient.background;
        
        // Guardar los colores del gradiente
        await AuthorService.updateGradientColors(
          author.id, 
          gradient.primary, 
          gradient.secondary
        );
        
        // Actualizar las propiedades del autor
        author.gradient_primary_color = gradient.primary;
        author.gradient_secondary_color = gradient.secondary;
      }
    }
  } catch (error) {
    console.error(`Error handling author image for ${author.name}:`, error);
    
    // En caso de error, asegurar que haya un gradiente
    if (!author.gradient) {
      const gradient = getRandomGradient();
      author.gradient = gradient.background;
    }
  } finally {
    loadingCovers.value[author.id] = false;
  }
};

// Método para alternar el estado del botón de "me gusta"
const toggleLike = async (authorId) => {
  try {
    const response = await AuthorService.toggleFavorite(authorId);
    // Update the local state based on the server response
    const author = authors.value.find(a => a.id === authorId);
    if (author) {
      author.is_favorite = response.is_favorite;
      
      // If this author was favorited, move it to the top of the list
      if (response.is_favorite) {
        // Remove the author from its current position
        const index = authors.value.findIndex(a => a.id === authorId);
        if (index !== -1) {
          const [favoriteAuthor] = authors.value.splice(index, 1);
          // Add it to the beginning of the array
          authors.value.unshift(favoriteAuthor);
          
          // Scroll to the top to show the favorited author
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    likedAuthors.value[authorId] = response.is_favorite;
  } catch (error) {
    console.error("Error toggling favorite status:", error);
  }
};

// Método para generar un degradado aleatorio en CSS, asegurando colores distintos
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

// Update the navigation function to use Vue Router
const navigateToAuthor = (authorId) => {
  console.log('Navigating to author:', authorId);
  // Use Vue Router instead of direct URL navigation
  router.push({ 
    name: 'authorDetail', 
    params: { id: authorId } 
  });
};

// Function to fetch author covers
const fetchAuthorCovers = async () => {
  try {
    updatingCovers.value = true;
    
    // Filter authors without covers
    const authorsWithoutCovers = authors.value.filter(author => !author.cover);
    
    if (authorsWithoutCovers.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No Authors to Update',
        detail: 'All authors already have covers',
        life: 3000
      });
      updatingCovers.value = false;
      return;
    }

    // Initialize authorsToProcess with all authors without covers
    authorsToProcess.value = [...authorsWithoutCovers];
    currentAuthorIndex.value = 0;
    
    // Start with the first author immediately
    await processCurrentAuthor();
    
  } catch (error) {
    console.error('Error fetching author covers:', error);
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'There was an error updating author covers',
      life: 3000
    });
    updatingCovers.value = false;
  }
};

// Process the current author and fetch its cover for preview
const processCurrentAuthor = async () => {
  if (currentAuthorIndex.value >= authorsToProcess.value.length) {
    finishCoverUpdate();
    return;
  }
  
  currentAuthor.value = authorsToProcess.value[currentAuthorIndex.value];
  previewCoverUrl.value = null;
  coverDialogVisible.value = true;
  
  try {
    await searchCoverForCurrentAuthor();
  } catch (error) {
    console.error('Error fetching cover:', error);
    toast.add({
      severity: 'error',
      summary: 'Cover Fetch Error',
      detail: `Error fetching cover for "${currentAuthor.value.name}"`,
      life: 2000
    });
  }
};

// Search for a cover for the current author
const searchCoverForCurrentAuthor = async () => {
  // Use the author's name as the search term
  const searchTitle = currentAuthor.value.name;
  
  try {
    // Reset cover errors on new search
    coverLoadErrors.value = {};
    changingCover.value = true;
    
    toast.add({
      severity: 'info',
      summary: 'Searching Wikipedia',
      detail: `Looking for images for ${searchTitle}...`,
      life: 3000
    });
    
    // Search Wikipedia for author images
    const options = await AuthorService.fetchAuthorCoverFromOpenLibrary(searchTitle, true);
    
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

// Handle custom URL preview
const previewCustomCoverUrl = () => {
  if (!customCoverUrl.value) return;
  
  showCustomPreview.value = true;
  previewError.value = false;
  
  // Validate URL format
  try {
    new URL(customCoverUrl.value);
  } catch (urlError) {
    previewError.value = true;
    return;
  }
};

// Handle custom URL error
const handleCustomUrlError = () => {
  previewError.value = true;
};

// Handle custom URL success
const handleCustomUrlSuccess = () => {
  previewError.value = false;
};

// Use custom cover URL
const useCustomCoverUrl = () => {
  if (!customCoverUrl.value || previewError.value) return;
  
  previewCoverUrl.value = customCoverUrl.value;
  showCustomPreview.value = false;
  customCoverUrl.value = '';
};

// Add the removeAuthorImage method
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

// Handle preview image error
const handlePreviewImageError = () => {
  previewImageError.value = true;
};

// Handle preview image load
const handlePreviewImageLoad = () => {
  previewImageError.value = false;
};

// Finish the cover update process
const finishCoverUpdate = () => {
  coverDialogVisible.value = false;
  updatingCovers.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'Process Completed',
    detail: 'Author cover update process is complete',
    life: 3000
  });
};

// Exit the cover process
const exitCoverProcess = () => {
  coverDialogVisible.value = false;
  updatingCovers.value = false;
  
  toast.add({
    severity: 'info',
    summary: 'Process Exited',
    detail: 'Cover update process has been canceled. No changes were made.',
    life: 3000
  });
};

// Select a cover from the options
const selectCover = (coverUrl) => {
  previewCoverUrl.value = coverUrl;
};

// Accept the current cover and save it to the database
const acceptCover = async () => {
  if (!previewCoverUrl.value || !currentAuthor.value) return;
  
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
    
    // Update the author with the new cover
    await AuthorService.updateAuthorCover(currentAuthor.value.id, previewCoverUrl.value);
    
    // Update local state
    const authorIndex = authors.value.findIndex(a => a.id === currentAuthor.value.id);
    if (authorIndex !== -1) {
      authors.value[authorIndex].cover = previewCoverUrl.value;
    }
    
    toast.add({
      severity: 'success',
      summary: 'Cover Accepted',
      detail: `Cover for "${currentAuthor.value.name}" has been saved`,
      life: 2000
    });
    
    // Process next author
    processNextAuthor();
    
  } catch (error) {
    console.error('Error saving cover:', error);
    
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    }
    
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Failed to save author cover. Please try again.',
      life: 3000
    });
  }
};

// Reject the current cover and move to next author
const rejectCover = () => {
  toast.add({
    severity: 'info',
    summary: 'Cover Rejected',
    detail: `Cover for "${currentAuthor.value.name}" was rejected`,
    life: 2000
  });
  
  processNextAuthor();
};

// Move to the next author in the queue
const processNextAuthor = () => {
  currentAuthorIndex.value++;
  processCurrentAuthor();
};
</script>

<template>
  <div class="flex flex-col">
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <div class="font-semibold text-xl">Authors</div>
        <div class="flex gap-2">
          <Button 
            label="Update Author Covers" 
            icon="pi pi-refresh" 
            severity="info" 
            @click="fetchAuthorCovers"
            :loading="updatingCovers"
          />
        </div>
      </div>
      <DataView :value="authors" :layout="layout">
        <template #header>
          <div class="flex justify-end">
            <!-- Se muestra el SelectButton solo en pantallas grandes -->
            <SelectButton
              v-if="!isSmallScreen"
              v-model="layout"
              :options="options"
              :allowEmpty="false"
            >
              <template #option="{ option }">
                <i :class="[option === 'list' ? 'pi pi-bars' : 'pi pi-table']" />
              </template>
            </SelectButton>
          </div>
        </template>

        <!-- Layout tipo Lista: se renderiza solo en pantallas grandes -->
        <template v-if="!isSmallScreen" #list="slotProps">
          <div class="flex flex-col">
            <div v-for="(author, index) in slotProps.items" :key="author.id">
              <div
                class="flex flex-col sm:flex-row md:items-center p-6 gap-4 hover:scale-105 hover:shadow-xl transition-transform duration-300 cursor-pointer"
                :class="{ 'border-t border-surface': index !== 0 }"
                @click="navigateToAuthor(author.id)"
              >
                <!-- Contenedor del cover en List view (300x200 px) con efecto hover -->
                <div class="md:w-40 relative">
                  <div
                    class="block mx-auto rounded transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                    :style="
                      author.cover
                        ? { maxWidth: '300px', height: '200px' }
                        : {
                            background: author.gradient || 
                              (author.gradient_primary_color && author.gradient_secondary_color ? 
                                `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})` : 
                                getRandomGradient().background),
                            maxWidth: '300px',
                            height: '200px',
                          }
                    "
                  >
                    <img
                      v-if="author.cover"
                      class="rounded-lg w-full h-full object-cover"
                      :src="author.cover"
                      :alt="author.name"
                      @error="handleAuthorImageError(author)"
                    />
                    <!-- Author placeholder if no cover -->
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <div class="text-white text-xl font-bold p-4 text-center">
                        <div class="w-16 h-16 mx-auto rounded-full border-2 border-white/30 flex items-center justify-center mb-2">
                          <span class="text-3xl">{{ author.name.charAt(0) }}</span>
                        </div>
                        <div>{{ author.name.split(' ')[0] }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Información del autor -->
                <div class="flex flex-col justify-between flex-1">
                  <!-- Nombre y bio -->
                  <div>
                    <h2 class="text-3xl font-bold fancy-font">
                      {{ author.name }}
                    </h2>
                    <p class="text-sm mt-2">
                      {{ author.bio }}
                    </p>
                  </div>
                  <!-- Sección inferior: rating y botones -->
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
                        <span class="text-surface-900 font-medium text-sm">{{ author.quotes_count || 0 }}</span>
                        <i class="pi pi-comment text-primary-500"></i>
                      </div>
                    </div>
                    <div class="flex flex-row-reverse md:flex-row gap-2">
                      <Button
                        :icon="author.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        outlined
                        @click.stop="toggleLike(author.id)"
                      ></Button>
                      <Button
                        icon="pi pi-book"
                        label="Read More"
                        class="flex-auto whitespace-nowrap"
                        @click.stop="navigateToAuthor(author.id)"
                      ></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Layout tipo Grid: se muestra siempre -->
        <template #grid="slotProps">
          <div class="grid grid-cols-12 gap-4 auto-rows-fr">
            <div
              v-for="(author, index) in slotProps.items"
              :key="author.id"
              class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
            >
              <div
                @click="navigateToAuthor(author.id)"
                class="p-6 h-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg flex flex-col hover:scale-105 hover:shadow-xl mx-auto transition-transform duration-300 cursor-pointer"
              >
                <!-- Cover: se muestra primero con dimensiones 200x300 px y efecto hover -->
                <div class="mx-auto">
                  <div v-if="author.cover">
                    <img
                      class="rounded-lg w-[200px] h-[300px] object-cover transition-transform duration-300"
                      :src="author.cover"
                      :alt="author.name"
                      @error="handleAuthorImageError(author)"
                    />
                  </div>
                  <div v-else
                    :style="{ 
                      background: author.gradient || 
                        (author.gradient_primary_color && author.gradient_secondary_color ? 
                          `linear-gradient(135deg, ${author.gradient_primary_color}, ${author.gradient_secondary_color})` : 
                          getRandomGradient().background) 
                    }"
                    class="rounded-lg w-[200px] h-[300px] transition-transform duration-300 flex items-center justify-center"
                  >
                    <!-- Author placeholder -->
                    <div class="text-white text-xl font-bold p-4 text-center">
                      <div class="w-16 h-16 mx-auto rounded-full border-2 border-white/30 flex items-center justify-center mb-2">
                        <span class="text-3xl">{{ author.name.charAt(0) }}</span>
                      </div>
                      <div>{{ author.name.split(' ')[0] }}</div>
                    </div>
                  </div>
                </div>

                <!-- Detalles del autor: nombre y bio -->
                <div class="mt-4 text-center">
                  <h2 class="text-3xl font-bold fancy-font">
                    {{ author.name }}
                  </h2>
                  <p class="text-sm mt-2">
                    {{ author.bio }}
                  </p>
                </div>
                <!-- Sección inferior: rating y botones -->
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
                        <span class="text-surface-900 font-medium text-sm">{{ author.quotes_count || 0 }}</span>
                        <i class="pi pi-comment text-primary-500"></i>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <Button
                        icon="pi pi-book"
                        label="Read More"
                        class="flex-auto whitespace-nowrap"
                        @click.stop="navigateToAuthor(author.id)"
                      ></Button>
                      <Button
                        :icon="author.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        outlined
                        @click.stop="toggleLike(author.id)"
                      ></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>

      <!-- Cover Preview Dialog -->
      <Dialog 
        v-model:visible="coverDialogVisible" 
        :style="{width: '800px'}" 
        header="Author Cover Preview" 
        :modal="true"
        :closable="true"
        @hide="exitCoverProcess"
      >
        <div class="flex flex-col items-center p-4">
          <h3 class="text-xl font-semibold mb-2">{{ currentAuthor?.name }}</h3>
          
          <div class="grid grid-cols-2">
            <!-- Selected cover preview (large) -->
            <div class="col-span-1 flex flex-col items-center">
              <h4 class="font-medium mb-2">Selected Cover:</h4>
              <div class="relative mb-4 w-64 h-64 bg-gray-100 flex items-center justify-center border rounded shadow-sm">
                <img 
                  v-if="previewCoverUrl" 
                  :src="previewCoverUrl" 
                  :alt="currentAuthor?.name"
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
              <div v-if="previewCoverUrl" class="text-xs text-center mt-1 p-1 w-full overflow-hidden">
                <div class="truncate max-w-[250px]">{{ previewCoverUrl }}</div>
              </div>
              <!-- Add a "Remove Image" button -->
              <Button 
                v-if="previewCoverUrl || currentAuthor?.cover" 
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
                No cover options found
              </div>
            </div>
          </div>
          
          <!-- Search sections with separate tabs for each method -->
          <div class="w-full my-4 border-t pt-4">
            <h3 class="text-lg font-semibold mb-3">Search for Author Images</h3>
            
            <!-- Wikipedia search section -->
            <div class="p-3">
              <p class="mb-2 text-sm text-gray-600">
                Search Wikipedia for author images. Adding terms like "writer", "novelist", 
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
            </div>
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
                  :alt="currentAuthor?.name" 
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
              @click="processNextAuthor"
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
  </div>
</template>
