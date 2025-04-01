<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { QuoteListService } from '@/service/QuoteListService';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Panel from 'primevue/panel';
import Checkbox from 'primevue/checkbox';
import Menu from 'primevue/menu';

const props = defineProps({
  quoteId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['quote-added-to-list']);

const toast = useToast();
const quoteLists = ref([]);
const showCreateDialog = ref(false);
const newListTitle = ref('');
const newListDescription = ref('');
const selectedList = ref(null);
const showMenu = ref(false);
const addedToListIds = ref(new Set());
const menuRef = ref(null);

let clickOutsideHandler = null;

const loadQuoteLists = async () => {
  try {
    const lists = await QuoteListService.getQuoteLists();
    quoteLists.value = lists;
    // Check which lists already contain this quote
    for (const list of lists) {
      if (list.quotes?.some(quote => quote.id === props.quoteId)) {
        addedToListIds.value.add(list.id);
      }
    }
  } catch (error) {
    console.error('Error loading quote lists:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load quote lists',
      life: 3000
    });
  }
};

const createNewList = async () => {
  if (!newListTitle.value.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please enter a title for the list',
      life: 3000
    });
    return;
  }

  try {
    const newList = await QuoteListService.createQuoteList({
      title: newListTitle.value,
      description: newListDescription.value
    });
    
    quoteLists.value.push(newList);
    
    // Automatically add the quote to the new list
    await addQuoteToList(newList.id);
    
    showCreateDialog.value = false;
    newListTitle.value = '';
    newListDescription.value = '';
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'List created and quote added successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error creating list:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create list',
      life: 3000
    });
  }
};

const addQuoteToList = async (listId) => {
  try {
    await QuoteListService.addQuoteToList(listId, props.quoteId);
    addedToListIds.value.add(listId);
    emit('quote-added-to-list', listId);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Quote added to list successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error adding quote to list:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add quote to list',
      life: 3000
    });
  }
};

const removeQuoteFromList = async (listId) => {
  try {
    await QuoteListService.removeQuoteFromList(listId, props.quoteId);
    addedToListIds.value.delete(listId);
    emit('quote-added-to-list', listId);
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
  }
};

const toggleQuoteInList = async (listId, checked) => {
  if (checked) {
    await addQuoteToList(listId);
  } else {
    await removeQuoteFromList(listId);
  }
};

const toggleMenu = (event) => {
  event.stopPropagation();
  showMenu.value = !showMenu.value;
};

onMounted(() => {
  loadQuoteLists();
  clickOutsideHandler = (event) => {
    // Don't close if clicking on the modal or its children
    if (event.target.closest('.p-dialog') || event.target.closest('.p-dialog-mask')) {
      return;
    }
    
    if (menuRef.value && !menuRef.value.contains(event.target)) {
      showMenu.value = false;
    }
  };
  document.addEventListener('click', clickOutsideHandler);
});

onUnmounted(() => {
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
  }
});
</script>

<template>
  <div class="relative" ref="menuRef">
    <Button
      icon="pi pi-list"
      outlined
      @click="toggleMenu"
      class="p-button-sm"
    />
    
    <Panel
      v-if="showMenu"
      class="absolute right-0 mt-2 w-64 z-50"
      :pt="{
        root: { class: 'border-1' },
        content: { class: 'p-0' },
        header: { class: 'border-bottom-1' },
        headerTitle: { class: 'font-semibold' }
      }"
      header="Save quote in list:"
    >
      <template #icons>
        <Button
          icon="pi pi-times"
          class="p-button-rounded p-button-text p-button-sm"
          @click="showMenu = false"
        />
      </template>

      <!-- Lists -->
      <div class="max-h-48 overflow-y-auto">
        <div
          v-for="list in quoteLists"
          :key="list.id"
          class="flex items-center justify-between p-3 hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer border-bottom-1 last:border-bottom-0"
        >
          <span class="truncate">{{ list.title }}</span>
          <Checkbox
            :modelValue="addedToListIds.has(list.id)"
            @update:modelValue="(checked) => toggleQuoteInList(list.id, checked)"
            :binary="true"
            class="quote-list-checkbox"
          />
        </div>
      </div>
      
      <!-- New List Button -->
      <div class="p-3 border-top-1">
        <Button
          icon="pi pi-plus"
          label="New List"
          class="w-full p-button-text justify-center"
          @click="showCreateDialog = true"
        />
      </div>
    </Panel>
  </div>

  <!-- Create List Dialog -->
  <Dialog
    v-model:visible="showCreateDialog"
    header="Create New List"
    :style="{ width: '400px' }"
    :modal="true"
  >
    <div class="p-4">
      <div class="mb-4">
        <label for="listTitle" class="block mb-2">Title</label>
        <InputText
          id="listTitle"
          v-model="newListTitle"
          class="w-full"
          placeholder="Enter list title"
        />
      </div>
      
      <div class="mb-4">
        <label for="listDescription" class="block mb-2">Description</label>
        <Textarea
          id="listDescription"
          v-model="newListDescription"
          class="w-full"
          rows="3"
          placeholder="Enter list description (optional)"
        />
      </div>
      
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          class="p-button-text"
          @click="showCreateDialog = false"
        />
        <Button
          label="Create"
          @click="createNewList"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.quote-list-menu {
  position: relative;

  :deep(.p-button) {
    border-radius: 50%;
    background: transparent;
    border: none;
    color: var(--text-color);
  }

  :deep(.p-button:hover) {
    background: var(--surface-hover);
  }

  :deep(.p-button-rounded) {
    width: 1.5rem;
    height: 1.5rem;
  }

  :deep(.p-button-rounded .p-button-icon) {
    font-size: 0.875rem;
  }

  :deep(.quote-list-checkbox) {
    width: 1.5rem;
    height: 1.5rem;
  }

  :deep(.quote-list-checkbox .p-checkbox-box) {
    border-radius: 0.375rem;
    border-color: var(--surface-border);
    background: var(--surface-ground);
  }

  :deep(.quote-list-checkbox .p-checkbox-box.p-highlight) {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }

  :deep(.quote-list-checkbox .p-checkbox-box.p-highlight:not(.p-disabled):hover) {
    background: var(--primary-600);
    border-color: var(--primary-600);
  }

  :deep(.quote-list-checkbox .p-checkbox-box:not(.p-disabled):hover) {
    border-color: var(--primary-color);
  }

  :deep(.quote-list-checkbox .p-checkbox-icon) {
    color: var(--primary-color-text);
  }
}
</style> 