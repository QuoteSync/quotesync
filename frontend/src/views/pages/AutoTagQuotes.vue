<template>
  <div class="card">
    <h1 class="text-3xl font-bold mb-4">Auto Tag Quotes</h1>
    
    <div class="mb-4">
      <p class="text-gray-700 dark:text-gray-300 mb-2">
        Use AI to automatically generate tags for your quotes. Select quotes from the list below, 
        then click "Generate Tags" to have our AI analyze and tag them.
      </p>
    </div>
    
    <div class="mb-4 flex flex-row gap-2">
      <Button 
        label="Generate Tags" 
        icon="pi pi-tag" 
        :disabled="selectedQuotes.length === 0 || processing" 
        :loading="processing"
        @click="generateTagsForSelected" 
        class="p-button-primary" 
      />
      <Button 
        label="Apply All Tags" 
        icon="pi pi-check" 
        :disabled="!hasProcessedQuotes || applyingTags" 
        :loading="applyingTags"
        @click="applyAllTags" 
        class="p-button-success" 
      />
      <Button 
        label="Clear Selection" 
        icon="pi pi-times" 
        :disabled="selectedQuotes.length === 0" 
        @click="clearSelection" 
        class="p-button-secondary" 
      />
      <Button 
        label="Clear Filters" 
        icon="pi pi-filter-slash" 
        @click="clearAllFilters" 
        class="p-button-outlined" 
      />
    </div>
    
    <!-- AI Settings Panel -->
    <Panel header="AI Settings" :toggleable="true" class="mb-4">
      <div class="flex items-center gap-4">
        <div class="flex items-center">
          <label for="useOllama" class="mr-2 font-bold">Use Ollama</label>
          <InputSwitch v-model="useOllama" inputId="useOllama" />
          <span v-if="useOllama" class="ml-2">
            <i 
              v-if="ollamaAvailable" 
              class="pi pi-check-circle text-green-500"
              v-tooltip.top="'Ollama is available'"
            ></i>
            <i 
              v-else-if="checkingOllamaStatus" 
              class="pi pi-spin pi-spinner text-blue-500"
            ></i>
            <i 
              v-else 
              class="pi pi-exclamation-circle text-yellow-500"
              v-tooltip.top="'Ollama not available or not checked'"
              @click="checkOllamaStatus"
              style="cursor: pointer;"
            ></i>
          </span>
        </div>
        
        <div class="flex items-center">
          <Button 
            icon="pi pi-refresh" 
            @click="checkOllamaStatus" 
            class="p-button-text p-button-rounded"
            v-tooltip.top="'Check Ollama status'"
            :disabled="checkingOllamaStatus"
          />
        </div>
      </div>
    </Panel>
    
    <!-- Quote selection table -->
    <DataTable 
      v-model:selection="selectedQuotes" 
      :value="quotes" 
      dataKey="id" 
      :paginator="true" 
      :rows="10"
      :loading="loading"
      :filters="filters"
      filterDisplay="menu"
      class="p-datatable-sm mb-4"
      :scrollable="true"
      scrollHeight="500px"
    >
      <template #header>
        <div class="flex justify-between">
          <Button 
            icon="pi pi-refresh" 
            @click="loadQuotes" 
            class="p-button-text p-button-rounded" 
          />
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="filters['global'].value" placeholder="Search quotes..." />
          </span>
        </div>
      </template>
      
      <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
      
      <Column field="body" header="Quote" style="min-width: 50%" :sortable="true" filterField="body">
        <template #body="{ data }">
          <div>
            <p :class="{'line-through': processedQuoteIds.has(data.id)}">{{ truncateText(data.body, 100) }}</p>
            <div class="text-xs text-gray-500 mt-1">
              {{ data.book ? data.book.title : 'Unknown book' }} - 
              {{ data.book && data.book.author ? data.book.author.name : 'Unknown author' }}
            </div>
          </div>
        </template>
        <template #filter="{ filterModel }">
          <InputText v-model="filterModel.value" type="text" class="p-column-filter w-full" placeholder="Search by content" />
        </template>
      </Column>
      
      <Column field="book.title" header="Book" :sortable="true" style="width: 12rem">
        <template #body="{ data }">
          <div class="text-sm">{{ data.book ? data.book.title : 'Unknown' }}</div>
        </template>
        <template #filter="{ filterModel }">
          <div>
            <AutoComplete
              v-model="selectedBookFilter"
              :suggestions="filteredBooks"
              @complete="suggestBooks"
              optionLabel="label"
              placeholder="Search or select a book"
              class="w-full"
              @item-select="applyBookFilter"
              @clear="clearBookFilter"
              :dropdown="true"
            />
          </div>
        </template>
      </Column>
      
      <Column field="book.author.name" header="Author" :sortable="true" style="width: 12rem">
        <template #body="{ data }">
          <div class="text-sm">{{ data.book && data.book.author ? data.book.author.name : 'Unknown' }}</div>
        </template>
        <template #filter="{ filterModel }">
          <div>
            <AutoComplete 
              v-model="selectedAuthorFilter"
              :suggestions="filteredAuthors"
              @complete="suggestAuthors"
              optionLabel="label"
              placeholder="Search or select an author"
              class="w-full"
              @item-select="applyAuthorFilter"
              @clear="clearAuthorFilter"
              :dropdown="true"
            />
          </div>
        </template>
      </Column>
      
      <Column field="tags" header="Current Tags" :sortable="true" :filterFunction="tagFilter" @sort="tagSorter">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <Chip 
              v-for="tag in data.tags" 
              :key="tag.id" 
              :label="tag.title" 
              class="text-xs"
              :style="getTagStyle(tag)" 
            />
            <span v-if="data.tags.length === 0" class="text-gray-500 text-xs italic">No tags</span>
          </div>
        </template>
        <template #filter="{ filterModel }">
          <div>
            <AutoComplete 
              v-model="selectedTagFilter"
              :suggestions="filteredTags"
              @complete="suggestTags"
              optionLabel="label"
              placeholder="Search or select a tag"
              class="w-full"
              @item-select="applyTagFilter"
              @clear="clearTagFilter"
              :dropdown="true"
            />
          </div>
        </template>
      </Column>
      
      <Column field="generatedTags" header="Generated Tags">
        <template #body="{ data }">
          <div v-if="processedQuoteIds.has(data.id)" class="flex flex-wrap gap-1">
            <div v-for="(tag, i) in generatedTags[data.id]" :key="i" class="flex items-center">
              <Checkbox 
                :inputId="`tag-${data.id}-${i}`" 
                v-model="tagSelections[data.id][i]" 
                :binary="true" 
                class="mr-1"
              />
              <label :for="`tag-${data.id}-${i}`" class="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900">
                {{ tag }}
              </label>
            </div>
          </div>
          <ProgressSpinner v-else-if="processingQuotes.has(data.id)" style="width: 20px; height: 20px" />
          <span v-else class="text-gray-500 text-xs italic">Not generated yet</span>
        </template>
      </Column>
      
      <Column header="Actions" style="width: 8rem">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button 
              icon="pi pi-tag" 
              class="p-button-rounded p-button-sm p-button-outlined"
              :disabled="processingQuotes.has(data.id)"
              @click="generateTagsForQuote(data)" 
              v-tooltip.top="'Generate tags'"
            />
            <Button 
              icon="pi pi-check" 
              class="p-button-rounded p-button-sm p-button-success p-button-outlined"
              :disabled="!processedQuoteIds.has(data.id) || applyingTagsForQuote[data.id]"
              :loading="applyingTagsForQuote[data.id]"
              @click="applyTagsForQuote(data)" 
              v-tooltip.top="'Apply tags'"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { QuoteService } from '@/service/QuoteService';
import { QuoteSyncChatService } from '@/service/QuoteSyncChatService';
import { OllamaService } from '@/service/OllamaService';
import { TagService } from '@/service/TagService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import Checkbox from 'primevue/checkbox';
import InputSwitch from 'primevue/inputswitch';
import Panel from 'primevue/panel';
import AutoComplete from 'primevue/autocomplete';

const toast = useToast();

// State
const quotes = ref([]);
const selectedQuotes = ref([]);
const loading = ref(false);
const processing = ref(false);
const applyingTags = ref(false);
const processingQuotes = ref(new Set());
const processedQuoteIds = ref(new Set());
const generatedTags = ref({});
const tagSelections = ref({});
const applyingTagsForQuote = ref({});
const useOllama = ref(true); // Default to using Ollama
const ollamaAvailable = ref(false);
const checkingOllamaStatus = ref(false);

// Filters
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  body: { value: null, matchMode: FilterMatchMode.CONTAINS },
  'book.title': { value: null, matchMode: FilterMatchMode.CONTAINS },
  'book.author.name': { value: null, matchMode: FilterMatchMode.CONTAINS },
  tags: { 
    operator: FilterOperator.AND,
    constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] 
  }
});

// Additional state for filter UI
const availableBooks = ref([]);
const availableAuthors = ref([]);
const availableTags = ref([]);
const selectedBookFilter = ref(null);
const selectedAuthorFilter = ref(null);
const selectedTagFilter = ref(null);

const filteredBooks = ref([]);
const filteredAuthors = ref([]);
const filteredTags = ref([]);

// Computed properties
const hasProcessedQuotes = computed(() => processedQuoteIds.value.size > 0);

// Methods
const loadQuotes = async () => {
  try {
    loading.value = true;
    const data = await QuoteService.getQuotes();
    quotes.value = data;
    
    // Load filter options after quotes are loaded
    loadFilterOptions();
  } catch (error) {
    console.error('Error loading quotes:', error);
    toast.add({
      severity: 'error',
      summary: 'Error Loading Quotes',
      detail: 'Failed to load quotes. Please try again.',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const getTagStyle = (tag) => {
  if (tag.gradient_primary_color && tag.gradient_secondary_color) {
    return {
      background: `linear-gradient(135deg, ${tag.gradient_primary_color}, ${tag.gradient_secondary_color})`,
      color: 'white'
    };
  }
  return {
    background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)',
    color: 'white'
  };
};

const checkOllamaStatus = async () => {
  checkingOllamaStatus.value = true;
  try {
    ollamaAvailable.value = await OllamaService.checkStatus();
  } catch (error) {
    console.error('Error checking Ollama status:', error);
    ollamaAvailable.value = false;
  } finally {
    checkingOllamaStatus.value = false;
  }
};

const generateTagsForQuote = async (quote) => {
  if (processingQuotes.value.has(quote.id)) return;
  
  processingQuotes.value.add(quote.id);
  
  try {
    let result;
    
    if (useOllama.value) {
      // Check Ollama status if we haven't already
      if (!ollamaAvailable.value && !checkingOllamaStatus.value) {
        await checkOllamaStatus();
      }
      
      if (!ollamaAvailable.value) {
        throw new Error('Ollama is not available. Make sure it is running.');
      }
      
      // Use Ollama service with the quote text directly
      result = await OllamaService.generateTags(quote.body);
    } else {
      // Use existing QuoteSyncChat service
      result = await QuoteSyncChatService.generateTags(quote.id);
    }
    
    generatedTags.value[quote.id] = result.tags || [];
    
    // Initialize tag selections (all selected by default)
    tagSelections.value[quote.id] = generatedTags.value[quote.id].map(() => true);
    
    processedQuoteIds.value.add(quote.id);
  } catch (error) {
    console.error('Error generating tags:', error);
    toast.add({
      severity: 'error',
      summary: 'Tag Generation Failed',
      detail: error.message || `Failed to generate tags for quote: ${truncateText(quote.body, 30)}`,
      life: 3000
    });
  } finally {
    processingQuotes.value.delete(quote.id);
  }
};

const generateTagsForSelected = async () => {
  if (selectedQuotes.value.length === 0 || processing.value) return;
  
  processing.value = true;
  
  try {
    const promises = selectedQuotes.value.map(quote => generateTagsForQuote(quote));
    await Promise.all(promises);
    
    toast.add({
      severity: 'success',
      summary: 'Tags Generated',
      detail: `Successfully generated tags for ${selectedQuotes.value.length} quotes`,
      life: 3000
    });
  } catch (error) {
    console.error('Error generating tags:', error);
  } finally {
    processing.value = false;
  }
};

const applyTagsForQuote = async (quote) => {
  if (!processedQuoteIds.value.has(quote.id) || applyingTagsForQuote.value[quote.id]) return;
  
  applyingTagsForQuote.value[quote.id] = true;
  
  try {
    // Get the selected tags
    const selectedTags = generatedTags.value[quote.id].filter((_, index) => tagSelections.value[quote.id][index]);
    
    // Get existing tags (we want to append new tags, not replace)
    const existingTagTitles = quote.tags.map(tag => tag.title);
    
    // Filter out tags that already exist
    const newTags = selectedTags.filter(tag => !existingTagTitles.includes(tag));
    
    if (newTags.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No New Tags',
        detail: 'All selected tags already exist for this quote',
        life: 3000
      });
      return;
    }
    
    // Create tags and associate with the quote
    const updatedTagsList = [...existingTagTitles, ...newTags];
    
    // Update the quote with new tags
    await QuoteService.updateQuote(quote.id, { tags: updatedTagsList });
    
    // Refresh the quote data
    await loadQuotes();
    
    toast.add({
      severity: 'success',
      summary: 'Tags Applied',
      detail: `Added ${newTags.length} tags to the quote`,
      life: 3000
    });
    
    // Remove from processed list
    processedQuoteIds.value.delete(quote.id);
    delete generatedTags.value[quote.id];
    delete tagSelections.value[quote.id];
    
  } catch (error) {
    console.error('Error applying tags:', error);
    toast.add({
      severity: 'error',
      summary: 'Failed to Apply Tags',
      detail: 'An error occurred while applying tags',
      life: 3000
    });
  } finally {
    applyingTagsForQuote.value[quote.id] = false;
  }
};

const applyAllTags = async () => {
  if (!hasProcessedQuotes.value || applyingTags.value) return;
  
  applyingTags.value = true;
  
  try {
    // Get all processed quotes
    const processedQuotes = quotes.value.filter(q => processedQuoteIds.value.has(q.id));
    
    // Apply tags for each processed quote
    for (const quote of processedQuotes) {
      await applyTagsForQuote(quote);
    }
    
    toast.add({
      severity: 'success',
      summary: 'All Tags Applied',
      detail: 'Successfully applied tags to all processed quotes',
      life: 3000
    });
  } catch (error) {
    console.error('Error applying all tags:', error);
    toast.add({
      severity: 'error',
      summary: 'Failed to Apply All Tags',
      detail: 'An error occurred while applying tags to all quotes',
      life: 3000
    });
  } finally {
    applyingTags.value = false;
  }
};

const clearSelection = () => {
  selectedQuotes.value = [];
};

// Load filter options
const loadFilterOptions = () => {
  // Extract unique books
  const books = new Set();
  const authors = new Set();
  const tags = new Set();
  
  quotes.value.forEach(quote => {
    if (quote.book && quote.book.title) {
      books.add(quote.book.title);
    }
    
    if (quote.book && quote.book.author && quote.book.author.name) {
      authors.add(quote.book.author.name);
    }
    
    if (quote.tags && quote.tags.length > 0) {
      quote.tags.forEach(tag => {
        tags.add(tag.title);
      });
    }
  });
  
  availableBooks.value = Array.from(books).sort().map(title => ({ label: title, value: title }));
  availableAuthors.value = Array.from(authors).sort().map(name => ({ label: name, value: name }));
  availableTags.value = Array.from(tags).sort().map(title => ({ label: title, value: title }));
};

// Filter suggestion methods
const suggestBooks = (event) => {
  let query = event.query.toLowerCase();
  filteredBooks.value = availableBooks.value.filter(book => 
    book.label.toLowerCase().includes(query)
  );
};

const suggestAuthors = (event) => {
  let query = event.query.toLowerCase();
  filteredAuthors.value = availableAuthors.value.filter(author => 
    author.label.toLowerCase().includes(query)
  );
};

const suggestTags = (event) => {
  let query = event.query.toLowerCase();
  filteredTags.value = availableTags.value.filter(tag => 
    tag.label.toLowerCase().includes(query)
  );
};

// Apply filters
const applyBookFilter = () => {
  if (selectedBookFilter.value) {
    filters.value['book.title'].value = selectedBookFilter.value.value;
  } else {
    filters.value['book.title'].value = null;
  }
};

const applyAuthorFilter = () => {
  if (selectedAuthorFilter.value) {
    filters.value['book.author.name'].value = selectedAuthorFilter.value.value;
  } else {
    filters.value['book.author.name'].value = null;
  }
};

const applyTagFilter = () => {
  if (selectedTagFilter.value) {
    // For tag filtering, we need a workaround since tags are in an array
    // Instead of using the global filter as a hack, let's provide a UI message
    // that tags can be searched in the tags column directly
    toast.add({
      severity: 'info',
      summary: 'Tag Filter Applied',
      detail: `Showing quotes with tag: ${selectedTagFilter.value.label}`,
      life: 3000
    });
    
    // We'll use a different approach by filtering the quotes array directly
    // This is a better UX than the previous approach
    const filteredIds = quotes.value
      .filter(quote => quote.tags && quote.tags.some(tag => tag.title === selectedTagFilter.value.value))
      .map(quote => quote.id);
      
    if (filteredIds.length > 0) {
      // Create a complex filter expression that will match any of these IDs
      const filterExpression = filteredIds.map(id => `id:${id}`).join(' OR ');
      filters.value.global.value = filterExpression;
    } else {
      // No matches, use a value that won't match anything
      filters.value.global.value = 'NO_RESULTS_FOR_TAG';
    }
  } else {
    filters.value.global.value = null;
  }
};

const clearAllFilters = () => {
  selectedBookFilter.value = null;
  selectedAuthorFilter.value = null;
  selectedTagFilter.value = null;
  
  // Clear all filter values
  Object.keys(filters.value).forEach(key => {
    filters.value[key].value = null;
  });
  
  toast.add({
    severity: 'success',
    summary: 'Filters Cleared',
    detail: 'All filters have been reset',
    life: 2000
  });
};

// Custom filter function for tags
const tagFilter = (value, filter) => {
  if (filter === undefined || filter === null || filter.trim() === '') {
    return true;
  }
  
  if (value === undefined || value === null) {
    return false;
  }
  
  // Value is an array of tag objects
  return value.some(tag => 
    tag.title.toLowerCase().indexOf(filter.toLowerCase()) !== -1
  );
};

// Add clear methods
const clearBookFilter = () => {
  selectedBookFilter.value = null;
  filters.value['book.title'].value = null;
};

const clearAuthorFilter = () => {
  selectedAuthorFilter.value = null;
  filters.value['book.author.name'].value = null;
};

const clearTagFilter = () => {
  selectedTagFilter.value = null;
  filters.value.global.value = null;
};

// Add custom sort function for tags
const tagSorter = (event) => {
  const { field, order } = event;
  
  // Sort quotes by tag count or alphabetically by first tag
  quotes.value.sort((quote1, quote2) => {
    const tags1 = quote1.tags || [];
    const tags2 = quote2.tags || [];
    
    // Sort by tag count first
    if (tags1.length !== tags2.length) {
      return order * (tags1.length - tags2.length);
    }
    
    // If same number of tags, sort alphabetically by first tag
    if (tags1.length > 0 && tags2.length > 0) {
      const tag1 = tags1[0].title.toLowerCase();
      const tag2 = tags2[0].title.toLowerCase();
      return order * tag1.localeCompare(tag2);
    }
    
    return 0;
  });
};

// Load quotes and check Ollama on mount
onMounted(() => {
  loadQuotes();
  checkOllamaStatus();
});
</script>

<style scoped>
:deep(.p-datatable-wrapper) {
  border-radius: 0.5rem;
}

:deep(.p-checkbox .p-checkbox-box.p-highlight) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.p-button.p-button-sm) {
  padding: 0.25rem;
  font-size: 0.75rem;
}

:deep(.p-button-sm .p-button-icon) {
  font-size: 0.875rem;
}

:deep(.p-panel) {
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

:deep(.p-panel .p-panel-header) {
  background-color: var(--surface-card);
  border-radius: 0.5rem 0.5rem 0 0;
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-dropdown) {
  width: 100%;
}

@media (min-width: 768px) {
  :deep(.p-dropdown) {
    min-width: 16rem;
  }
}
</style> 