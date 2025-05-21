<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { QuoteListService } from '@/service/QuoteListService';
import { QuoteGroupService } from '@/service/QuoteGroupService';
import { QuoteService } from '@/service/QuoteService';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import QuoteCard from '@/components/QuoteCard.vue';
import QuoteModal from '@/components/QuoteModal.vue';
import Checkbox from 'primevue/checkbox';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const quoteList = ref(null);
const loading = ref(true);
const showEditDialog = ref(false);
const editedTitle = ref('');
const editedDescription = ref('');
const showDeleteDialog = ref(false);
const quoteToDelete = ref(null);
const showDeleteListDialog = ref(false);
const likedQuotes = ref({});
const savingOrder = ref(false);

// Quote Modal state
const showQuoteModal = ref(false);
const selectedQuote = ref(null);
const selectedQuoteIndex = ref(-1);

// Sharing functionality
const groups = ref([]);
const loadingGroups = ref(false);
const selectedGroups = ref([]);
const showShareDialog = ref(false);

// Add these new reactive states for filters
const selectedTag = ref("");
const showFavorites = ref(false);
const selectedChapter = ref("");

// Predefined gradient pairs for list cards
const gradients = [
  { primary: '#0093E9', secondary: '#80D0C7' },
  { primary: '#8EC5FC', secondary: '#E0C3FC' },
  { primary: '#4158D0', secondary: '#C850C0' },
  { primary: '#85FFBD', secondary: '#FFFB7D' },
  { primary: '#74EBD5', secondary: '#9FACE6' },
  { primary: '#F4D03F', secondary: '#16A085' },
  { primary: '#FF9A8B', secondary: '#FF6A88' },
  { primary: '#FF6CAB', secondary: '#7366FF' },
];

// Generate a consistent gradient for a list based on its ID
const getListGradient = (listId) => {
  if (!listId) return gradients[0]; // Return default gradient if no ID
  // Use the last digit of the list ID to select a gradient
  const index = parseInt(listId.toString().slice(-1)) % gradients.length;
  return gradients[index];
};

const loadQuoteList = async () => {
  try {
    const list = await QuoteListService.getQuoteList(route.params.id);
    quoteList.value = list;
    editedTitle.value = list.title;
    editedDescription.value = list.description || '';
    
    // Initialize liked status for each quote
    if (list.quotes) {
      list.quotes.forEach(quote => {
        likedQuotes.value[quote.id] = quote.is_favorite || false;
      });
    }
  } catch (error) {
    console.error('Error loading quote list:', error);
    
    // Handle 404 Not Found errors
    if (error.response && error.response.status === 404) {
      toast.add({
        severity: 'error',
        summary: 'Not Found',
        detail: 'The quote list you are looking for does not exist or you don\'t have permission to view it',
        life: 5000
      });
      // Redirect to the quote lists page after a delay
      setTimeout(() => {
        router.push({ name: 'quoteLists' });
      }, 2000);
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load quote list',
        life: 3000
      });
    }
  } finally {
    loading.value = false;
  }
};

// Toggle favorite status of a quote
const toggleLikeQuote = async (quoteId) => {
  try {
    const response = await QuoteService.toggleFavorite(quoteId);
    
    // Update the liked status in our local state
    likedQuotes.value[quoteId] = response.is_favorite;
    
    // Also update in the quotes list for UI consistency
    const quote = quoteList.value.quotes.find(q => q.id === quoteId);
    if (quote) {
      quote.is_favorite = response.is_favorite;
    }
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: response.is_favorite ? 'Added to favorites' : 'Removed from favorites',
      life: 2000
    });
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update favorite status',
      life: 3000
    });
  }
};

// Move a quote up in the list (swap with the previous quote)
const moveQuoteUp = async (quoteId) => {
  if (!quoteList.value || !quoteList.value.quotes) return;
  
  const quotes = [...quoteList.value.quotes];
  const index = quotes.findIndex(q => q.id === quoteId);
  
  // If the quote is already at the top, do nothing
  if (index <= 0) return;
  
  // Swap the quote with the one above it
  [quotes[index], quotes[index - 1]] = [quotes[index - 1], quotes[index]];
  
  // Update the list in the UI
  quoteList.value.quotes = quotes;
  
  // Save the new order to the backend
  await saveQuoteOrder();
};

// Move a quote down in the list (swap with the next quote)
const moveQuoteDown = async (quoteId) => {
  if (!quoteList.value || !quoteList.value.quotes) return;
  
  const quotes = [...quoteList.value.quotes];
  const index = quotes.findIndex(q => q.id === quoteId);
  
  // If the quote is already at the bottom, do nothing
  if (index === -1 || index >= quotes.length - 1) return;
  
  // Swap the quote with the one below it
  [quotes[index], quotes[index + 1]] = [quotes[index + 1], quotes[index]];
  
  // Update the list in the UI
  quoteList.value.quotes = quotes;
  
  // Save the new order to the backend
  await saveQuoteOrder();
};

// Save the current quote order to the backend
const saveQuoteOrder = async () => {
  if (!quoteList.value || !quoteList.value.quotes || savingOrder.value) return;
  
  savingOrder.value = true;
  try {
    const quoteIds = quoteList.value.quotes.map(q => q.id);
    await QuoteListService.updateQuoteOrder(quoteList.value.id, quoteIds);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Quote order updated successfully',
      life: 2000
    });
  } catch (error) {
    console.error('Error updating quote order:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update quote order',
      life: 3000
    });
    
    // Reload the list to reset to the server's order
    await loadQuoteList();
  } finally {
    savingOrder.value = false;
  }
};

const updateList = async () => {
  if (!editedTitle.value.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please enter a title for the list',
      life: 3000
    });
    return;
  }

  try {
    const updatedList = await QuoteListService.updateQuoteList(quoteList.value.id, {
      title: editedTitle.value,
      description: editedDescription.value
    });
    
    quoteList.value = updatedList;
    showEditDialog.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'List updated successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error updating list:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update list',
      life: 3000
    });
  }
};

const handleDeleteList = () => {
  showDeleteListDialog.value = true;
};

const confirmDeleteList = async () => {
  try {
    await QuoteListService.deleteQuoteList(quoteList.value.id);
    router.push({ name: 'quoteLists' });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'List deleted successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error deleting list:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete list',
      life: 3000
    });
  } finally {
    showDeleteListDialog.value = false;
  }
};

const handleRemoveQuote = (quoteId) => {
  quoteToDelete.value = quoteId;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!quoteToDelete.value) return;
  
  try {
    await QuoteListService.removeQuoteFromList(quoteList.value.id, quoteToDelete.value);
    quoteList.value.quotes = quoteList.value.quotes.filter(q => q.id !== quoteToDelete.value);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Quote removed from list successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error removing quote from list:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to remove quote from list',
      life: 3000
    });
  } finally {
    showDeleteDialog.value = false;
    quoteToDelete.value = null;
  }
};

const loadGroups = async () => {
  loadingGroups.value = true;
  try {
    const response = await QuoteGroupService.getGroups();
    groups.value = response;
    // Mark groups that already have access to this list
    selectedGroups.value = groups.value
      .filter(group => group.lists?.some(list => list.id === quoteList.value.id))
      .map(group => group.id);
  } catch (error) {
    console.error('Error loading groups:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load groups',
      life: 3000
    });
  } finally {
    loadingGroups.value = false;
  }
};

const toggleGroupShare = async (groupId) => {
  try {
    if (selectedGroups.value.includes(groupId)) {
      // Share with the group
      await QuoteGroupService.updateListVisibility(quoteList.value.id, 'group', groupId);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'List shared with group successfully',
        life: 3000
      });
    } else {
      // Remove from group
      await QuoteGroupService.updateListVisibility(quoteList.value.id, 'private');
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'List removed from group successfully',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error toggling group share:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update list sharing',
      life: 3000
    });
  }
};

// Handle opening the quote modal
const openQuoteModal = (quote, index) => {
  // Check if we should prevent opening a new modal (when the quote's modal is already open)
  if (quote._preventModalOpen) {
    // Just update the selected quote and index without toggling the modal visibility
    selectedQuote.value = quote;
    selectedQuoteIndex.value = index;
    return;
  }

  // Normal flow - open the modal
  selectedQuote.value = quote;
  selectedQuoteIndex.value = index;
  showQuoteModal.value = true;
};

// Handle navigating to the previous quote
const navigateToPreviousQuote = () => {
  if (selectedQuoteIndex.value > 0) {
    selectedQuoteIndex.value -= 1;
    selectedQuote.value = quoteList.value.quotes[selectedQuoteIndex.value];
  }
};

// Handle navigating to the next quote
const navigateToNextQuote = () => {
  if (selectedQuoteIndex.value < quoteList.value.quotes.length - 1) {
    selectedQuoteIndex.value += 1;
    selectedQuote.value = quoteList.value.quotes[selectedQuoteIndex.value];
  }
};

// Handle editing a quote from the modal
const handleEditFromModal = (quote) => {
  // Find the quote and trigger edit
  const quoteInList = quoteList.value.quotes.find(q => q.id === quote.id);
  if (quoteInList) {
    showQuoteModal.value = false;
    // Any additional logic for editing would go here
  }
};

// Add this function after the other modal-related functions
const closeAllModals = () => {
  showQuoteModal.value = false;
  showEditDialog.value = false;
  showDeleteDialog.value = false;
  showDeleteListDialog.value = false;
  showShareDialog.value = false;
};

// Compute all unique tags from quotes
const allTags = computed(() => {
  if (!quoteList.value || !quoteList.value.quotes) return [];

  const tags = [];
  quoteList.value.quotes.forEach((quote) => {
    if (quote.tags) {
      quote.tags.forEach((tag) => {
        if (!tags.includes(tag.title)) {
          tags.push(tag.title);
        }
      });
    }
  });

  return tags.sort();
});

// Compute all unique chapters from quotes
const availableChapters = computed(() => {
  if (!quoteList.value || !quoteList.value.quotes) return [];
  
  const chapters = quoteList.value.quotes
    .map(quote => quote.chapter)
    .filter(chapter => chapter) // Filter out empty/null chapters
    .reduce((unique, chapter) => {
      if (!unique.includes(chapter)) {
        unique.push(chapter);
      }
      return unique;
    }, []);
  
  return chapters.sort(); // Sort alphabetically
});

// Filtered quotes based on selected filters
const filteredQuotes = computed(() => {
  if (!quoteList.value || !quoteList.value.quotes) return [];

  return quoteList.value.quotes.filter((quote) => {
    // Filter by favorites
    if (showFavorites.value && !likedQuotes.value[quote.id]) {
      return false;
    }

    // Filter by tag
    if (selectedTag.value && 
        (!quote.tags || !quote.tags.some((tag) => tag.title === selectedTag.value))) {
      return false;
    }
    
    // Filter by chapter
    if (selectedChapter.value && quote.chapter !== selectedChapter.value) {
      return false;
    }

    return true;
  });
});

onMounted(async () => {
  await loadQuoteList();
  await loadGroups();
});
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- List Info Panel (1/4) -->
    <div class="w-1/4 p-4 md:p-2 flex flex-col items-center sticky top-4">
      <div class="w-full bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden flex flex-col group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in">
        <!-- List Cover -->
        <div class="relative aspect-[21/9] overflow-hidden">
          <!-- List Cover Background -->
          <div 
            class="absolute inset-0 flex items-center justify-center overflow-hidden"
            :style="{ background: quoteList?.title === 'Favourites' 
                      ? 'linear-gradient(135deg, #FF5E62, #FF9966)'
                      : `linear-gradient(135deg, ${getListGradient(quoteList?.id).primary}, ${getListGradient(quoteList?.id).secondary})` }"
          >
            <div class="w-full h-full flex flex-col items-center justify-center p-4 relative">
              <!-- Light reflection effect -->
              <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
              
              <!-- List name -->
              <div class="relative z-10 text-center w-full px-4">
                <span class="text-white font-bold text-2xl fancy-font whitespace-normal break-words">{{ quoteList?.title || 'Loading...' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- List Info -->
        <div class="p-6 flex-1 flex flex-col">
          <p class="text-surface-600 dark:text-surface-400 mb-4">{{ quoteList?.description || 'No description' }}</p>
          
          <!-- Stats and Actions -->
          <div class="mt-auto flex items-center justify-between">
            <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-3 py-1 rounded-full">
              <i class="pi pi-comment text-primary-500"></i>
              <span class="text-sm font-medium">{{ quoteList?.quotes?.length || 0 }} quotes</span>
            </div>
            <div class="flex gap-2">
              <Button
                icon="pi pi-share-alt"
                rounded
                severity="secondary"
                @click="showShareDialog = true"
                v-tooltip.top="'Share List'"
              />
              <Button
                icon="pi pi-pencil"
                rounded
                severity="secondary"
                @click="showEditDialog = true"
                v-tooltip.top="'Edit List'"
              />
              <Button
                icon="pi pi-trash"
                rounded
                severity="danger"
                @click="handleDeleteList"
                v-tooltip.top="'Delete List'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Panel (3/4) -->
    <div class="w-3/4 h-screen overflow-y-auto pl-8 animate-slide-in">
      <div class="max-w-6xl mx-auto p-8 space-y-12">
        <!-- Quotes Section -->
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-3xl transform -rotate-0.25"></div>
          <div class="p-8 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-3xl hover:shadow-xl transition-all duration-300 relative">
            <h2 class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Quotes</h2>

            <!-- Filtros de Citas -->
            <div class="mb-8 flex flex-col md:flex-row items-center justify-center gap-6 bg-surface-50 dark:bg-surface-800 p-6 rounded-2xl shadow-sm">
              <!-- Chapter filter -->
              <div v-if="availableChapters.length > 0" class="filter-item">
                <label class="mr-2 font-semibold text-surface-700 dark:text-surface-200">Chapter:</label>
                <select v-model="selectedChapter" class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
                  <option value="">All Chapters</option>
                  <option v-for="chapter in availableChapters" :key="chapter" :value="chapter">
                    {{ chapter }}
                  </option>
                </select>
              </div>
              
              <!-- Tag filter -->
              <div v-if="allTags.length > 0" class="filter-item">
                <label class="mr-2 font-semibold text-surface-700 dark:text-surface-200">Tag:</label>
                <select v-model="selectedTag" class="border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
                  <option value="">All Tags</option>
                  <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
                </select>
              </div>
              
              <!-- Favorites filter -->
              <div class="filter-item flex items-center">
                <label class="mr-2 font-semibold text-surface-700 dark:text-surface-200">Favorites:</label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="showFavorites" 
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-surface-200 dark:bg-surface-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

      <!-- Loading state -->
      <div v-if="loading" class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg animate-pulse">
            <div class="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div class="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
          </div>
        </div>

        <!-- Quotes Grid -->
            <div v-else-if="quoteList" class="mt-10">
              <div v-if="filteredQuotes && filteredQuotes.length" class="flex flex-col gap-6">
                <div v-for="(quote, index) in filteredQuotes" :key="quote.id" class="relative group">
                  <div class="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-2xl transform rotate-2 group-hover:rotate-3 transition-transform duration-300"></div>
              <QuoteCard
                :quote="quote"
                :liked="likedQuotes[quote.id]"
                :showActions="true"
                :has-previous="index > 0"
                    :has-next="index < filteredQuotes.length - 1"
                @toggle-like="toggleLikeQuote"
                @remove-quote="handleRemoveQuote"
                @previous-quote="navigateToPreviousQuote"
                @next-quote="navigateToNextQuote"
                @click="openQuoteModal(quote, index)"
                    class="transform transition-all duration-300 hover:-translate-y-1 relative"
                  />
                  
                  <!-- Display chapter information if present -->
                  <div v-if="quote.chapter" class="text-sm text-gray-600 mt-2 ml-4">
                    <span class="font-medium">Chapter:</span> {{ quote.chapter }}
                  </div>
                  
                  <!-- Display link to Google Books if present -->
                  <div v-if="quote.book_url" class="text-sm text-blue-600 mt-1 ml-4">
                    <a :href="quote.book_url" target="_blank" class="flex items-center">
                      <i class="pi pi-external-link mr-1"></i>
                      <span>View in Google Books</span>
                    </a>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-surface-500 p-8">
                <i class="pi pi-quote-right text-4xl mb-4"></i>
                <p class="text-lg">No quotes available with these filters.</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quote Modal -->
    <QuoteModal
      v-if="selectedQuote"
      v-model:visible="showQuoteModal"
      :quote="selectedQuote"
      :liked="selectedQuote ? likedQuotes[selectedQuote.id] : false"
      :has-previous="selectedQuoteIndex > 0"
      :has-next="selectedQuoteIndex < (quoteList?.quotes?.length || 0) - 1"
      @toggle-like="toggleLikeQuote"
      @edit-quote="handleEditFromModal"
      @previous-quote="navigateToPreviousQuote"
      @next-quote="navigateToNextQuote"
      @close="closeAllModals"
    />

    <!-- Share List Dialog -->
    <Dialog
      v-model:visible="showShareDialog"
      header="Share List"
      :style="{ width: '500px' }"
      :modal="true"
    class="fancy-dialog"
    >
      <div class="p-4">
        <div v-if="loadingGroups" class="flex justify-center p-4">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>

        <div v-else-if="groups.length === 0" class="text-center p-4 text-surface-500">
          No groups available to share with
        </div>

        <div v-else class="flex flex-col gap-4">
          <div 
            v-for="group in groups" 
            :key="group.id"
          class="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-200"
          >
            <div>
              <h3 class="font-medium">{{ group.name }}</h3>
              <p class="text-sm text-surface-600 dark:text-surface-400">{{ group.description || 'No description' }}</p>
            </div>
            <Checkbox
              :modelValue="selectedGroups.includes(group.id)"
              @update:modelValue="(checked) => {
                if (checked) {
                  selectedGroups.push(group.id);
                } else {
                  selectedGroups = selectedGroups.filter(id => id !== group.id);
                }
                toggleGroupShare(group.id);
              }"
              :binary="true"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Edit List Dialog -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Edit List"
      :style="{ width: '400px' }"
      :modal="true"
    class="fancy-dialog"
    >
      <div class="p-4">
        <div class="mb-4">
        <label for="listTitle" class="block mb-2 fancy-label">Title</label>
          <InputText
            id="listTitle"
            v-model="editedTitle"
          class="w-full fancy-input"
            placeholder="Enter list title"
          />
        </div>
        
        <div class="mb-4">
        <label for="listDescription" class="block mb-2 fancy-label">Description</label>
          <Textarea
            id="listDescription"
            v-model="editedDescription"
          class="w-full fancy-textarea"
            rows="3"
            placeholder="Enter list description (optional)"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
          class="p-button-text fancy-cancel-button"
            @click="showEditDialog = false"
          />
          <Button
            label="Save"
          class="fancy-create-button"
            @click="updateList"
          />
        </div>
      </div>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Remove Quote"
      :style="{ width: '400px' }"
      :modal="true"
    class="fancy-dialog"
    >
      <div class="p-4">
        <p class="mb-4">Are you sure you want to remove this quote from the list?</p>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
          class="p-button-text fancy-cancel-button"
            @click="showDeleteDialog = false"
          />
          <Button
            label="Remove"
            severity="danger"
          class="fancy-delete-button"
            @click="confirmDelete"
          />
        </div>
      </div>
    </Dialog>

    <!-- Delete List Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteListDialog"
      header="Delete List"
      :style="{ width: '400px' }"
      :modal="true"
    class="fancy-dialog"
    >
      <div class="p-4">
        <p class="mb-4">Are you sure you want to delete this list? This action cannot be undone.</p>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
          class="p-button-text fancy-cancel-button"
            @click="showDeleteListDialog = false"
          />
          <Button
            label="Delete"
            severity="danger"
          class="fancy-delete-button"
            @click="confirmDeleteList"
          />
        </div>
      </div>
    </Dialog>
</template>

<style scoped>
/* Add these new styles */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Add transition for the content panel */
.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Layout styles */
.h-screen {
  height: 100vh;
  max-height: 100vh;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}

/* Custom scrollbar for the content panel */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--surface-300);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--surface-400);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--surface-600);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--surface-500);
}

/* Quote item styles */
.quote-item {
  position: relative;
  transition: all 0.3s ease;
}

.reorder-buttons {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.quote-item:hover .reorder-buttons {
  opacity: 1;
}

/* Dialog styles */
:deep(.fancy-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.fancy-dialog .p-dialog-header) {
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
  border-bottom: 1px solid var(--surface-border);
}

:deep(.fancy-dialog .p-dialog-content) {
  background: var(--surface-card);
}

/* Input styles */
:deep(.fancy-input),
:deep(.fancy-textarea) {
  border-radius: 12px;
  border: 2px solid var(--surface-border);
  transition: all 0.3s ease;
  background: var(--surface-ground);
}

:deep(.fancy-input:hover),
:deep(.fancy-textarea:hover) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px rgba(var(--primary-500-rgb), 0.1);
}

:deep(.fancy-input:focus),
:deep(.fancy-textarea:focus) {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(var(--primary-500-rgb), 0.2);
}

/* Label styles */
.fancy-label {
  color: var(--text-color-secondary);
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.fancy-input:focus) + .fancy-label,
:deep(.fancy-textarea:focus) + .fancy-label {
  color: var(--primary-500);
}

/* Button styles */
:deep(.fancy-cancel-button) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.fancy-cancel-button:hover) {
  background: rgba(var(--surface-500-rgb), 0.1);
  transform: translateY(-2px);
}

:deep(.fancy-create-button) {
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
  border: none;
  transition: all 0.3s ease;
}

:deep(.fancy-create-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.3);
}

:deep(.fancy-delete-button) {
  border-radius: 12px;
  background: linear-gradient(135deg, var(--red-500), var(--red-400));
  border: none;
  transition: all 0.3s ease;
}

:deep(.fancy-delete-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--red-500-rgb), 0.3);
}

/* Dark mode adjustments */
:root.dark {
  :deep(.fancy-dialog) {
    background: var(--surface-ground);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  }

  :deep(.fancy-dialog .p-dialog-header) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.15),
      rgba(var(--primary-400-rgb), 0.05)
    );
  }

  :deep(.fancy-input),
  :deep(.fancy-textarea) {
    background: var(--surface-ground);
    border-color: var(--surface-border);
  }

  :deep(.fancy-input:hover),
  :deep(.fancy-textarea:hover) {
    border-color: var(--primary-400);
  }

  :deep(.fancy-input:focus),
  :deep(.fancy-textarea:focus) {
    border-color: var(--primary-400);
    box-shadow: 0 0 0 3px rgba(var(--primary-400-rgb), 0.2);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Add these new styles */
.filter-item {
  @apply mb-2 md:mb-0;
}
</style> 