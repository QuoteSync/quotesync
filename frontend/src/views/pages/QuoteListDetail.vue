<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { QuoteListService } from '@/service/QuoteListService';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import QuoteCard from '@/components/QuoteCard.vue';

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

const loadQuoteList = async () => {
  try {
    const list = await QuoteListService.getQuoteList(route.params.id);
    quoteList.value = list;
    editedTitle.value = list.title;
    editedDescription.value = list.description || '';
  } catch (error) {
    console.error('Error loading quote list:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load quote list',
      life: 3000
    });
  } finally {
    loading.value = false;
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

onMounted(() => {
  loadQuoteList();
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
            <QuoteCard
              v-for="quote in quoteList.quotes"
              :key="quote.id"
              :quote="quote"
              :showActions="true"
              @remove-quote="handleRemoveQuote"
            />
          </div>
          <div v-else class="text-center text-gray-500">
            <p>No quotes in this list.</p>
          </div>
        </div>
      </div>
    </div>

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