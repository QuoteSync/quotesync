<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { QuoteService } from '@/service/QuoteService';
import QuoteCard from '@/components/QuoteCard.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import { useRouter } from 'vue-router';
import { getSession } from '@/api';

const toast = useToast();
const sharedQuotes = ref([]);
const sharedLists = ref([]);
const loading = ref(false);
const router = useRouter();

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

onMounted(() => {
  loadSharedItems();
});
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-6">Shared with Me</h1>

    <TabView>
      <!-- Shared Quotes Tab -->
      <TabPanel header="Shared Quotes">
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div v-else-if="sharedQuotes.length === 0" class="text-center text-gray-500 py-8">
          No quotes have been shared with you yet.
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuoteCard
            v-for="quote in sharedQuotes"
            :key="quote.id"
            :quote="quote"
            :liked="quote.is_favorite"
            @toggle-like="toggleLikeQuote"
          />
        </div>
      </TabPanel>

      <!-- Shared Lists Tab -->
      <TabPanel header="Shared Lists">
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div v-else-if="sharedLists.length === 0" class="text-center text-gray-500 py-8">
          No lists have been shared with you yet.
        </div>
        
        <DataTable
          v-else
          :value="sharedLists"
          class="p-datatable-striped"
        >
          <Column field="title" header="List Title"></Column>
          <Column field="description" header="Description">
            <template #body="slotProps">
              {{ slotProps.data.description || 'No description' }}
            </template>
          </Column>
          <Column field="created" header="Created">
            <template #body="slotProps">
              {{ slotProps.data.created ? new Date(slotProps.data.created).toLocaleDateString() : 'N/A' }}
            </template>
          </Column>
          <Column field="owner_name" header="Shared By">
            <template #body="slotProps">
              {{ slotProps.data.owner?.username || 'Unknown' }}
            </template>
          </Column>
          <Column :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
              <router-link
                :to="{ name: 'quoteListDetail', params: { id: slotProps.data.id }}"
                class="p-button p-button-text p-button-sm"
              >
                View List
              </router-link>
            </template>
          </Column>
        </DataTable>
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
.p-tabview-panels {
  padding: 1.5rem 0;
}
</style> 