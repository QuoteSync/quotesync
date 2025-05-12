<template>
  <div
    class="w-full p-6 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm relative"
  >
    <div v-if="isEditing || isNew">
      <textarea
        v-model="editedText"
        class="w-full p-2 border rounded resize-none"
        rows="3"
        :placeholder="isNew ? 'Escribe la nueva cita...' : ''"
      ></textarea>
      <!-- Sección para editar etiquetas con pills -->
      <div class="mt-2">
        <div class="flex flex-wrap gap-2 items-center">
          <div
            v-for="(tag, idx) in editedTagsArray"
            :key="idx"
            class="flex items-center px-3 py-1 rounded-full text-white text-xs shadow-sm"
            :style="{ background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' }"
          >
            {{ tag }}
            <button class="ml-1 text-white focus:outline-none" @click="removeTag(idx)">
              x
            </button>
          </div>
          <!-- Campo de entrada y botón para agregar tag -->
          <div class="flex items-center">
            <input
              type="text"
              v-model="newTag"
              @keydown.enter.prevent="addTag"
              placeholder="Añadir tag"
              class="p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
            />
            <button
              class="ml-2 p-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-xs"
              @click="addTag"
            >
              Add Tag
            </button>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-2">
        <button
          class="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          @click="cancelEdit"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          @click="save"
        >
          {{ isNew ? "Create" : "Save" }}
        </button>
      </div>
    </div>
    <div v-else>
      <p class="text-xl italic cursor-pointer hover:text-primary-500 transition-colors" @click="openQuoteModal">"{{ quote.body }}"</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <div
          v-for="(tag, idx) in localQuote.tags"
          :key="tag.id || idx"
          class="px-3 py-1 rounded-full text-white text-xs shadow-sm cursor-pointer hover:opacity-90 tag-pill"
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
      <div class="mt-2 flex items-center justify-between">
        <div>
          <span 
            class="text-sm font-medium text-gray-500 cursor-pointer hover:text-primary-500 hover:underline"
            @click.stop.prevent="handleBookClick(quote.book)"
          >
            {{ quote.book?.title || "Unknown Book" }}
          </span>
          <br />
          <span 
            class="text-sm font-medium text-gray-500 cursor-pointer hover:text-primary-500 hover:underline"
            @click.stop.prevent="handleAuthorClick(quote.book?.author)"
          >
            {{ quote.book?.author?.name || "Unknown Author" }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            icon="pi pi-heart"
            :class="{ 'p-button-rounded': true, 'p-button-text': !liked, 'p-button-danger': liked }"
            @click="$emit('toggle-like', quote.id)"
          />
          <Button
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text"
            @click="startEdit"
          />
          <GenerateTagsButton
            :quote="quote"
            class="p-button-rounded p-button-text"
            @tag-accepted="handleAddTag"
          />
          <QuoteListMenu
            :quoteId="quote.id"
            @quote-added-to-list="handleQuoteAddedToList"
            @remove-quote="$emit('remove-quote', $event)"
          />
        </div>
      </div>
    </div>
    
    <!-- Quote Modal -->
    <QuoteModal
      v-model:visible="showModal"
      :quote="quote"
      :liked="liked"
      :has-previous="hasPrevious"
      :has-next="hasNext"
      @toggle-like="$emit('toggle-like', quote.id)"
      @add-tag="handleAddTag"
      @remove-tag="handleRemoveTag"
      @previous-quote="emitPreviousQuote"
      @next-quote="emitNextQuote"
    />
    
    <!-- Actions Menu -->
    <div v-if="showActions" class="absolute top-2 right-2">
      <Button
        icon="pi pi-ellipsis-v"
        class="p-button-rounded p-button-text"
        @click="toggleMenu"
        aria-haspopup="true"
        aria-controls="overlay_menu"
      />
      <Menu
        ref="menu"
        :model="menuItems"
        :popup="true"
        aria-haspopup="true"
        aria-controls="overlay_menu"
      />
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
import QuoteListMenu from './QuoteListMenu.vue';
import QuoteModal from './QuoteModal.vue';
import TagReviewPanel from './TagReviewPanel.vue';
import GenerateTagsButton from './GenerateTagsButton.vue';
import Menu from 'primevue/menu';
import Sidebar from 'primevue/sidebar';
import { useToast } from "primevue/usetoast";

const router = useRouter();
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
const showModal = ref(false);
const isAnyModalOpen = ref(false);
const toast = useToast();

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
  showModal.value = false; // Close modal if open
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

const openQuoteModal = () => {
  if (!isAnyModalOpen.value) {
    isAnyModalOpen.value = true;
    showModal.value = true;
    
    // We'll emit the click event to let the parent know which quote is active
    emit("click", {
      ...props.quote,
      _preventModalOpen: true
    });
  }
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

watch(() => showModal.value, (newValue) => {
  if (!newValue) {
    // Our modal was closed
    isAnyModalOpen.value = false;
  }
});
</script>

<style scoped>
/* Puedes agregar estilos adicionales para pulir la apariencia de los pills */

.quote-list-menu {
  :deep(.p-button) {
    border-radius: 50%;
    background: transparent;
    border: none;
    color: #6B7280;
  }

  :deep(.p-button:hover) {
    background: #F3F4F6;
  }

  :deep(.dark .p-button) {
    color: #9CA3AF;
  }

  :deep(.dark .p-button:hover) {
    background: #374151;
  }

  :deep(.p-dropdown) {
    min-width: 200px;
  }

  :deep(.p-dropdown-panel) {
    background: white;
    border: 1px solid #E5E7EB;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  :deep(.dark .p-dropdown-panel) {
    background: #1F2937;
    border-color: #374151;
  }

  :deep(.p-dropdown-items) {
    padding: 0;
  }

  :deep(.p-dropdown-item) {
    padding: 0.75rem 1rem;
    color: #374151;
  }

  :deep(.dark .p-dropdown-item) {
    color: #E5E7EB;
  }

  :deep(.p-dropdown-item:hover) {
    background: #F3F4F6;
  }

  :deep(.dark .p-dropdown-item:hover) {
    background: #374151;
  }

  :deep(.p-dialog) {
    background: white;
  }

  :deep(.dark .p-dialog) {
    background: #1F2937;
  }

  :deep(.p-dialog-header) {
    background: white;
    border-bottom: 1px solid #E5E7EB;
    padding: 1rem;
  }

  :deep(.dark .p-dialog-header) {
    background: #1F2937;
    border-color: #374151;
  }

  :deep(.p-dialog-content) {
    background: white;
    padding: 1rem;
  }

  :deep(.dark .p-dialog-content) {
    background: #1F2937;
  }

  :deep(.p-dialog-footer) {
    background: white;
    border-top: 1px solid #E5E7EB;
    padding: 1rem;
  }

  :deep(.dark .p-dialog-footer) {
    background: #1F2937;
    border-color: #374151;
  }

  :deep(.p-inputtext) {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #E5E7EB;
    border-radius: 0.375rem;
    background: white;
  }

  :deep(.dark .p-inputtext) {
    background: #374151;
    border-color: #4B5563;
    color: #E5E7EB;
  }

  :deep(.p-button.p-button-primary) {
    background: #3B82F6;
    border-color: #3B82F6;
    color: white;
  }

  :deep(.p-button.p-button-primary:hover) {
    background: #2563EB;
    border-color: #2563EB;
  }

  :deep(.p-button.p-button-secondary) {
    background: #E5E7EB;
    border-color: #E5E7EB;
    color: #374151;
  }

  :deep(.p-button.p-button-secondary:hover) {
    background: #D1D5DB;
    border-color: #D1D5DB;
  }

  :deep(.dark .p-button.p-button-secondary) {
    background: #374151;
    border-color: #374151;
    color: #E5E7EB;
  }

  :deep(.dark .p-button.p-button-secondary:hover) {
    background: #4B5563;
    border-color: #4B5563;
  }
}

:deep(.p-menu) {
  min-width: 200px;
  background: white;
  border: 1px solid #E5E7EB;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.dark .p-menu) {
  background: #1F2937;
  border-color: #374151;
}

:deep(.p-menu-item) {
  padding: 0.75rem 1rem;
  color: #374151;
}

:deep(.dark .p-menu-item) {
  color: #E5E7EB;
}

:deep(.p-menu-item:hover) {
  background: #F3F4F6;
}

:deep(.dark .p-menu-item:hover) {
  background: #374151;
}

:deep(.p-menu-item .p-menuitem-icon) {
  color: #6B7280;
  margin-right: 0.5rem;
}

:deep(.dark .p-menu-item .p-menuitem-icon) {
  color: #9CA3AF;
}

.tag-pill {
  transition: all 0.3s ease;
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
</style>
