<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { TagService } from "@/service/TagService";
import { QuoteService } from "@/service/QuoteService";
import QuoteCard from "@/components/QuoteCard.vue"; // Import the reusable QuoteCard component

const route = useRoute();
const tag = ref(null);
const tagId = route.params.id;
const quotes = ref([]);

// Function to generate a random gradient for the tag
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

// Reactive states for like and editing functionality on quotes
const likedQuotes = ref({});
const editingQuoteId = ref(null);
const editedQuoteText = ref("");

// Reactive states for filters
const selectedBook = ref("");
const showFavorites = ref(false);

// Computed: List of all available books from the quotes
const allBooks = computed(() => {
  if (!quotes.value || quotes.value.length === 0) return [];
  const booksSet = new Set();
  
  quotes.value.forEach((quote) => {
    if (quote.book && quote.book.title) {
      booksSet.add(quote.book.title);
    }
  });
  
  return Array.from(booksSet);
});

// Computed: Quotes filtered based on selected book and favorites flag
const filteredQuotes = computed(() => {
  if (!quotes.value || quotes.value.length === 0) return [];
  
  return quotes.value.filter((quote) => {
    let bookMatch = true;
    let favoriteMatch = true;
    
    if (selectedBook.value) {
      bookMatch = quote.book && quote.book.title === selectedBook.value;
    }
    
    if (showFavorites.value) {
      favoriteMatch = quote.is_favorite;
    }
    
    return bookMatch && favoriteMatch;
  });
});

// Functions to handle quote actions
const toggleLikeQuote = async (quoteId) => {
  try {
    const response = await QuoteService.toggleFavorite(quoteId);
    // Update the local state based on the server response
    const quote = quotes.value.find(q => q.id === quoteId);
    if (quote) {
      quote.is_favorite = response.is_favorite;
      
      // If this quote was favorited, move it to the top of the list
      if (response.is_favorite) {
        // Remove the quote from its current position
        const index = quotes.value.findIndex(q => q.id === quoteId);
        if (index !== -1) {
          const [favoriteQuote] = quotes.value.splice(index, 1);
          // Add it to the beginning of the array
          quotes.value.unshift(favoriteQuote);
          
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
  const index = quotes.value.findIndex((q) => q.id === quote.id);
  if (index !== -1) {
    quotes.value[index] = updatedQuote;
  }
  editingQuoteId.value = null;
  editedQuoteText.value = "";
};

onMounted(async () => {
  try {
    // Get tag details
    const tagData = await TagService.getTag(tagId);
    tagData.gradient = getRandomGradient();
    tag.value = tagData;
    
    // Get quotes with this tag
    const quotesData = await TagService.getQuotesByTag(tagData.title);
    quotesData.forEach((quote) => {
      likedQuotes.value[quote.id] = quote.is_favorite;
    });
    quotes.value = quotesData;
  } catch (error) {
    console.error("Error loading tag data:", error);
  }
});
</script>

<template>
  <div v-if="tag" class="max-w-6xl mx-auto p-8">
    <div
      class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
    >
      <!-- Tag Details -->
      <div class="flex flex-col items-center gap-6">
        <!-- Tag Badge -->
        <div 
          class="w-64 h-32 rounded-lg flex items-center justify-center text-white font-bold text-4xl transition-transform duration-300 hover:scale-105"
          :style="{ background: tag.gradient }"
        >
          #{{ tag.title }}
        </div>
        
        <!-- Tag Information -->
        <div class="text-center">
          <h1 class="text-4xl font-bold fancy-font">#{{ tag.title }}</h1>
          <p class="mt-4 text-lg">{{ quotes.length }} quotes with this tag</p>
        </div>
      </div>
    </div>

    <div
      class="mt-10 p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-shadow duration-300"
    >
      <h2 class="text-3xl font-bold mb-6 text-center">Tagged Quotes</h2>

      <!-- Quote Filters -->
      <div class="mb-6 flex flex-col md:flex-row items-center justify-center gap-4">
        <div>
          <label class="mr-2 font-semibold">Filter by Book:</label>
          <select v-model="selectedBook" class="border p-1 rounded">
            <option value="">All Books</option>
            <option v-for="book in allBooks" :key="book" :value="book">{{ book }}</option>
          </select>
        </div>
        <div class="flex items-center">
          <label class="mr-2 font-semibold">Favorites:</label>
          <input type="checkbox" v-model="showFavorites" />
        </div>
      </div>

      <!-- Quotes Section using QuoteCard Component -->
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
