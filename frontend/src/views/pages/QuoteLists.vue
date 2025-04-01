<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { QuoteListService } from '@/service/QuoteListService';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

const router = useRouter();
const toast = useToast();
const quoteLists = ref([]);
const loading = ref(true);
const showCreateDialog = ref(false);
const newListTitle = ref('');
const newListDescription = ref('');

const loadQuoteLists = async () => {
  try {
    const lists = await QuoteListService.getQuoteLists();
    quoteLists.value = lists;
  } catch (error) {
    console.error('Error loading quote lists:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load quote lists',
      life: 3000
    });
  } finally {
    loading.value = false;
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
    showCreateDialog.value = false;
    newListTitle.value = '';
    newListDescription.value = '';
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'List created successfully',
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

onMounted(() => {
  loadQuoteLists();
});
</script>

<template>
  <div class="flex flex-col">
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <div class="font-semibold text-xl">Quote Lists</div>
        <Button
          label="Create New List"
          icon="pi pi-plus"
          @click="showCreateDialog = true"
        />
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="grid grid-cols-12 gap-4">
        <div
          v-for="n in 6"
          :key="n"
          class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
        >
          <div class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg animate-pulse">
            <div class="h-40 bg-gray-300 rounded-lg mb-4"></div>
            <div class="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Quote Lists Grid -->
      <div v-else class="grid grid-cols-12 gap-4">
        <div
          v-for="list in quoteLists"
          :key="list.id"
          class="col-span-12 sm:col-span-6 lg:col-span-4 p-2"
        >
          <div
            class="p-6 h-full border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
            @click="router.push({ name: 'quoteListDetail', params: { id: list.id } })"
          >
            <div class="flex flex-col h-full">
              <!-- List Header -->
              <div class="flex justify-between items-start mb-4">
                <h2 class="text-2xl font-bold fancy-font">{{ list.title }}</h2>
              </div>

              <!-- List Description -->
              <p class="text-sm text-gray-600 mb-4">{{ list.description || 'No description' }}</p>

              <!-- Quote Count -->
              <div class="mt-auto">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-comment text-primary-500"></i>
                    <span class="text-sm text-gray-600">{{ list.quotes?.length || 0 }} quotes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="!loading && quoteLists.length === 0"
        class="text-center py-12"
      >
        <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-600">No quote lists yet</p>
      </div>
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
  </div>
</template>

<style scoped>
/* Add smooth transition for the scale effect */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Ensure the hover effect is smooth */
.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style> 