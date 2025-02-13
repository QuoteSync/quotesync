<script setup>
import { QuoteService } from "@/service/QuoteService";
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";
import { onMounted, ref } from "vue";
import axios from "axios";

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
onMounted(() => {
  QuoteService.getQuotes().then((data) => {
    quotes.value = data.map((item) => ({
      archive: item.archive,
      // Map the API’s "body" field to our "quote" property
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
});

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

function editQuote(q) {
  quote.value = { ...q };
  // Ensure quote.book is defined
  if (!quote.value.book) {
    quote.value.book = { author: "", title: "" };
  }
  quoteDialog.value = true;
}

function hideDialog() {
  quoteDialog.value = false;
  submitted.value = false;
}

function saveQuote() {
  submitted.value = true;

  // Validate using "title" (not "name")
  if (quote.value.title?.trim()) {
    if (quote.value.id) {
      const index = findIndexById(quote.value.id);
      if (index !== -1) {
        quotes.value[index] = { ...quote.value };
      }
      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Quote Updated",
        life: 3000,
      });
    } else {
      quote.value.id = createId();
      quotes.value.push({ ...quote.value });
      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Quote Created",
        life: 3000,
      });
    }
    quoteDialog.value = false;
    quote.value = {};
  }
}

function confirmDeleteQuote(q) {
  quote.value = q;
  deleteQuoteDialog.value = true;
}

function deleteQuote() {
  quotes.value = quotes.value.filter((val) => val.id !== quote.value.id);
  deleteQuoteDialog.value = false;
  quote.value = {};
  toast.add({
    severity: "success",
    summary: "Successful",
    detail: "Quote Deleted",
    life: 3000,
  });
}

function findIndexById(id) {
  let index = -1;
  for (let i = 0; i < quotes.value.length; i++) {
    if (quotes.value[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
}

function createId() {
  let id = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
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
  toast.add({
    severity: "success",
    summary: "Successful",
    detail: "Quotes Deleted",
    life: 3000,
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
    QuoteService.getQuotes().then((data) => {
      quotes.value = data.map((item) => ({
        archive: item.archive,
        quote: item.body,
        created: item.created,
        id: item.id,
        location: item.location,
        tags: item.tags,
        title: item.title,
        updated: item.updated,
        book: item.book,
      }));
    });
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
        <Column field="tags" header="Tags" sortable style="min-width: 12rem" />
        <Column :exportable="false" style="min-width: 12rem">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              outlined
              rounded
              class="mr-2"
              @click="editQuote(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              outlined
              rounded
              severity="danger"
              @click="confirmDeleteQuote(slotProps.data)"
            />
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
