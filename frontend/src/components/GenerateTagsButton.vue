<template>
  <div>
    <Button
      v-tooltip.top="'Generate AI Tags'"
      :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-tag'"
      :class="buttonClass"
      :disabled="loading || disabled"
      @click="generateTags"
    />
    
    <!-- Tag Review Panel in Sidebar -->
    <Sidebar v-model:visible="showTagPanel" position="right" :style="{ width: '30rem' }">
      <div class="tag-panel bg-white dark:bg-gray-800 p-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">AI Tag Suggestions</h3>
          <Button
            icon="pi pi-times"
            class="p-button-rounded p-button-text p-button-sm"
            @click="showTagPanel = false"
          />
        </div>
        
        <div v-if="loading" class="flex justify-center p-4">
          <ProgressSpinner style="width: 50px; height: 50px" />
        </div>
        
        <div v-else-if="error" class="text-red-500 p-2 text-center">
          {{ error }}
        </div>
        
        <div v-else>
          <!-- Status Info for Ollama -->
          <div v-if="!ollamaStatus.available && aiService === 'ollama'" class="mb-4 p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900 dark:border-yellow-800 rounded-lg">
            <div class="flex items-center">
              <i class="pi pi-exclamation-triangle text-yellow-500 mr-2"></i>
              <span class="text-sm">Ollama is not available. Check if the service is running.</span>
            </div>
            <div class="mt-2 text-right">
              <Button 
                label="Check Ollama" 
                icon="pi pi-refresh" 
                class="p-button-sm p-button-outlined"
                @click="checkOllamaStatus"
              />
            </div>
          </div>
          
          <!-- AI Service Selector -->
          <div class="mb-4">
            <label class="block text-sm mb-2">Select AI Service:</label>
            <div class="flex flex-wrap gap-2">
              <Button 
                :class="['p-button-sm', aiService === 'claude' ? 'p-button-primary' : 'p-button-outlined']"
                label="Claude" 
                icon="pi pi-star"
                @click="aiService = 'claude'"
              />
              <Button 
                :class="['p-button-sm', aiService === 'ollama' ? 'p-button-primary' : 'p-button-outlined']"
                label="Ollama" 
                icon="pi pi-desktop"
                @click="aiService = 'ollama'"
              />
              <Button 
                :class="['p-button-sm', aiService === 'quotesync' ? 'p-button-primary' : 'p-button-outlined']"
                label="QuoteSync" 
                icon="pi pi-cloud"
                @click="aiService = 'quotesync'"
              />
            </div>
            <span v-if="aiService === 'ollama'" class="ml-2">
              <i 
                v-if="ollamaStatus.available" 
                class="pi pi-check-circle text-green-500"
              ></i>
              <i 
                v-else-if="ollamaStatus.checking" 
                class="pi pi-spin pi-spinner text-blue-500"
              ></i>
              <i 
                v-else 
                class="pi pi-exclamation-circle text-yellow-500"
              ></i>
            </span>
          </div>
          
          <!-- AI Tags Section -->
          <div class="mb-4">
            <p class="text-sm text-gray-500 mb-2">AI suggested tags for this quote:</p>
            <div v-if="suggestedTags.length > 0" class="flex flex-wrap gap-2">
              <div 
                v-for="(tag, idx) in suggestedTags" 
                :key="idx"
                class="flex items-center px-3 py-1 rounded-full text-white text-xs shadow-sm transition-all"
                :style="getTagStyle(tag)"
              >
                {{ tag }}
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
            <div v-else-if="loading" class="text-sm text-gray-500 italic mt-2 flex items-center">
              <i class="pi pi-spin pi-spinner mr-2"></i> Generating tags...
            </div>
            <div v-else class="text-sm text-gray-500 italic mt-2">
              No suggested tags. Click the button below to generate tags.
            </div>
            
            <!-- Recently accepted tags section -->
            <div v-if="acceptedTags.length > 0" class="mt-4">
              <p class="text-sm text-gray-500 mb-2">Recently accepted tags:</p>
              <div class="flex flex-wrap gap-2">
                <div 
                  v-for="(tag, idx) in acceptedTags" 
                  :key="idx"
                  class="flex items-center px-3 py-1 rounded-full text-white text-xs shadow-sm tag-added"
                  :style="{ background: 'linear-gradient(135deg, #10B981, #047857)' }"
                >
                  {{ tag }}
                  <i class="pi pi-check ml-2 text-white"></i>
                </div>
              </div>
            </div>
            
            <Button 
              label="Generate Tags" 
              icon="pi pi-refresh"
              :loading="loading"
              :disabled="loading"
              @click="generateTags"
              class="mt-4 p-button-outlined"
            />
          </div>
        </div>
      </div>
    </Sidebar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { OllamaService } from '@/service/OllamaService';
import { AnthropicService } from '@/service/AnthropicService';
import { QuoteSyncChatService } from '@/service/QuoteSyncChatService';
import Button from 'primevue/button';
import Sidebar from 'primevue/sidebar';
import ProgressSpinner from 'primevue/progressspinner';
import InputSwitch from 'primevue/inputswitch';

const props = defineProps({
  quote: {
    type: Object,
    required: true
  },
  buttonClass: {
    type: String,
    default: 'p-button-rounded p-button-outlined'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['tags-generated', 'tag-accepted']);

// State
const toast = useToast();
const loading = ref(false);
const error = ref(null);
const showTagPanel = ref(false);
const suggestedTags = ref([]);
const acceptedTags = ref([]);
const aiService = ref('claude'); // Default to Claude
const ollamaStatus = ref({
  available: false,
  checking: false
});

// Check Ollama status
const checkOllamaStatus = async () => {
  ollamaStatus.value.checking = true;
  try {
    ollamaStatus.value.available = await OllamaService.checkStatus();
  } catch (error) {
    console.error('Error checking Ollama status:', error);
    ollamaStatus.value.available = false;
  } finally {
    ollamaStatus.value.checking = false;
  }
};

// Utility to capitalize the first letter of each word
const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Generate tags using selected AI service
const generateTags = async () => {
  if (loading.value) return;
  
  loading.value = true;
  error.value = null;
  suggestedTags.value = [];
  
  try {
    // Show the tag panel
    showTagPanel.value = true;
    
    let result;
    
    // Select AI service based on user choice
    if (aiService.value === 'claude') {
      // Generate tags using Claude
      result = await AnthropicService.generateTags(props.quote.body);
    } else if (aiService.value === 'ollama') {
      // Check Ollama status first
      if (!ollamaStatus.value.available && !ollamaStatus.value.checking) {
        await checkOllamaStatus();
      }
      
      if (!ollamaStatus.value.available) {
        throw new Error('Ollama is not available. Make sure it is running.');
      }
      
      // Generate tags using Ollama
      result = await OllamaService.generateTags(props.quote.body);
    } else {
      // Generate tags using QuoteSyncChat
      result = await QuoteSyncChatService.generateTags(props.quote.id);
      
      // Need different handling for QuoteSyncChat response format
      if (result.tags && Array.isArray(result.tags) && result.tags.length > 0 && typeof result.tags[0] === 'object') {
        // Extract titles from tag objects for QuoteSyncChat
        result.tags = result.tags.map(tag => tag.title);
      }
    }
    
    // Filter out tags that already exist on the quote
    const existingTags = props.quote.tags ? props.quote.tags.map(tag => 
      typeof tag === 'object' ? tag.title.toLowerCase() : tag.toLowerCase()
    ) : [];
    
    // Capitalize first letter of each word in tags before adding to suggested tags
    suggestedTags.value = result.tags
      .filter(tag => !existingTags.includes(tag.toLowerCase()))
      .map(tag => capitalizeWords(tag));
    
    // Notify parent component
    emit('tags-generated', suggestedTags.value);
    
    if (suggestedTags.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No New Tags',
        detail: 'All suggested tags are already applied to this quote.',
        life: 3000
      });
    }
  } catch (error) {
    console.error('Error generating tags:', error);
    error.value = error.message || 'Failed to generate tags. Please try again.';
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.value,
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Accept a tag
const acceptTag = async (tag) => {
  try {
    console.log('Accepting tag:', tag);
    // Remove the tag from suggestions
    suggestedTags.value = suggestedTags.value.filter(t => t !== tag);
    
    // Capitalize the tag before emitting
    const capitalizedTag = capitalizeWords(tag);
    
    // Add to accepted tags list
    acceptedTags.value.push(capitalizedTag);
    
    // Emit event to parent component with the accepted tag
    emit('tag-accepted', capitalizedTag);
    
    // Check if we've accepted all tags
    if (suggestedTags.value.length === 0) {
      // Clear accepted tags after a delay and close panel
      setTimeout(() => {
        showTagPanel.value = false;
        // Clear accepted tags list when panel closes
        setTimeout(() => {
          acceptedTags.value = [];
        }, 300);
      }, 1500);
    }
  } catch (error) {
    console.error('Error accepting tag:', error);
  }
};

// Reject a tag
const rejectTag = (tag) => {
  // Remove the tag from suggestions
  suggestedTags.value = suggestedTags.value.filter(t => t !== tag);
  
  console.log(`Tag "${tag}" rejected`);
  
  // Check if we've rejected all tags
  if (suggestedTags.value.length === 0) {
    // Close the panel after a delay if all tags have been handled
    setTimeout(() => {
      showTagPanel.value = false;
      // Clear accepted tags list when panel closes
      setTimeout(() => {
        acceptedTags.value = [];
      }, 300);
    }, 500);
  }
};

// Tag style utility
const getTagStyle = (tag) => {
  return {
    background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)',
    color: 'white'
  };
};

// Initialize
onMounted(() => {
  checkOllamaStatus();
});
</script>

<style scoped>
:deep(.p-button-sm) {
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
}

:deep(.p-button-sm .p-button-icon) {
  font-size: 0.75rem;
  margin-right: 0.3rem;
}

.tag-panel {
  height: 100%;
  overflow-y: auto;
}

.tag-added {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 