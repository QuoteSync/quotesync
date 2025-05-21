<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { QuoteListService } from '@/service/QuoteListService';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Panel from 'primevue/panel';
import Checkbox from 'primevue/checkbox';
import Menu from 'primevue/menu';
import Tooltip from 'primevue/tooltip';

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
const panelRef = ref(null);

let clickOutsideHandler = null;

const menuStyle = computed(() => {
  if (!menuRef.value) return {};
  
  const rect = menuRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  
  // Determine if we should show above or below the button
  const showAbove = spaceBelow < 300 && spaceAbove > spaceBelow;
  
  return {
    position: 'fixed',
    top: showAbove ? `${rect.top - 8}px` : `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
    width: '18rem',
    zIndex: 99999,
    transform: showAbove ? 'translateY(-100%)' : 'translateY(0)',
    transformOrigin: showAbove ? 'bottom right' : 'top right'
  };
});

const loadQuoteLists = async () => {
  try {
    console.log('Loading quote lists...');
    const lists = await QuoteListService.getQuoteLists();
    console.log('Quote lists loaded:', lists);
    quoteLists.value = lists;
    // Check which lists already contain this quote
    for (const list of lists) {
      if (list.quotes?.some(quote => quote.id === props.quoteId)) {
        console.log(`Quote ${props.quoteId} found in list ${list.id}`);
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
    console.log(`Attempting to add quote ${props.quoteId} to list ${listId}`);
    await QuoteListService.addQuoteToList(listId, props.quoteId);
    console.log(`Successfully added quote ${props.quoteId} to list ${listId}`);
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
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      quoteId: props.quoteId,
      listId: listId
    });
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
  console.log(`Toggling quote ${props.quoteId} in list ${listId}, checked: ${checked}`);
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
    
    // Don't close if clicking inside the panel
    if (panelRef.value && panelRef.value.contains(event.target)) {
      return;
    }
    
    // Don't close if clicking the button that opens the menu
    if (menuRef.value && menuRef.value.contains(event.target)) {
      return;
    }
    
    showMenu.value = false;
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
      class="p-button-sm fancy-list-button fancy-button p-button-rounded p-button-text transition-all duration-300"
      v-tooltip.top="'Save to list'"
    />
    
    <Teleport to="body">
      <Panel
        v-if="showMenu"
        ref="panelRef"
        class="custom-dropdown-menu"
        :style="menuStyle"
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
            class="p-button-rounded p-button-text p-button-sm close-button"
            @click="showMenu = false"
          />
        </template>

        <!-- Lists -->
        <div class="max-h-48 overflow-y-auto fancy-scrollbar">
          <div
            v-for="list in quoteLists"
            :key="list.id"
            class="list-item flex items-center justify-between p-3 hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer border-bottom-1 last:border-bottom-0 transition-all duration-300"
            @click="toggleQuoteInList(list.id, !addedToListIds.has(list.id))"
          >
            <div class="flex items-center gap-3">
              <div class="checkbox-wrapper">
                <Checkbox
                  :modelValue="addedToListIds.has(list.id)"
                  @update:modelValue="(checked) => toggleQuoteInList(list.id, checked)"
                  :binary="true"
                  class="quote-list-checkbox"
                  @click.stop
                />
              </div>
              <span class="truncate list-title">{{ list.title }}</span>
            </div>
          </div>
        </div>
        
        <!-- New List Button -->
        <div class="p-3 border-top-1">
          <Button
            icon="pi pi-plus"
            label="New List"
            class="w-full p-button-text justify-center fancy-new-button"
            @click="showCreateDialog = true"
          />
        </div>
      </Panel>
    </Teleport>
  </div>

  <!-- Create List Dialog -->
  <Dialog
    v-model:visible="showCreateDialog"
    header="Create New List"
    :style="{ width: '400px' }"
    :modal="true"
    class="fancy-dialog"
  >
    <div class="p-4">
      <div class="mb-4">
        <label for="listTitle" class="block mb-2 fancy-label">Title</label>
        <InputText
          id="listTitle"
          v-model="newListTitle"
          class="w-full fancy-input"
          placeholder="Enter list title"
        />
      </div>
      
      <div class="mb-4">
        <label for="listDescription" class="block mb-2 fancy-label">Description</label>
        <Textarea
          id="listDescription"
          v-model="newListDescription"
          class="w-full fancy-textarea"
          rows="3"
          placeholder="Enter list description (optional)"
        />
      </div>
      
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          class="p-button-text fancy-cancel-button"
          @click="showCreateDialog = false"
        />
        <Button
          label="Create"
          class="fancy-create-button"
          @click="createNewList"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.quote-list-menu {
  position: relative;
}

/* Fancy List Button */
:deep(.fancy-list-button) {
  position: relative;
  overflow: hidden;
  border-radius: 50%;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid var(--primary-color);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
}

:deep(.fancy-list-button::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

:deep(.fancy-list-button:hover::before) {
  transform: translateX(100%);
}

:deep(.fancy-list-button::after) {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(45deg, var(--primary-color), var(--primary-400));
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.fancy-list-button:hover::after) {
  opacity: 1;
}

:deep(.fancy-list-button:hover) {
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

:deep(.fancy-list-button:active) {
  transform: translateY(0) scale(0.95);
}

:deep(.fancy-list-button .p-button-icon) {
  font-size: 1.1rem;
  transition: all 0.4s ease;
  position: relative;
  z-index: 1;
  color: var(--primary-500);
}

:deep(.fancy-list-button:hover .p-button-icon) {
  transform: scale(1.2) rotate(5deg);
  color: var(--primary-400);
}

/* Fancy Panel */
:deep(.fancy-panel) {
  position: fixed;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(12px);
  animation: panelAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 99999;
}

:deep(.fancy-panel .p-panel-header) {
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
  border-radius: 16px 16px 0 0;
  padding: 1rem;
}

:deep(.fancy-panel .p-panel-content) {
  background: transparent;
  border-radius: 0 0 16px 16px;
}

/* List Items */
.list-item {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(var(--primary-500-rgb), 0.05);
  padding: 0.75rem 1rem;
}

.list-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(to bottom, var(--primary-500), var(--primary-400));
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.list-item:hover::before {
  transform: scaleY(1);
}

.list-item:hover {
  transform: translateX(4px);
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-400-rgb), 0.05)
  );
}

.list-title {
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  color: var(--text-color);
}

.list-item:hover .list-title {
  color: var(--primary-500);
  transform: translateX(4px);
}

/* Checkbox Styling */
.checkbox-wrapper {
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.quote-list-checkbox) {
  width: 1.25rem;
  height: 1.25rem;
}

:deep(.quote-list-checkbox .p-checkbox-box) {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 4px;
  border: 2px solid var(--surface-border);
  background: var(--surface-ground);
  transition: all 0.3s ease;
}

:deep(.quote-list-checkbox .p-checkbox-box.p-highlight) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.quote-list-checkbox .p-checkbox-box:not(.p-disabled):hover) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

:deep(.quote-list-checkbox .p-checkbox-icon) {
  color: white;
  font-size: 0.875rem;
  font-weight: bold;
}

/* New List Button */
:deep(.fancy-new-button) {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

:deep(.fancy-new-button::before) {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.fancy-new-button:hover::before) {
  opacity: 1;
}

:deep(.fancy-new-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.2);
}

/* Dialog Styling */
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

/* Input Styling */
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

/* Label Styling */
.fancy-label {
  color: var(--text-color-secondary);
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.fancy-input:focus) + .fancy-label,
:deep(.fancy-textarea:focus) + .fancy-label {
  color: var(--primary-500);
}

/* Button Styling */
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

/* Scrollbar Styling */
.fancy-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--primary-500) var(--surface-ground);
}

.fancy-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.fancy-scrollbar::-webkit-scrollbar-track {
  background: var(--surface-ground);
  border-radius: 3px;
}

.fancy-scrollbar::-webkit-scrollbar-thumb {
  background: var(--primary-500);
  border-radius: 3px;
}

.fancy-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--primary-600);
}

/* Animations */
@keyframes panelAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Dark Mode Adjustments */
:root.dark {
  :deep(.fancy-panel) {
    background: var(--surface-ground);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  }

  :deep(.fancy-panel .p-panel-header) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.15),
      rgba(var(--primary-400-rgb), 0.05)
    );
  }

  .list-item:hover {
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

  :deep(.fancy-list-button) {
    background: transparent;
  }

  :deep(.fancy-list-button:hover) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.2),
      rgba(var(--primary-400-rgb), 0.15)
    );
    box-shadow: 0 8px 16px rgba(var(--primary-400-rgb), 0.3);
  }

  :deep(.fancy-list-button .p-button-icon) {
    color: var(--primary-400);
  }

  :deep(.fancy-list-button:hover .p-button-icon) {
    color: var(--primary-300);
  }

  :deep(.quote-list-checkbox .p-checkbox-box) {
    background: var(--surface-ground);
    border-color: var(--surface-border);
  }

  :deep(.quote-list-checkbox .p-checkbox-box.p-highlight) {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }

  :deep(.quote-list-checkbox .p-checkbox-box:not(.p-disabled):hover) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
  }
}

/* Responsive Adjustments */
@media (max-width: 640px) {
  :deep(.fancy-panel) {
    width: calc(100vw - 2rem);
    margin: 0 1rem;
  }

  :deep(.fancy-dialog) {
    width: calc(100vw - 2rem) !important;
  }

  :deep(.fancy-list-button) {
    width: 2.5rem;
    height: 2.5rem;
  }

  :deep(.fancy-list-button .p-button-icon) {
    font-size: 1rem;
  }
}

/* Tooltip Styling */
:deep(.p-tooltip) {
  background: var(--surface-900);
  color: var(--surface-0);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: tooltipFadeIn 0.2s ease-out;
}

:deep(.p-tooltip-arrow) {
  border-top-color: var(--surface-900);
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark mode adjustments for tooltip */
:root.dark {
  :deep(.p-tooltip) {
    background: var(--surface-800);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  :deep(.p-tooltip-arrow) {
    border-top-color: var(--surface-800);
  }
}

/* Custom Dropdown Menu */
:deep(.custom-dropdown-menu) {
  background: rgba(var(--surface-card-rgb), 0.95);
  border: 2px solid var(--primary-color);
  border-radius: 20px;
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(var(--primary-500-rgb), 0.05),
    0 0 32px rgba(var(--primary-500-rgb), 0.1);
  backdrop-filter: blur(12px);
  animation: panelAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  opacity: 0;
  transform: scale(0.95);
  animation: panelAppear 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes panelAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Dark mode adjustments */
:root.dark {
  :deep(.custom-dropdown-menu) {
    background: rgba(var(--surface-ground-rgb), 0.95);
    border: 2px solid var(--primary-color);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(var(--primary-400-rgb), 0.1),
      0 0 32px rgba(var(--primary-400-rgb), 0.15);
  }
}

/* Responsive Adjustments */
@media (max-width: 640px) {
  :deep(.fancy-panel) {
    width: calc(100vw - 2rem);
    margin: 0 1rem;
  }

  :deep(.fancy-dialog) {
    width: calc(100vw - 2rem) !important;
  }

  :deep(.fancy-list-button) {
    width: 2.5rem;
    height: 2.5rem;
  }

  :deep(.fancy-list-button .p-button-icon) {
    font-size: 1rem;
  }
}
</style> 