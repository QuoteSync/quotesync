<template>
  <div class="tag-review-panel bg-white dark:bg-gray-800 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium">AI Tag Suggestions</h3>
      <div class="flex gap-2">
        <Button 
          icon="pi pi-refresh" 
          class="p-button-rounded p-button-outlined p-button-sm" 
          @click="generateTags"
          :loading="loading"
          :disabled="loading || !quote"
        />
        <Button
          icon="pi pi-times"
          class="p-button-rounded p-button-text p-button-sm"
          @click="$emit('close')"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center p-4">
      <ProgressSpinner style="width: 50px; height: 50px" />
    </div>
    
    <div v-else-if="error" class="text-red-500 p-2 text-center">
      {{ error }}
    </div>
    
    <div v-else>
      <!-- AI Tags Section -->
      <div class="mb-4">
        <p class="text-sm text-gray-500 mb-2">AI suggested tags for this quote:</p>
        <div class="flex flex-wrap gap-2">
          <div 
            v-for="(tag, idx) in suggestedTags" 
            :key="idx"
            class="flex items-center px-3 py-1 rounded-full text-white text-xs shadow-sm"
            :style="{ background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' }"
          >
            {{ tag.title }}
            <div class="ml-2 flex items-center">
              <Button 
                icon="pi pi-check" 
                class="p-button-rounded p-button-success p-button-text p-button-sm" 
                @click="acceptTag(tag)"
              />
              <Button 
                icon="pi pi-times" 
                class="p-button-rounded p-button-danger p-button-text p-button-sm" 
                @click="rejectTag(tag)"
              />
            </div>
          </div>
        </div>
        <div v-if="suggestedTags.length === 0 && !loading" class="text-sm text-gray-500 italic mt-2">
          No suggested tags. Click the refresh button to generate tags.
        </div>
      </div>

      <!-- Related Quotes Section -->
      <div v-if="relatedQuotes.length > 0" class="mt-6">
        <p class="text-sm text-gray-500 mb-2">Related quotes:</p>
        <div class="max-h-80 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-lg">
          <div 
            v-for="(item, idx) in relatedQuotes" 
            :key="idx"
            class="p-3 border-b border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 cursor-pointer"
            @click="viewQuote(item.quote)"
          >
            <p class="text-sm italic mb-1">"{{ item.quote.body }}"</p>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">
                {{ item.quote.book?.title || 'Unknown book' }} - 
                {{ item.quote.book?.author?.name || 'Unknown author' }}
              </span>
              <span class="text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                {{ Math.round(item.similarity_score * 100) }}% match
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { QuoteSyncChatService } from '@/service/QuoteSyncChatService';

const props = defineProps({
  quote: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-quote', 'close', 'view-quote']);

// State management
const toast = useToast();
const loading = ref(false);
const error = ref(null);
const suggestedTags = ref([]);
const relatedQuotes = ref([]);

// Computed properties
const hasQuoteChanged = computed(() => {
  return props.quote && props.quote.id;
});

// Watch for quote changes
watch(() => props.quote?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadData();
  }
});

// Methods
const loadData = async () => {
  if (!props.quote || !props.quote.id) return;
  
  // Reset state
  suggestedTags.value = [];
  relatedQuotes.value = [];
  error.value = null;
  
  try {
    loading.value = true;
    
    // Find related quotes
    const relatedResponse = await QuoteSyncChatService.findRelatedQuotes(props.quote.id);
    relatedQuotes.value = relatedResponse.related_quotes;
    
    // Generate suggested tags if there are none
    if (suggestedTags.value.length === 0) {
      await generateTags();
    }
  } catch (err) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load data. Please try again.';
  } finally {
    loading.value = false;
  }
};

const generateTags = async () => {
  if (!props.quote || !props.quote.id) return;
  
  try {
    loading.value = true;
    error.value = null;
    
    const response = await QuoteSyncChatService.generateTags(props.quote.id);
    
    // Filter out tags that are already applied to the quote
    const existingTagIds = props.quote.tags.map(tag => tag.id);
    suggestedTags.value = response.tags.filter(
      tag => !existingTagIds.includes(tag.id)
    );
    
    if (suggestedTags.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No new tags',
        detail: 'All suggested tags are already applied to this quote.',
        life: 3000
      });
    }
  } catch (err) {
    console.error('Error generating tags:', err);
    error.value = 'Failed to generate tags. Please try again.';
  } finally {
    loading.value = false;
  }
};

const acceptTag = async (tag) => {
  try {
    // Add the tag to the quote
    // This would typically call your API to add the tag
    emit('update-quote', {
      quoteId: props.quote.id,
      tag: tag
    });
    
    // Remove the tag from suggestions
    suggestedTags.value = suggestedTags.value.filter(t => t.id !== tag.id);
    
    toast.add({
      severity: 'success',
      summary: 'Tag Added',
      detail: `"${tag.title}" has been added to the quote.`,
      life: 3000
    });
  } catch (err) {
    console.error('Error accepting tag:', err);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add tag. Please try again.',
      life: 3000
    });
  }
};

const rejectTag = (tag) => {
  // Simply remove the tag from suggestions
  suggestedTags.value = suggestedTags.value.filter(t => t.id !== tag.id);
  
  toast.add({
    severity: 'info',
    summary: 'Tag Rejected',
    detail: `"${tag.title}" tag was rejected.`,
    life: 3000
  });
};

const viewQuote = (quote) => {
  emit('view-quote', quote);
};

// Initialize
onMounted(() => {
  if (props.quote && props.quote.id) {
    loadData();
  }
});
</script>

<style scoped>
.tag-review-panel {
  max-width: 100%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.p-button-sm) {
  width: 2rem;
  height: 2rem;
  font-size: 0.75rem;
}

:deep(.p-button-sm .p-button-icon) {
  font-size: 0.875rem;
}
</style> 