<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { QuoteService } from '@/service/QuoteService';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Divider from 'primevue/divider';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import axios from 'axios';
import { getCookie } from '@/api';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const quote = ref(null);
const loading = ref(true);
const editDialog = ref(false);
const editedQuote = ref({});
const editedTags = ref([]);
const newTagText = ref('');

// Notes-related state
const newNote = ref('');
const isPrivateNote = ref(false);
const submittingNote = ref(false);
const editingNoteId = ref(null);
const editedNoteContent = ref('');

// Fetch quote details
const fetchQuote = async () => {
  const quoteId = route.params.id;
  if (!quoteId) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Quote ID is missing',
      life: 3000
    });
    return;
  }

  try {
    loading.value = true;
    const data = await QuoteService.getQuote(quoteId);
    quote.value = data;
    console.log('Quote details:', data);
  } catch (error) {
    console.error('Error fetching quote:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load quote details',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Notes functionality
const addNote = async () => {
  if (!newNote.value.trim()) return;
  
  submittingNote.value = true;
  try {
    const response = await axios.post('/api/quote-notes/', {
      quote: quote.value.id,
      content: newNote.value.trim(),
      is_private: isPrivateNote.value
    }, {
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      }
    });
    
    // Refresh quote to get updated notes
    await fetchQuote();
    
    // Reset form
    newNote.value = '';
    isPrivateNote.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Note Added',
      detail: 'Your note has been added successfully',
      life: 2000
    });
  } catch (error) {
    console.error('Error adding note:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to add note',
      life: 3000
    });
  } finally {
    submittingNote.value = false;
  }
};

const startEditNote = (note) => {
  editingNoteId.value = note.id;
  editedNoteContent.value = note.content;
};

const cancelEditNote = () => {
  editingNoteId.value = null;
  editedNoteContent.value = '';
};

const saveEditedNote = async (noteId) => {
  if (!editedNoteContent.value.trim()) return;
  
  try {
    const response = await axios.patch(`/api/quote-notes/${noteId}/`, {
      content: editedNoteContent.value.trim()
    }, {
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      }
    });
    
    // Refresh quote to get updated notes
    await fetchQuote();
    
    // Reset editing state
    editingNoteId.value = null;
    editedNoteContent.value = '';
    
    toast.add({
      severity: 'success',
      summary: 'Note Updated',
      detail: 'Your note has been updated successfully',
      life: 2000
    });
  } catch (error) {
    console.error('Error updating note:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update note',
      life: 3000
    });
  }
};

const deleteNote = async (noteId) => {
  confirm.require({
    message: 'Are you sure you want to delete this note?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await axios.delete(`/api/quote-notes/${noteId}/`, {
          headers: {
            'X-CSRFToken': getCookie('csrftoken')
          }
        });
        
        // Refresh quote to get updated notes
        await fetchQuote();
        
        toast.add({
          severity: 'success',
          summary: 'Note Deleted',
          detail: 'Your note has been deleted successfully',
          life: 2000
        });
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete note',
          life: 3000
        });
      }
    }
  });
};

// Toggle favorite status
const toggleFavorite = async () => {
  try {
    const response = await QuoteService.toggleFavorite(quote.value.id);
    quote.value.is_favorite = response.is_favorite;
    
    toast.add({
      severity: 'success',
      summary: quote.value.is_favorite ? 'Added to Favorites' : 'Removed from Favorites',
      detail: quote.value.is_favorite ? 'Quote added to your favorites' : 'Quote removed from your favorites',
      life: 2000
    });
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update favorite status',
      life: 3000
    });
  }
};

// Open edit dialog
const openEditDialog = () => {
  editedQuote.value = { ...quote.value };
  // Store the full tag data including colors
  editedTags.value = quote.value.tags_data ? 
    [...quote.value.tags_data] : [];
  editDialog.value = true;
};

// Tag functions
const addTag = () => {
  if (newTagText.value.trim()) {
    // Avoid duplicates
    if (!editedTags.value.some(tag => tag.title === newTagText.value.trim())) {
      // Add new tag with default gradient
      editedTags.value.push({
        title: newTagText.value.trim(),
        gradient_primary_color: '#3B82F6',
        gradient_secondary_color: '#1E3A8A'
      });
    }
    newTagText.value = '';
  }
};

const removeTag = (index) => {
  editedTags.value.splice(index, 1);
};

// Save edited quote
const saveQuote = async () => {
  try {
    // Add tags to the quote data - extract only the titles for the API
    const quoteData = {
      ...editedQuote.value,
      tags: editedTags.value.map(tag => tag.title) // Send tag titles as array of strings
    };
    
    const response = await QuoteService.updateQuote(quoteData.id, quoteData);
    quote.value = response;
    editDialog.value = false;
    
    toast.add({
      severity: 'success',
      summary: 'Quote Updated',
      detail: 'Quote has been successfully updated',
      life: 2000
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update quote',
      life: 3000
    });
  }
};

// Delete quote
const confirmDelete = () => {
  confirm.require({
    message: 'Are you sure you want to delete this quote?',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: deleteQuote,
    reject: () => {}
  });
};

const deleteQuote = async () => {
  try {
    await QuoteService.deleteQuote(quote.value.id);
    
    toast.add({
      severity: 'success',
      summary: 'Quote Deleted',
      detail: 'Quote has been successfully deleted',
      life: 2000
    });
    
    // Navigate back to quotes list
    router.push('/quotes');
  } catch (error) {
    console.error('Error deleting quote:', error);
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: 'Failed to delete quote',
      life: 3000
    });
  }
};

// Go back to previous page
const goBack = () => {
  router.back();
};

// Watch for route parameter changes to reload data when navigating between quotes
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchQuote();
  }
}, { immediate: false });

onMounted(() => {
  fetchQuote();
});
</script>

<template>
  <div class="surface-ground px-4 py-5 md:px-6 lg:px-8">
    <div class="flex justify-content-between align-items-center mb-4">
      <Button icon="pi pi-arrow-left" label="Back" class="p-button-text" @click="goBack" />
      <div v-if="!loading && quote">
        <Button icon="pi pi-pencil" class="p-button-text mr-2" @click="openEditDialog" />
        <Button 
          :icon="quote.is_favorite ? 'pi pi-heart-fill' : 'pi pi-heart'" 
          :class="{'p-button-danger': quote.is_favorite, 'p-button-text': !quote.is_favorite}"
          @click="toggleFavorite" 
        />
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-content-center py-8">
      <i class="pi pi-spin pi-spinner text-primary" style="font-size: 2rem"></i>
    </div>
    
    <div v-else-if="quote" class="grid">
      <div class="col-12">
        <Card>
          <template #title>
            <div class="flex align-items-center">
              <h2 class="m-0 text-xl">{{ quote.title }}</h2>
            </div>
          </template>
          
          <template #subtitle>
            <div class="text-color-secondary">
              From 
              <router-link 
                :to="`/books/${quote.book?.id}`" 
                class="font-medium text-primary hover:underline"
              >
                {{ quote.book?.title || 'Unknown book' }}
              </router-link>
              <template v-if="quote.book?.author">
                by 
                <router-link 
                  :to="`/authors/${quote.book.author.id}`" 
                  class="hover:underline"
                >
                  {{ quote.book.author.name }}
                </router-link>
              </template>
            </div>
          </template>
          
          <template #content>
            <div class="quote-content mb-5">
              <p class="text-2xl line-height-3 my-4 font-italic">
                "{{ quote.body }}"
              </p>
            </div>
            
            <Divider />
            
            <div class="grid">
              <div class="col-12 md:col-6 mb-3 md:mb-0">
                <h3 class="text-sm font-medium text-color-secondary mb-2">Details</h3>
                <ul class="list-none p-0 m-0">
                  <li class="mb-2">
                    <span class="font-medium">Chapter:</span> {{ quote.chapter || 'Not specified' }}
                  </li>
                  <li class="mb-2">
                    <span class="font-medium">Location:</span> {{ quote.location || 'Not specified' }}
                  </li>
                  <li class="mb-2">
                    <span class="font-medium">Source:</span> {{ quote.source_platform || 'Not specified' }}
                  </li>
                  <li v-if="quote.book_url" class="mb-2">
                    <span class="font-medium">Book URL:</span> 
                    <a :href="quote.book_url" target="_blank" class="text-primary hover:underline">
                      {{ quote.book_url }}
                    </a>
                  </li>
                </ul>
              </div>
              
              <div class="col-12 md:col-6">
                <h3 class="text-sm font-medium text-color-secondary mb-2">Metadata</h3>
                <ul class="list-none p-0 m-0">
                  <li class="mb-2">
                    <span class="font-medium">Added:</span> {{ new Date(quote.created).toLocaleDateString() }}
                  </li>
                  <li class="mb-2">
                    <span class="font-medium">Last Updated:</span> {{ new Date(quote.updated).toLocaleDateString() }}
                  </li>
                  <li class="mb-2">
                    <span class="font-medium">Status:</span>
                    <span :class="{'text-green-500': !quote.archive, 'text-orange-500': quote.archive}">
                      {{ quote.archive ? 'Archived' : 'Active' }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- Tags Section -->
            <div class="mt-4">
              <h3 class="text-sm font-medium text-color-secondary mb-2">Tags</h3>
              <div v-if="quote.tags_data && quote.tags_data.length > 0" class="flex flex-wrap gap-2">
                <div
                  v-for="(tag, idx) in quote.tags_data"
                  :key="idx"
                  class="px-3 py-1 rounded-full text-white text-xs shadow-sm cursor-pointer hover:opacity-90"
                  :style="{ background: tag.gradient_primary_color && tag.gradient_secondary_color ? 
                    `linear-gradient(135deg, ${tag.gradient_primary_color}, ${tag.gradient_secondary_color})` : 
                    'linear-gradient(135deg, #3B82F6, #1E3A8A)' }"
                  @click="() => router.push(`/tags/${tag.id}`)"
                >
                  {{ tag.title }}
                </div>
              </div>
              <p v-else class="text-color-secondary">No tags assigned to this quote</p>
            </div>
            
            <!-- Notes Section -->
            <Divider />
            <div class="notes-section mt-4">
              <h3 class="text-xl font-medium mb-3">Notes & Comments</h3>
              
              <!-- Add Note Form -->
              <div class="add-note-form p-4 bg-surface-50 dark:bg-surface-800 border-round-xl mb-4 shadow-1">
                <h4 class="text-base font-medium mb-3">Add a Note</h4>
                <Textarea 
                  v-model="newNote"
                  rows="3"
                  placeholder="Write your thoughts about this quote..."
                  class="w-full mb-3 rounded-textarea"
                  :disabled="submittingNote"
                />
                <div class="field-checkbox mb-3">
                  <input type="checkbox" id="private-note" v-model="isPrivateNote" class="mr-2" />
                  <label for="private-note" class="cursor-pointer">Make note private</label>
                </div>
                <div class="flex justify-content-end">
                  <Button 
                    label="Add Note" 
                    icon="pi pi-plus" 
                    @click="addNote"
                    :loading="submittingNote"
                    :disabled="!newNote.trim()"
                    class="p-button-raised p-button-primary p-button-rounded"
                  />
                </div>
              </div>
              
              <!-- Notes List -->
              <div v-if="quote.notes && quote.notes.length > 0" class="notes-list">
                <div 
                  v-for="note in quote.notes" 
                  :key="note.id" 
                  class="note-item p-4 mb-4 border-round-xl shadow-1 transition-all transition-duration-200"
                  :class="{
                    'bg-blue-50 dark:bg-blue-900 border-left-3 border-blue-500': note.is_private, 
                    'bg-surface-50 dark:bg-surface-800': !note.is_private
                  }"
                >
                  <div class="flex align-items-center justify-content-between mb-3">
                    <div class="flex align-items-center flex-wrap gap-2">
                      <span class="font-medium text-primary">{{ note.user.username }}</span>
                      <span class="text-sm text-color-secondary">{{ new Date(note.created).toLocaleString() }}</span>
                      <span v-if="note.is_private" class="text-xs bg-blue-500 text-white px-2 py-1 border-round-xl">Private</span>
                    </div>
                    <div v-if="note.user.id === quote.owner" class="note-actions">
                      <Button 
                        v-if="editingNoteId !== note.id" 
                        icon="pi pi-pencil" 
                        class="p-button-text p-button-rounded p-button-sm mr-1" 
                        @click="startEditNote(note)"
                        aria-label="Edit note"
                      />
                      <Button 
                        v-if="editingNoteId !== note.id" 
                        icon="pi pi-trash" 
                        class="p-button-text p-button-rounded p-button-danger p-button-sm" 
                        @click="deleteNote(note.id)"
                        aria-label="Delete note"
                      />
                    </div>
                  </div>
                  
                  <div v-if="editingNoteId === note.id" class="editing-note bg-white dark:bg-gray-900 p-3 border-round-xl">
                    <Textarea 
                      v-model="editedNoteContent"
                      rows="3"
                      class="w-full mb-3 rounded-textarea"
                      autoFocus
                    />
                    <div class="flex justify-content-end gap-2">
                      <Button 
                        label="Cancel" 
                        icon="pi pi-times"
                        class="p-button-outlined p-button-rounded p-button-sm" 
                        @click="cancelEditNote"
                      />
                      <Button 
                        label="Save" 
                        icon="pi pi-check"
                        class="p-button-rounded p-button-sm" 
                        @click="saveEditedNote(note.id)"
                      />
                    </div>
                  </div>
                  <p v-else class="note-content mb-0 line-height-3">{{ note.content }}</p>
                </div>
              </div>
              <div v-else class="text-center p-4 bg-surface-50 dark:bg-surface-800 border-round-xl shadow-1">
                <i class="pi pi-comments text-4xl text-color-secondary mb-3 opacity-60"></i>
                <p class="m-0 text-color-secondary">No notes yet. Be the first to add a note!</p>
              </div>
            </div>
          </template>
          
          <template #footer>
            <div class="flex justify-content-between gap-4">
              <Button 
                label="Edit" 
                icon="pi pi-pencil" 
                @click="openEditDialog" 
              />
              <Button 
                label="Delete" 
                icon="pi pi-trash" 
                class="p-button-danger" 
                @click="confirmDelete" 
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
    
    <div v-else class="text-center p-5">
      <i class="pi pi-exclamation-circle text-yellow-500 text-5xl mb-3"></i>
      <h2 class="text-xl font-medium mb-2">Quote Not Found</h2>
      <p class="mb-4">The quote you're looking for doesn't exist or has been removed.</p>
      <Button label="Back to Quotes" icon="pi pi-arrow-left" @click="() => router.push('/quotes')" />
    </div>
    
    <!-- Edit Dialog -->
    <Dialog 
      v-model:visible="editDialog" 
      header="Edit Quote" 
      :style="{width: '80vw', maxWidth: '1000px'}" 
      :modal="true"
      :blockScroll="true"
      class="edit-quote-dialog"
    >
      <div class="p-fluid p-4">
        <div class="field mb-5">
          <label for="title" class="font-medium mb-3 block text-xl">Title</label>
          <InputText 
            id="title" 
            v-model="editedQuote.title" 
            aria-describedby="title-help"
            class="p-inputtext-lg" 
            style="padding: 1rem; font-size: 1.25rem; border-radius: 8px; width: 100%;"
          />
          <small id="title-help" class="text-color-secondary mt-2 block text-base">A descriptive title for the quote</small>
        </div>
        
        <div class="field mb-5">
          <label for="body" class="font-medium mb-3 block text-xl">Quote Text</label>
          <Textarea 
            id="body" 
            v-model="editedQuote.body" 
            rows="10" 
            autoResize 
            aria-describedby="body-help"
            class="p-inputtext-lg"
            style="padding: 1rem; font-size: 1.25rem; line-height: 1.6; border-radius: 8px; width: 100%;"
          />
          <small id="body-help" class="text-color-secondary mt-2 block text-base">The full text of the quote</small>
        </div>
        
        <div class="field mb-5">
          <label class="font-medium mb-3 block text-xl">Tags</label>
          <div class="flex flex-wrap gap-2 mb-3">
            <div
              v-for="(tag, idx) in editedTags"
              :key="idx"
              class="flex items-center px-3 py-1 rounded-full text-white text-xs shadow-sm"
              :style="{ background: tag.gradient_primary_color && tag.gradient_secondary_color ? 
                `linear-gradient(135deg, ${tag.gradient_primary_color}, ${tag.gradient_secondary_color})` : 
                'linear-gradient(135deg, #3B82F6, #1E3A8A)' }"
            >
              {{ tag.title }}
              <Button 
                icon="pi pi-times" 
                class="p-button-rounded p-button-text p-button-sm text-white ml-1" 
                @click="removeTag(idx)"
                style="width: 1.5rem; height: 1.5rem;"
              />
            </div>
            
            <!-- Add tag input -->
            <div class="flex">
              <InputText
                v-model="newTagText"
                placeholder="Add tag"
                class="p-inputtext-sm mr-2"
                style="height: 2rem; width: 10rem;"
                @keydown.enter.prevent="addTag"
              />
              <Button
                icon="pi pi-plus"
                class="p-button-sm p-button-success"
                @click="addTag"
                :disabled="!newTagText.trim()"
              />
            </div>
          </div>
          <small class="text-color-secondary block text-base">Add tags to categorize your quote</small>
        </div>
        
        <div class="grid">
          <div class="col-12 md:col-6 field pr-md-3 mb-5">
            <label for="chapter" class="font-medium mb-3 block text-xl">Chapter</label>
            <InputText 
              id="chapter" 
              v-model="editedQuote.chapter"
              class="p-inputtext-lg" 
              style="padding: 1rem; font-size: 1.25rem; border-radius: 8px; width: 100%;"
            />
          </div>
          
          <div class="col-12 md:col-6 field pl-md-3 mb-5">
            <label for="location" class="font-medium mb-3 block text-xl">Location</label>
            <InputText 
              id="location" 
              v-model="editedQuote.location"
              class="p-inputtext-lg" 
              style="padding: 1rem; font-size: 1.25rem; border-radius: 8px; width: 100%;"
            />
          </div>
        </div>
        
        <div class="field mb-5">
          <label for="book_url" class="font-medium mb-3 block text-xl">Book URL</label>
          <InputText 
            id="book_url" 
            v-model="editedQuote.book_url"
            class="p-inputtext-lg" 
            style="padding: 1rem; font-size: 1.25rem; border-radius: 8px; width: 100%;"
            placeholder="https://example.com/book"
            aria-describedby="book_url-help"
          />
          <small id="book_url-help" class="text-color-secondary mt-2 block text-base">URL to the book in Google Books or other external platforms</small>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-content-between p-3">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            class="p-button-text p-button-lg" 
            style="font-size: 1.1rem; padding: 0.75rem 1.5rem;"
            @click="editDialog = false" 
          />
          <Button 
            label="Save" 
            icon="pi pi-check" 
            class="p-button-lg"
            style="font-size: 1.1rem; padding: 0.75rem 1.5rem;"
            @click="saveQuote" 
          />
        </div>
      </template>
    </Dialog>
    
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.quote-content {
  position: relative;
  padding: 1.5rem 2rem;
  background-color: var(--surface-50);
  border-radius: 0.5rem;
}

.quote-content::before {
  content: '"';
  position: absolute;
  top: -1.5rem;
  left: 0;
  font-size: 5rem;
  color: var(--primary-color);
  opacity: 0.2;
  font-family: serif;
}

.quote-content p {
  position: relative;
  z-index: 1;
}

/* Notes styling */
.notes-section {
  margin-top: 2rem;
}

.add-note-form {
  transition: all 0.3s ease;
  border-radius: 24px !important;
  overflow: hidden;
}

.add-note-form:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.note-item {
  position: relative;
  transition: all 0.2s ease;
  border: 1px solid var(--surface-200);
  border-radius: 24px !important;
  overflow: hidden;
}

.note-item:hover {
  transform: translateY(-2px);
  border-color: var(--surface-300);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.note-content {
  white-space: pre-line;
  color: var(--text-color);
}

.note-actions {
  opacity: 0.4;
  transition: opacity 0.2s ease;
}

.note-item:hover .note-actions {
  opacity: 1;
}

.editing-note {
  border: 1px solid var(--surface-300);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border-radius: 18px !important;
  overflow: hidden;
}

.rounded-textarea {
  border-radius: 18px !important;
}

.tag-pill {
  border-radius: 50px;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style> 