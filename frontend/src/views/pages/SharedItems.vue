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
  <div class="shared-items-container p-4">
    <div class="header-section mb-8">
      <div class="flex flex-column align-items-center">
        <span class="header-badge">Shared with Me</span>
        <h1 class="text-3xl font-bold mb-2 text-gradient">Collaborative Space</h1>
        <p class="text-gray-500 dark:text-gray-400 text-center max-w-3xl">
          Discover quotes and lists that others have shared with you. Collaborate and engage with your community's content.
        </p>
      </div>
    </div>

    <TabView v-model:activeIndex="activeTabIndex" class="custom-tabs">
      <!-- Shared Quotes Tab -->
      <TabPanel header="Shared Quotes">
        <div class="tab-content-wrapper">
          <div v-if="loading" class="skeleton-container">
            <div v-for="i in 6" :key="i" class="skeleton-quote-card">
              <Skeleton height="200px" width="100%" borderRadius="10px" />
            </div>
          </div>
          
          <div v-else-if="sharedQuotes.length === 0" class="empty-state">
            <div class="empty-state-icon">
              <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600"></i>
            </div>
            <h3 class="text-xl font-semibold mt-4">No shared quotes yet</h3>
            <p class="text-gray-500 mt-2 max-w-lg text-center">
              When someone shares quotes with you, they'll appear here. 
              Join a group or connect with friends to start sharing quotes.
            </p>
            <Button 
              label="Browse Groups" 
              icon="pi pi-users" 
              class="mt-4"
              @click="router.push('/groups')"
            />
          </div>
          
          <div v-else>
            <div class="quote-stats mb-4">
              <div class="stats-item">
                <div class="stats-value">{{ sharedQuotes.length }}</div>
                <div class="stats-label">Quotes</div>
              </div>
              <div class="stats-item">
                <div class="stats-value">{{ new Set(sharedQuotes.map(q => q.author?.id).filter(Boolean)).size }}</div>
                <div class="stats-label">Authors</div>
              </div>
              <div class="stats-item">
                <div class="stats-value">{{ new Set(sharedQuotes.map(q => q.book?.id).filter(Boolean)).size }}</div>
                <div class="stats-label">Books</div>
              </div>
            </div>
            
            <Divider align="center">
              <Tag icon="pi pi-share-alt" value="Shared Quotes" severity="info" />
            </Divider>
            
            <div class="quote-grid">
              <div v-for="(quote, index) in sharedQuotes" :key="quote.id" class="quote-card-container"
                   :style="{ animationDelay: `${index * 0.05}s` }">
                <div class="quote-shared-info">
                  <AvatarGroup>
                    <Avatar v-tooltip.top="quote.shared_by?.username || 'Someone'"
                      :style="{ backgroundColor: getRandomAvatarColor() }" 
                      :label="getInitials(quote.shared_by?.username)" 
                      shape="circle" 
                      size="small" />
                  </AvatarGroup>
                  <span class="shared-time">{{ getShareDate(quote.shared_at) }}</span>
                </div>
                <QuoteCard
                  :quote="quote"
                  :liked="quote.is_favorite"
                  @toggle-like="toggleLikeQuote"
                  class="h-full shared-quote-card"
                />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- Shared Lists Tab -->
      <TabPanel header="Shared Lists">
        <div class="tab-content-wrapper">
          <div v-if="loading" class="skeleton-container">
            <div v-for="i in 4" :key="i" class="skeleton-list-card">
              <Skeleton height="100px" width="100%" borderRadius="10px 10px 0 0" />
              <div class="p-3">
                <Skeleton width="70%" height="24px" class="mb-2" />
                <Skeleton width="90%" height="16px" />
              </div>
            </div>
          </div>
          
          <div v-else-if="sharedLists.length === 0" class="empty-state">
            <div class="empty-state-icon">
              <i class="pi pi-list text-6xl text-gray-300 dark:text-gray-600"></i>
            </div>
            <h3 class="text-xl font-semibold mt-4">No shared lists yet</h3>
            <p class="text-gray-500 mt-2 max-w-lg text-center">
              Lists help organize quotes by theme or topic. When someone shares a list with you, 
              it'll appear here for easy access and collaboration.
            </p>
            <Button 
              label="Create Your Own List" 
              icon="pi pi-plus" 
              class="mt-4"
              @click="router.push('/lists/new')"
            />
          </div>
          
          <div v-else>
            <Divider align="center">
              <Tag icon="pi pi-list" value="Shared Lists" severity="success" />
            </Divider>
            
            <div class="lists-grid">
              <Card v-for="list in sharedLists" :key="list.id" class="list-card">
                <template #header>
                  <div class="list-card-header">
                    <Badge :value="list.quotes?.length || 0" severity="info" class="quote-counter" />
                    <div class="shared-info">
                      <span class="shared-label">
                        <i class="pi pi-share-alt mr-1"></i>
                        Shared {{ getShareDate(list.shared_at) }}
                      </span>
                    </div>
                  </div>
                </template>
                <template #title>
                  <div class="list-title">{{ list.title }}</div>
                </template>
                <template #subtitle>
                  <div class="list-subtitle">{{ list.description || 'No description' }}</div>
                </template>
                <template #content>
                  <div class="list-metadata">
                    <div class="list-tags mb-3" v-if="list.tags && list.tags.length">
                      <Tag v-for="tag in list.tags.slice(0, 3)" 
                           :key="tag.id" 
                           :value="tag.name" 
                           class="mr-1 mb-1" 
                           severity="secondary" />
                      <Tag v-if="list.tags.length > 3" 
                           :value="`+${list.tags.length - 3}`" 
                           severity="secondary" 
                           class="mr-1 mb-1" />
                    </div>
                    <div class="list-date">
                      <i class="pi pi-calendar mr-2"></i>
                      {{ list.created ? new Date(list.created).toLocaleDateString() : 'N/A' }}
                    </div>
                    <div class="list-owner mt-2">
                      <Avatar 
                        :style="{ backgroundColor: getRandomAvatarColor() }"
                        :label="getInitials(list.owner?.username)"
                        class="mr-2" 
                        size="small" 
                        shape="circle" />
                      <span>{{ list.owner?.username || 'Unknown' }}</span>
                    </div>
                  </div>
                </template>
                <template #footer>
                  <div class="list-footer">
                    <Button 
                      @click="router.push({ name: 'quoteListDetail', params: { id: list.id }})"
                      icon="pi pi-eye" 
                      label="View List" 
                      class="p-button p-component p-button-outlined"
                    />
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
.shared-items-container {
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  position: relative;
  padding: 2rem 0;
  background: linear-gradient(to bottom, rgba(99, 102, 241, 0.1), transparent);
  border-radius: 16px;
  margin-bottom: 2rem;
}

.header-badge {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  display: inline-block;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

.text-gradient {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.75rem;
}

.custom-tabs :deep(.p-tabview-nav) {
  display: flex;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.custom-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
  background: transparent;
  border: none;
  color: #6b7280;
  font-weight: 500;
  padding: 1rem 1.5rem;
  transition: all 0.3s ease;
  position: relative;
}

.custom-tabs :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  color: #4f46e5;
}

.custom-tabs :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link::after) {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 3px;
  animation: slideIn 0.3s ease-in-out;
}

.custom-tabs :deep(.p-tabview-panels) {
  padding: 1rem 0;
}

.tab-content-wrapper {
  min-height: 400px;
}

.quote-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.quote-card-container {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  position: relative;
}

.quote-shared-info {
  position: absolute;
  top: -12px;
  left: 10px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 2px 10px;
  border-radius: 50px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.dark .quote-shared-info {
  background: #1f2937;
}

.shared-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.dark .shared-time {
  color: #9ca3af;
}

.shared-quote-card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 12px;
  overflow: hidden;
}

.shared-quote-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.quote-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 2rem;
  padding: 1rem;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
  border-radius: 10px;
}

.stats-item {
  text-align: center;
  padding: 0.5rem 1rem;
}

.stats-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 0.5rem;
}

.stats-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.empty-state-icon {
  background: rgba(99, 102, 241, 0.1);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.list-card {
  animation: fadeInUp 0.5s ease-out forwards;
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.list-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.list-card-header {
  height: 100px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  position: relative;
  border-radius: 6px 6px 0 0;
}

.quote-counter {
  position: absolute;
  right: 10px;
  top: 10px;
}

.shared-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
}

.shared-label {
  display: inline-block;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.list-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.dark .list-title {
  color: #f3f4f6;
}

.list-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-metadata {
  padding: 1rem 0;
  color: #6b7280;
}

.list-footer {
  display: flex;
  justify-content: center;
}

.skeleton-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.skeleton-quote-card, .skeleton-list-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

@keyframes slideIn {
  from {
    width: 0;
    left: 50%;
  }
  to {
    width: 100%;
    left: 0;
  }
}

.dark .empty-state-icon {
  background: rgba(99, 102, 241, 0.05);
}

.dark .list-subtitle {
  color: #9ca3af;
}

.dark .list-metadata {
  color: #9ca3af;
}

.dark .stats-value {
  color: #818cf8;
}

.dark .stats-label {
  color: #9ca3af;
}

@media (max-width: 768px) {
  .quote-grid, .lists-grid, .skeleton-container {
    grid-template-columns: 1fr;
  }
  
  .quote-stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 