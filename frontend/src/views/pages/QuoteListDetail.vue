<script setup>
import { ref, onMounted } from 'vue';
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

// Sharing functionality
const groups = ref([]);
const loadingGroups = ref(false);
const selectedGroups = ref([]);
const showShareDialog = ref(false);

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

onMounted(async () => {
  await loadQuoteList();
  await loadGroups();
});
</script>

<template>
  <div class="flex flex-col">
    <div class="card">
      <!-- Loading state -->
      <div v-if="loading" class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg animate-pulse">
            <div class="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div class="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      <!-- Quote List Content -->
      <div v-else-if="quoteList" class="flex flex-col">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-3xl font-bold fancy-font mb-2">{{ quoteList.title }}</h1>
            <p class="text-gray-600">{{ quoteList.description || 'No description' }}</p>
          </div>
          <div class="flex gap-2">
            <Button
              label="Share"
              icon="pi pi-share-alt"
              @click="showShareDialog = true"
            />
            <Button
              label="Edit"
              icon="pi pi-pencil"
              @click="showEditDialog = true"
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              class="p-button-danger"
              @click="handleDeleteList"
            />
          </div>
        </div>

        <!-- Quotes Grid -->
        <div class="mt-10">
          <div v-if="quoteList.quotes && quoteList.quotes.length" class="flex flex-col gap-6">
            <div v-for="(quote, index) in quoteList.quotes" :key="quote.id" class="quote-item">
              <div class="flex justify-end mb-2 gap-2 reorder-buttons">
                <Button
                  icon="pi pi-arrow-up"
                  class="p-button-rounded p-button-outlined p-button-sm"
                  :disabled="index === 0 || savingOrder"
                  @click="moveQuoteUp(quote.id)"
                  title="Move Up"
                />
                <Button
                  icon="pi pi-arrow-down"
                  class="p-button-rounded p-button-outlined p-button-sm"
                  :disabled="index === quoteList.quotes.length - 1 || savingOrder"
                  @click="moveQuoteDown(quote.id)"
                  title="Move Down"
                />
              </div>
              <QuoteCard
                :quote="quote"
                :liked="likedQuotes[quote.id]"
                :showActions="true"
                @toggle-like="toggleLikeQuote"
                @remove-quote="handleRemoveQuote"
              />
            </div>
          </div>
          <div v-else class="text-center text-gray-500">
            <p>No quotes in this list.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Share List Dialog -->
    <Dialog
      v-model:visible="showShareDialog"
      header="Share List"
      :style="{ width: '500px' }"
      :modal="true"
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
            class="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded-lg"
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
    >
      <div class="p-4">
        <div class="mb-4">
          <label for="listTitle" class="block mb-2">Title</label>
          <InputText
            id="listTitle"
            v-model="editedTitle"
            class="w-full"
            placeholder="Enter list title"
          />
        </div>
        
        <div class="mb-4">
          <label for="listDescription" class="block mb-2">Description</label>
          <Textarea
            id="listDescription"
            v-model="editedDescription"
            class="w-full"
            rows="3"
            placeholder="Enter list description (optional)"
          />
        </div>
        
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text"
            @click="showEditDialog = false"
          />
          <Button
            label="Save"
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
    >
      <div class="p-4">
        <p class="mb-4">Are you sure you want to remove this quote from the list?</p>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text"
            @click="showDeleteDialog = false"
          />
          <Button
            label="Remove"
            severity="danger"
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
    >
      <div class="p-4">
        <p class="mb-4">Are you sure you want to delete this list? This action cannot be undone.</p>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            class="p-button-text"
            @click="showDeleteListDialog = false"
          />
          <Button
            label="Delete"
            severity="danger"
            @click="confirmDeleteList"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
/* Add styles for the reorder buttons */
.quote-item {
  position: relative;
}

.reorder-buttons {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.quote-item:hover .reorder-buttons {
  opacity: 1;
}

.p-button-sm {
  width: 2rem;
  height: 2rem;
  font-size: 0.75rem;
}
</style> 