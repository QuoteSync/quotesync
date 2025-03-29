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
            class="rounded-lg w-[200px] h-[250px] transition-transform duration-300 hover:scale-105 book-cover overflow-hidden flex items-center justify-center"
          >
            <!-- Author placeholder -->
            <div class="text-white text-2xl font-bold p-4 text-center">
              <div class="w-20 h-20 mx-auto rounded-full border-2 border-white/30 flex items-center justify-center mb-4">
                <span class="text-4xl">{{ author.name.charAt(0) }}</span>
              </div>
              <div>{{ author.name }}</div>
            </div>
          </div>
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
              @error="handleBookImageError(book)"
            />
          </template>
          <template v-else>
            <div
              :style="{ background: (book.gradient?.background || 
                (book.gradient_primary_color && book.gradient_secondary_color) ? 
                `linear-gradient(135deg, ${book.gradient_primary_color}, ${book.gradient_secondary_color})` : 
                getRandomGradient().background) }"
              class="rounded-lg w-full h-60 flex flex-col book-cover overflow-hidden"
            >
              <!-- Book-like cover design -->
              <div class="w-full h-full flex flex-col p-4 relative">
                <!-- Light reflection effect -->
                <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
                
                <!-- Decorative book elements -->
                <div class="flex-1 flex flex-col items-center justify-center relative">
                  <!-- Decorative circle -->
                  <div class="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-3">
                    <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <span class="text-white/80 text-2xl font-serif">{{ book.title.charAt(0) }}</span>
                    </div>
                  </div>
                  
                  <!-- Decorative lines -->
                  <div class="w-12 h-0.5 bg-white/20 mb-1"></div>
                  <div class="w-20 h-0.5 bg-white/20 mb-2"></div>
                </div>
                
                <!-- Title area -->
                <div class="mt-auto flex flex-col p-2 text-center z-10">
                  <span class="text-white font-bold text-lg leading-tight uppercase tracking-wide">{{ book.title.split(' ').slice(0, 3).join(' ') }}{{ book.title.split(' ').length > 3 ? '...' : '' }}</span>
                  <div class="w-10 h-0.5 bg-white/40 mx-auto my-1"></div>
                  <span class="text-white/80 text-xs mt-1 italic">by {{ author.name }}</span>
                </div>
              </div>
            </div>
          </template>
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
const toggleLikeQuote = async (quoteId) => {
  try {
    const response = await QuoteService.toggleFavorite(quoteId);
    // Update the local state based on the server response
    const quote = author.value.quotes.find(q => q.id === quoteId);
    if (quote) {
      quote.is_favorite = response.is_favorite;
      
      // If this quote was favorited, move it to the top of the list
      if (response.is_favorite) {
        // Remove the quote from its current position
        const index = author.value.quotes.findIndex(q => q.id === quoteId);
        if (index !== -1) {
          const [favoriteQuote] = author.value.quotes.splice(index, 1);
          // Add it to the beginning of the array
          author.value.quotes.unshift(favoriteQuote);
          
          // Scroll to the top to show the favorited quote
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    likedQuotes.value[quoteId] = response.is_favorite;
  } catch (error) {
    console.error("Error toggling favorite status:", error);
  }
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

const handleBookImageError = (book) => {
  // Check for existing stored gradient colors in the database
  if (book.id && book.gradient_primary_color && book.gradient_secondary_color) {
    // Use stored colors if available
    book.gradient = {
      primary: book.gradient_primary_color,
      secondary: book.gradient_secondary_color,
      background: `linear-gradient(135deg, ${book.gradient_primary_color}, ${book.gradient_secondary_color})`
    };
  } 
  // If no gradient or string gradient (old format), generate a new one
  else if (!book.gradient || typeof book.gradient === 'string') {
    book.gradient = getRandomGradient();
    
    // Store the new gradient colors for consistency
    if (book.id) {
      BookService.updateGradientColors(
        book.id,
        book.gradient.primary,
        book.gradient.secondary
      ).catch(error => {
        console.error(`Error saving gradient colors for book ${book.id}:`, error);
      });
    }
  }
  
  // Replace the image with a gradient div using Vue reactive properties
  book.cover = null; // This will trigger the v-else template with the gradient
};

onMounted(async () => {
  // Obtener datos del autor
  const data = await AuthorService.getAuthor(authorId);

  // Obtener las citas del autor
  const quotes = await QuoteService.getQuotesByAuthor(authorId);
  quotes.forEach((quote) => {
    likedQuotes.value[quote.id] = quote.is_favorite || false;
  });
  data.quotes = quotes;

  // Obtener los libros del autor
  const books = await BookService.getBooksByAuthor(authorId);
  
  // Assign gradients to books using stored colors from database when available
  books.forEach(book => {
    if (book.gradient_primary_color && book.gradient_secondary_color) {
      // If we have stored gradient colors, use them
      book.gradient = {
        primary: book.gradient_primary_color,
        secondary: book.gradient_secondary_color,
        background: `linear-gradient(135deg, ${book.gradient_primary_color}, ${book.gradient_secondary_color})`
      };
    } else if (!book.cover) {
      // Generate a new gradient only if there's no cover and no stored colors
      const gradient = getRandomGradient();
      book.gradient = gradient;
      
      // Save the new gradient colors to the database for future consistency
      if (book.id) {
        BookService.updateGradientColors(
          book.id,
          gradient.primary,
          gradient.secondary
        ).catch(error => {
          console.error(`Error saving gradient colors for book ${book.id}:`, error);
        });
      }
    } else {
      // Generate a fallback gradient in case the cover fails to load later
      // but don't save it yet - will be saved if the image fails to load
      book.gradient = getRandomGradient();
    }
  });
  
  data.books = books;

  // Si hay libros, asignar el ID del primero como valor por defecto para creación
  if (books && books.length > 0) {
    selectedBookId.value = books[0].id;
  }

  // Asignar un gradiente si no hay cover para el autor
  if (!data.cover) {
    // Use the same gradient structure for consistency
    const gradient = getRandomGradient();
    data.gradient = gradient.background;
  }

  author.value = data;
});
</script>

<style scoped>
/* Book cover styling */
.book-cover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
  background-repeat: repeat;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  position: relative;
  transition-property: transform;
  transition-duration: 300ms;
}

.book-cover:hover {
  transform: scale(1.05);
}

/* Spine effect */
.book-cover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
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
