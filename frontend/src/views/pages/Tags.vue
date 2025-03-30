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
  <div class="flex flex-col">
    <div class="card">
      <div class="font-semibold text-xl mb-4">Tags</div>
      <DataView :value="tags" :layout="layout">
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

        <!-- List Layout: se renderiza solo si no es pantalla pequeña -->
        <template v-if="!isSmallScreen" #list="slotProps">
          <div class="flex flex-col">
            <div v-for="(tag, index) in slotProps.items" :key="index">
              <div
                class="flex flex-col sm:flex-row md:items-center p-6 gap-4 hover:scale-105 hover:shadow-xl transition-transform duration-300 cursor-pointer"
                :class="{ 'border-t border-surface': index !== 0 }"
                @click="navigateToTag(tag.id)"
              >
                <!-- Contenedor del tag con degradado en List view -->
                <div 
                  class="md:w-40 h-24 rounded-lg overflow-hidden relative shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                  :style="{ background: tag.gradient.background }"
                >
                  <!-- Light reflection effect -->
                  <div class="absolute top-0 right-0 w-12 h-[150%] bg-white opacity-10 rotate-30 -translate-x-8 -translate-y-8"></div>
                  <!-- Content -->
                  <div class="w-full h-full flex items-center justify-center p-2 z-10">
                    <span class="text-white font-bold text-xl">#{{ tag.title }}</span>
                  </div>
                </div>

                <!-- Información del tag -->
                <div class="flex flex-col justify-between flex-1">
                  <!-- Título y descripción/contador -->
                  <div>
                    <h2 class="text-3xl font-bold fancy-font">
                      #{{ tag.title }}
                    </h2>
                    <p class="text-sm mt-2">
                      {{ tag.quote_count || 0 }} quotes with this tag
                    </p>
                  </div>
                  <!-- Sección inferior: botones -->
                  <div class="mt-4 flex flex-col md:items-end gap-4">
                    <div class="flex flex-row-reverse md:flex-row gap-2">
                      <Button
                        :icon="tag.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        outlined
                        @click="toggleLike(tag.id)"
                      ></Button>
                      <Button
                        icon="pi pi-tag"
                        label="View Tag"
                        class="flex-auto whitespace-nowrap"
                        @click.stop="navigateToTag(tag.id)"
                      ></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Grid Layout: se muestra siempre -->
        <template #grid="slotProps">
          <div class="grid grid-cols-12 gap-4 auto-rows-fr">
            <div
              v-for="(tag, index) in slotProps.items"
              :key="index"
              class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
            >
              <div
                @click="navigateToTag(tag.id)"
                class="p-6 h-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg flex flex-col hover:scale-105 hover:shadow-xl mx-auto transition-transform duration-300 cursor-pointer"
              >
                <!-- Tag badge with gradient background -->
                <div 
                  class="w-full h-40 rounded-lg overflow-hidden relative shadow-lg transition-transform duration-300 mx-auto"
                  :style="{ background: tag.gradient.background }"
                >
                  <!-- Light reflection effect -->
                  <div class="absolute top-0 right-0 w-20 h-[150%] bg-white opacity-10 rotate-30 -translate-x-10 -translate-y-10"></div>
                  
                  <!-- Decorative elements -->
                  <div class="w-full h-full flex flex-col items-center justify-center p-4 relative">
                    <!-- Decorative circle -->
                    <div class="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-2">
                      <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <span class="text-white/90 text-xl font-serif">{{ tag.title.charAt(0).toUpperCase() }}</span>
                      </div>
                    </div>
                    
                    <!-- Tag name -->
                    <div class="mt-2 text-center z-10">
                      <span class="text-white font-bold text-2xl">#{{ tag.title }}</span>
                    </div>
                  </div>
                </div>

                <!-- Detalles del tag: título y contador -->
                <div class="mt-4 text-center">
                  <h2 class="text-3xl font-bold fancy-font">
                    #{{ tag.title }}
                  </h2>
                  <p class="text-sm mt-2">
                    {{ tag.quote_count || 0 }} quotes with this tag
                  </p>
                </div>
                <!-- Sección inferior: botones -->
                <div class="mt-auto pt-4">
                  <div class="flex flex-row justify-between items-center">
                    <div class="flex gap-2">
                      <Button
                        icon="pi pi-tag"
                        label="View Quotes"
                        class="flex-auto whitespace-nowrap"
                        @click.stop="navigateToTag(tag.id)"
                      ></Button>
                      <Button
                        :icon="tag.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        outlined
                        @click.stop="toggleLike(tag.id)"
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
  </div>
</template>
