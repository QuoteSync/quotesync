<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { QuoteService } from '@/service/QuoteService';
import { TagService } from '@/service/TagService';
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
import GenerateTagsButton from '@/components/GenerateTagsButton.vue';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const userStore = useUserStore();

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

const showDetails = ref(false);

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

// Utility to capitalize the first letter of each word
const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Handle adding a tag from AI suggestion
const handleAddTag = async (tagTitle) => {
  try {
    console.log('Adding tag in QuoteDetails:', tagTitle);
    
    // Ensure the tag is properly capitalized
    const capitalizedTagTitle = capitalizeWords(tagTitle);
    
    // Update the UI immediately with a temporary tag
    if (quote.value) {
      // Initialize tags_data array if it doesn't exist
      if (!quote.value.tags_data) {
        quote.value.tags_data = [];
      }
      
      // Avoid duplicates
      if (!quote.value.tags_data.some(tag => tag.title === capitalizedTagTitle)) {
        // Add new tag locally with temporary ID and default gradient
        const tempTag = {
          id: `temp-${Date.now()}`,
          title: capitalizedTagTitle, // Capitalized title
          gradient_primary_color: '#3B82F6',
          gradient_secondary_color: '#1E3A8A',
          isNew: true // Mark as newly added for animation
        };
        
        // Update local state
        quote.value.tags_data = [...quote.value.tags_data, tempTag];
        
        // If tags array exists, update it too
        if (quote.value.tags) {
          quote.value.tags.push(tempTag);
        }
        
        // Remove the "new" status after animation completes
        setTimeout(() => {
          if (quote.value && quote.value.tags_data) {
            const tagIndex = quote.value.tags_data.findIndex(t => t.id === tempTag.id);
            if (tagIndex !== -1) {
              quote.value.tags_data[tagIndex].isNew = false;
            }
          }
        }, 6000); // 3 iterations of 2s animation
      
        // Then persist the change to the backend
        try {
          // First, create or get the tag using TagService
          // TagService will convert the title to a slug format internally
          const tagResponse = await TagService.createTag({ 
            title: capitalizedTagTitle,
            // Store the original title in the description field
            description: capitalizedTagTitle
          });
          const tagId = tagResponse.id;
  
          // Then, add the tag to the quote
          await QuoteService.addTagToQuote(quote.value.id, tagId);
  
          // Replace our temporary tag with the real one from the server
          const tempTagIndex = quote.value.tags_data.findIndex(t => t.id === tempTag.id);
          if (tempTagIndex !== -1) {
            const realTag = {
              ...tempTag,
              id: tagId
            };
            quote.value.tags_data[tempTagIndex] = realTag;
          }
          
          toast.add({
            severity: 'success',
            summary: 'Tag Added',
            detail: `Added tag "${capitalizedTagTitle}" to quote`,
            life: 3000
          });
        } catch (apiError) {
          console.error('API error:', apiError);
          // Since we've already updated the UI, no need to show an error to the user
          // Just refresh the quote to get the accurate state
          await fetchQuote();
        }
      } else {
        toast.add({
          severity: 'info',
          summary: 'Tag Already Exists',
          detail: `The tag "${capitalizedTagTitle}" is already applied to this quote`,
          life: 3000
        });
      }
    }
  } catch (error) {
    console.error('Error adding tag:', error);
    toast.add({
      severity: 'error',
      summary: 'Failed to Add Tag',
      detail: 'An error occurred while adding the tag',
      life: 3000
    });
  }
};

onMounted(() => {
  fetchQuote();
});
</script>

<template>
  <div class="surface-ground px-4 py-5 md:px-6 lg:px-8">
    <div class="flex justify-content-between align-items-center mb-4">
      <Button icon="pi pi-arrow-left" label="Back" class="p-button-text" @click="goBack" />
      <div v-if="!loading && quote" class="flex gap-2">
        <GenerateTagsButton
          :quote="quote"
          class="p-button-text"
          @tag-accepted="handleAddTag"
        />
        <Button icon="pi pi-pencil" class="p-button-text" @click="openEditDialog" />
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
        <Card class="quote-card">
          <template #content>
            <!-- Main Quote Section -->
            <div class="quote-hero-section p-6 mb-6">
              <div class="quote-content-wrapper">
                <div class="quote-marks left">"</div>
                <p class="text-4xl line-height-3 my-4 font-italic quote-text">
                  {{ quote.body }}
                </p>
                <div class="quote-marks right">"</div>
              </div>
              
              <div class="quote-source mt-6">
                <p class="text-xl text-color-secondary">
                  <span 
                    class="cursor-pointer hover:text-primary-500 hover:underline transition-colors duration-200"
                    @click="() => router.push(`/authors/${quote.book?.author?.id}`)"
                  >
                    {{ quote.book?.author?.name || "Unknown Author" }}
                  </span>
                  <span class="mx-2 text-color-secondary">•</span>
                  <span 
                    class="cursor-pointer hover:text-primary-500 hover:underline transition-colors duration-200"
                    @click="() => router.push(`/books/${quote.book?.id}`)"
                  >
                    {{ quote.book?.title || "Unknown Book" }}
                  </span>
                </p>
              </div>

              <!-- Details Toggle Button -->
              <div class="flex justify-content-center mt-4">
                <Button
                  :icon="showDetails ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                  :label="showDetails ? 'Hide Details' : 'Show Details'"
                  class="p-button-text p-button-rounded details-toggle"
                  @click="showDetails = !showDetails"
                />
              </div>
            </div>

            <!-- Collapsible Details Section -->
            <transition name="slide-fade">
              <div v-if="showDetails" class="details-section p-6 mb-6">
                <div class="grid">
                  <div class="col-12 md:col-6 mb-3 md:mb-0">
                    <h3 class="text-lg font-medium text-color-secondary mb-3 flex items-center">
                      <i class="pi pi-info-circle mr-2"></i>
                      Details
                    </h3>
                    <ul class="list-none p-0 m-0 details-list">
                      <li class="mb-3">
                        <span class="font-medium text-color-secondary">Chapter:</span>
                        <span class="ml-2">{{ quote.chapter || 'Not specified' }}</span>
                      </li>
                      <li class="mb-3">
                        <span class="font-medium text-color-secondary">Location:</span>
                        <span class="ml-2">{{ quote.location || 'Not specified' }}</span>
                      </li>
                      <li class="mb-3">
                        <span class="font-medium text-color-secondary">Source:</span>
                        <span class="ml-2">{{ quote.source_platform || 'Not specified' }}</span>
                      </li>
                      <li v-if="quote.book_url" class="mb-3">
                        <span class="font-medium text-color-secondary">Book URL:</span>
                        <a :href="quote.book_url" target="_blank" class="ml-2 text-primary hover:underline">
                          {{ quote.book_url }}
                        </a>
                      </li>
                    </ul>
                  </div>
                  
                  <div class="col-12 md:col-6">
                    <h3 class="text-lg font-medium text-color-secondary mb-3 flex items-center">
                      <i class="pi pi-calendar mr-2"></i>
                      Metadata
                    </h3>
                    <ul class="list-none p-0 m-0 details-list">
                      <li class="mb-3">
                        <span class="font-medium text-color-secondary">Added:</span>
                        <span class="ml-2">{{ new Date(quote.created).toLocaleDateString() }}</span>
                      </li>
                      <li class="mb-3">
                        <span class="font-medium text-color-secondary">Last Updated:</span>
                        <span class="ml-2">{{ new Date(quote.updated).toLocaleDateString() }}</span>
                      </li>
                      <li class="mb-3">
                        <span class="font-medium text-color-secondary">Status:</span>
                        <span :class="{'text-green-500': !quote.archive, 'text-orange-500': quote.archive}" class="ml-2">
                          {{ quote.archive ? 'Archived' : 'Active' }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </transition>
            
            <!-- Tags Section -->
            <div class="tags-section p-6 mb-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-medium text-color-secondary flex items-center">
                  <i class="pi pi-tags mr-2"></i>
                  Tags
                </h3>
              </div>
              
              <div v-if="quote.tags_data && quote.tags_data.length > 0" class="flex flex-wrap gap-2">
                <div
                  v-for="(tag, idx) in quote.tags_data"
                  :key="tag.id || idx"
                  class="px-4 py-2 rounded-full text-white text-sm shadow-md cursor-pointer hover:scale-105 transition-all duration-200 tag-pill"
                  :class="{ 'newly-added-tag': tag.isNew }"
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
            <div class="notes-section p-6">
              <h3 class="text-xl font-medium mb-4 flex items-center">
                <i class="pi pi-comments mr-2"></i>
                Notes & Comments
              </h3>
              
              <!-- Add Note Form -->
              <div class="add-note-form p-4 bg-surface-50 dark:bg-surface-800 border-round-xl mb-4 shadow-1">
                <Textarea 
                  v-model="newNote"
                  rows="3"
                  placeholder="Write your thoughts about this quote..."
                  class="w-full mb-3 rounded-textarea"
                  :disabled="submittingNote"
                />
                <div class="flex justify-content-between align-items-center">
                  <div class="field-checkbox">
                    <input type="checkbox" id="private-note" v-model="isPrivateNote" class="mr-2" />
                    <label for="private-note" class="cursor-pointer">Make note private</label>
                  </div>
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
      :style="{width: '90vw', maxWidth: '768px'}" 
      :modal="true"
      class="p-fluid"
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
.quote-card {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.quote-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.quote-hero-section {
  background: linear-gradient(135deg, var(--surface-0), var(--surface-50));
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.quote-content-wrapper {
  position: relative;
  padding: 2rem 0;
}

.quote-marks {
  position: absolute;
  font-size: 6rem;
  color: var(--primary-color);
  opacity: 0.15;
  font-family: serif;
  line-height: 1;
}

.quote-marks.left {
  left: -1rem;
  top: -2rem;
}

.quote-marks.right {
  right: -1rem;
  bottom: -2rem;
  transform: rotate(180deg);
}

.quote-text {
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.quote-source {
  position: relative;
  z-index: 1;
}

.tags-section {
  background: linear-gradient(135deg, var(--surface-50), var(--surface-100));
  border-radius: 16px;
}

.notes-section {
  background: linear-gradient(135deg, var(--surface-100), var(--surface-200));
  border-radius: 16px;
}

.tag-pill {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

/* Dark mode adjustments */
.dark .quote-hero-section {
  background: linear-gradient(135deg, var(--surface-800), var(--surface-900));
}

.dark .tags-section {
  background: linear-gradient(135deg, var(--surface-900), var(--surface-800));
}

.dark .notes-section {
  background: linear-gradient(135deg, var(--surface-800), var(--surface-700));
}

.dark .quote-marks {
  opacity: 0.1;
}

.dark .quote-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.details-toggle {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--surface-200);
  background: var(--surface-0);
  color: var(--text-color);
}

.details-toggle:hover {
  background: var(--surface-100);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.details-section {
  background: linear-gradient(135deg, var(--surface-50), var(--surface-100));
  border-radius: 16px;
  overflow: hidden;
}

.details-list li {
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: var(--surface-0);
  border: 1px solid var(--surface-200);
}

.details-list li:hover {
  background: var(--surface-50);
  transform: translateX(4px);
  border-color: var(--surface-300);
}

/* Slide fade transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
  opacity: 1;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

/* Dark mode adjustments */
.dark .details-section {
  background: linear-gradient(135deg, var(--surface-900), var(--surface-800));
}

.dark .details-list li {
  background: var(--surface-800);
  border-color: var(--surface-700);
}

.dark .details-list li:hover {
  background: var(--surface-700);
  border-color: var(--surface-600);
}

.dark .details-toggle {
  background: var(--surface-800);
  border-color: var(--surface-700);
  color: var(--surface-0);
}

.dark .details-toggle:hover {
  background: var(--surface-700);
}
</style> 