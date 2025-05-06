<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { QuoteService } from '@/service/QuoteService';
import QuoteCard from '@/components/QuoteCard.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import { useRouter } from 'vue-router';
import { getSession } from '@/api';
import Badge from 'primevue/badge';
import ProgressSpinner from 'primevue/progressspinner';
import Card from 'primevue/card';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import AvatarGroup from 'primevue/avatargroup';
import Tag from 'primevue/tag';
import Tooltip from 'primevue/tooltip';
import Skeleton from 'primevue/skeleton';
import Divider from 'primevue/divider';

const toast = useToast();
const sharedQuotes = ref([]);
const sharedLists = ref([]);
const loading = ref(false);
const router = useRouter();
const activeTabIndex = ref(0);

const loadSharedItems = async () => {
  loading.value = true;
  try {
    // Check if user is authenticated first
    const session = await getSession();
    if (!session || !session.meta || !session.meta.is_authenticated) {
      toast.add({
        severity: 'error',
        summary: 'Authentication Error',
        detail: 'You must be logged in to view shared items',
        life: 3000
      });
      router.push({ name: 'login' });
      return;
    }
    
    // Load shared quotes from shared lists
    const sharedListsData = await QuoteService.getSharedQuotes();
    sharedLists.value = sharedListsData;
    
    // Extract quotes from shared lists
    const quotesFromLists = [];
    sharedListsData.forEach(list => {
      if (list.quotes && Array.isArray(list.quotes)) {
        quotesFromLists.push(...list.quotes);
      }
    });
    sharedQuotes.value = quotesFromLists;

  } catch (error) {
    console.error('Error loading shared items:', error);
    
    // Check if it's an authentication error
    if (error.response && error.response.status === 401) {
      toast.add({
        severity: 'error',
        summary: 'Authentication Error',
        detail: 'Your session has expired. Please log in again',
        life: 3000
      });
      router.push({ name: 'login' });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load shared items',
        life: 3000
      });
    }
  } finally {
    loading.value = false;
  }
};

const toggleLikeQuote = async (quoteId) => {
  try {
    const response = await QuoteService.toggleFavorite(quoteId);
    const quote = sharedQuotes.value.find(q => q.id === quoteId);
    if (quote) {
      quote.is_favorite = response.is_favorite;
    }
  } catch (error) {
    console.error('Error toggling favorite status:', error);
  }
};

// Computed properties for UI enhancements
const getShareDate = (date) => {
  if (!date) return 'Recently';
  
  const shareDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - shareDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return shareDate.toLocaleDateString();
};

const getRandomAvatarColor = () => {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

onMounted(() => {
  loadSharedItems();
});
</script>

<template>
  <div class="surface-ground px-4 py-5 md:px-6 lg:px-8">
    <!-- Page Header -->
    <div class="card mb-6">
      <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between mb-3">
        <div>
          <span class="block text-6xl font-bold mb-1 text-primary">Shared With Me</span>
          <div class="text-color-secondary font-medium text-xl">Discover content that others have shared with you</div>
        </div>
        <div class="mt-3 md:mt-0">
          <span class="inline-flex align-items-center gap-2 bg-primary-100 dark:bg-primary-400/10 py-2 px-3 font-medium text-primary rounded-lg">
            <i class="pi pi-users"></i>
            <span>Collaborative Space</span>
          </span>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-3 mt-3">
        <div class="flex align-items-center py-2 px-3 surface-card rounded-lg border-1 border-primary-200 dark:border-primary-900">
          <i class="pi pi-bookmark text-primary mr-2"></i>
          <span class="font-medium mr-3">{{ sharedQuotes.length }}</span>
          <span class="text-color-secondary">Quotes</span>
        </div>
        
        <div class="flex align-items-center py-2 px-3 surface-card rounded-lg border-1 border-primary-200 dark:border-primary-900">
          <i class="pi pi-users text-primary mr-2"></i>
          <span class="font-medium mr-3">{{ new Set(sharedQuotes.map(q => q.author?.id).filter(Boolean)).size }}</span>
          <span class="text-color-secondary">Authors</span>
        </div>
        
        <div class="flex align-items-center py-2 px-3 surface-card rounded-lg border-1 border-primary-200 dark:border-primary-900">
          <i class="pi pi-book text-primary mr-2"></i>
          <span class="font-medium mr-3">{{ new Set(sharedQuotes.map(q => q.book?.id).filter(Boolean)).size }}</span>
          <span class="text-color-secondary">Books</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="activeTabIndex" class="shared-items-tabs">
      <!-- Shared Quotes Tab -->
      <TabPanel header="Shared Quotes">
        <div v-if="loading" class="flex justify-content-center my-8">
          <ProgressSpinner strokeWidth="3" animationDuration=".8s" />
        </div>
        
        <div v-else-if="sharedQuotes.length === 0" class="card flex flex-column align-items-center justify-content-center py-8 px-5">
          <i class="pi pi-inbox text-6xl text-primary opacity-30 mb-4"></i>
          <h3 class="text-2xl font-semibold mb-2">No shared quotes yet</h3>
          <p class="text-color-secondary mb-5 text-center max-w-30rem">
            When someone shares quotes with you, they'll appear here. 
            Join a group or connect with friends to start seeing shared content.
          </p>
          <Button 
            label="Browse Quote Groups" 
            icon="pi pi-users" 
            class="p-button-rounded"
            @click="router.push('/groups')"
          />
        </div>
        
        <div v-else class="grid">
          <div v-for="(quote, index) in sharedQuotes" :key="quote.id" class="col-12 md:col-6 lg:col-4 shared-quote-item">
            <div class="card h-full flex flex-column relative shared-quote-card animate-item" :style="{ '--delay': `${index * 0.05}s` }">
              <!-- Shared By Badge -->
              <div class="shared-by-badge">
                <AvatarGroup>
                  <Avatar v-tooltip.top="quote.shared_by?.username || 'Someone'"
                    :style="{ backgroundColor: getRandomAvatarColor() }" 
                    :label="getInitials(quote.shared_by?.username)" 
                    shape="circle" 
                    size="small" />
                </AvatarGroup>
                <span class="shared-time ml-2">{{ getShareDate(quote.shared_at) }}</span>
              </div>
              
              <QuoteCard
                :quote="quote"
                :liked="quote.is_favorite"
                @toggle-like="toggleLikeQuote"
                class="flex-1"
              />
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- Shared Lists Tab -->
      <TabPanel header="Shared Lists">
        <div v-if="loading" class="flex justify-content-center my-8">
          <ProgressSpinner strokeWidth="3" animationDuration=".8s" />
        </div>
        
        <div v-else-if="sharedLists.length === 0" class="card flex flex-column align-items-center justify-content-center py-8 px-5">
          <i class="pi pi-list text-6xl text-primary opacity-30 mb-4"></i>
          <h3 class="text-2xl font-semibold mb-2">No shared lists yet</h3>
          <p class="text-color-secondary mb-5 text-center max-w-30rem">
            Lists help organize quotes by theme or topic. When someone shares a list with you, 
            it'll appear here for easy access and collaboration.
          </p>
          <Button 
            label="Create Your Own List" 
            icon="pi pi-plus" 
            class="p-button-rounded"
            @click="router.push('/lists/new')"
          />
        </div>
        
        <div v-else class="grid">
          <div v-for="(list, index) in sharedLists" :key="list.id" class="col-12 md:col-6 lg:col-4 shared-list-item">
            <div class="card h-full flex flex-column animate-item" :style="{ '--delay': `${index * 0.05}s` }">
              <div class="flex-1">
                <!-- Header with gradient background -->
                <div class="list-header relative mb-3">
                  <div class="list-header-content p-3 flex justify-content-between align-items-center">
                    <Badge :value="list.quotes?.length || 0" severity="info" class="badge-count" />
                    <span class="shared-info px-2 py-1 text-white text-xs rounded-lg">
                      <i class="pi pi-share-alt mr-1"></i>
                      Shared {{ getShareDate(list.shared_at) }}
                    </span>
                  </div>
                </div>
              
                <!-- Content -->
                <div class="p-3">
                  <h3 class="text-xl font-semibold mb-2 text-overflow-ellipsis overflow-hidden white-space-nowrap">{{ list.title }}</h3>
                  <p class="text-color-secondary mb-4 line-clamp-2">{{ list.description || 'No description provided' }}</p>
                  
                  <!-- Tags -->
                  <div class="mb-4" v-if="list.tags && list.tags.length">
                    <Tag v-for="tag in list.tags.slice(0, 3)" 
                         :key="tag.id" 
                         :value="tag.name" 
                         class="mr-1 mb-1" 
                         />
                    <Tag v-if="list.tags.length > 3" 
                         :value="`+${list.tags.length - 3}`" 
                         severity="secondary" 
                         class="mr-1 mb-1" />
                  </div>
                  
                  <!-- Owner info -->
                  <div class="flex align-items-center mt-3">
                    <Avatar 
                      :style="{ backgroundColor: getRandomAvatarColor() }"
                      :label="getInitials(list.owner?.username)"
                      class="mr-2" 
                      size="small" 
                      shape="circle" />
                    <span class="font-medium">{{ list.owner?.username || 'Unknown' }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div class="px-3 py-3 border-top-1 surface-border mt-3">
                <Button 
                  @click="router.push({ name: 'quoteListDetail', params: { id: list.id }})"
                  icon="pi pi-eye" 
                  label="View List" 
                  class="p-button-rounded w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
.shared-items-tabs :deep(.p-tabview-nav) {
  display: flex;
  border-bottom: 1px solid var(--surface-border);
}

.shared-items-tabs :deep(.p-tabview-nav li) {
  margin-right: 1rem;
}

.shared-items-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  padding: 1rem 0;
  font-weight: 600;
  border-radius: 0;
  transition: all 0.2s;
  position: relative;
}

.shared-items-tabs :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
}

.shared-items-tabs :deep(.p-tabview-panels) {
  padding: 1.5rem 0;
}

.shared-quote-item, .shared-list-item {
  margin-bottom: 1.5rem;
}

.shared-quote-card {
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.shared-quote-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--card-shadow);
}

.shared-by-badge {
  position: absolute;
  top: -10px;
  left: 15px;
  z-index: 1;
  display: flex;
  align-items: center;
  background-color: var(--surface-card);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  box-shadow: var(--card-shadow);
}

.shared-time {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.list-header {
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-darker-color, #3949ab));
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  overflow: hidden;
}

.list-header-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.badge-count {
  margin-top: 5px;
}

.shared-info {
  background-color: rgba(255, 255, 255, 0.2);
  margin-top: 5px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.animate-item {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.5s ease-out forwards;
  animation-delay: var(--delay, 0s);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 