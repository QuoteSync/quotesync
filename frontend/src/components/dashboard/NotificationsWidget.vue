<script setup>
import { onMounted, ref } from 'vue';
import { QuoteListService } from '@/service/QuoteListService';
import { useRouter } from 'vue-router';

const router = useRouter();
const quoteLists = ref([]);
const loading = ref(true);
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

const navigateToList = (listId) => {
  router.push(`/lists/${listId}`);
};

onMounted(async () => {
  try {
    loading.value = true;
    const data = await QuoteListService.getQuoteLists();
    
    // Make sure we have data and it's an array
    if (Array.isArray(data)) {
      quoteLists.value = data.slice(0, 6); // Limit to 6 lists for display
      console.log('Loaded quote lists:', quoteLists.value);
    } else {
      console.error('Quote lists data is not an array:', data);
      quoteLists.value = [];
    }
  } catch (error) {
    console.error('Error fetching quote lists:', error);
    quoteLists.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-content-center p-4">
      <ProgressSpinner class="w-4rem h-4rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
    </div>
    
    <div v-else-if="quoteLists.length > 0" class="grid">
      <div v-for="list in quoteLists" :key="list.id" 
           class="col-12 md:col-6 p-2" 
           @mouseenter="setHoverList(list.id)"
           @mouseleave="clearHoverList()">
        <div class="list-card" 
             :class="{ 'hovered': hoverList === list.id }"
             :style="{
               background: `linear-gradient(135deg, ${getListGradient(list.id).primary}, ${getListGradient(list.id).secondary})`
             }"
             @click="navigateToList(list.id)">
          <div class="list-content">
            <div class="list-icon">
              <i class="pi pi-list text-white text-xl"></i>
            </div>
            <h3 class="list-title">{{ list.title }}</h3>
            <p class="list-description" v-if="list.description">{{ list.description }}</p>
            <p class="list-description" v-else>A collection of your favorite quotes</p>
            
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
    
    <div v-else class="empty-state">
      <i class="pi pi-list text-4xl text-primary mb-3"></i>
      <span class="text-xl font-medium">No Quote Lists</span>
      <p class="text-color-secondary">Create a list to organize your quotes</p>
      <Button 
        label="Create List" 
        icon="pi pi-plus" 
        class="p-button-rounded mt-3"
        @click="router.push('/lists')"
      />
    </div>
  </div>
</template>

<style scoped>
.list-card {
  border-radius: 24px;
  padding: 1.5rem;
  color: white;
  height: 100%;
  min-height: 200px;
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
  padding: 3rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 16px;
  border: 1px dashed var(--surface-border);
}
</style>
