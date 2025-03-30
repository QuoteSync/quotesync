<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { AuthorService } from "@/service/AuthorService";
import { useRouter } from "vue-router";

// Initialize the router
const router = useRouter();

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
</script>

<template>
  <div class="flex flex-col">
    <div class="card">
      <div class="font-semibold text-xl mb-4">Authors</div>
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
                        <span class="text-surface-900 font-medium text-sm">5.0</span>
                        <i class="pi pi-star-fill text-yellow-500"></i>
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
                        <span class="text-surface-900 font-medium text-sm">5.0</span>
                        <i class="pi pi-star-fill text-yellow-500"></i>
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
    </div>
  </div>
</template>
