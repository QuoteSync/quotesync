<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { TagService } from "@/service/TagService";
import { useRouter } from "vue-router";

// Initialize the router
const router = useRouter();

// Opciones para el layout de DataView
const layout = ref("grid");
const options = ref(["list", "grid"]);

// Variable para detectar pantallas pequeñas
const isSmallScreen = ref(window.innerWidth < 768);

// Lista de tags
const tags = ref([]);

// Estado de los botones de "me gusta" para cada tag
const likedTags = ref({});

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

  // Llamada al API para obtener los datos de los tags
  const data = await TagService.getTags();
  console.log(data);
  // Se asigna un color aleatorio para cada tag
  for (const tag of data) {
    // Create gradient object - either from stored values or generate new one
    if (tag.gradient_primary_color && tag.gradient_secondary_color) {
      // Use the stored gradient colors from the database
      console.log(`Tag ${tag.id} already has gradient colors:`, tag.gradient_primary_color, tag.gradient_secondary_color);
      tag.gradient = {
        primary: tag.gradient_primary_color,
        secondary: tag.gradient_secondary_color,
        background: `linear-gradient(135deg, ${tag.gradient_primary_color}, ${tag.gradient_secondary_color})`
      };
    } else {
      // Generate a new random gradient and store it in the database
      console.log(`Tag ${tag.id} needs new gradient colors`);
      tag.gradient = getRandomGradient();
      console.log(`Generated colors for tag ${tag.id}:`, tag.gradient.primary, tag.gradient.secondary);
      
      // Save the gradient colors to the database
      TagService.updateGradientColors(
        tag.id,
        tag.gradient.primary,
        tag.gradient.secondary
      ).then(response => {
        console.log(`Successfully saved gradient colors for tag ${tag.id}:`, response);
      }).catch(error => {
        console.error(`Error saving gradient colors for tag ${tag.id}:`, error);
      });
    }
    
    likedTags.value[tag.id] = tag.is_favorite;
  }
  tags.value = data;
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// Método para alternar el estado del botón de "me gusta"
const toggleLike = async (tagId) => {
  try {
    const response = await TagService.toggleFavorite(tagId);
    // Update the local state based on the server response
    const tag = tags.value.find(t => t.id === tagId);
    if (tag) {
      tag.is_favorite = response.is_favorite;
      
      // If this tag was favorited, move it to the top of the list
      if (response.is_favorite) {
        // Remove the tag from its current position
        const index = tags.value.findIndex(t => t.id === tagId);
        if (index !== -1) {
          const [favoriteTag] = tags.value.splice(index, 1);
          // Add it to the beginning of the array
          tags.value.unshift(favoriteTag);
          
          // Scroll to the top to show the favorited tag
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    likedTags.value[tagId] = response.is_favorite;
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
const navigateToTag = (tagId) => {
  console.log('Navigating to tag:', tagId);
  // Use Vue Router instead of direct URL navigation
  router.push({ 
    name: 'tagDetail', 
    params: { id: tagId } 
  });
};
</script>

<template>
  <div class="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-900 rounded-3xl">
    <!-- Header Section -->
    <div class="sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 rounded-t-3xl">
      <div class="container mx-auto px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 class="text-4xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent rounded text-center sm:text-left">
            Tag Collection
          </h1>
          <div class="flex gap-3 justify-center sm:justify-end mt-4 sm:mt-0">
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
              <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tags Grid/List View -->
      <div v-else>
        <Transition name="fade" mode="out-in">
          <template v-if="layout === 'grid'">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <div v-for="tag in tags" :key="tag.id" 
                :data-tag-id="tag.id"
                class="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
                @click="navigateToTag(tag.id)"
              >
                <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col">
                  <!-- Tag Cover -->
                  <div class="relative aspect-[21/9] overflow-hidden">
                    <!-- Tag Cover Background -->
                    <div 
                      class="absolute inset-0 flex items-center justify-center overflow-hidden"
                      :style="{ background: tag.gradient?.background || getRandomGradient().background }"
                    >
                      <div class="w-full h-full flex flex-col items-center justify-center p-4 relative">
                        <!-- Light reflection effect -->
                        <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
                        
                        <!-- Tag name -->
                        <div class="relative z-10 text-center w-full px-4">
                          <span class="text-white font-bold text-2xl fancy-font whitespace-normal break-words">#{{ tag.title }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Simple hover overlay -->
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <!-- Tag Info -->
                  <div class="p-3 flex-1 flex flex-col">
                    <!-- Stats -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                        <i class="pi pi-comment text-primary-500"></i>
                        <span class="text-sm font-medium">{{ tag.quotes_count || 0 }}</span>
                      </div>
                      <Button
                        :icon="tag.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        rounded
                        :severity="tag.is_favorite ? 'danger' : 'secondary'"
                        @click.stop="toggleLike(tag.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- List View -->
          <template v-else>
            <div class="space-y-4">
              <div v-for="tag in tags" :key="tag.id" 
                class="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2"
                @click="navigateToTag(tag.id)"
              >
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-2xl transform rotate-2 group-hover:rotate-3 transition-transform duration-300"></div>
                  <div class="p-4 border border-surface-200 dark:border-surface-700 rounded-2xl hover:shadow-lg transition-all duration-300 bg-surface-0 dark:bg-surface-900 relative">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-4">
                        <div 
                          class="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center"
                          :style="{ background: tag.gradient?.background || getRandomGradient().background }"
                        >
                          <span class="text-white text-2xl font-bold">#</span>
                        </div>
                        <div>
                          <h3 class="text-xl font-semibold group-hover:text-primary-500 transition-colors duration-300">#{{ tag.title }}</h3>
                          <p class="text-surface-600 dark:text-surface-400">{{ tag.quotes_count || 0 }} quotes</p>
                        </div>
                      </div>
                      <Button 
                        icon="pi pi-chevron-right" 
                        rounded 
                        text 
                        severity="secondary"
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
  </div>
</template>

<style scoped>
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
</style>
