<template>
  <div class="quote-modal-container">
    <Dialog 
      :visible="visible" 
      @update:visible="$emit('update:visible', $event)"
      :style="{ width: '95vw', maxWidth: '850px' }" 
      modal 
      :dismissableMask="true"
      :closeOnEscape="true"
      class="quote-modal"
      header="Quote Details"
    >
      <div class="quote-modal-content p-6">
        <!-- Quote Body with transition -->
        <transition :name="transitionName" mode="out-in">
          <p :key="quote?.id" class="text-2xl italic mb-6 quote-content">"{{ quote?.body }}"</p>
        </transition>
        
        <!-- Quote Metadata with transition -->
        <transition :name="transitionName" mode="out-in">
          <div :key="quote?.id" class="mb-6">
            <p class="text-lg font-medium text-gray-500">
              <span 
                class="cursor-pointer hover:text-primary-500 hover:underline"
                @click="handleAuthorClick(quote?.book?.author)"
              >
                {{ quote?.book?.author?.name || "Unknown Author" }}
              </span>
               - 
              <span 
                class="cursor-pointer hover:text-primary-500 hover:underline"
                @click="handleBookClick(quote?.book)"
              >
                {{ quote?.book?.title || "Unknown Book" }}
              </span>
            </p>
          </div>
        </transition>
        
        <!-- Tags Section -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Tags</h3>
            <Button
              icon="pi pi-plus"
              class="p-button-rounded p-button-text p-button-sm"
              @click="showTagInput = !showTagInput"
              :tooltip="showTagInput ? 'Cancel' : 'Add Tag'"
            />
          </div>
          
          <!-- Tag Input with transition -->
          <transition name="fade">
            <div v-if="showTagInput" class="mb-3">
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  v-model="newTag"
                  @keydown.enter.prevent="addTag"
                  placeholder="Add new tag"
                  class="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm flex-1"
                  :disabled="isAddingTag"
                  ref="tagInput"
                />
                <Button
                  icon="pi pi-check"
                  class="p-button-rounded p-button-success p-button-sm"
                  @click="addTag"
                  :disabled="!newTag.trim() || isAddingTag"
                  :loading="isAddingTag"
                />
              </div>
            </div>
          </transition>
          
          <!-- Tags List with transition -->
          <transition :name="transitionName" mode="out-in">
            <div :key="quote?.id" class="flex flex-wrap gap-2">
              <transition-group name="tag-list" tag="div" class="flex flex-wrap gap-2">
                <div
                  v-for="tag in localTags"
                  :key="tag.id"
                  class="px-3 py-1 rounded-full text-white text-sm shadow-sm cursor-pointer hover:opacity-90 flex items-center gap-1"
                  :style="{ background: tag.gradient_primary_color && tag.gradient_secondary_color ? 
                    `linear-gradient(135deg, ${tag.gradient_primary_color}, ${tag.gradient_secondary_color})` : 
                    'linear-gradient(135deg, #3B82F6, #1E3A8A)' }"
                >
                  <span @click="handleTagClick(tag)">{{ tag.title }}</span>
                  <button 
                    class="text-white hover:text-red-200 transition-colors"
                    @click.stop="removeTag(tag)"
                  >
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </div>
              </transition-group>
            </div>
          </transition>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-center items-center mb-6">
          <div class="flex gap-4">
            <Button
              icon="pi pi-heart"
              :class="{ 'p-button-rounded p-button-lg': true, 'p-button-text': !liked, 'p-button-danger': liked }"
              @click="$emit('toggle-like', quote?.id)"
              tooltip="Favorite"
            />
            <Button
              icon="pi pi-cog"
              class="p-button-rounded p-button-text p-button-lg"
              @click="navigateToQuoteDetails"
              tooltip="Properties"
            />
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between items-center mt-4">
          <Button 
            v-if="hasPrevious"
            class="p-button-text p-button-lg navigation-button"
            @click="handlePrevious"
            :disabled="!hasPrevious"
          >
            <i class="pi pi-chevron-left mr-2"></i>
            Previous
          </Button>
          <div class="flex-1"></div>
          <Button 
            v-if="hasNext"
            class="p-button-text p-button-lg navigation-button"
            @click="handleNext"
            :disabled="!hasNext"
          >
            Next
            <i class="pi pi-chevron-right ml-2"></i>
          </Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

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

// Watch for quote changes to update local tags
watch(() => props.quote, (newQuote) => {
  if (newQuote && newQuote.tags) {
    localTags.value = [...newQuote.tags];
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

const handleNext = () => {
  transitionName.value = 'slide-next';
  // Emit the navigation event without closing the modal
  emit('next-quote');
};

const handlePrevious = () => {
  transitionName.value = 'slide-prev';
  // Emit the navigation event without closing the modal
  emit('previous-quote');
};

const addTag = async () => {
  if (newTag.value.trim() && !isAddingTag.value) {
    isAddingTag.value = true;
    const tagTitle = newTag.value.trim();
    
    try {
      // Avoid duplicates
      if (!localTags.value.some(tag => tag.title.toLowerCase() === tagTitle.toLowerCase())) {
        // Add tag to local state immediately
        const newTagObj = {
          id: Date.now(), // Temporary ID until backend sync
          title: tagTitle,
          gradient_primary_color: '#3B82F6',
          gradient_secondary_color: '#1E3A8A'
        };
        localTags.value.push(newTagObj);
        
        // Emit event to parent
        await emit('add-tag', {
          quoteId: props.quote.id,
          tag: tagTitle
        });
      }
      
      newTag.value = '';
      showTagInput.value = false;
    } catch (error) {
      // If there's an error, remove the tag from local state
      localTags.value = localTags.value.filter(t => t.title !== tagTitle);
      console.error('Error adding tag:', error);
    } finally {
      isAddingTag.value = false;
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

// Watch for visible changes to emit update
watch(() => props.visible, (newValue) => {
  if (!newValue) {
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
</script>

<style scoped>
.quote-modal-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.navigation-button {
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  background-color: var(--surface-100);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: var(--text-color);
}

.navigation-button:hover {
  background-color: var(--surface-200);
  transform: scale(1.05);
}

.navigation-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.navigation-button .pi {
  font-size: 1rem;
}

/* Next transition */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
  filter: blur(10px);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-100px) scale(0.9);
  filter: blur(10px);
}

/* Previous transition */
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-100px) scale(0.9);
  filter: blur(10px);
}

.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
  filter: blur(10px);
}

/* Tag Input Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Tag List Transition */
.tag-list-move,
.tag-list-enter-active,
.tag-list-leave-active {
  transition: all 0.5s ease;
}

.tag-list-enter-from,
.tag-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.tag-list-leave-active {
  position: absolute;
}

.quote-content {
  transition: all 0.3s ease;
}

.quote-modal {
  :deep(.p-dialog-header) {
    padding: 1.5rem;
    border-bottom: 1px solid var(--surface-200);
    font-size: 1.5rem;
  }
  
  :deep(.p-dialog-content) {
    padding: 0;
  }
  
  :deep(.p-dialog-mask) {
    backdrop-filter: blur(4px);
  }
  
  :deep(.p-dialog) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    max-height: 90vh;
  }
}

.dark .quote-modal {
  :deep(.p-dialog-header) {
    border-bottom: 1px solid var(--surface-700);
    background-color: var(--surface-800);
    color: var(--surface-0);
  }
  
  :deep(.p-dialog-content) {
    background-color: var(--surface-800);
    color: var(--surface-0);
  }
}

.dark .navigation-button {
  background-color: var(--surface-700);
  color: var(--surface-0);
}

.dark .navigation-button:hover {
  background-color: var(--surface-600);
}

input[type="text"] {
  background-color: var(--surface-ground);
  color: var(--text-color);
  border-color: var(--surface-border);
}

.dark input[type="text"] {
  background-color: var(--surface-700);
  color: var(--surface-0);
  border-color: var(--surface-600);
}

input[type="text"]:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-alpha-20);
}

.dark input[type="text"]:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-alpha-20);
}
</style> 