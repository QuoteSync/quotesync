<template>
  <div class="card">
    <h1 class="text-3xl font-bold mb-4">Auto Tag Quotes</h1>
    
    <div class="mb-4">
      <p class="text-gray-700 dark:text-gray-300 mb-2">
        Use AI to automatically generate tags for your quotes. Select quotes from the list below, 
        then click "Generate Tags" to have our AI analyze and tag them.
      </p>
    </div>
    
    <div class="mb-4 flex flex-wrap gap-2">
      <Button 
        label="Generate Tags" 
        icon="pi pi-tag" 
        :disabled="selectedQuotes.length === 0 || processing" 
        :loading="processing"
        @click="generateTagsForSelected" 
        class="p-button-primary flex-grow sm:flex-grow-0" 
      />
      <Button 
        label="Apply All Tags" 
        icon="pi pi-check" 
        :disabled="!hasProcessedQuotes || applyingTags" 
        :loading="applyingTags"
        @click="applyAllTags" 
        class="p-button-success flex-grow sm:flex-grow-0" 
      />
      <Button 
        label="Clear Selection" 
        icon="pi pi-times" 
        :disabled="selectedQuotes.length === 0" 
        @click="clearSelection" 
        class="p-button-secondary flex-grow sm:flex-grow-0" 
      />
      <Button 
        label="Clear Filters" 
        icon="pi pi-filter-slash" 
        @click="clearAllFilters" 
        class="p-button-outlined flex-grow sm:flex-grow-0" 
      />
    </div>
    
    <!-- AI Settings Panel -->
    <Panel header="AI Settings" :toggleable="true" class="mb-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div class="flex items-center gap-4">
          <div class="flex flex-col">
            <label class="text-sm font-bold mb-2">Select AI Service:</label>
            <div class="flex gap-2">
              <Button 
                :class="['p-button-sm', aiService === 'claude' ? 'p-button-primary' : 'p-button-outlined']"
                label="Claude" 
                icon="pi pi-star"
                @click="aiService = 'claude'"
              />
              <Button 
                :class="['p-button-sm', aiService === 'ollama' ? 'p-button-primary' : 'p-button-outlined']"
                label="Ollama" 
                icon="pi pi-desktop"
                @click="aiService = 'ollama'"
              />
              <Button 
                :class="['p-button-sm', aiService === 'quotesync' ? 'p-button-primary' : 'p-button-outlined']"
                label="QuoteSync" 
                icon="pi pi-cloud"
                @click="aiService = 'quotesync'"
              />
            </div>
          </div>
        </div>
        
        <div class="flex items-center" v-if="aiService === 'ollama'">
          <Button 
            icon="pi pi-refresh" 
            @click="checkOllamaStatus" 
            class="p-button-text p-button-rounded"
            v-tooltip.top="'Check Ollama status'"
            :disabled="checkingOllamaStatus"
          />
          <span class="ml-2">
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
      </div>
    </Panel>
    
    <!-- Quote selection table -->
    <DataTable 
      v-model:selection="selectedQuotes" 
      :value="quotes" 
      dataKey="id" 
      :paginator="true" 
      :rows="rows"
      :totalRecords="totalRecords"
      :loading="loading"
      :filters="filters"
      :lazy="true"
      filterDisplay="menu"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      class="p-datatable-sm mb-4"
      :scrollable="true"
      :scrollHeight="getScrollHeight()"
      @page="onPage"
      @sort="onSort"
      @filter="onFilter"
      :rowClass="rowClass"
      @row-click="onRowClick"
      @row-select-checkbox="onRowSelectCheckbox"
      responsiveLayout="stack"
      breakpoint="960px"
    >
      <template #header>
        <div class="flex flex-col sm:flex-row justify-between gap-2">
          <div class="flex items-center">
            <Button 
              icon="pi pi-refresh" 
              @click="loadQuotes" 
              class="p-button-text p-button-rounded" 
            />
            <span class="text-xs text-gray-500 ml-2" v-tooltip.right="'Hold Shift and click checkboxes to select multiple quotes in a range'">
              <i class="pi pi-info-circle mr-1"></i>Tip: Use Shift+Click on checkboxes for range selection
            </span>
          </div>
          <span class="p-input-icon-left w-full sm:w-auto">
            <i class="pi pi-search" />
            <InputText v-model="filters['global'].value" placeholder="Search quotes..." class="w-full" />
          </span>
        </div>
      </template>
      
      <Column selectionMode="multiple" headerStyle="width: 3rem" :showFilterMenu="false"></Column>
      
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
      
      <Column field="book.title" header="Book" :sortable="true" class="break-words" style="min-width: 12rem" :showFilterMenu="false">
        <template #body="{ data }">
          <div class="text-sm break-words">{{ data.book ? data.book.title : 'Unknown' }}</div>
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
      
      <Column field="book.author.name" header="Author" :sortable="true" class="break-words" style="min-width: 12rem" :showFilterMenu="false">
        <template #body="{ data }">
          <div class="text-sm break-words">{{ data.book && data.book.author ? data.book.author.name : 'Unknown' }}</div>
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
      
      <Column field="tags" header="Current Tags" :sortable="true" :filterFunction="tagFilter" @sort="tagSorter" class="break-words" :showFilterMenu="false">
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
      
      <Column field="generatedTags" header="Generated Tags" class="break-words" :showFilterMenu="false">
        <template #body="{ data }">
          <div v-if="processedQuoteIds.has(data.id)" class="flex flex-wrap gap-1">
            <div v-for="(tag, i) in generatedTags[data.id]" :key="i" class="flex items-center mb-1">
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
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 w-full">
              <AutoComplete 
                v-model="customTags[data.id]" 
                placeholder="Add custom tag..." 
                class="text-xs w-full sm:w-2/3"
                :suggestions="filteredCustomTagSuggestions"
                @complete="suggestCustomTags"
                @keydown.enter="addCustomTag(data.id)"
                dropdown
              />
              <Button 
                icon="pi pi-plus" 
                class="p-button-sm p-button-outlined mt-1 sm:mt-0"
                @click="addCustomTag(data.id)" 
                v-tooltip.top="'Add custom tag'"
              />
            </div>
          </div>
          <ProgressSpinner v-else-if="processingQuotes.has(data.id)" style="width: 20px; height: 20px" />
          <span v-else class="text-gray-500 text-xs italic">Not generated yet</span>
        </template>
      </Column>
      
      <Column header="Actions" :showFilterMenu="false">
        <template #body="{ data }">
          <div class="flex gap-1 flex-wrap justify-start">
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
            <Button 
              icon="pi pi-plus" 
              class="p-button-rounded p-button-sm p-button-info p-button-outlined"
              @click="showCustomTagDialog(data)"
              v-tooltip.top="'Add custom tag'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Custom Tag Dialog -->
    <Dialog 
      v-model:visible="customTagDialogVisible" 
      :style="{ width: '100%', maxWidth: '450px' }" 
      header="Add Custom Tag" 
      :modal="true"
      :closable="true"
      class="p-fluid"
    >
      <div class="flex flex-col p-3">
        <div class="mb-3">
          <label for="customTagInput" class="block mb-2 font-medium">Enter tag:</label>
          <AutoComplete 
            id="customTagInput" 
            v-model="newCustomTag" 
            class="w-full" 
            placeholder="New tag..."
            :suggestions="filteredCustomTagSuggestions"
            @complete="suggestCustomTags"
            @keydown.enter="addCustomTagFromDialog"
            dropdown
          />
        </div>
        <div v-if="availableTags.length > 0" class="mb-3">
          <label class="block mb-2 font-medium">Or select existing tag:</label>
          <div class="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-2 border rounded">
            <Chip
              v-for="tag in availableTags" 
              :key="tag.value" 
              :label="tag.label" 
              class="cursor-pointer hover:bg-primary-100 transition-colors my-1" 
              @click="selectExistingTag(tag.label)"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="customTagDialogVisible = false" 
            class="p-button-text"
          />
          <Button 
            label="Add Tag" 
            icon="pi pi-check" 
            @click="addCustomTagFromDialog" 
            class="p-button-primary" 
            :disabled="!newCustomTag || newCustomTag.trim() === ''"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { QuoteService } from '@/service/QuoteService';
import { QuoteSyncChatService } from '@/service/QuoteSyncChatService';
import { OllamaService } from '@/service/OllamaService';
import { AnthropicService } from '@/service/AnthropicService';
import { TagService } from '@/service/TagService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import Checkbox from 'primevue/checkbox';
import ToggleSwitch from 'primevue/toggleswitch';
import Panel from 'primevue/panel';
import AutoComplete from 'primevue/autocomplete';
import Dialog from 'primevue/dialog';

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
const aiService = ref('claude'); // Default to using Claude
const ollamaAvailable = ref(false);
const checkingOllamaStatus = ref(false);
const customTags = ref({});
const customTagDialogVisible = ref(false);
const newCustomTag = ref('');
const currentQuote = ref(null);
const lastSelectedIndex = ref(-1); // Store the last selected row index for shift+click
const lastCheckedIndex = ref(-1); // Store the last checkbox index for shift+click

// Window size tracking for responsive design
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

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

// Add after the other state references
const filteredCustomTagSuggestions = ref([]);

// Pagination state
const rows = ref(10);
const totalRecords = ref(0);
const currentPage = ref(1);
const currentSortField = ref(null);
const currentSortOrder = ref(null);

// Computed properties
const hasProcessedQuotes = computed(() => processedQuoteIds.value.size > 0);

// Window resize handler for responsive design
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

// Get dynamic scroll height based on screen size
const getScrollHeight = () => {
  // Mobile devices (portrait)
  if (windowWidth.value < 640) {
    return '400px';
  }
  // Tablets and small screens
  if (windowWidth.value < 1024) {
    return '450px';
  }
  // Larger screens
  return '500px';
};

// Listen for window resize
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

// Methods
const loadQuotes = async () => {
  try {
    loading.value = true;
    
    // Use paginated API
    const result = await QuoteService.getQuotesPaginated(
      currentPage.value, 
      rows.value, 
      currentSortField.value, 
      currentSortOrder.value, 
      filters.value
    );
    
    quotes.value = result.data;
    totalRecords.value = result.total;
    
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
    
    // Select AI service based on user choice
    if (aiService.value === 'claude') {
      // Use Anthropic Claude service
      result = await AnthropicService.generateTags(quote.body);
    } else if (aiService.value === 'ollama') {
      // Check Ollama status if we haven't already
      if (!ollamaAvailable.value && !checkingOllamaStatus.value) {
        await checkOllamaStatus();
      }
      
      if (!ollamaAvailable.value) {
        throw new Error('Ollama is not available. Make sure it is running.');
      }
      
      // Use Ollama service
      result = await OllamaService.generateTags(quote.body);
    } else {
      // Use QuoteSyncChat service
      result = await QuoteSyncChatService.generateTags(quote.id);
      
      // Need different handling for QuoteSyncChat response format
      if (result.tags && Array.isArray(result.tags) && result.tags.length > 0 && typeof result.tags[0] === 'object') {
        // Extract titles from tag objects for QuoteSyncChat
        result.tags = result.tags.map(tag => tag.title);
      }
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
  lastSelectedIndex.value = -1; // Reset last selected index
  lastCheckedIndex.value = -1; // Reset last checked index
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

const addCustomTag = (quoteId) => {
  // Make sure there's something to add
  if (!customTags.value[quoteId] || customTags.value[quoteId].trim() === '') {
    return;
  }
  
  // Capitalize first letter
  const newTag = customTags.value[quoteId].trim();
  const formattedTag = newTag.charAt(0).toUpperCase() + newTag.slice(1);
  
  // Initialize if needed
  if (!generatedTags.value[quoteId]) {
    generatedTags.value[quoteId] = [];
    tagSelections.value[quoteId] = [];
    processedQuoteIds.value.add(quoteId);
  }
  
  // Check for duplicates
  if (generatedTags.value[quoteId].includes(formattedTag)) {
    toast.add({
      severity: 'info',
      summary: 'Duplicate Tag',
      detail: `The tag "${formattedTag}" already exists for this quote`,
      life: 2000
    });
    return;
  }
  
  // Add the new tag and set it as selected
  generatedTags.value[quoteId].push(formattedTag);
  tagSelections.value[quoteId].push(true);
  
  // Clear the input
  customTags.value[quoteId] = '';
  
  toast.add({
    severity: 'success',
    summary: 'Custom Tag Added',
    detail: `Added "${formattedTag}" to tags`,
    life: 2000
  });
};

const showCustomTagDialog = (quote) => {
  currentQuote.value = quote;
  customTagDialogVisible.value = true;
  newCustomTag.value = '';
};

const addCustomTagFromDialog = () => {
  if (!newCustomTag.value || newCustomTag.value.trim() === '') return;
  
  const quoteId = currentQuote.value.id;
  
  // Initialize if needed
  if (!generatedTags.value[quoteId]) {
    generatedTags.value[quoteId] = [];
    tagSelections.value[quoteId] = [];
    processedQuoteIds.value.add(quoteId);
  }
  
  // Process and add the tag
  let formattedTag = newCustomTag.value.trim();
  formattedTag = formattedTag.charAt(0).toUpperCase() + formattedTag.slice(1);
  
  // Check for duplicates
  if (generatedTags.value[quoteId].includes(formattedTag)) {
    toast.add({
      severity: 'info',
      summary: 'Duplicate Tag',
      detail: `The tag "${formattedTag}" already exists for this quote`,
      life: 2000
    });
    return;
  }
  
  // Add the tag
  generatedTags.value[quoteId].push(formattedTag);
  tagSelections.value[quoteId].push(true);
  
  // Clear and close
  newCustomTag.value = '';
  customTagDialogVisible.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'Custom Tag Added',
    detail: `Added "${formattedTag}" to tags`,
    life: 2000
  });
};

const selectExistingTag = (tagName) => {
  newCustomTag.value = tagName;
};

// Add after the suggestTags function
const suggestCustomTags = (event) => {
  let query = event.query.toLowerCase();
  filteredCustomTagSuggestions.value = availableTags.value
    .filter(tag => tag.label.toLowerCase().includes(query))
    .map(tag => tag.label);
};

// Event handlers for pagination
const onPage = (event) => {
  currentPage.value = event.page + 1; // PrimeVue uses 0-based pagination
  rows.value = event.rows;
  loadQuotes();
};

const onSort = (event) => {
  currentSortField.value = event.sortField;
  currentSortOrder.value = event.sortOrder === 1 ? 'asc' : 'desc';
  loadQuotes();
};

const onFilter = (event) => {
  // Reset to first page when filtering
  currentPage.value = 1;
  filters.value = event.filters;
  loadQuotes();
};

// Load quotes and check Ollama on mount
onMounted(() => {
  loadQuotes();
  checkOllamaStatus();
});

// Add rowClass and onRowClick methods
const rowClass = (data) => {
  return {
    'bg-primary-100': processedQuoteIds.value.has(data.id),
    'bg-secondary-100': !processedQuoteIds.value.has(data.id) && processingQuotes.value.has(data.id)
  };
};

const onRowClick = (event) => {
  const { originalEvent, data, index } = event;
  
  // If shift key is pressed and we have a previous selection
  if (originalEvent.shiftKey && lastSelectedIndex.value >= 0) {
    // Prevent default behavior
    originalEvent.preventDefault();
    
    // Determine start and end indices for range selection
    const start = Math.min(lastSelectedIndex.value, index);
    const end = Math.max(lastSelectedIndex.value, index);
    
    // Select all quotes in the range
    for (let i = start; i <= end; i++) {
      if (i >= 0 && i < quotes.value.length) {
        const quote = quotes.value[i];
        
        // If the quote is not already selected, add it to selection
        if (!selectedQuotes.value.some(q => q.id === quote.id)) {
          selectedQuotes.value.push(quote);
        }
      }
    }
  }
  
  // Update last selected index
  lastSelectedIndex.value = index;
};

const onRowSelectCheckbox = (event) => {
  const { originalEvent, data, index, checked } = event;
  
  // If shift key is pressed and we have a previous checkbox selection
  if (originalEvent.shiftKey && lastCheckedIndex.value >= 0) {
    // Prevent default behavior to handle our custom logic
    originalEvent.preventDefault();
    
    // Determine start and end indices for range selection
    const start = Math.min(lastCheckedIndex.value, index);
    const end = Math.max(lastCheckedIndex.value, index);
    
    // Apply the same state to all checkboxes in the range
    for (let i = start; i <= end; i++) {
      if (i >= 0 && i < quotes.value.length) {
        const quote = quotes.value[i];
        const quoteId = quote.id;
        const alreadySelected = selectedQuotes.value.some(q => q.id === quoteId);
        
        if (checked && !alreadySelected) {
          // Add to selection if not already there
          selectedQuotes.value.push(quote);
        } else if (!checked && alreadySelected) {
          // Remove from selection
          selectedQuotes.value = selectedQuotes.value.filter(q => q.id !== quoteId);
        }
      }
    }
  }
  
  // Update last checked index
  lastCheckedIndex.value = index;
};
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

/* Responsive styles */
:deep(.p-datatable.p-datatable-sm .p-datatable-thead > tr > th) {
  padding: 0.5rem 0.5rem;
}

:deep(.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.5rem;
}

:deep(.p-datatable.p-datatable-responsive-stack tbody tr) {
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 0.5rem;
}

:deep(.p-datatable.p-datatable-responsive-stack tbody td .p-column-title) {
  font-weight: 600;
  margin-right: 0.5rem;
}

:deep(.p-datatable.p-datatable-responsive-stack .p-datatable-tbody > tr > td) {
  text-align: left;
  display: block;
  width: 100%;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-datatable.p-datatable-responsive-stack .p-datatable-tbody > tr > td:last-child) {
  border-bottom: none;
}

@media (max-width: 640px) {
  :deep(.p-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }
  
  :deep(.p-button) {
    padding: 0.5rem 0.75rem;
  }
  
  :deep(.p-button .p-button-label) {
    font-size: 0.875rem;
  }
}

@media (min-width: 768px) {
  :deep(.p-dropdown) {
    min-width: 16rem;
  }
}
</style> 