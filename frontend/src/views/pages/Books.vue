<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { BookService } from "@/service/BookService";

// Opciones para el layout de DataView
const layout = ref("grid");
const options = ref(["list", "grid"]);

// Variable para detectar pantallas pequeñas
const isSmallScreen = ref(window.innerWidth < 768);

// Lista de libros
const books = ref([]);

// Estado de los botones de "me gusta" para cada libro
const likedBooks = ref({});

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

  // Llamada al API para obtener los datos de los libros
  const data = await BookService.getBooks();
  console.log(data);
  // Se asume que cada libro posee: title, author.name, author.cover, description, cover e id
  data.forEach((book) => {
    // Si no existe cover para el libro, se asigna un degradado aleatorio
    if (!book.cover) {
      book.gradient = getRandomGradient();
    }
    likedBooks.value[book.id] = false;
  });
  books.value = data;
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// Método para alternar el estado del botón de "me gusta"
const toggleLike = (bookId) => {
  likedBooks.value[bookId] = !likedBooks.value[bookId];
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
      <div class="font-semibold text-xl mb-4">Books</div>
      <DataView :value="books" :layout="layout">
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
            <div v-for="(book, index) in slotProps.items" :key="index">
              <div
                class="flex flex-col sm:flex-row md:items-center p-6 gap-4"
                :class="{ 'border-t border-surface': index !== 0 }"
              >
                <!-- Contenedor del cover en List view (300x200 px) con efecto hover -->
                <div class="md:w-40 relative">
                  <div
                    class="block mx-auto rounded transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                    :style="
                      book.cover
                        ? { maxWidth: '300px', height: '200px' }
                        : {
                            background: book.gradient,
                            maxWidth: '300px',
                            height: '200px',
                          }
                    "
                  >
                    <img
                      v-if="book.cover"
                      class="rounded-lg w-full h-full object-cover"
                      :src="book.cover"
                      :alt="book.title"
                    />
                  </div>
                </div>

                <!-- Información del libro -->
                <div class="flex flex-col justify-between flex-1">
                  <!-- Título, autor (con avatar) y descripción -->
                  <div>
                    <h2 class="text-3xl font-bold fancy-font">
                      {{ book.title }}
                    </h2>
                    <div class="flex items-center mt-2">
                      <img
                        class="w-8 h-8 rounded-full object-cover transition-transform duration-300 hover:scale-105"
                        :src="book.author.cover"
                        alt="Author Avatar"
                      />
                      <span class="ml-2 text-lg font-semibold">
                        {{ book.author.name }}
                      </span>
                    </div>
                    <p class="text-sm mt-2">
                      {{ book.description }}
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
                        <span class="text-surface-900 font-medium text-sm"> 5.0 </span>
                        <i class="pi pi-star-fill text-yellow-500"></i>
                      </div>
                    </div>
                    <div class="flex flex-row-reverse md:flex-row gap-2">
                      <Button
                        :icon="likedBooks[book.id] ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        outlined
                        @click="toggleLike(book.id)"
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

        <!-- Grid Layout: se muestra siempre -->
        <template #grid="slotProps">
          <div class="grid grid-cols-12 gap-4 auto-rows-fr">
            <div
              v-for="(book, index) in slotProps.items"
              :key="index"
              class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
            >
              <div
                class="p-6 h-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg flex flex-col hover:scale-105 hover:shadow-xl mx-auto transition-transform duration-300"
              >
                <!-- Cover: se muestra primero con dimensiones 200x300 px y efecto hover -->
                <template v-if="book.cover">
                  <img
                    class="rounded-lg w-[200px] h-[300px] object-cover transition-transform duration-300 mx-auto"
                    :src="book.cover"
                    :alt="book.title"
                  />
                </template>
                <template v-else>
                  <div
                    :style="{ background: book.gradient }"
                    class="rounded-lg w-[200px] h-[300px] transition-transform duration-300 mx-auto"
                  ></div>
                </template>

                <!-- Detalles del libro: título, autor (con avatar) y descripción -->
                <div class="mt-4 text-center">
                  <h2 class="text-3xl font-bold fancy-font">
                    {{ book.title }}
                  </h2>
                  <div class="flex items-center justify-center mt-2">
                    <img
                      class="w-10 h-10 rounded-full object-cover transition-transform duration-300 hover:scale-105"
                      :src="book.author.cover"
                      alt="Author Avatar"
                    />
                    <span class="ml-2 text-lg font-semibold">
                      {{ book.author.name }}
                    </span>
                  </div>
                  <p class="text-sm mt-2">
                    {{ book.description }}
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
                        <span class="text-surface-900 font-medium text-sm"> 5.0 </span>
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
                        :icon="likedBooks[book.id] ? 'pi pi-heart-fill' : 'pi pi-heart'"
                        outlined
                        @click="toggleLike(book.id)"
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
