<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { AuthorService } from "@/service/AuthorService";

// Opciones para el layout de DataView
const layout = ref("grid");
const options = ref(["list", "grid"]);

// Variable para detectar pantallas pequeñas
const isSmallScreen = ref(window.innerWidth < 768);

// Lista de autores
const authors = ref([]);

// Estado de los botones de "me gusta" para cada autor
const likedAuthors = ref({});

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
  console.log(data);
  // Se asume que cada autor posee: name, bio, cover, id y (opcionalmente) rating
  data.forEach((author) => {
    // Si no existe cover para el autor, se asigna un degradado aleatorio
    if (!author.cover) {
      author.gradient = getRandomGradient();
    }
    likedAuthors.value[author.id] = false;
  });
  authors.value = data;
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// Método para alternar el estado del botón de "me gusta"
const toggleLike = (authorId) => {
  likedAuthors.value[authorId] = !likedAuthors.value[authorId];
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
                class="flex flex-col sm:flex-row md:items-center p-6 gap-4"
                :class="{ 'border-t border-surface': index !== 0 }"
              >
                <!-- Contenedor del cover en List view (300x200 px) con efecto hover -->
                <div class="md:w-40 relative">
                  <div
                    class="block mx-auto rounded transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                    :style="
                      author.cover
                        ? { maxWidth: '300px', height: '200px' }
                        : {
                            background: author.gradient,
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
                    />
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
                        :icon="
                          likedAuthors[author.id] ? 'pi pi-heart-fill' : 'pi pi-heart'
                        "
                        outlined
                        @click="toggleLike(author.id)"
                      ></Button>
                      <Button
                        icon="pi pi-book"
                        label="Read More"
                        class="flex-auto whitespace-nowrap"
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
                class="p-6 h-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg flex flex-col hover:scale-105 hover:shadow-xl mx-auto transition-transform duration-300"
              >
                <!-- Cover: se muestra primero con dimensiones 200x300 px y efecto hover -->
                <template v-if="author.cover">
                  <img
                    class="rounded-lg w-[200px] h-[300px] object-cover transition-transform duration-300 mx-auto"
                    :src="author.cover"
                    :alt="author.name"
                  />
                </template>
                <template v-else>
                  <div
                    :style="{ background: author.gradient }"
                    class="rounded-lg w-[200px] h-[300px] transition-transform duration-300 mx-auto"
                  ></div>
                </template>

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
                      ></Button>
                      <Button
                        :icon="
                          likedAuthors[author.id] ? 'pi pi-heart-fill' : 'pi pi-heart'
                        "
                        outlined
                        @click="toggleLike(author.id)"
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
