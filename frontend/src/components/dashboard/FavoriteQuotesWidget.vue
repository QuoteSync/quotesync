<script setup>
import { onMounted, ref } from 'vue';
import { QuoteService } from '@/service/QuoteService';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const router = useRouter();
const quotes = ref([]);
const loading = ref(true);
const hoverQuote = ref(null);

// Predefined gradient pairs for quote cards
const gradients = [
  { primary: '#FF9966', secondary: '#FF5E62' },
  { primary: '#A8BFFF', secondary: '#884D80' },
  { primary: '#00CDAC', secondary: '#02AAB0' },
  { primary: '#FBD786', secondary: '#f7797d' },
  { primary: '#66A6FF', secondary: '#89F7FE' },
  { primary: '#DA4453', secondary: '#89216B' },
  { primary: '#654EA3', secondary: '#EAAFC8' },
  { primary: '#009FFF', secondary: '#ec2F4B' },
];

// Generate a consistent gradient for quotes based on its content
const getQuoteGradient = (quote) => {
  if (quote.book && quote.book.gradient_primary_color && quote.book.gradient_secondary_color) {
    return {
      primary: quote.book.gradient_primary_color,
      secondary: quote.book.gradient_secondary_color
    };
  }
  
  // Use the quote's id to select a gradient
  const hash = quote.id.toString().split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const index = hash % gradients.length;
  return gradients[index];
};

// Helper function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  const shuffled = [...array]; // Create a copy to avoid modifying original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
};

const setHoverQuote = (quoteId) => {
  hoverQuote.value = quoteId;
};

const clearHoverQuote = () => {
  hoverQuote.value = null;
};

const navigateToQuote = (quoteId) => {
  router.push(`/quotes/${quoteId}`);
};

onMounted(async () => {
  try {
    loading.value = true;
    const allQuotes = await QuoteService.getQuotes();
    
    // Get favorite quotes first and shuffle them for randomness
    const favoriteQuotes = shuffleArray(allQuotes.filter(quote => quote.is_favorite));
    
    // Also shuffle non-favorite quotes for randomness
    const nonFavoriteQuotes = shuffleArray(allQuotes.filter(quote => !quote.is_favorite));
    
    // Take random favorites (up to 5)
    const selectedFavorites = favoriteQuotes.slice(0, 5);
    
    // Calculate how many more quotes we need
    const remainingSlots = Math.max(0, 5 - selectedFavorites.length);
    
    // Take random non-favorites to fill remaining slots
    const selectedRandomQuotes = nonFavoriteQuotes.slice(0, remainingSlots);
    
    // Combine favorites and random quotes
    quotes.value = [...selectedFavorites, ...selectedRandomQuotes];
    
    // If no quotes available, show an empty array
    if (allQuotes.length === 0) {
      quotes.value = [];
    }
    
    console.log(`Displaying ${selectedFavorites.length} random favorite quotes and ${selectedRandomQuotes.length} random non-favorite quotes`);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    quotes.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-content-center p-5">
      <ProgressSpinner class="w-4rem h-4rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
    </div>
    
    <div v-else-if="quotes.length > 0" class="grid">
      <div v-for="quote in quotes" :key="quote.id" 
           class="col-12 md:col-6 p-2" 
           @mouseenter="setHoverQuote(quote.id)"
           @mouseleave="clearHoverQuote()">
        <div class="quote-card" 
             :class="{ 'hovered': hoverQuote === quote.id }"
             :style="{
               background: `linear-gradient(135deg, ${getQuoteGradient(quote).primary}, ${getQuoteGradient(quote).secondary})`
             }"
             @click="navigateToQuote(quote.id)">
          <div class="quote-content">
            <div class="quote-header">
              <div class="quote-icon">
                <i class="pi pi-comment text-white text-xl"></i>
              </div>
              <div v-if="quote.is_favorite" class="quote-favorite">
                <i class="pi pi-heart-fill"></i>
              </div>
            </div>
            <h3 class="quote-title">{{ quote.title }}</h3>
            <p class="quote-body">"{{ quote.body || 'No content available' }}"</p>
            <div class="quote-source">
              <span class="quote-book">{{ quote.book?.title || 'Unknown book' }}</span>
              <span class="source-divider">by</span>
              <span class="quote-author">{{ quote.book?.author?.name || 'Unknown author' }}</span>
            </div>
            <div class="quote-action">
              <Button 
                icon="pi pi-arrow-right" 
                class="p-button-rounded p-button-text" 
                style="color: white;" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <i class="pi pi-comment text-4xl text-primary mb-3"></i>
      <span class="text-xl font-medium">No Quotes Found</span>
      <p class="text-color-secondary">Start adding your favorite quotes</p>
      <Button 
        label="Add Quote" 
        icon="pi pi-plus" 
        class="p-button-rounded mt-3"
        @click="router.push('/quotes/new')"
      />
    </div>
  </div>
</template>

<style scoped>
.quote-card {
  border-radius: 24px;
  padding: 1.5rem;
  color: white;
  height: 100%;
  min-height: 220px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;
  cursor: pointer;
}

.quote-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quote-card.hovered {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.quote-card.hovered::before {
  opacity: 1;
}

.quote-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.quote-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 3rem;
  height: 3rem;
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease;
}

.quote-card.hovered .quote-icon {
  transform: scale(1.1);
}

.quote-favorite {
  background: rgba(255, 105, 120, 0.3);
  width: 2rem;
  height: 2rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.quote-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.quote-body {
  font-size: 0.95rem;
  font-style: italic;
  opacity: 0.9;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.quote-source {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-top: auto;
}

.quote-book {
  font-weight: 600;
}

.source-divider {
  margin: 0 0.4rem;
}

.quote-action {
  position: absolute;
  right: 0;
  bottom: 0;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
}

.quote-card.hovered .quote-action {
  opacity: 1;
  transform: translateX(0);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 16px;
  border: 1px dashed var(--surface-border);
}
</style> 