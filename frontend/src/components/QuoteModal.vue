<template>
  <div class="quote-modal-container" v-if="visible">
    <div class="quote-overlay" @click="$emit('update:visible', false)"></div>
    <div class="quote-card-container">
      <div class="quote-card">
        <!-- Close button -->
        <button 
          class="close-button"
          @click="$emit('update:visible', false)"
        >
          <i class="pi pi-times"></i>
        </button>

         <!-- Quote Metadata -->
         <div class="quote-metadata">
          <p class="text-xl font-medium text-gray-600 dark:text-gray-300">
            <span 
              class="cursor-pointer hover:text-primary-500 hover:underline transition-colors duration-200"
              @click="handleAuthorClick(quote?.book?.author)"
            >
              {{ quote?.book?.author?.name || "Unknown Author" }}
            </span>
            <span class="mx-2 text-gray-400">•</span>
            <span 
              class="cursor-pointer hover:text-primary-500 hover:underline transition-colors duration-200"
              @click="handleBookClick(quote?.book)"
            >
              {{ quote?.book?.title || "Unknown Book" }}
            </span>
          </p>
        </div>

        <!-- Quote Body -->
        <div class="quote-body">
          <p class="text-3xl italic mb-6 quote-content leading-relaxed">"{{ quote?.body }}"</p>
        </div>

       

        <!-- Tags -->
        <div class="quote-tags">
          <h3 class="text-lg font-semibold mb-3 text-surface-700 dark:text-surface-300">Tags</h3>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="tag in localTags"
              :key="tag.id"
              class="px-4 py-2 rounded-full text-white text-sm shadow-md cursor-pointer hover:scale-105 transition-all duration-200"
              :style="{ background: tag.gradient_primary_color && tag.gradient_secondary_color ? 
                `linear-gradient(135deg, ${tag.gradient_primary_color}, ${tag.gradient_secondary_color})` : 
                'linear-gradient(135deg, #3B82F6, #1E3A8A)' }"
              @click="handleTagClick(tag)"
            >
              {{ tag.title }}
            </div>
            <!-- Add Tag Button -->
            <Button
              icon="pi pi-plus"
              class="p-button-rounded p-button-text p-button-sm"
              @click="showTagInput = true"
              v-if="!showTagInput"
            />
            <!-- Tag Input -->
            <div v-if="showTagInput" class="flex items-center gap-2">
              <InputText
                v-model="newTag"
                placeholder="New tag... (Press Enter to add)"
                class="p-inputtext-sm"
                @keyup.enter="addTag"
                @keyup.esc="cancelTagInput"
                ref="tagInput"
                autofocus
              />
              <Button
                icon="pi pi-check"
                class="p-button-rounded p-button-text p-button-sm"
                @click="addTag"
                :disabled="!newTag.trim()"
              />
              <Button
                icon="pi pi-times"
                class="p-button-rounded p-button-text p-button-sm"
                @click="cancelTagInput"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="quote-actions">
          <div class="flex justify-between items-center">
            <div class="flex gap-4">
              <Button
                icon="pi pi-heart"
                :class="{ 
                  'p-button-rounded p-button-lg hover:scale-110 transition-transform duration-200': true, 
                  'p-button-text': !liked, 
                  'p-button-danger': liked 
                }"
                @click="$emit('toggle-like', quote?.id)"
                tooltip="Favorite"
              />
              <Button
                icon="pi pi-cog"
                class="p-button-rounded p-button-text p-button-lg hover:scale-110 transition-transform duration-200"
                @click="navigateToQuoteDetails"
                tooltip="Properties"
              />
            </div>

            <div class="flex gap-4">
              <Button 
                v-if="hasPrevious"
                class="p-button-text p-button-lg navigation-button hover:scale-105"
                @click="handlePrevious"
                :disabled="!hasPrevious"
              >
                <i class="pi pi-chevron-left mr-2"></i>
                Previous
              </Button>
              <Button 
                v-if="hasNext"
                class="p-button-text p-button-lg navigation-button hover:scale-105"
                @click="handleNext"
                :disabled="!hasNext"
              >
                Next
                <i class="pi pi-chevron-right ml-2"></i>
              </Button>
            </div>
          </div>
          <!-- Shortcuts Info -->
          <div class="mt-4 text-center text-sm text-surface-500 dark:text-surface-400">
            <span class="shortcut-key">←</span> Previous
            <span class="mx-2">•</span>
            <span class="shortcut-key">→</span> Next
            <span class="mx-2">•</span>
            <span class="shortcut-key">T</span> Add Tag
            <span class="mx-2">•</span>
            <span class="shortcut-key">Esc</span> Close
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { TagService } from "@/service/TagService";
import { QuoteService } from "@/service/QuoteService";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  quote: {
    type: Object,
    default: null
  },
  liked: {
    type: Boolean,
    default: false
  },
  hasPrevious: {
    type: Boolean,
    default: false
  },
  hasNext: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:visible', 
  'toggle-like', 
  'previous-quote', 
  'next-quote',
  'add-tag',
  'remove-tag',
  'close'
]);

const router = useRouter();
const transitionName = ref('slide-next');
const showTagInput = ref(false);
const newTag = ref('');
const localTags = ref([]);
const isAddingTag = ref(false);
const tagInput = ref(null);
const localQuote = ref(null);

// Watch for quote changes to update local quote and tags
watch(() => props.quote, (newQuote) => {
  if (newQuote) {
    // Create a deep copy of the quote to maintain reactivity
    localQuote.value = {
      ...newQuote,
      tags: newQuote.tags ? newQuote.tags.map(tag => ({
        ...tag,
        isNew: false
      })) : []
    };
    localTags.value = localQuote.value.tags;
  } else {
    localQuote.value = null;
    localTags.value = [];
  }
}, { immediate: true, deep: true });

// Watch for tag input visibility to focus the input field
watch(() => showTagInput.value, (newValue) => {
  if (newValue) {
    nextTick(() => {
      if (tagInput.value) {
        tagInput.value.focus();
      }
    });
  }
});

const handleNext = async () => {
  // Save current tags before navigating
  if (localTags.value.length > 0) {
    try {
      // Get only the new tags (those without a server ID)
      const newTags = localTags.value
        .filter(tag => !tag.id || tag.id.toString().startsWith('temp-'))
        .map(tag => tag.title);
      
      if (newTags.length > 0) {
        await emit('add-tag', {
          quoteId: props.quote.id,
          tags: newTags
        });
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  }
  transitionName.value = 'slide-next';
  emit('next-quote');
};

const handlePrevious = async () => {
  // Save current tags before navigating
  if (localTags.value.length > 0) {
    try {
      // Get only the new tags (those without a server ID)
      const newTags = localTags.value
        .filter(tag => !tag.id || tag.id.toString().startsWith('temp-'))
        .map(tag => tag.title);
      
      if (newTags.length > 0) {
        await emit('add-tag', {
          quoteId: props.quote.id,
          tags: newTags
        });
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  }
  transitionName.value = 'slide-prev';
  emit('previous-quote');
};

const addTag = async () => {
  if (newTag.value.trim()) {
    try {
      const tagTitle = newTag.value.trim();
      
      // Check if tag already exists
      if (localTags.value.some(tag => tag.title.toLowerCase() === tagTitle.toLowerCase())) {
        return;
      }
      
      // Create a new tag object with the original title for display
      const newTagObj = {
        id: `temp-${Date.now()}`, // Temporary ID until the backend provides one
        title: tagTitle,
        gradient_primary_color: '#3B82F6',
        gradient_secondary_color: '#1E3A8A',
        isNew: true // Mark as newly added for animation
      };
      
      // Add to local state immediately
      localTags.value.push(newTagObj);
      if (localQuote.value) {
        localQuote.value.tags = [...localTags.value];
      }
      
      // Clear input and hide the input field
      newTag.value = '';
      showTagInput.value = false;
      
      // Call the backend to persist the change
      try {
        // First try to create or get the tag using TagService
        const tagResponse = await TagService.createTag({ 
          title: tagTitle,
          description: tagTitle
        });
        
        // Then add it to the quote if we have a valid tag ID
        if (tagResponse && tagResponse.id) {
          // Update our temporary tag with the real ID from the server
          const tagIndex = localTags.value.findIndex(t => t.id === newTagObj.id);
          if (tagIndex !== -1) {
            const updatedTag = {
              ...localTags.value[tagIndex],
              id: tagResponse.id
            };
            localTags.value[tagIndex] = updatedTag;
            if (localQuote.value) {
              localQuote.value.tags = [...localTags.value];
            }
          }
          
          // Persist to backend
          await QuoteService.addTagToQuote(props.quote.id, tagResponse.id);
          
          // Emit the add-tag event after successful API call
          emit('add-tag', {
            quoteId: props.quote.id,
            tags: [tagTitle]
          });
        }
      } catch (apiError) {
        console.error('API error adding tag:', apiError);
        // Remove the tag from local state if the API call fails
        const tagIndex = localTags.value.findIndex(t => t.id === newTagObj.id);
        if (tagIndex !== -1) {
          localTags.value.splice(tagIndex, 1);
          if (localQuote.value) {
            localQuote.value.tags = [...localTags.value];
          }
        }
        // Show the input field again if there was an error
        showTagInput.value = true;
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  }
};

const removeTag = async (tag) => {
  try {
    // Remove from local state immediately
    const tagIndex = localTags.value.findIndex(t => t.id === tag.id);
    if (tagIndex !== -1) {
      localTags.value.splice(tagIndex, 1);
    }
    
    // Emit event to parent
    await emit('remove-tag', {
      quoteId: props.quote.id,
      tagId: tag.id
    });
  } catch (error) {
    // If there's an error, restore the tag to local state
    localTags.value.push(tag);
    console.error('Error removing tag:', error);
  }
};

const saveTags = async () => {
  if (localTags.value.length > 0) {
    try {
      // Get only the new tags (those without a server ID)
      const newTags = localTags.value
        .filter(tag => !tag.id || tag.id > 1000000000000) // Temporary IDs are timestamps
        .map(tag => tag.title);
      
      if (newTags.length > 0) {
        await emit('add-tag', {
          quoteId: props.quote.id,
          tags: newTags
        });
      }
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  }
};

// Watch for visible changes to save tags before closing
watch(() => props.visible, async (newValue) => {
  if (!newValue) {
    await saveTags();
    emit('close');
  }
  emit('update:visible', newValue);
});

const navigateToQuoteDetails = () => {
  if (props.quote?.id) {
    router.push({ name: 'quoteDetails', params: { id: props.quote.id } });
    emit('update:visible', false);
  }
};

const handleTagClick = async (tag) => {
  if (tag && tag.id) {
    window.location.href = `/tags/${tag.id}`;
  }
};

const handleBookClick = (book) => {
  if (book && book.id) {
    window.location.href = `/books/${book.id}`;
  }
};

const handleAuthorClick = (author) => {
  if (author && author.id) {
    window.location.href = `/authors/${author.id}`;
  }
};

const cancelTagInput = () => {
  showTagInput.value = false;
  newTag.value = '';
};

// Add keyboard event listener
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
});

const handleKeyPress = (event) => {
  if (!props.visible) return;
  
  switch (event.key.toLowerCase()) {
    case 'arrowleft':
      if (props.hasPrevious) {
        handlePrevious();
      }
      break;
    case 'arrowright':
      if (props.hasNext) {
        handleNext();
      }
      break;
    case 't':
      if (!showTagInput.value) {
        showTagInput.value = true;
        // Use nextTick to ensure the input is rendered before focusing
        nextTick(() => {
          if (tagInput.value) {
            tagInput.value.focus();
            // Place cursor at the end of the input
            const length = tagInput.value.value.length;
            tagInput.value.setSelectionRange(length, length);
          }
        });
      }
      break;
    case 'escape':
      if (showTagInput.value) {
        cancelTagInput();
      } else {
        emit('update:visible', false);
      }
      break;
  }
};
</script>

<style scoped>
.quote-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quote-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
}

.quote-card-container {
  position: relative;
  width: 95%;
  max-width: 900px;
  z-index: 1001;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.quote-card {
  background: var(--surface-card);
  border-radius: 1.5rem;
  padding: 3rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  position: relative;
  border: 1px solid var(--surface-border);
}

.dark .quote-card {
  background: var(--surface-card);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--surface-border);
}

.close-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--surface-100);
  border: none;
  color: var(--surface-600);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  font-size: 1.25rem;
}

.dark .close-button {
  background: var(--surface-700);
  color: var(--surface-300);
}

.close-button:hover {
  background: var(--surface-200);
  color: var(--surface-700);
}

.dark .close-button:hover {
  background: var(--surface-600);
  color: var(--surface-100);
}

.quote-body {
  position: relative;
  margin-bottom: 2rem;
}

.quote-content {
  position: relative;
  z-index: 1;
  font-family: 'Georgia', serif;
  color: var(--text-color);
  font-size: 2rem;
  line-height: 1.6;
}

.dark .quote-content {
  color: var(--surface-50);
}

.quote-metadata {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.quote-metadata p {
  font-size: 1.25rem;
}

.dark .quote-metadata {
  border-bottom: 1px solid var(--surface-700);
}

.quote-tags {
  margin-bottom: 2rem;
}

.quote-tags {
  padding-top: 1.5rem;
  border-top: 1px solid var(--surface-border);
}

.dark .quote-tags {
  border-top: 1px solid var(--surface-700);
}

.navigation-button {
  transition: all 0.2s ease;
}

.navigation-button:hover {
  transform: scale(1.05);
}

.shortcut-key {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: var(--surface-200);
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
  margin: 0 0.25rem;
}

.dark .shortcut-key {
  background: var(--surface-700);
}
</style> 