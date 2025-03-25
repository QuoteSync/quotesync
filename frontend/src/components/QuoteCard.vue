<template>
  <div
    class="w-full p-6 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
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
            class="flex items-center px-3 py-1 bg-gradient-to-r from-blue-200 to-blue-300 text-blue-800 rounded-full text-xs shadow-sm"
          >
            {{ tag }}
            <button class="ml-1 text-red-500 focus:outline-none" @click="removeTag(idx)">
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
      <p class="text-xl italic">"{{ quote.body }}"</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <div
          v-for="(tag, idx) in quote.tags"
          :key="idx"
          class="px-3 py-1 bg-gradient-to-r from-blue-200 to-blue-300 text-blue-800 rounded-full text-xs shadow-sm"
        >
          {{ tag.title }}
        </div>
      </div>
      <!-- Información del libro y autor en dos líneas, junto a los botones -->
      <div class="mt-2 flex items-center justify-between">
        <div>
          <span class="text-sm font-medium text-gray-500">
            {{ quote.book?.title || "Unknown Book" }}
          </span>
          <br />
          <span class="text-sm font-medium text-gray-500">
            {{ quote.book?.author?.name || "Unknown Author" }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="p-2 rounded-full transition-colors hover:bg-gray-200 cursor-pointer"
            @click="$emit('toggle-like', quote.id)"
          >
            <i :class="heartIconClass" />
          </button>
          <button
            class="p-2 rounded transition-colors hover:bg-gray-200 cursor-pointer"
            @click="startEdit"
          >
            <i class="pi pi-pencil" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from "vue";

const props = defineProps({
  quote: { type: Object, default: () => ({ body: "", tags: [] }) },
  isNew: { type: Boolean, default: false },
  liked: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle-like", "save-edit", "save-new", "cancel-edit"]);

const isEditing = ref(props.isNew); // Si es nueva, ya iniciamos en modo edición.
const editedText = ref(props.isNew ? "" : props.quote.body);
const editedTagsArray = ref(props.quote.tags.map((tag) => tag.title) || []);
const newTag = ref("");

// Computed property para el icono del corazón.
const heartIconClass = computed(() =>
  props.liked
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
</script>

<style scoped>
/* Puedes agregar estilos adicionales para pulir la apariencia de los pills */
</style>
