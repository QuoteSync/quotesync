<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { BookService } from "@/service/BookService";
import { QuoteService } from "@/service/QuoteService";
import QuoteCard from "@/components/QuoteCard.vue";
import { getSession } from "@/api"; // Asegúrate de tener esta función configurada

const route = useRoute();
const book = ref(null);
const bookId = route.params.id;

// Estado reactivo para indicar la creación de una nueva cita
const isCreatingNewQuote = ref(false);

// Función para generar un gradiente aleatorio en caso de que no haya cover
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

// Computed: Lista de todos los tags disponibles de las citas
const allTags = computed(() => {
  if (!book.value?.quotes) return [];
  const tagsSet = new Set();
  book.value.quotes.forEach((quote) => {
    quote.tags.forEach((tag) => {
      tagsSet.add(tag.title);
    });
  });
  return Array.from(tagsSet);
});

// Computed: Citas filtradas según tag y favoritos
const filteredQuotes = computed(() => {
  if (!book.value?.quotes) return [];
  return book.value.quotes.filter((quote) => {
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

// Funciones para manejar las acciones de las citas
const toggleLikeQuote = (quoteId) => {
  likedQuotes.value[quoteId] = !likedQuotes.value[quoteId];
};

const startEditingQuote = (quote) => {
  editingQuoteId.value = quote.id;
  editedQuoteText.value = quote.body;
};

const cancelEditingQuote = () => {
  editingQuoteId.value = null;
  editedQuoteText.value = "";
};

const saveEditedQuote = async (quote) => {
  console.log("Saving edited quote:", quote.tags);
  const updatedQuote = await QuoteService.updateQuote(quote.id, {
    body: quote.body,
    tags: quote.tags,
  });
  console.log("Quote updated:", updatedQuote);
  const index = book.value.quotes.findIndex((q) => q.id === quote.id);
  if (index !== -1) {
    book.value.quotes[index] = updatedQuote;
  }
  editingQuoteId.value = null;
  editedQuoteText.value = "";
};

// Función para manejar la creación de una nueva cita
const handleSaveNewQuote = async (newQuoteData) => {
  // Se obtiene la sesión y se extrae el id del usuario autenticado
  const session = await getSession();
  const owner_id = session.data.user.id;
  console.log("Owner ID:", owner_id);

  const payload = {
    body: newQuoteData.body,
    tags: newQuoteData.tags,
    book_id: book.value.id, // Usamos el id del libro actual
    title: newQuoteData.body.split(" ").slice(0, 4).join(" "),
    owner_id: owner_id,
    owner: owner_id, // Dependiendo de cómo lo espere el serializer
  };
  const createdQuote = await QuoteService.createQuote(payload);
  book.value.quotes.push(createdQuote);
  isCreatingNewQuote.value = false;
};

onMounted(async () => {
  const data = await BookService.getBook(bookId);
  const quotes = await QuoteService.getQuotesByBook(bookId);
  quotes.forEach((quote) => {
    likedQuotes.value[quote.id] = false;
  });
  data.quotes = quotes;
  if (!data.cover) {
    data.gradient = getRandomGradient();
  }
  book.value = data;
});
</script>

<template>
  <div v-if="book" class="max-w-6xl mx-auto p-8">
    <!-- Detalles del Libro -->
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
        <!-- Portada del Libro -->
        <div class="flex justify-center">
          <template v-if="book.cover">
            <img
              class="rounded-lg w-[200px] h-[250px] object-cover transition-transform duration-300 hover:scale-105"
              :src="book.cover"
              :alt="book.title"
            />
          </template>
          <template v-else>
            <div
              :style="{ background: book.gradient }"
              class="rounded-lg w-[200px] h-[250px] transition-transform duration-300 hover:scale-105"
            ></div>
          </template>
        </div>
        <!-- Información del Libro -->
        <div class="text-center md:text-left">
          <h1 class="text-4xl font-bold fancy-font">{{ book.title }}</h1>
          <div
            class="flex items-center justify-center md:justify-start mt-4 cursor-pointer hover:underline"
            @click="
              $router.push({
                name: 'authorDetail',
                params: { id: book.author.id },
              })
            "
          >
            <img
              class="w-10 h-10 rounded-full object-cover transition-transform duration-300 hover:scale-105"
              :src="book.author.cover"
              alt="Author Avatar"
            />
            <span class="ml-3 text-xl font-semibold">{{ book.author.name }}</span>
          </div>
          <p class="mt-4 text-lg">{{ book.description }}</p>
        </div>
      </div>
    </div>

    <!-- Filtros y listado de citas -->
    <div
      class="mt-10 p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
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

      <!-- Sección para agregar nueva cita -->
      <div class="mt-10 text-center">
        <button
          class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          @click="isCreatingNewQuote = true"
        >
          Add New Quote
        </button>
      </div>

      <!-- Formulario para crear nueva cita -->
      <div v-if="isCreatingNewQuote" class="mt-6">
        <QuoteCard
          :quote="{ body: '', tags: [] }"
          :isNew="true"
          @save-new="handleSaveNewQuote"
          @cancel-edit="isCreatingNewQuote = false"
        />
      </div>

      <!-- Sección de Citas usando el componente QuoteCard -->
      <div class="mt-10">
        <div v-if="filteredQuotes && filteredQuotes.length" class="flex flex-col gap-6">
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
  </div>
  <div v-else class="flex justify-center items-center h-full">
    <p>Loading...</p>
  </div>
</template>
