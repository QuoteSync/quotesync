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
const hoverList = ref(null);

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
  // Use the last digit of the list ID to select a gradient
  const index = parseInt(listId.toString().slice(-1)) % gradients.length;
  return gradients[index];
};

const setHoverList = (listId) => {
  hoverList.value = listId;
};

const clearHoverList = () => {
  hoverList.value = null;
};

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
          class="p-button-rounded"
          @click="showCreateDialog = true"
        />
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-content-center my-8">
        <ProgressSpinner class="w-4rem h-4rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
      </div>

      <!-- Quote Lists Grid -->
      <div v-else-if="quoteLists.length > 0" class="grid">
        <div
          v-for="list in quoteLists"
          :key="list.id"
          class="col-12 sm:col-6 lg:col-4 p-2"
          @mouseenter="setHoverList(list.id)"
          @mouseleave="clearHoverList()"
        >
          <div 
            class="list-card" 
            :class="{ 'hovered': hoverList === list.id }"
            :style="{
              background: `linear-gradient(135deg, ${getListGradient(list.id).primary}, ${getListGradient(list.id).secondary})`
            }"
            @click="router.push({ name: 'quoteListDetail', params: { id: list.id } })"
          >
            <div class="list-content">
              <div class="list-icon">
                <i class="pi pi-list text-white text-xl"></i>
              </div>

              <h3 class="list-title">{{ list.title }}</h3>
              <p class="list-description">{{ list.description || 'A collection of your favorite quotes' }}</p>
              
              <div class="list-stats">
                <div class="stats-item">
                  <i class="pi pi-bookmark-fill mr-2"></i>
                  <span>{{ list.quotes?.length || 0 }} quotes</span>
                </div>
                <div class="stats-item" v-if="list.visibility">
                  <i class="pi pi-eye mr-2"></i>
                  <span>{{ list.visibility }}</span>
                </div>
              </div>
              
              <div class="list-action">
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

      <!-- Empty state -->
      <div
        v-else
        class="empty-state"
      >
        <i class="pi pi-list text-4xl text-primary mb-3"></i>
        <span class="text-xl font-medium">No Quote Lists</span>
        <p class="text-color-secondary">Create a list to organize your quotes</p>
        <Button 
          label="Create List" 
          icon="pi pi-plus" 
          class="p-button-rounded mt-3"
          @click="showCreateDialog = true"
        />
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
.list-card {
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
  transition: all 0.3s ease;
  cursor: pointer;
}

.list-card::before {
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

.list-card.hovered {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.list-card.hovered::before {
  opacity: 1;
}

.list-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-icon {
  background: rgba(255, 255, 255, 0.2);
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease;
}

.list-card.hovered .list-icon {
  transform: scale(1.1);
}

.list-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.list-description {
  font-size: 0.95rem;
  opacity: 0.9;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-stats {
  margin-top: auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.stats-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  opacity: 0.9;
}

.list-action {
  position: absolute;
  right: 0;
  bottom: 0;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
}

.list-card.hovered .list-action {
  opacity: 1;
  transform: translateX(0);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 16px;
  border: 1px dashed var(--surface-border);
}
</style> 