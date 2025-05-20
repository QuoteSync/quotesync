<template>
  <div
    class="quote-card w-full p-6 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm relative transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary-200 dark:hover:border-primary-700"
  >
    <!-- Decorative elements -->
    <div class="quote-decoration absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-700 opacity-0 transition-opacity duration-300"></div>
    <div class="quote-decoration absolute bottom-0 right-0 w-1 h-full bg-gradient-to-b from-primary-500 to-primary-700 opacity-0 transition-opacity duration-300"></div>
    
    <div v-if="isEditing || isNew">
      <textarea
        v-model="editedText"
        class="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
        rows="3"
        :placeholder="isNew ? 'Escribe la nueva cita...' : ''"
      ></textarea>
      <!-- Sección para editar etiquetas con pills -->
      <div class="mt-3">
        <div class="flex flex-wrap gap-2 items-center">
          <div
            v-for="(tag, idx) in editedTagsArray"
            :key="idx"
            class="flex items-center px-3 py-1.5 rounded-full text-white text-xs shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
            :style="{ background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' }"
          >
            {{ tag }}
            <button class="ml-1.5 text-white hover:text-red-200 focus:outline-none transition-colors duration-200" @click="removeTag(idx)">
              ×
            </button>
          </div>
          <!-- Campo de entrada y botón para agregar tag -->
          <div class="flex items-center">
            <input
              type="text"
              v-model="newTag"
              @keydown.enter.prevent="addTag"
              placeholder="Añadir tag"
              class="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all duration-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            />
            <button
              class="ml-2 p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all duration-200 text-sm font-medium hover:scale-105 hover:shadow-lg"
              @click="addTag"
            >
              Add Tag
            </button>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-3">
        <button
          class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200 hover:scale-105 hover:shadow-md"
          @click="cancelEdit"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          @click="save"
        >
          {{ isNew ? "Create" : "Save" }}
        </button>
      </div>
    </div>
    <div v-else>
      <div class="quote-content relative">
        <div class="quote-mark absolute -left-2 -top-2 text-4xl text-primary-500/20 dark:text-primary-400/20">"</div>
        <p class="text-xl italic cursor-pointer hover:text-primary-500 transition-all duration-300 leading-relaxed pl-4" @click.stop="openQuoteModal">"{{ quote.body }}"</p>
        <div class="quote-mark absolute -right-2 -bottom-2 text-4xl text-primary-500/20 dark:text-primary-400/20 transform rotate-180">"</div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <div
          v-for="(tag, idx) in localQuote.tags"
          :key="tag.id || idx"
          class="px-3 py-1.5 rounded-full text-white text-xs shadow-sm cursor-pointer hover:opacity-90 tag-pill transition-all duration-200 hover:scale-105 hover:shadow-lg"
          :class="{ 'newly-added-tag': tag.isNew }"
          :style="{ background: tag.gradient_primary_color && tag.gradient_secondary_color ? 
            `linear-gradient(135deg, ${tag.gradient_primary_color}, ${tag.gradient_secondary_color})` : 
            'linear-gradient(135deg, #3B82F6, #1E3A8A)' }"
          @click.stop.prevent="handleTagClick(tag)"
        >
          {{ tag.title }}
        </div>
      </div>
      <!-- Información del libro y autor en dos líneas, junto a los botones -->
      <div class="mt-3 flex items-center justify-between">
        <div class="space-y-1">
          <span 
            class="text-sm font-medium text-gray-500 cursor-pointer hover:text-primary-500 hover:underline transition-all duration-200 group"
            @click.stop.prevent="handleBookClick(quote.book)"
          >
            <i class="pi pi-book mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
            {{ quote.book?.title || "Unknown Book" }}
          </span>
          <br />
          <span 
            class="text-sm font-medium text-gray-500 cursor-pointer hover:text-primary-500 hover:underline transition-all duration-200 group"
            @click.stop.prevent="handleAuthorClick(quote.book?.author)"
          >
            <i class="pi pi-user mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
            {{ quote.book?.author?.name || "Unknown Author" }}
          </span>
        </div>
        <div class="flex items-center gap-3 button-group">
          <Button
            :icon="liked ? 'pi pi-heart-fill' : 'pi pi-heart'"
            :class="{ 
              'fancy-button': true, 
              'p-button-rounded': true, 
              'p-button-text': !liked, 
              'p-button-danger': liked,
              'favorite-button': true,
              'is-liked': liked
            }"
            @click="$emit('toggle-like', quote.id)"
            class="transition-all duration-300"
          />
          <Button
            icon="pi pi-pencil"
            class="fancy-button p-button-rounded p-button-text transition-all duration-300 edit-button"
            @click="startEdit"
          />
          <GenerateTagsButton
            :quote="quote"
            class="fancy-button p-button-rounded p-button-text transition-all duration-300 tag-button"
            @tag-accepted="handleAddTag"
          />
          <div class="relative">

            <QuoteListMenu
              :quoteId="quote.id"
              @quote-added-to-list="handleQuoteAddedToList"
              @remove-quote="$emit('remove-quote', $event)"
              class="enhanced-menu"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- AI Tag Review Panel -->
    <Sidebar v-model:visible="showTagReviewPanel" position="right" :style="{ width: '30rem' }">
      <TagReviewPanel 
        :quote="quote" 
        @close="showTagReviewPanel = false"
        @update-quote="handleTagUpdate" 
        @view-quote="handleRelatedQuoteView"
      />
    </Sidebar>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from "vue";
import { useRouter } from "vue-router";
import { TagService } from "@/service/TagService";
import { QuoteListService } from '@/service/QuoteListService';
import { QuoteService } from '@/service/QuoteService';
import { useUserStore } from '@/stores/user';
import QuoteListMenu from './QuoteListMenu.vue';
import QuoteModal from './QuoteModal.vue';
import TagReviewPanel from './TagReviewPanel.vue';
import GenerateTagsButton from './GenerateTagsButton.vue';
import Menu from 'primevue/menu';
import Sidebar from 'primevue/sidebar';
import { useToast } from "primevue/usetoast";
import Dialog from 'primevue/dialog';

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const props = defineProps({
  quote: {
    type: Object,
    required: true
  },
  isNew: { type: Boolean, default: false },
  liked: { type: Boolean, default: false },
  showActions: {
    type: Boolean,
    default: false
  },
  showRemoveButton: {
    type: Boolean,
    default: true
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
  "toggle-like", 
  "save-edit", 
  "save-new", 
  "cancel-edit", 
  "remove-quote",
  "previous-quote",
  "next-quote",
  "click",
  "update-quote"
]);

const isEditing = ref(props.isNew); // Si es nueva, ya iniciamos en modo edición.
const editedText = ref(props.isNew ? "" : props.quote.body);
const editedTagsArray = ref(props.quote.tags.map((tag) => tag.title) || []);
const newTag = ref("");

// Make a reactive copy of the quote for local modifications
const localQuote = ref({ ...props.quote });

// Watch for changes in props.quote and update localQuote
watch(() => props.quote, (newQuote) => {
  localQuote.value = { ...newQuote };
}, { deep: true });

// Computed property para el icono del corazón.
const heartIconClass = computed(() =>
  props.quote.is_favorite
    ? "pi pi-heart-fill text-red-500 text-xl"
    : "pi pi-heart text-gray-500 text-xl"
);

// Actualiza el texto y las etiquetas si cambia la propiedad quote (solo en modo edición de cita existente)
if (!props.isNew) {
  watch(
    () => props.quote.body,
    (newBody) => {
      if (!isEditing.value) {
        editedText.value = newBody;
      }
    }
  );
  watch(
    () => props.quote.tags,
    (newTags) => {
      if (!isEditing.value) {
        editedTagsArray.value = newTags.map((tag) => tag.title);
      }
    },
    { deep: true }
  );
}

const startEdit = () => {
  isEditing.value = true;
  editedText.value = props.quote.body;
  editedTagsArray.value = props.quote.tags.map((tag) => tag.title);
  newTag.value = "";
};

const cancelEdit = () => {
  isEditing.value = false;
  emit("cancel-edit", props.quote.id);
};

const addTag = () => {
  if (newTag.value.trim() !== "") {
    const tagToAdd = newTag.value.trim();
    if (!editedTagsArray.value.includes(tagToAdd)) {
      editedTagsArray.value.push(tagToAdd);
    }
    newTag.value = "";
  }
};

const removeTag = (index) => {
  editedTagsArray.value.splice(index, 1);
};

const save = () => {
  isEditing.value = false;
  // Si es una nueva cita, emitimos "save-new", de lo contrario "save-edit"
  if (props.isNew) {
    emit("save-new", {
      body: editedText.value,
      tags: editedTagsArray.value,
    });
  } else {
    emit("save-edit", {
      id: props.quote.id,
      body: editedText.value,
      tags: editedTagsArray.value,
    });
  }
};

const handleTagClick = async (tag) => {
  console.log("Tag clicked:", tag);
  
  try {
    // If we have a tag ID, use it directly
    if (tag && tag.id) {
      console.log("Navigating with tag ID:", tag.id);
      
      // Use direct URL navigation with page reload
      window.location.href = `/tags/${tag.id}`;
      return;
    }
    
    // If no ID but we have a title, fetch the tag by title
    if (tag && tag.title) {
      console.log("No tag ID found, searching by title:", tag.title);
      
      // Get all tags and find the one matching this title
      const tags = await TagService.getTags();
      const matchingTag = tags.find(t => t.title === tag.title);
      
      if (matchingTag && matchingTag.id) {
        console.log("Found tag by title:", matchingTag);
        
        // Use direct URL navigation with page reload
        window.location.href = `/tags/${matchingTag.id}`;
        return;
      }
    }
    
    console.error("Cannot navigate - tag has no ID or title:", tag);
  } catch (error) {
    console.error("Error in handleTagClick:", error);
  }
};

const handleBookClick = (book) => {
  if (book && book.id) {
    console.log("Navigating to book:", book.title, "with ID:", book.id);
    window.location.href = `/books/${book.id}`;
  } else {
    console.error("Cannot navigate - book has no ID:", book);
  }
};

const handleAuthorClick = (author) => {
  if (author && author.id) {
    console.log("Navigating to author:", author.name, "with ID:", author.id);
    window.location.href = `/authors/${author.id}`;
  } else {
    console.error("Cannot navigate - author has no ID:", author);
  }
};

const handleQuoteAddedToList = (quoteId) => {
  console.log("Quote added to list:", quoteId);
  // Handle the event when a quote is added to a list
};

if (props.quote && props.quote.tags && props.quote.tags.length > 0) {
  console.log("Tags structure:", JSON.stringify(props.quote.tags[0], null, 2));
}

const menu = ref(null);

const menuItems = ref([
  {
    label: 'Remove from list',
    icon: 'pi pi-trash',
    command: () => {
      emit('remove-quote', props.quote.id);
    }
  },
  {
    label: 'AI Tag Suggestions',
    icon: 'pi pi-bolt',
    command: () => {
      showTagReviewPanel.value = true;
    }
  }
]);

// AI Tag Review Panel
const showTagReviewPanel = ref(false);

// Handle tag update from AI
const handleTagUpdate = ({ quoteId, tag }) => {
  handleAddTag(tag.title);
};

// Handle related quote view
const handleRelatedQuoteView = (quote) => {
  // Navigate to the related quote
  window.location.href = `/quotes/${quote.id}`;
};

const toggleMenu = (event) => {
  menu.value.toggle(event);
};

const openQuoteModal = (event) => {
  console.log('QuoteCard - openQuoteModal called');
  // Prevent event propagation
  event?.preventDefault();
  event?.stopPropagation();
  
  // Just emit the click event to the parent
  emit("click", props.quote);
};

const handleAddTag = async (tagTitle) => {
  try {
    console.log('Adding tag:', tagTitle);
    
    // Create a new tag object with the original title for display
    const newTag = {
      id: `temp-${Date.now()}`, // Temporary ID until the backend provides one
      title: tagTitle, // Original title with spaces and accents
      // Use default gradient colors
      gradient_primary_color: '#3B82F6',
      gradient_secondary_color: '#1E3A8A',
      isNew: true // Mark as newly added for animation
    };
    
    // Initialize tags array if it doesn't exist
    if (!localQuote.value.tags) {
      localQuote.value.tags = [];
    }
    
    // Add the tag to the quote's tags if it doesn't already exist
    if (!localQuote.value.tags.some(tag => tag.title.toLowerCase() === tagTitle.toLowerCase())) {
      // Add the new tag to the local quote object - directly updating the reactive variable
      localQuote.value.tags = [...localQuote.value.tags, newTag];
      
      console.log('Updated localQuote tags:', localQuote.value.tags);
      
      // Emit the update-quote event to update parent state for persistence
      emit('update-quote', { ...localQuote.value });
      
      // Remove the "new" status after animation completes
      setTimeout(() => {
        const tagIndex = localQuote.value.tags.findIndex(t => t.id === newTag.id);
        if (tagIndex !== -1) {
          localQuote.value.tags[tagIndex].isNew = false;
        }
      }, 6000); // 3 iterations of 2s animation
      
      // Call the backend to persist the change
      try {
        // First try to create or get the tag using TagService
        // TagService will convert the title to a slug format internally
        const tagResponse = await TagService.createTag({ 
          title: tagTitle,
          // Store the original title in the description field
          description: tagTitle
        });
        
        // Then add it to the quote if we have a valid tag ID
        if (tagResponse && tagResponse.id) {
          // Update our temporary tag with the real ID from the server
          const tagIndex = localQuote.value.tags.findIndex(t => t.id === newTag.id);
          if (tagIndex !== -1) {
            // Update the tag in our local quote with the real ID
            localQuote.value.tags[tagIndex].id = tagResponse.id;
          }
          
          // Persist to backend
          await QuoteService.addTagToQuote(localQuote.value.id, tagResponse.id);
        }
      } catch (apiError) {
        console.error('API error adding tag:', apiError);
      }
    } else {
      console.log('Tag already exists:', tagTitle);
    }
  } catch (error) {
    console.error('Error adding tag:', error);
  }
};

const handleRemoveTag = async ({ quoteId, tagId }) => {
  try {
    await QuoteService.removeTagFromQuote(quoteId, tagId);
    
    // Update the local quote data
    const updatedQuote = await QuoteService.getQuote(quoteId);
    if (updatedQuote) {
      emit('update-quote', updatedQuote);
    }
  } catch (error) {
    console.error('Error removing tag:', error);
    // You might want to show an error message to the user here
  }
};

const emitPreviousQuote = () => {
  // Close the modal first
  showModal.value = false;
  // Then emit the event after a short delay
  setTimeout(() => {
    emit('previous-quote');
  }, 50);
};

const emitNextQuote = () => {
  // Close the modal first
  showModal.value = false;
  // Then emit the event after a short delay
  setTimeout(() => {
    emit('next-quote');
  }, 50);
};
</script>

<style scoped>
.quote-card {
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.quote-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(30, 58, 138, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.quote-card:hover::before {
  opacity: 1;
}

.quote-card:hover .quote-decoration {
  opacity: 1;
}

.quote-content {
  position: relative;
  padding: 1rem 0;
}

.quote-mark {
  font-family: Georgia, serif;
  transition: all 0.3s ease;
}

.quote-card:hover .quote-mark {
  transform: scale(1.1);
  opacity: 0.3;
}

.tag-pill {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.tag-pill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.tag-pill:hover::before {
  transform: translateX(100%);
}

.tag-pill:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.newly-added-tag {
  animation: pulsate 2s ease-out;
  animation-iteration-count: 3;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
}

@keyframes pulsate {
  0% {
    transform: scale(1);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 24px rgba(59, 130, 246, 1);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
  }
}

/* Dark mode adjustments */
:root.dark .quote-card {
  background: linear-gradient(145deg, #1f2937, #111827);
}

:root.dark .quote-card::before {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 58, 138, 0.1));
}

:root.dark .tag-pill {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:root.dark .tag-pill:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Enhanced Fancy Button Styles */
:deep(.fancy-button) {
  position: relative;
  overflow: hidden;
  border-radius: 50%;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid transparent;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
}

:deep(.fancy-button::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

:deep(.fancy-button:hover::before) {
  transform: translateX(100%);
}

:deep(.fancy-button::after) {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(45deg, var(--primary-color), var(--primary-400));
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.fancy-button:hover::after) {
  opacity: 1;
}

:deep(.fancy-button:hover) {
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

:deep(.fancy-button:active) {
  transform: translateY(0) scale(0.95);
}

:deep(.fancy-button .p-button-icon) {
  font-size: 1.1rem;
  transition: all 0.4s ease;
  position: relative;
  z-index: 1;
}

:deep(.fancy-button:hover .p-button-icon) {
  transform: scale(1.2) rotate(5deg);
}

/* Special styles for each button type */
:deep(.favorite-button) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
}

:deep(.favorite-button.p-button-danger) {
  color: var(--red-500);
  background: linear-gradient(135deg, rgba(var(--red-500-rgb), 0.2), rgba(var(--red-500-rgb), 0.1));
}

:deep(.favorite-button.p-button-danger::after) {
  background: linear-gradient(45deg, var(--red-500), var(--red-400));
}

:deep(.favorite-button:hover) {
  background: linear-gradient(135deg, rgba(var(--red-500-rgb), 0.3), rgba(var(--red-500-rgb), 0.1));
  box-shadow: 0 8px 16px rgba(var(--red-500-rgb), 0.2);
}

:deep(.edit-button) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
}

:deep(.edit-button:hover) {
  background: linear-gradient(135deg, rgba(var(--primary-500-rgb), 0.3), rgba(var(--primary-500-rgb), 0.1));
  box-shadow: 0 8px 16px rgba(var(--primary-500-rgb), 0.2);
}

:deep(.edit-button::after) {
  background: linear-gradient(45deg, var(--primary-500), var(--primary-400));
}

:deep(.tag-button) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
}

:deep(.tag-button:hover) {
  background: linear-gradient(135deg, rgba(var(--green-500-rgb), 0.3), rgba(var(--green-500-rgb), 0.1));
  box-shadow: 0 8px 16px rgba(var(--green-500-rgb), 0.2);
}

:deep(.tag-button::after) {
  background: linear-gradient(45deg, var(--green-500), var(--green-400));
}

/* Enhanced List Button Styles */
:deep(.list-button) {
  background: transparent;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.list-button::before) {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, 
    rgba(147, 51, 234, 0.1),
    rgba(168, 85, 247, 0.1)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.list-button:hover::before) {
  opacity: 1;
}

:deep(.list-button:hover) {
  background: linear-gradient(135deg, 
    rgba(147, 51, 234, 0.2),
    rgba(168, 85, 247, 0.2)
  );
  box-shadow: 0 8px 16px rgba(147, 51, 234, 0.2);
  transform: translateY(-3px) scale(1.1);
}

:deep(.list-button:active) {
  transform: translateY(0) scale(0.95);
}

:deep(.list-button .p-button-icon) {
  color: var(--purple-500);
  font-size: 1.1rem;
  transition: all 0.4s ease;
}

:deep(.list-button:hover .p-button-icon) {
  color: var(--purple-400);
  transform: scale(1.2) rotate(5deg);
}

/* Dark mode adjustments for list button */
:root.dark {
  :deep(.list-button) {
    background: transparent;
  }

  :deep(.list-button:hover) {
    background: linear-gradient(135deg, 
      rgba(147, 51, 234, 0.2),
      rgba(168, 85, 247, 0.15)
    );
    box-shadow: 0 8px 16px rgba(147, 51, 234, 0.3);
  }

  :deep(.list-button .p-button-icon) {
    color: var(--purple-400);
  }

  :deep(.list-button:hover .p-button-icon) {
    color: var(--purple-300);
  }
}

/* Button group hover effect */
.button-group {
  position: relative;
  padding: 0.5rem;
  border-radius: 1rem;
  transition: all 0.3s ease;
}

.button-group::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, 
    rgba(var(--primary-500-rgb), 0.15),
    rgba(var(--primary-500-rgb), 0.05) 40%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: 1rem;
  backdrop-filter: blur(8px);
}

.button-group:hover::before {
  opacity: 1;
}

/* Dark mode adjustments */
:root.dark {
  :deep(.fancy-button) {
    background: rgba(255, 255, 255, 0.05);
  }

  :deep(.favorite-button) {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  }

  :deep(.favorite-button.p-button-danger) {
    background: linear-gradient(135deg, rgba(var(--red-500-rgb), 0.3), rgba(var(--red-500-rgb), 0.1));
  }

  :deep(.edit-button) {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  }

  :deep(.tag-button) {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  }

  :deep(.list-button) {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  }

  .button-group::before {
    background: radial-gradient(circle at center, 
      rgba(var(--primary-400-rgb), 0.2),
      rgba(var(--primary-400-rgb), 0.1) 40%,
      transparent 70%
    );
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  :deep(.fancy-button) {
    width: 2.5rem;
    height: 2.5rem;
  }

  :deep(.fancy-button .p-button-icon) {
    font-size: 1rem;
  }

  .button-group {
    padding: 0.25rem;
  }
}

/* Animation keyframes */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--primary-500-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0);
  }
}

:deep(.fancy-button:hover) {
  animation: pulse 2s infinite;
}

/* Enhanced Menu Styles */
:deep(.enhanced-menu) {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 0.5rem;
  min-width: 200px;
}

:deep(.enhanced-menu .p-menuitem) {
  margin: 0.25rem 0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.enhanced-menu .p-menuitem-link) {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.enhanced-menu .p-menuitem-link:hover) {
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
}

:deep(.enhanced-menu .p-menuitem-icon) {
  color: var(--primary-500);
  margin-right: 0.75rem;
  transition: all 0.3s ease;
}

:deep(.enhanced-menu .p-menuitem-link:hover .p-menuitem-icon) {
  transform: scale(1.1);
}

:deep(.enhanced-menu .p-menuitem-text) {
  color: var(--text-color);
  font-weight: 500;
}

/* Dark mode adjustments for menu */
:root.dark {
  :deep(.enhanced-menu) {
    background: var(--surface-ground);
    border-color: var(--surface-border);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  :deep(.enhanced-menu .p-menuitem-link:hover) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.15),
      rgba(var(--primary-400-rgb), 0.05)
    );
  }
}

/* Enhanced QuoteListMenu Styles */
:deep(.p-menu) {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  padding: 0.75rem;
  min-width: 280px;
  backdrop-filter: blur(12px);
  animation: menuAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.p-menu .p-menuitem) {
  margin: 0.25rem 0;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.p-menu .p-menuitem-link) {
  padding: 0.875rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.p-menu .p-menuitem-link:hover) {
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
  transform: translateX(4px);
}

:deep(.p-menu .p-menuitem-icon) {
  color: var(--primary-500);
  font-size: 1.1rem;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.1),
    rgba(var(--primary-500-rgb), 0.05)
  );
  padding: 0.5rem;
  border-radius: 8px;
}

:deep(.p-menu .p-menuitem-link:hover .p-menuitem-icon) {
  transform: scale(1.1) rotate(5deg);
  background: linear-gradient(135deg, 
    rgba(var(--primary-500-rgb), 0.2),
    rgba(var(--primary-500-rgb), 0.1)
  );
}

:deep(.p-menu .p-menuitem-text) {
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

:deep(.p-menu .p-menuitem-link:hover .p-menuitem-text) {
  color: var(--primary-500);
  transform: translateX(2px);
}

:deep(.p-menu .p-submenu-list) {
  background: var(--surface-card);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 0.5rem;
  margin-top: 0.5rem;
  border: 1px solid var(--surface-border);
}

:deep(.p-menu .p-menuitem-separator) {
  border-top: 1px solid var(--surface-border);
  margin: 0.5rem 0;
  opacity: 0.5;
}

/* Dark mode adjustments */
:root.dark {
  :deep(.p-menu) {
    background: var(--surface-ground);
    border-color: var(--surface-border);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  }

  :deep(.p-menu .p-menuitem-link:hover) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.15),
      rgba(var(--primary-400-rgb), 0.05)
    );
  }

  :deep(.p-menu .p-menuitem-icon) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.15),
      rgba(var(--primary-400-rgb), 0.05)
    );
  }

  :deep(.p-menu .p-menuitem-link:hover .p-menuitem-icon) {
    background: linear-gradient(135deg, 
      rgba(var(--primary-400-rgb), 0.25),
      rgba(var(--primary-400-rgb), 0.15)
    );
  }

  :deep(.p-menu .p-submenu-list) {
    background: var(--surface-ground);
    border-color: var(--surface-border);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

@keyframes menuAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
