<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { QuoteListService } from '@/service/QuoteListService';
import { QuoteService } from '@/service/QuoteService';
import { EventBus } from '@/service/EventBusService';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import ProgressSpinner from 'primevue/progressspinner';
import Divider from 'primevue/divider';

const router = useRouter();
const toast = useToast();
const quoteLists = ref([]);
const sharedLists = ref([]);
const loading = ref(true);
const loadingShared = ref(true);
const showCreateDialog = ref(false);
const newListTitle = ref('');
const newListDescription = ref('');
const hoverList = ref(null);
const favouritesList = ref(null);

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
    loading.value = true;
    const lists = await QuoteListService.getQuoteLists();
    
    // Filter for personal lists and update state immediately
    quoteLists.value = lists.filter(list => list.owner.id === lists[0]?.owner.id);
    
    // Check for Favourites list in the background
    ensureFavouritesListExists();
    
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

const loadSharedLists = async () => {
  try {
    const lists = await QuoteListService.getSharedLists();
    sharedLists.value = lists;
  } catch (error) {
    console.error('Error loading shared lists:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load shared lists',
      life: 3000
    });
  } finally {
    loadingShared.value = false;
  }
};

// Function to ensure Favourites list exists
const ensureFavouritesListExists = async () => {
  try {
    // Check if Favourites list already exists
    const existingFavourites = quoteLists.value.find(list => list.title === 'Favourites');
    
    if (existingFavourites) {
      favouritesList.value = existingFavourites;
      return; // Exit early if list exists
    }

    // Create Favourites list if it doesn't exist
    const newList = await QuoteListService.createQuoteList({
      title: 'Favourites',
      description: 'All your favorite quotes in one place'
    });
    
    quoteLists.value.push(newList);
    favouritesList.value = newList;
    
  } catch (error) {
    console.error('Error ensuring Favourites list:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create Favourites list',
      life: 3000
    });
  }
};

// Handle quote favorite status changes
const handleFavoriteChange = async (data) => {
  try {
    // Only update the favorite status in the backend
    await QuoteService.toggleFavorite(data.quoteId);
  } catch (error) {
    console.error('Error handling favorite change:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update favorites',
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

// Setup event listeners
let unsubscribeFavoriteChange;

onMounted(() => {
  loadQuoteLists();
  loadSharedLists();
  
  // Subscribe to favorite change events
  unsubscribeFavoriteChange = EventBus.on('quote:favoriteChanged', handleFavoriteChange);
});

onUnmounted(() => {
  // Clean up event subscription
  if (unsubscribeFavoriteChange) {
    unsubscribeFavoriteChange();
  }
});
</script>

<template>
  <div class="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-900 rounded-3xl">
    <!-- Header Section -->
    <div class="sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 rounded-t-3xl">
      <div class="container mx-auto px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 class="text-4xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent rounded text-center sm:text-left">
            Quote Lists
          </h1>
          <div class="flex gap-3 justify-center sm:justify-end mt-4 sm:mt-0">
            <Button
              icon="pi pi-plus"
              label="New List"
              class="p-button-rounded"
              @click="showCreateDialog = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div v-for="n in 4" :key="n" class="animate-pulse">
          <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden">
            <div class="aspect-[21/9] bg-surface-200 dark:bg-surface-700"></div>
            <div class="p-3 space-y-3">
              <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
              <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-12">
        <!-- My Lists Section -->
        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <i class="pi pi-list text-2xl text-primary-500"></i>
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">My Lists</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div v-for="list in quoteLists" :key="list.id" 
              class="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              @click="router.push({ name: 'quoteListDetail', params: { id: list.id } })"
            >
              <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800">
                <!-- List Cover -->
                <div class="relative aspect-[21/9] overflow-hidden">
                  <!-- List Cover Background -->
                  <div 
                    class="absolute inset-0 flex items-center justify-center overflow-hidden"
                    :style="{ background: list.title === 'Favourites' 
                              ? 'linear-gradient(135deg, #FF5E62, #FF9966)'
                              : `linear-gradient(135deg, ${getListGradient(list.id).primary}, ${getListGradient(list.id).secondary})` }"
                  >
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 relative">
                      <!-- Light reflection effect -->
                      <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
                      
                      <!-- List name -->
                      <div class="relative z-10 text-center w-full px-4">
                        <span class="text-white font-bold text-2xl fancy-font whitespace-normal break-words">{{ list.title }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Simple hover overlay -->
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <!-- List Info -->
                <div class="p-3 flex-1 flex flex-col">
                  <!-- Stats -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                      <i class="pi pi-comment text-primary-500"></i>
                      <span class="text-sm font-medium">{{ list.quotes?.length || 0 }}</span>
                    </div>
                    <Button
                      :icon="list.title === 'Favourites' ? 'pi pi-heart-fill' : 'pi pi-heart'"
                      rounded
                      :severity="list.title === 'Favourites' ? 'danger' : 'secondary'"
                      @click.stop="handleFavoriteChange({ isFavorite: list.title === 'Favourites', quoteId: list.id })"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Shared Lists Section -->
        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <i class="pi pi-share-alt text-2xl text-primary-500"></i>
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Shared With Me</h2>
          </div>

          <div v-if="loadingShared" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div v-for="n in 4" :key="n" class="animate-pulse">
              <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden">
                <div class="aspect-[21/9] bg-surface-200 dark:bg-surface-700"></div>
                <div class="p-6 space-y-4">
                  <div class="h-6 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
                  <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="sharedLists.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <div v-for="list in sharedLists" :key="list.id" 
              class="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              @click="router.push({ name: 'quoteListDetail', params: { id: list.id } })"
            >
              <div class="bg-surface-0 dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col border-2 border-primary-200 dark:border-primary-800">
                <!-- List Cover -->
                <div class="relative aspect-[21/9] overflow-hidden">
                  <!-- List Cover Background -->
                  <div 
                    class="absolute inset-0 flex items-center justify-center overflow-hidden"
                    :style="{ background: `linear-gradient(135deg, ${getListGradient(list.id).primary}, ${getListGradient(list.id).secondary})` }"
                  >
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 relative">
                      <!-- Light reflection effect -->
                      <div class="absolute top-0 right-0 w-20 h-[130%] bg-white opacity-10" style="transform: rotate(30deg) translateX(-10px) translateY(-10px);"></div>
                      
                      <!-- List name -->
                      <div class="relative z-10 text-center w-full px-4">
                        <span class="text-white font-bold text-2xl fancy-font whitespace-normal break-words">{{ list.title }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Share badge -->
                  <div class="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30">
                    <i class="pi pi-share-alt text-white"></i>
                  </div>

                  <!-- Simple hover overlay -->
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <!-- List Info -->
                <div class="p-3 flex-1 flex flex-col">
                  <!-- Stats -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                      <i class="pi pi-comment text-primary-500"></i>
                      <span class="text-sm font-medium">{{ list.quotes?.length || 0 }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                      <i class="pi pi-user"></i>
                      <span>{{ list.owner.username }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state for shared lists -->
          <div v-else class="text-center py-12 bg-surface-0 dark:bg-surface-800 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-700">
            <i class="pi pi-share-alt text-4xl text-primary-500 mb-4"></i>
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">No Shared Lists</h3>
            <p class="text-surface-600 dark:text-surface-400">No lists have been shared with you yet</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create List Modal -->
    <Dialog
      v-model:visible="showCreateDialog"
      modal
      header="Create New List"
      :style="{ width: '50vw' }"
      :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    >
      <div class="p-4">
        <div class="field">
          <label for="listName" class="block text-900 font-medium mb-2">List Name</label>
          <InputText
            id="listName"
            v-model="newListTitle"
            class="w-full"
            placeholder="Enter list name"
          />
        </div>
        
        <div class="field">
          <label for="listDescription" class="block text-900 font-medium mb-2">Description</label>
          <Textarea
            id="listDescription"
            v-model="newListDescription"
            class="w-full"
            rows="3"
            placeholder="Enter list description (optional)"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-text"
            @click="showCreateDialog = false"
          />
          <Button
            label="Create"
            icon="pi pi-check"
            class="p-button-primary"
            @click="createNewList"
          />
        </div>
      </template>
    </Dialog>
  </div>
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

/* View transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--surface-300);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--surface-400);
}

.dark ::-webkit-scrollbar-thumb {
  background: var(--surface-600);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: var(--surface-500);
}

/* Line clamp utilities */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 