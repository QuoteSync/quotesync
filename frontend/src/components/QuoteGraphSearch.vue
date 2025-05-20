<template>
  <div class="quote-graph-search p-4 bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 rounded-lg">
    <h2 class="text-xl font-medium mb-4">Build your search query</h2>
    
    <!-- Search Builder UI -->
    <div class="search-builder mb-4">
      
        <div class="mb-4">
          <div class="text-sm text-gray-500 mb-2">Use the options below to build a search query across quotes, authors, books, and tags.</div>
          
          <!-- Filter Builder -->
          <div class="filter-builder">
            <div v-for="(filter, index) in filters" :key="index" class="filter-row flex flex-wrap items-center gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <!-- Filter Type -->
              <Dropdown
                v-model="filter.type"
                :options="filterTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select filter type"
                class="w-48"
                @change="resetFilterValue(index)"
              />
              
              <!-- Filter Operator -->
              <Dropdown
                v-model="filter.operator"
                :options="getOperatorsForType(filter.type)"
                optionLabel="label"
                optionValue="value"
                placeholder="Operator"
                class="w-32"
              />
              
              <!-- Filter Value - changes based on type -->
              <div class="filter-value flex-grow">
                <!-- Text Input -->
                <InputText 
                  v-if="['text', 'quote_content'].includes(filter.type)"
                  v-model="filter.value"
                  placeholder="Enter value"
                  class="w-full"
                />
                
                <!-- Tag selection -->
                <MultiSelect
                  v-else-if="filter.type === 'tags'"
                  v-model="filter.value"
                  :options="availableTags"
                  optionLabel="title"
                  placeholder="Select tags"
                  class="w-full"
                  display="chip"
                />
                
                <!-- Author selection -->
                <Dropdown
                  v-else-if="filter.type === 'author'"
                  v-model="filter.value"
                  :options="availableAuthors"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select author"
                  class="w-full"
                />
                
                <!-- Book selection -->
                <Dropdown
                  v-else-if="filter.type === 'book'"
                  v-model="filter.value"
                  :options="availableBooks"
                  optionLabel="title"
                  optionValue="id"
                  placeholder="Select book"
                  class="w-full"
                />
                
                <!-- Vector/Semantic search -->
                <Textarea
                  v-else-if="filter.type === 'similar_to'"
                  v-model="filter.value"
                  placeholder="Enter text to find similar quotes"
                  class="w-full"
                  rows="3"
                />
                
                <!-- Date range -->
                <Calendar 
                  v-else-if="filter.type === 'date'"
                  v-model="filter.value"
                  selectionMode="range"
                  dateFormat="yy-mm-dd"
                  placeholder="Select date range"
                  class="w-full"
                />
                
                <!-- Boolean options -->
                <ToggleButton
                  v-else-if="filter.type === 'is_favorite'"
                  v-model="filter.value"
                  onLabel="Yes"
                  offLabel="No"
                  class="w-24"
                />
              </div>
              
              <!-- Remove Filter Button -->
              <Button 
                icon="pi pi-times" 
                class="p-button-rounded p-button-danger p-button-text" 
                @click="removeFilter(index)"
              />
            </div>
            
            <!-- Add Filter Button -->
            <Button 
              label="Add Filter" 
              icon="pi pi-plus" 
              class="p-button-outlined mt-2" 
              @click="addFilter"
            />
          </div>
        </div>
        
        <!-- Logic Operator -->
        <div class="logic-operator mb-4">
          <label class="block text-sm text-gray-500 mb-1">Combine filters with:</label>
          <div class="flex gap-2">
            <RadioButton v-model="logicOperator" value="AND" /> <label class="mr-4">AND (all conditions must match)</label>
            <RadioButton v-model="logicOperator" value="OR" /> <label>OR (any condition can match)</label>
          </div>
        </div>
        
        <!-- Search Options -->
        <div class="search-options mb-4">
          <div class="flex flex-wrap items-center gap-4">
            <div class="limit">
              <label class="block text-sm text-gray-500 mb-1">Max results:</label>
              <InputNumber v-model="searchLimit" :min="1" :max="100" />
            </div>
            
            <div class="sort-by">
              <label class="block text-sm text-gray-500 mb-1">Sort by:</label>
              <Dropdown
                v-model="sortBy"
                :options="sortOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sort by"
              />
            </div>
            
            <div class="sort-order">
              <label class="block text-sm text-gray-500 mb-1">Order:</label>
              <Dropdown
                v-model="sortOrder"
                :options="sortDirections"
                optionLabel="label"
                optionValue="value"
                placeholder="Sort direction"
              />
            </div>
          </div>
        </div>
        
        <!-- Search Button -->
        <div class="search-button-adv mt-4">
          <div class="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
               @click="searchQuotes"
               :class="{ 'opacity-50 cursor-not-allowed': filters.length === 0 }">
            <i class="pi pi-search text-primary-500 text-xl"></i>
            <span class="text-primary-700 dark:text-primary-300 font-medium">
              {{ loading ? 'Searching...' : 'Search Quotes' }}
            </span>
          </div>
        </div>

    </div>
    
    <!-- Search Results -->
    <div class="search-results">
      <div v-if="loading" class="flex justify-center p-4">
        <ProgressSpinner />
      </div>
      
      <div v-else-if="searchPerformed && results.length === 0" class="p-4 text-center text-gray-500">
        No quotes found matching your criteria.
      </div>
      
      <div v-else-if="results.length > 0" class="results-grid">
        <DataView :value="results" :layout="layout" :paginator="true" :rows="10">
          <template #header>
            <div class="flex justify-between items-center">
              <div>
                <span class="text-sm text-gray-500">Found {{ results.length }} quotes</span>
              </div>
              <div>
                <Button icon="pi pi-th-large" @click="layout = 'grid'" :outlined="layout !== 'grid'" :text="layout === 'grid'" />
                <Button icon="pi pi-bars" @click="layout = 'list'" :outlined="layout !== 'list'" :text="layout === 'list'" />
              </div>
            </div>
          </template>
          
          <template #grid="slotProps">
            <div class="grid">
              <div v-for="(item, index) in slotProps.items" :key="item.id" class="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
                <div class="quote-card-wrapper h-full">
                  <QuoteCard 
                    :quote="item" 
                    :liked="item.is_favorite"
                    :has-previous="index > 0"
                    :has-next="index < slotProps.items.length - 1"
                    @toggle-like="toggleFavorite(item.id)"
                    @click="openQuoteModal(item, index)"
                  />
                </div>
              </div>
            </div>
          </template>
          
          <template #list="slotProps">
            <div class="grid">
              <div v-for="(item, index) in slotProps.items" :key="item.id" class="col-12 mb-3">
                <div class="quote-card-wrapper">
                  <QuoteCard 
                    :quote="item" 
                    :liked="item.is_favorite"
                    :has-previous="index > 0"
                    :has-next="index < slotProps.items.length - 1"
                    @toggle-like="toggleFavorite(item.id)"
                    @click="openQuoteModal(item, index)"
                  />
                </div>
              </div>
            </div>
          </template>
        </DataView>
      </div>
    </div>

    <QuoteModal
      v-if="selectedQuote"
      v-model:visible="showQuoteModal"
      :quote="selectedQuote"
      :liked="selectedQuote ? selectedQuote.is_favorite : false"
      :has-previous="selectedQuoteIndex > 0"
      :has-next="selectedQuoteIndex < (results?.length || 0) - 1"
      @toggle-like="toggleFavorite(selectedQuote.id)"
      @previous-quote="() => openQuoteModal(results[selectedQuoteIndex - 1], selectedQuoteIndex - 1)"
      @next-quote="() => openQuoteModal(results[selectedQuoteIndex + 1], selectedQuoteIndex + 1)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { QuoteService } from '@/service/QuoteService';
import { TagService } from '@/service/TagService';
import { AuthorService } from '@/service/AuthorService';
import { BookService } from '@/service/BookService';
import { QuoteSyncChatService } from '@/service/QuoteSyncChatService';
import QuoteCard from '@/components/QuoteCard.vue';
import QuoteModal from '@/components/QuoteModal.vue';

import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import RadioButton from 'primevue/radiobutton';
import InputNumber from 'primevue/inputnumber';
import ToggleButton from 'primevue/togglebutton';
import ProgressSpinner from 'primevue/progressspinner';
import DataView from 'primevue/dataview';

const router = useRouter();
const toast = useToast();

// State
const filters = ref([{ type: 'quote_content', operator: 'contains', value: '' }]);
const logicOperator = ref('AND');
const searchLimit = ref(20);
const sortBy = ref('created');
const sortOrder = ref('desc');
const loading = ref(false);
const results = ref([]);
const searchPerformed = ref(false);
const layout = ref('grid');

// Available data options
const availableTags = ref([]);
const availableAuthors = ref([]);
const availableBooks = ref([]);

// Add after other state variables
const showQuoteModal = ref(false);
const selectedQuote = ref(null);
const selectedQuoteIndex = ref(-1);

// Filter options
const filterTypes = [
  { label: 'Quote Content', value: 'quote_content' },
  { label: 'Tags', value: 'tags' },
  { label: 'Author', value: 'author' },
  { label: 'Book', value: 'book' },
  { label: 'Date Added', value: 'date' },
  { label: 'Is Favorite', value: 'is_favorite' },
  { label: 'Similar to (Semantic)', value: 'similar_to' }
];

const operatorsByType = {
  quote_content: [
    { label: 'Contains', value: 'contains' },
    { label: 'Exact Match', value: 'exact' },
    { label: 'Starts With', value: 'starts_with' },
    { label: 'Ends With', value: 'ends_with' }
  ],
  tags: [
    { label: 'Has Any Of', value: 'has_any' },
    { label: 'Has All Of', value: 'has_all' },
    { label: 'Doesn\'t Have', value: 'not_has' }
  ],
  author: [
    { label: 'Is', value: 'is' },
    { label: 'Is Not', value: 'is_not' }
  ],
  book: [
    { label: 'Is', value: 'is' },
    { label: 'Is Not', value: 'is_not' }
  ],
  date: [
    { label: 'Between', value: 'between' },
    { label: 'Before', value: 'before' },
    { label: 'After', value: 'after' }
  ],
  is_favorite: [
    { label: 'Is', value: 'is' }
  ],
  similar_to: [
    { label: 'Similarity ≥ 70%', value: 'sim_70' },
    { label: 'Similarity ≥ 80%', value: 'sim_80' },
    { label: 'Similarity ≥ 90%', value: 'sim_90' }
  ]
};

// Sort options
const sortOptions = [
  { label: 'Date Added', value: 'created' },
  { label: 'Last Updated', value: 'updated' },
  { label: 'Book Title', value: 'book__title' },
  { label: 'Author Name', value: 'book__author__name' },
  { label: 'Relevance', value: 'relevance' }
];

const sortDirections = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' }
];

// Methods
const getOperatorsForType = (type) => {
  return operatorsByType[type] || [];
};

const addFilter = () => {
  filters.value.push({ type: 'quote_content', operator: 'contains', value: '' });
};

const removeFilter = (index) => {
  filters.value.splice(index, 1);
};

const resetFilterValue = (index) => {
  // Reset the value when filter type changes
  const filterType = filters.value[index].type;
  
  if (['tags'].includes(filterType)) {
    filters.value[index].value = [];
  } else if (['date'].includes(filterType)) {
    filters.value[index].value = null;
  } else if (['is_favorite'].includes(filterType)) {
    filters.value[index].value = false;
  } else {
    filters.value[index].value = '';
  }
  
  // Set the default operator for the type
  const operators = getOperatorsForType(filterType);
  if (operators.length > 0) {
    filters.value[index].operator = operators[0].value;
  }
};

const searchQuotes = async () => {
  if (filters.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Filters',
      detail: 'Please add at least one search filter',
      life: 3000
    });
    return;
  }
  
  try {
    loading.value = true;
    searchPerformed.value = true;
    
    // Build the search query
    const searchParams = {
      filters: filters.value.map(f => ({
        type: f.type,
        operator: f.operator,
        value: f.value
      })),
      logic_operator: logicOperator.value,
      limit: searchLimit.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value
    };
    
    console.log('Search params:', searchParams);
    
    // Perform the search
    const response = await QuoteService.searchQuotes(searchParams);
    results.value = response.results;
    
    // Check if we need to do semantic search
    const semanticFilters = filters.value.filter(f => f.type === 'similar_to' && f.value);
    
    if (semanticFilters.length > 0 && results.value.length > 0) {
      for (const filter of semanticFilters) {
        const similarityThreshold = parseFloat(filter.operator.split('_')[1]) / 100;
        await enrichWithSimilarityScores(filter.value, similarityThreshold);
      }
    }
    
  } catch (error) {
    console.error('Error searching quotes:', error);
    toast.add({
      severity: 'error',
      summary: 'Search Failed',
      detail: 'An error occurred while searching quotes',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const enrichWithSimilarityScores = async (queryText, threshold) => {
  try {
    // For each result, calculate similarity score to the query text
    // We need to get embeddings for both the query and each result
    
    // Call the backend to get similarity scores
    // This is a simplified version - in a real app, you'd want to do this on the backend
    const semanticResults = await QuoteSyncChatService.findRelatedQuotesByText(queryText, threshold);
    
    // Filter results to only include quotes above the threshold
    const validIds = new Set(semanticResults.map(item => item.quote_id));
    results.value = results.value.filter(quote => validIds.has(quote.id));
    
    // Add similarity scores to results
    results.value.forEach(quote => {
      const match = semanticResults.find(item => item.quote_id === quote.id);
      if (match) {
        quote.similarity_score = match.similarity_score;
      }
    });
    
    // If sort by relevance is selected, sort by similarity score
    if (sortBy.value === 'relevance') {
      results.value.sort((a, b) => {
        return sortOrder.value === 'desc' 
          ? (b.similarity_score || 0) - (a.similarity_score || 0)
          : (a.similarity_score || 0) - (b.similarity_score || 0);
      });
    }
  } catch (error) {
    console.error('Error enriching with similarity scores:', error);
  }
};

const openQuoteModal = (quote, index) => {
  selectedQuote.value = quote;
  selectedQuoteIndex.value = index;
  showQuoteModal.value = true;
};

const toggleFavorite = async (quoteId) => {
  try {
    const index = results.value.findIndex(q => q.id === quoteId);
    if (index !== -1) {
      await QuoteService.toggleFavorite(quoteId);
      
      // Update the item in the results
      results.value[index].is_favorite = !results.value[index].is_favorite;
      
      toast.add({
        severity: 'success',
        summary: results.value[index].is_favorite ? 'Added to Favorites' : 'Removed from Favorites',
        detail: results.value[index].is_favorite ? 'Quote added to favorites' : 'Quote removed from favorites',
        life: 2000
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    toast.add({
      severity: 'error',
      summary: 'Action Failed',
      detail: 'Failed to update favorite status',
      life: 3000
    });
  }
};

// Load reference data
const loadReferenceData = async () => {
  try {
    // Load tags
    const tagsResponse = await TagService.getTags();
    availableTags.value = tagsResponse;
    
    // Load authors
    const authorsResponse = await AuthorService.getAuthors();
    availableAuthors.value = authorsResponse;
    
    // Load books
    const booksResponse = await BookService.getBooks();
    availableBooks.value = booksResponse;
  } catch (error) {
    console.error('Error loading reference data:', error);
    toast.add({
      severity: 'error',
      summary: 'Data Loading Error',
      detail: 'Failed to load some reference data for search filters',
      life: 3000
    });
  }
};

// Initialize
onMounted(() => {
  loadReferenceData();
});
</script>

<style scoped>
.quote-graph-search {
  max-width: 100%;
  background: var(--surface-card);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quote-graph-search:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* Panel styling */
:deep(.p-panel) {
  background: transparent;
  border: none;
  box-shadow: none;
}

:deep(.p-panel .p-panel-header) {
  background: transparent;
  border: none;
  padding: 1.5rem;
}

:deep(.p-panel .p-panel-content) {
  padding: 0 1.5rem 1.5rem;
  background: transparent;
}

/* Filter row styling */
.filter-row {
  background: var(--surface-ground);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  border: 1px solid var(--surface-border);
}

.filter-row:hover {
  background: var(--surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Dropdown styling */
:deep(.p-dropdown) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.p-dropdown:hover) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

:deep(.p-dropdown.p-focus) {
  box-shadow: 0 0 0 2px var(--primary-color-lighter);
}

/* Input styling */
:deep(.p-inputtext) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.p-inputtext:hover) {
  border-color: var(--primary-color);
}

:deep(.p-inputtext.p-focus) {
  box-shadow: 0 0 0 2px var(--primary-color-lighter);
}

/* Button styling */
:deep(.p-button) {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.p-button:active) {
  transform: translateY(0);
}

/* Search button styling */
.search-button-adv {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.search-button-adv .flex {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-button-adv .flex:hover:not(.opacity-50) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.1);
}

.search-button-adv .flex:active:not(.opacity-50) {
  transform: translateY(0);
}

.search-button-adv .flex i {
  transition: transform 0.3s ease;
}

.search-button-adv .flex:hover:not(.opacity-50) i {
  transform: scale(1.1);
}

/* Dark mode adjustments */
:root.dark .search-button-adv .flex {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:root.dark .search-button-adv .flex:hover:not(.opacity-50) {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-button-adv .flex {
    width: 100%;
    justify-content: center;
  }
}

/* Results grid styling */
.results-grid {
  margin-top: 2rem;
}

.results-grid :deep(.p-dataview-header) {
  background: transparent;
  border: none;
  padding: 1rem 0;
}

.results-grid :deep(.p-dataview-content) {
  background: transparent;
}

/* Quote card wrapper styling */
.quote-card-wrapper {
  background: var(--surface-card);
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.quote-card-wrapper:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Quote card hover effects */
.results-grid .grid .cursor-pointer {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.results-grid .grid .cursor-pointer:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

/* Tag styling */
.results-grid .tag-pill {
  background: var(--primary-50);
  color: var(--primary-700);
  border-radius: 12px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.results-grid .tag-pill:hover {
  background: var(--primary-100);
  transform: translateY(-1px);
}

/* Dark mode adjustments */
:root.dark {
  .quote-graph-search {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  
  .filter-row {
    background: var(--surface-ground);
    border-color: var(--surface-border);
  }
  
  .filter-row:hover {
    background: var(--surface-hover);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .results-grid .tag-pill {
    background: var(--primary-900);
    color: var(--primary-300);
  }
  
  .results-grid .tag-pill:hover {
    background: var(--primary-800);
  }
  
  .quote-card-wrapper {
    background: var(--surface-ground);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .quote-card-wrapper:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

/* Loading spinner styling */
:deep(.p-progress-spinner) {
  width: 3rem;
  height: 3rem;
}

:deep(.p-progress-spinner-circle) {
  stroke: var(--primary-color);
  stroke-width: 3;
}

/* Radio button styling */
:deep(.p-radiobutton) {
  margin-right: 0.5rem;
}

:deep(.p-radiobutton .p-radiobutton-box) {
  border-radius: 50%;
  transition: all 0.3s ease;
}

:deep(.p-radiobutton .p-radiobutton-box.p-highlight) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

/* Calendar styling */
:deep(.p-calendar) {
  width: 100%;
}

:deep(.p-calendar .p-inputtext) {
  width: 100%;
}

/* MultiSelect styling */
:deep(.p-multiselect) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.p-multiselect:hover) {
  border-color: var(--primary-color);
}

:deep(.p-multiselect.p-focus) {
  box-shadow: 0 0 0 2px var(--primary-color-lighter);
}

/* Toggle button styling */
:deep(.p-togglebutton) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.p-togglebutton.p-highlight) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filter-row {
    padding: 0.75rem;
  }
  
  :deep(.p-button) {
    padding: 0.5rem 1rem;
  }
  
  .search-button-adv .flex {
    width: 100%;
    justify-content: center;
  }
  
  .quote-card-wrapper {
    margin: 0.5rem 0;
  }
}
</style> 