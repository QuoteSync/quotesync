<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { TagService } from "@/service/TagService";

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
  data.forEach((tag) => {
    tag.gradient = getRandomGradient();
    likedTags.value[tag.id] = tag.is_favorite;
  });
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
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#FF33A1",
    "#33FFF5",
    "#F5FF33",
    "#FF5733",
  ];
  let color1, color2;
  do {
    color1 = colors[Math.floor(Math.random() * colors.length)];
    color2 = colors[Math.floor(Math.random() * colors.length)];
  } while (color1 === color2);
  return `linear-gradient(135deg, ${color1}, ${color2})`;
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
                class="flex flex-col sm:flex-row md:items-center p-6 gap-4"
                :class="{ 'border-t border-surface': index !== 0 }"
              >
                <!-- Contenedor del tag con degradado en List view -->
                <div 
                  class="md:w-40 h-24 rounded-lg flex items-center justify-center text-white font-bold text-xl transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                  :style="{ background: tag.gradient }"
                >
                  {{ tag.title }}
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
                        @click="
                          $router.push({ name: 'tagDetail', params: { id: tag.id } })
                        "
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
                @click="$router.push({ name: 'tagDetail', params: { id: tag.id } })"
                class="p-6 h-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg flex flex-col hover:scale-105 hover:shadow-xl mx-auto transition-transform duration-300 cursor-pointer"
              >
                <!-- Tag badge with gradient background -->
                <div 
                  class="w-full h-40 rounded-lg flex items-center justify-center text-white font-bold text-3xl transition-transform duration-300 mx-auto"
                  :style="{ background: tag.gradient }"
                >
                  #{{ tag.title }}
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
                        @click="
                          $router.push({ name: 'tagDetail', params: { id: tag.id } })
                        "
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
