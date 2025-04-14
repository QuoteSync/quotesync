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
      <p class="text-xl italic cursor-pointer hover:text-primary-500 transition-colors" @click="navigateToQuoteDetails">"{{ quote.body }}"</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <div
          v-for="(tag, idx) in quote.tags"
          :key="idx"
          class="px-3 py-1 rounded-full text-white text-xs shadow-sm cursor-pointer hover:opacity-90"
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
          <QuoteListMenu
            :quoteId="quote.id"
            @quote-added-to-list="handleQuoteAddedToList"
            @remove-quote="$emit('remove-quote', $event)"
          />
        </div>
      </div>
    </div>
    
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
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from "vue";
import { useRouter } from "vue-router";
import { TagService } from "@/service/TagService";
import { QuoteListService } from '@/service/QuoteListService';
import QuoteListMenu from './QuoteListMenu.vue';
import Menu from 'primevue/menu';

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
  }
});

const emit = defineEmits(["toggle-like", "save-edit", "save-new", "cancel-edit", "remove-quote"]);

const isEditing = ref(props.isNew); // Si es nueva, ya iniciamos en modo edición.
const editedText = ref(props.isNew ? "" : props.quote.body);
const editedTagsArray = ref(props.quote.tags.map((tag) => tag.title) || []);
const newTag = ref("");

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
  }
]);

const toggleMenu = (event) => {
  menu.value.toggle(event);
};

const navigateToQuoteDetails = () => {
  console.log("Navigating to quote details:", props.quote.id);
  router.push({ name: 'quoteDetails', params: { id: props.quote.id } });
};
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
</style>
