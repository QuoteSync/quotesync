<template>
  <div v-if="author" class="max-w-6xl mx-auto p-8 space-y-10">
    <!-- Detalles del Autor -->
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300 flex flex-col md:flex-row gap-6 items-center"
    >
      <div class="flex justify-center">
        <template v-if="author.cover">
          <img
            class="rounded-lg w-[200px] h-[250px] object-cover transition-transform duration-300 hover:scale-105"
            :src="author.cover"
            :alt="author.name"
          />
        </template>
        <template v-else>
          <div
            :style="{ background: author.gradient }"
            class="rounded-lg w-[200px] h-[250px] transition-transform duration-300 hover:scale-105"
          ></div>
        </template>
      </div>
      <div class="text-center md:text-left">
        <h1 class="text-4xl font-bold fancy-font">{{ author.name }}</h1>
        <p class="mt-4 text-lg">{{ author.bio }}</p>
      </div>
    </div>

    <!-- Sección de Libros del Autor -->
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
    >
      <h2 class="text-3xl font-bold mb-4 text-center">Books by {{ author.name }}</h2>
      <div
        v-if="author.books && author.books.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="book in author.books"
          :key="book.id"
          class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:shadow-md transition-shadow duration-300 cursor-pointer"
          @click="$router.push({ name: 'bookDetail', params: { id: book.id } })"
        >
          <template v-if="book.cover">
            <img
              class="rounded-lg w-full h-60 object-cover transition-transform duration-300 hover:scale-105"
              :src="book.cover"
              :alt="book.title"
            />
          </template>
          <template v-else>
            <div
              :style="{ background: book.gradient || getRandomGradient() }"
              class="rounded-lg w-full h-60 transition-transform duration-300 hover:scale-105"
            ></div>
          </template>
          <h3 class="mt-2 text-xl font-semibold text-center">{{ book.title }}</h3>
        </div>
      </div>
      <div v-else class="text-center text-gray-500">
        <p>No books available for this author.</p>
      </div>
    </div>

    <!-- Sección de Citas del Autor -->
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
    >
      <h2 class="text-3xl font-bold mb-6 text-center">Quotes</h2>

      <!-- Filtros de Citas -->
      <div class="mb-6 flex flex-col md:flex-row items-center justify-center gap-4">
        <div>
          <label class="mr-2 font-semibold">Filter by Tag:</label>
          <select v-model="selectedTag" class="border p-1 rounded">
            <option value="">All</option>
            <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
          </select>
        </div>
        <div class="flex items-center">
          <label class="mr-2 font-semibold">Favorites:</label>
          <input type="checkbox" v-model="showFavorites" />
        </div>
      </div>

      <!-- Botón para agregar una nueva cita -->
      <div class="mb-6 text-center">
        <button
          class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          @click="isCreatingNewQuote = true"
        >
          Add New Quote
        </button>
      </div>

      <!-- Dropdown para seleccionar el libro (solo al crear nueva cita) -->
      <div v-if="isCreatingNewQuote && author.books && author.books.length" class="mb-4">
        <label class="mr-2 font-semibold">Select Book:</label>
        <select v-model="selectedBookId" class="border p-1 rounded">
          <option v-for="book in author.books" :key="book.id" :value="book.id">
            {{ book.title }}
          </option>
        </select>
      </div>

      <!-- Componente para crear una nueva cita -->
      <div v-if="isCreatingNewQuote">
        <!-- Se pasa una cita vacía y la propiedad isNew para mostrar el formulario de creación -->
        <QuoteCard
          :quote="{ body: '', tags: [] }"
          :isNew="true"
          @save-new="handleSaveNewQuote"
          @cancel-edit="isCreatingNewQuote = false"
        />
      </div>

      <!-- Lista de citas existentes -->
      <div
        v-if="filteredQuotes && filteredQuotes.length"
        class="flex flex-col gap-6 mt-6"
      >
        <QuoteCard
          v-for="quote in filteredQuotes"
          :key="quote.id"
          :quote="quote"
          :liked="likedQuotes[quote.id]"
          @toggle-like="toggleLikeQuote"
          @save-edit="saveEditedQuote"
          @cancel-edit="cancelEditingQuote"
        />
      </div>
      <div v-else class="text-center text-gray-500">
        <p>No quotes available with these filters.</p>
      </div>
    </div>
  </div>
  <div v-else class="flex justify-center items-center h-full">
    <p>Loading...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { AuthorService } from "@/service/AuthorService";
import { BookService } from "@/service/BookService";
import { QuoteService } from "@/service/QuoteService";
import QuoteCard from "@/components/QuoteCard.vue";
import { getSession } from "@/api";

const route = useRoute();
const author = ref(null);
const authorId = route.params.id;

// Variable reactiva para almacenar el ID del libro seleccionado en la creación de cita
const selectedBookId = ref(null);

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
const toggleLikeQuote = (quoteId) => {
  likedQuotes.value[quoteId] = !likedQuotes.value[quoteId];
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

onMounted(async () => {
  // Obtener datos del autor
  const data = await AuthorService.getAuthor(authorId);

  // Obtener las citas del autor
  const quotes = await QuoteService.getQuotesByAuthor(authorId);
  quotes.forEach((quote) => {
    likedQuotes.value[quote.id] = false;
  });
  data.quotes = quotes;

  // Obtener los libros del autor
  const books = await BookService.getBooksByAuthor(authorId);
  data.books = books;

  // Si hay libros, asignar el ID del primero como valor por defecto para creación
  if (books && books.length > 0) {
    selectedBookId.value = books[0].id;
  }

  // Asignar un gradiente si no hay cover
  if (!data.cover) {
    data.gradient = getRandomGradient();
  }

  author.value = data;
});
</script>

<style scoped>
/* Puedes agregar estilos adicionales para pulir la apariencia de los pills */
</style>
