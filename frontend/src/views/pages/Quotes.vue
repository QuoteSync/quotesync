<script setup>
import { QuoteService } from "@/service/QuoteService";
import { TagService } from "@/service/TagService";
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";
import { onMounted, ref } from "vue";
import axios from "axios";
// import { getCookie } from "@/utils/csrf"; // Ensure you have a utility to get CSRF token
import { apiClient, getCookie } from "@/api";
import GenerateTagsButton from '@/components/GenerateTagsButton.vue';

// Reactive variables
const toast = useToast();
const dt = ref();
const quotes = ref([]);
const quoteDialog = ref(false);
const deleteQuoteDialog = ref(false);
const deleteQuotesDialog = ref(false);
const quote = ref({});
const selectedQuotes = ref([]); // ensure this is an array
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const submitted = ref(false);
const fileInput = ref(null); // hidden file input for importing quotes

// Fetch and map quotes when the component mounts
function fetchQuotes() {
  QuoteService.getQuotes().then((data) => {
    console.log("API Response:", data);
    quotes.value = data.map((item) => ({
      archive: item.archive,
      // Map the API's "body" field to our "quote" property
      quote: item.body,
      created: item.created,
      id: item.id,
      location: item.location,
      tags: item.tags,
      title: item.title,
      updated: item.updated,
      author: item.author,
      book: item.book,
    }));
    console.log(data);
  });
}

onMounted(fetchQuotes);

// Open a dialog to create a new quote (do not call POST immediately)
function openNew() {
  quote.value = {
    title: "",
    body: "",
    quote: "",
    tags: "",
    // Initialize book as an object with empty properties:
    book: { author: { id: "", name: "" }, title: "" },
  };
  submitted.value = false;
  quoteDialog.value = true;
}

// Open a dialog to edit an existing quote
function editQuote(q) {
  // Spread the selected quote into the reactive variable
  quote.value = { ...q };
  // Ensure quote.book is defined
  if (!quote.value.book) {
    quote.value.book = { author: { id: "", name: "" }, title: "" };
  }
  // Convert tags array to a comma-separated string
  if (Array.isArray(quote.value.tags)) {
    quote.value.tags = quote.value.tags.map((tag) => tag.title).join(", ");
  }
  submitted.value = false;
  quoteDialog.value = true;
}

// Hide the quote dialog
function hideDialog() {
  quoteDialog.value = false;
  submitted.value = false;
}

// Save the quote by either creating (POST) or updating (PUT) via the API
function saveQuote() {
  submitted.value = true;

  if (quote.value.title?.trim()) {
    const payload = {
      title: quote.value.title,
      body: quote.value.body, // Ensure this matches the backend field
      archive: quote.value.archive || false,
      book: quote.value.book?.id || null,
      tags: [...quote.value.tags.split(",")],
      owner: quote.value.owner || 9, // If needed, set a default or fetch dynamically
    };
    console.log("TAGS:" + quote.value.tags);

    if (quote.value.id) {
      QuoteService.updateQuote(quote.value.id, payload)
        .then((data) => {
          const index = findIndexById(quote.value.id);
          if (index !== -1) {
            quotes.value[index] = data;
          }
          toast.add({
            severity: "success",
            summary: "Successful",
            detail: quote.value.tags,
            life: 3000,
          });
          quoteDialog.value = false;
          quote.value = {};
        })
        .catch((error) => {
          console.error("PUT error:", error);
          toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data || "Unknown error",
            life: 3000,
          });
        })
        .finally(() => {
          fetchQuotes();
        });
    }
  }
}

// Utility: find a quote's index by its id in the local array
function findIndexById(id) {
  return quotes.value.findIndex((q) => q.id === id);
}

// --- Other functions remain unchanged ---

function confirmDeleteQuote(q) {
  quote.value = q;
  deleteQuoteDialog.value = true;
}

function deleteQuote() {
  QuoteService.deleteQuote(quote.value.id)
    .then(() => {
      quotes.value = quotes.value.filter((val) => val.id !== quote.value.id);
      deleteQuoteDialog.value = false;
      quote.value = {};
      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Quote Deleted",
        life: 3000,
      });
    })
    .catch((error) => {
      console.error("DELETE error:", error);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.response?.data || "Unknown error",
        life: 3000,
      });
    });
}

function exportCSV() {
  dt.value.exportCSV();
}

function confirmDeleteSelected() {
  deleteQuotesDialog.value = true;
}

function deleteSelectedQuotes() {
  quotes.value = quotes.value.filter((val) => !selectedQuotes.value.includes(val));
  deleteQuotesDialog.value = false;
  selectedQuotes.value = []; // reset to an empty array
  QuoteService.deleteMultipleQuotes(selectedQuotes.value.map((q) => q.id))
    .then(() => {
      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Quotes Deleted",
        life: 3000,
      });
    })
    .catch((error) => {
      console.error("DELETE error:", error);
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.response?.data || "Unknown error",
        life: 3000,
      });
    });
}

function importQuotes() {
  fileInput.value.click();
}

// Handle file selection and upload to Django
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await axios.post("/api/upload-quotes/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.add({
      severity: "success",
      summary: "Success",
      detail: response.data.message,
      life: 3000,
    });
    // Refresh quotes after a successful upload
    fetchQuotes();
    console.log(response.data);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.response.data.error,
      life: 3000,
    });
  }
}

// Utility to capitalize the first letter of each word
const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Add a new method to handle tag addition
function handleAddTag(quoteData, tagTitle) {
  console.log('Adding tag in Quotes view:', tagTitle);
  
  // Ensure the tag is properly capitalized
  const capitalizedTagTitle = capitalizeWords(tagTitle);
  
  // Update UI immediately
  const quoteIndex = quotes.value.findIndex(q => q.id === quoteData.id);
  
  if (quoteIndex !== -1) {
    // Clone the quote
    const updatedQuote = { ...quotes.value[quoteIndex] };
    
    // Initialize tags array if needed
    if (!updatedQuote.tags) {
      updatedQuote.tags = [];
    }
    
    // Create a temporary tag with generated ID
    const tempTag = {
      id: `temp-${Date.now()}`,
      title: capitalizedTagTitle, // Capitalized title
      isNew: true // Mark as newly added for animation
    };
    
    // Add the tag if it doesn't exist already
    if (!updatedQuote.tags.some(tag => tag.title === capitalizedTagTitle)) {
      updatedQuote.tags = [...updatedQuote.tags, tempTag];
      
      // Update the quotes array
      quotes.value[quoteIndex] = updatedQuote;
      
      // Remove the "new" status after animation completes
      setTimeout(() => {
        const quoteToUpdate = quotes.value[quoteIndex];
        if (quoteToUpdate && quoteToUpdate.tags) {
          const tagIndex = quoteToUpdate.tags.findIndex(t => t.id === tempTag.id);
          if (tagIndex !== -1) {
            quoteToUpdate.tags[tagIndex].isNew = false;
            // Update the quotes array
            quotes.value[quoteIndex] = { ...quoteToUpdate };
          }
        }
      }, 6000); // 3 iterations of 2s animation
      
      // Then call your existing service to create and add the tag
      // TagService will convert the title to a slug format internally
      TagService.createTag({ 
        title: capitalizedTagTitle,
        // Store the original title in the description field
        description: capitalizedTagTitle
      })
        .then(newTag => {
          // Update the temporary tag with the real ID
          const realTag = {
            ...tempTag,
            id: newTag.id
          };
          
          // Find and update the tag in our quotes array
          const quoteToUpdate = quotes.value[quoteIndex];
          const tagIndex = quoteToUpdate.tags.findIndex(t => t.id === tempTag.id);
          if (tagIndex !== -1) {
            quoteToUpdate.tags[tagIndex] = realTag;
            // Update the quotes array
            quotes.value[quoteIndex] = quoteToUpdate;
          }
          
          return QuoteService.addTagToQuote(quoteData.id, newTag.id);
        })
        .then(() => {
          toast.add({
            severity: 'success',
            summary: 'Tag Added',
            detail: `Added tag "${capitalizedTagTitle}" to quote`,
            life: 3000
          });
        })
        .catch(error => {
          console.error('Error adding tag:', error);
          // Refresh quotes to ensure consistent state
          fetchQuotes();
          
          toast.add({
            severity: 'error',
            summary: 'Failed to Add Tag',
            detail: 'An error occurred while adding the tag',
            life: 3000
          });
        });
    } else {
      toast.add({
        severity: 'info',
        summary: 'Tag Already Exists',
        detail: `The tag "${capitalizedTagTitle}" is already applied to this quote`,
        life: 3000
      });
    }
  }
}
</script>

<template>
  <div>
    <div class="card">
      <Toolbar class="mb-6">
        <template #start>
          <Button
            label="New"
            icon="pi pi-plus"
            severity="secondary"
            class="mr-2"
            @click="openNew"
          />
          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="secondary"
            @click="confirmDeleteSelected"
            :disabled="!selectedQuotes || !selectedQuotes.length"
          />
        </template>

        <template #end>
          <Button
            label="Import"
            icon="pi pi-download"
            severity="secondary"
            class="mr-2"
            @click="importQuotes"
          />
          <Button
            label="Export"
            icon="pi pi-upload"
            severity="secondary"
            @click="exportCSV"
          />
        </template>
      </Toolbar>

      <!-- Hidden file input for uploading .txt files -->
      <input
        type="file"
        accept=".txt"
        ref="fileInput"
        style="display: none"
        @change="handleFileUpload"
      />

      <DataTable
        ref="dt"
        v-model:selection="selectedQuotes"
        :value="quotes"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} quotes"
      >
        <template #header>
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <h4 class="m-0">Manage Quotes</h4>
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Search..." />
            </IconField>
          </div>
        </template>

        <!-- Note: Using "title" here since our quotes use the "title" property -->
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />
        <Column field="title" header="Title" sortable style="min-width: 12rem" />
        <Column
          field="book.author.name"
          header="Author"
          sortable
          style="min-width: 12rem"
        />
        <Column field="book.title" header="Book" sortable style="min-width: 12rem" />
        <Column field="quote" header="Quote" sortable style="min-width: 16rem" />
        <Column field="tags" header="Tags" sortable style="min-width: 12rem">
          <template #body="slotProps">
            <div class="flex flex-wrap gap-1">
              <span v-for="tag in slotProps.data.tags" :key="tag.id || tag.title" class="mr-1">
                <Tag 
                  :value="tag.title" 
                  :class="{'newly-added-tag': tag.isNew}" 
                  severity="info"
                />
              </span>
            </div>
          </template>
        </Column>
        <Column :exportable="false" style="min-width: 12rem">
          <template #body="slotProps">
            <div class="flex">
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text p-button-sm"
                @click="editQuote(slotProps.data)"
              />
              <GenerateTagsButton
                :quote="slotProps.data"
                class="p-button-rounded p-button-text p-button-sm"
                @tag-accepted="handleAddTag(slotProps.data, $event)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-danger p-button-sm"
                @click="confirmDeleteQuote(slotProps.data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="quoteDialog"
      :style="{ width: '450px' }"
      header="Quote Details"
      :modal="true"
    >
      <div class="flex flex-col gap-6">
        <!-- Name Field -->
        <div>
          <label for="name" class="block font-bold mb-3">Name</label>
          <InputText
            id="name"
            v-model.trim="quote.title"
            required
            autofocus
            :invalid="submitted && !quote.title"
            fluid
          />
          <small v-if="submitted && !quote.title" class="text-red-500">
            Name is required.
          </small>
        </div>

        <!-- Author Field -->
        <div>
          <label for="author" class="block font-bold mb-3">Author</label>
          <InputText
            id="author"
            v-model.trim="quote.book.author.name"
            required
            :invalid="submitted && !(quote.book && quote.book.author.name)"
            fluid
          />
          <small
            v-if="submitted && !(quote.book && quote.book.author.name)"
            class="text-red-500"
          >
            Author is required.
          </small>
        </div>

        <!-- Book Field -->
        <div>
          <label for="book" class="block font-bold mb-3">Book</label>
          <InputText
            id="book"
            v-model.trim="quote.book.title"
            required
            :invalid="submitted && !(quote.book && quote.book.title)"
            fluid
          />
          <small
            v-if="submitted && !(quote.book && quote.book.title)"
            class="text-red-500"
          >
            Book is required.
          </small>
        </div>

        <!-- Quote Field -->
        <div>
          <label for="quote" class="block font-bold mb-3">Quote</label>
          <Textarea id="quote" v-model="quote.quote" required rows="3" cols="20" fluid />
          <small v-if="submitted && !quote.quote" class="text-red-500">
            Quote is required.
          </small>
        </div>

        <!-- Tags Field -->
        <div>
          <label for="tags" class="block font-bold mb-3">Tags</label>
          <InputText
            id="tags"
            v-model.trim="quote.tags"
            placeholder="Comma separated tags"
            fluid
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" @click="saveQuote" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteQuoteDialog"
      :style="{ width: '450px' }"
      header="Confirm"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="quote">
          Are you sure you want to delete <b>{{ quote.title }}</b
          >?
        </span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="deleteQuoteDialog = false" />
        <Button label="Yes" icon="pi pi-check" @click="deleteQuote" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteQuotesDialog"
      :style="{ width: '450px' }"
      header="Confirm"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span> Are you sure you want to delete the selected quotes? </span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="deleteQuotesDialog = false" />
        <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedQuotes" />
      </template>
    </Dialog>
  </div>
</template>

<style>
.newly-added-tag {
  animation: pulsate 2s ease-out;
  animation-iteration-count: 3;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.8) !important;
}

@keyframes pulsate {
  0% {
    transform: scale(1);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.8) !important;
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 18px rgba(59, 130, 246, 1) !important;
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.8) !important;
  }
}
</style>
