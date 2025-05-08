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
    const lists = await QuoteListService.getQuoteLists();
    quoteLists.value = lists.filter(list => list.owner.id === lists[0]?.owner.id); // Filter for personal lists
    
    // Check if Favourites list exists, create if not
    await ensureFavouritesListExists();
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

// Function to ensure Favourites list exists and contains all favorited quotes
const ensureFavouritesListExists = async () => {
  try {
    // Check if Favourites list already exists
    const existingFavourites = quoteLists.value.find(list => list.title === 'Favourites');
    
    if (existingFavourites) {
      favouritesList.value = existingFavourites;
    } else {
      // Create Favourites list if it doesn't exist
      const newList = await QuoteListService.createQuoteList({
        title: 'Favourites',
        description: 'All your favorite quotes in one place'
      });
      
      quoteLists.value.push(newList);
      favouritesList.value = newList;
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Favourites list created',
        life: 3000
      });
    }
    
    // Get all favorite quotes and add them to Favourites list
    await updateFavouritesList();
    
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

// Add all favorited quotes to the Favourites list
const updateFavouritesList = async () => {
  try {
    if (!favouritesList.value) return;
    
    // Get all quotes
    const allQuotes = await QuoteService.getQuotes();
    
    // Filter favorite quotes
    const favoriteQuotes = allQuotes.filter(quote => quote.is_favorite);
    
    // Add each favorite quote to the Favourites list if not already there
    for (const quote of favoriteQuotes) {
      // Check if quote is already in the list
      const isInList = favouritesList.value.quotes && 
                       favouritesList.value.quotes.some(q => q.id === quote.id);
      
      if (!isInList) {
        await QuoteListService.addQuoteToList(favouritesList.value.id, quote.id);
      }
    }
    
  } catch (error) {
    console.error('Error updating Favourites list:', error);
  }
};

// Handle quote favorite status changes
const handleFavoriteChange = async (data) => {
  // If a quote was favorited, add it to the Favourites list
  if (data.isFavorite) {
    await addQuoteToFavourites(data.quoteId);
  } else {
    // If a quote was unfavorited, remove it from the Favourites list
    await removeQuoteFromFavourites(data.quoteId);
  }
};

// Add quote to Favourites list
const addQuoteToFavourites = async (quoteId) => {
  try {
    if (!favouritesList.value) {
      await ensureFavouritesListExists();
    }
    
    // Add the quote to the Favourites list
    await QuoteListService.addQuoteToList(favouritesList.value.id, quoteId);
    
    // Update the local state to keep UI in sync
    const quote = await QuoteService.getQuote(quoteId);
    if (favouritesList.value.quotes) {
      const exists = favouritesList.value.quotes.some(q => q.id === quoteId);
      if (!exists) {
        favouritesList.value.quotes.push(quote);
      }
    } else {
      favouritesList.value.quotes = [quote];
    }
  } catch (error) {
    console.error('Error adding quote to Favourites:', error);
  }
};

// Remove quote from Favourites list
const removeQuoteFromFavourites = async (quoteId) => {
  try {
    if (!favouritesList.value) return;
    
    // Remove the quote from the Favourites list
    await QuoteListService.removeQuoteFromList(favouritesList.value.id, quoteId);
    
    // Update the local state to keep UI in sync
    if (favouritesList.value.quotes) {
      favouritesList.value.quotes = favouritesList.value.quotes.filter(q => q.id !== quoteId);
    }
  } catch (error) {
    console.error('Error removing quote from Favourites:', error);
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

      <div class="columns-container">
        <!-- My Lists Column -->
        <div class="lists-column">
          <div class="column-header">
            <div class="font-semibold text-lg">
              <i class="pi pi-list-box text-primary"></i>
              My Quote Lists
            </div>
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
              class="col-12 p-2"
              @mouseenter="setHoverList(list.id)"
              @mouseleave="clearHoverList()"
            >
              <div 
                class="list-card" 
                :class="{ 
                  'hovered': hoverList === list.id,
                  'favorites-list': list.title === 'Favourites' 
                }"
                :style="{
                  background: list.title === 'Favourites' 
                    ? 'linear-gradient(135deg, #FF5E62, #FF9966)'
                    : `linear-gradient(135deg, ${getListGradient(list.id).primary}, ${getListGradient(list.id).secondary})`
                }"
                @click="router.push({ name: 'quoteListDetail', params: { id: list.id } })"
              >
                <div class="list-content">
                  <div class="list-icon">
                    <i :class="list.title === 'Favourites' ? 'pi pi-heart-fill' : 'pi pi-list'" class="text-white text-xl"></i>
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

          <!-- Empty state for my lists -->
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
        
        <!-- Vertical Divider -->
        <div class="column-divider">
          <div class="divider-icon">
            <i class="pi pi-ellipsis-v"></i>
          </div>
        </div>
        
        <!-- Shared Lists Column -->
        <div class="lists-column">
          <div class="column-header">
            <div class="font-semibold text-lg">
              <i class="pi pi-share-alt text-primary"></i>
              Shared With Me
            </div>
          </div>
          
          <!-- Loading state for shared lists -->
          <div v-if="loadingShared" class="flex justify-content-center my-8">
            <ProgressSpinner class="w-4rem h-4rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
          </div>

          <!-- Shared Lists Grid -->
          <div v-else-if="sharedLists.length > 0" class="grid">
            <div
              v-for="list in sharedLists"
              :key="list.id"
              class="col-12 p-2"
              @mouseenter="setHoverList(list.id)"
              @mouseleave="clearHoverList()"
            >
              <div 
                class="list-card shared-list" 
                :class="{ 'hovered': hoverList === list.id }"
                :style="{
                  background: `linear-gradient(135deg, ${getListGradient(list.id).primary}, ${getListGradient(list.id).secondary})`
                }"
                @click="router.push({ name: 'quoteListDetail', params: { id: list.id } })"
              >
                <div class="share-badge">
                  <i class="pi pi-share-alt"></i>
                </div>
                
                <div class="list-content">
                  <div class="list-icon">
                    <i class="pi pi-share-alt text-white text-xl"></i>
                  </div>

                  <div class="shared-by">
                    <i class="pi pi-user mr-1"></i>
                    <span>{{ list.owner.username }}</span>
                  </div>

                  <h3 class="list-title">{{ list.title }}</h3>
                  <p class="list-description">{{ list.description || 'A collection of shared quotes' }}</p>
                  
                  <div class="list-stats">
                    <div class="stats-item">
                      <i class="pi pi-bookmark-fill mr-2"></i>
                      <span>{{ list.quotes?.length || 0 }} quotes</span>
                    </div>
                    <div class="stats-item" v-if="list.visibility">
                      <i class="pi pi-users mr-2"></i>
                      <span>{{ list.group?.name || 'Shared' }}</span>
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

          <!-- Empty state for shared lists -->
          <div
            v-else
            class="empty-state"
          >
            <i class="pi pi-share-alt text-4xl text-primary mb-3"></i>
            <span class="text-xl font-medium">No Shared Lists</span>
            <p class="text-color-secondary">No lists have been shared with you yet</p>
          </div>
        </div>
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
/* Column Layout Styles */
.columns-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.lists-column {
  flex: 1;
  padding: 0 1rem;
  overflow-y: auto;
  max-height: calc(100vh - 220px);
}

.column-divider {
  width: 2px;
  background: linear-gradient(to bottom, transparent, var(--surface-border), var(--surface-border), transparent);
  margin: 0 1.5rem;
  position: relative;
  align-self: stretch;
  min-height: 500px;
}

.divider-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: var(--surface-card);
  border: 2px solid var(--surface-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.divider-icon i {
  color: var(--primary-color);
  font-size: 16px;
}

.column-header {
  position: sticky;
  top: 0;
  background: var(--surface-card);
  padding: 1rem 0;
  margin-bottom: 1.5rem;
  z-index: 10;
  border-bottom: 1px solid var(--surface-border);
}

.column-header .font-semibold {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lists-column:first-child .column-header .font-semibold::before {
  /* Remove content */
}

.lists-column:last-child .column-header .font-semibold::before {
  /* Remove content */
}

/* List Card Styles */
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .columns-container {
    flex-direction: column;
  }
  
  .column-divider {
    width: 90%;
    height: 2px;
    margin: 2rem auto;
    min-height: auto;
    background: linear-gradient(to right, transparent, var(--surface-border), var(--surface-border), transparent);
  }
  
  .divider-icon {
    width: 32px;
    height: 32px;
  }
  
  .lists-column {
    max-height: none;
    padding: 0 0.5rem;
    margin-bottom: 2rem;
  }
  
  .column-header {
    margin-bottom: 1rem;
    padding: 0.75rem 0;
    text-align: center;
  }
  
  .column-header .font-semibold {
    justify-content: center;
  }
}

/* Rest of your existing styles */
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

.favorites-list {
  position: relative;
  box-shadow: 0 8px 20px rgba(255, 94, 98, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.favorites-list::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0 0 0 40px;
  z-index: 1;
}

.favorites-list .list-icon {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

.favorites-list.hovered {
  transform: translateY(-8px);
  box-shadow: 0 12px 28px rgba(255, 94, 98, 0.4);
}

.shared-list {
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;
}

.share-badge {
  position: absolute;
  top: 0;
  right: 16px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  z-index: 5;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.share-badge i {
  color: white;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.shared-by {
  background: rgba(0, 0, 0, 0.2);
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}
</style> 