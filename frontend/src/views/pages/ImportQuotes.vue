<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import axios from "axios";
import { getCookie } from "@/api";

// Reactive variables
const toast = useToast();
const fileInput = ref(null); // Hidden file input for importing quotes
const docxFileInput = ref(null); // Hidden file input for importing docx files
const zipFileInput = ref(null); // Hidden file input for importing zip files
const isUploading = ref(false);
const importResults = ref(null); // Store batch import results
const importHistory = ref([]); // Store import history
const isLoadingHistory = ref(false);

// Drag and drop reactive variables
const isDraggingKindle = ref(false);
const isDraggingDocx = ref(false);
const isDraggingZip = ref(false);

// Method to trigger the file input dialog
function importFromKindle() {
  fileInput.value.click();
}

// Method to trigger the docx file input dialog
function importFromGoogleBooks() {
  docxFileInput.value.click();
}

// Method to trigger the zip file input dialog
function importFromGoogleBooksZip() {
  zipFileInput.value.click();
}

// Handle file selection and upload to Django
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  await uploadKindleFile(file);
}

// Handle docx file selection and upload to Django
async function handleDocxFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  await uploadDocxFile(file);
}

// Handle zip file selection and upload to Django
async function handleZipFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  await uploadZipFile(file);
}

// Fetch import history
async function fetchImportHistory() {
  isLoadingHistory.value = true;
  try {
    const response = await axios.get("/api/import-history/", {
      headers: { "X-CSRFToken": getCookie("csrftoken") }
    });
    importHistory.value = response.data;
  } catch (error) {
    console.error("Error fetching import history:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to load import history",
      life: 3000,
    });
  } finally {
    isLoadingHistory.value = false;
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('default', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Get platform display name
function getPlatformName(platform) {
  const platforms = {
    'kindle': 'Kindle',
    'google_books': 'Google Books',
    'google_books_batch': 'Google Books (Batch)',
  };
  return platforms[platform] || platform;
}

// Get platform tag class
function getPlatformTagClass(platform) {
  const classes = {
    'kindle': 'bg-blue-50 text-blue-700',
    'google_books': 'bg-green-50 text-green-700',
    'google_books_batch': 'bg-purple-50 text-purple-700',
    'apple_books': 'bg-orange-50 text-orange-700'
  };
  return classes[platform] || 'bg-gray-50 text-gray-700';
}

// Upload Kindle file function (extracted for reuse with drag and drop)
async function uploadKindleFile(file) {
  if (!file || !file.name.endsWith('.txt')) {
    toast.add({
      severity: "error",
      summary: "Invalid File",
      detail: "Please select a valid .txt file",
      life: 3000,
    });
    return;
  }
  
  isUploading.value = true;
  
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append("file", file);
  formData.append("check_duplicates", "true"); // Add flag to check for duplicates
  
  try {
    const response = await axios.post("/api/upload-quotes/", formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
        "X-CSRFToken": getCookie("csrftoken")
      }
    });
    
    toast.add({
      severity: "success",
      summary: "Success",
      detail: response.data.message,
      life: 3000,
    });
    
    // Reset the file input if it exists
    if (fileInput.value) fileInput.value.value = '';
    
    // Refresh import history after successful import
    fetchImportHistory();
    
    console.log(response.data);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.response?.data?.error || "An error occurred during upload",
      life: 3000,
    });
  } finally {
    isUploading.value = false;
    isDraggingKindle.value = false;
  }
}

// Upload DOCX file function (extracted for reuse with drag and drop)
async function uploadDocxFile(file) {
  if (!file || !file.name.endsWith('.docx')) {
    toast.add({
      severity: "error",
      summary: "Invalid File",
      detail: "Please select a valid .docx file",
      life: 3000,
    });
    return;
  }
  
  isUploading.value = true;
  
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append("file", file);
  formData.append("check_duplicates", "true"); // Add flag to check for duplicates
  
  try {
    const response = await axios.post("/api/upload-docx/", formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
        "X-CSRFToken": getCookie("csrftoken")
      }
    });
    
    toast.add({
      severity: "success",
      summary: "Success",
      detail: `Successfully imported ${response.data.quotes_count} quotes from '${response.data.book}' by ${response.data.author}`,
      life: 5000,
    });
    
    // Reset the file input if it exists
    if (docxFileInput.value) docxFileInput.value.value = '';
    
    // Refresh import history after successful import
    fetchImportHistory();
    
    console.log(response.data);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.response?.data?.error || "An error occurred during upload",
      life: 3000,
    });
  } finally {
    isUploading.value = false;
    isDraggingDocx.value = false;
  }
}

// Upload ZIP file function (extracted for reuse with drag and drop)
async function uploadZipFile(file) {
  if (!file || !file.name.endsWith('.zip')) {
    toast.add({
      severity: "error",
      summary: "Invalid File",
      detail: "Please select a valid .zip file",
      life: 3000,
    });
    return;
  }
  
  isUploading.value = true;
  importResults.value = null;
  
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append("file", file);
  formData.append("check_duplicates", "true"); // Add flag to check for duplicates
  
  try {
    const response = await axios.post("/api/upload-zip/", formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
        "X-CSRFToken": getCookie("csrftoken")
      }
    });
    
    toast.add({
      severity: "success",
      summary: "Batch Import Complete",
      detail: response.data.message,
      life: 5000,
    });
    
    // Store the results for display
    importResults.value = response.data.results;
    
    // Reset the file input if it exists
    if (zipFileInput.value) zipFileInput.value.value = '';
    
    // Refresh import history after successful import
    fetchImportHistory();
    
    console.log(response.data);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.response?.data?.error || "An error occurred during zip file upload",
      life: 3000,
    });
  } finally {
    isUploading.value = false;
    isDraggingZip.value = false;
  }
}

// Drag and drop event handlers
function handleDragOver(event, type) {
  event.preventDefault();
  event.stopPropagation();
  
  if (type === 'kindle') isDraggingKindle.value = true;
  else if (type === 'docx') isDraggingDocx.value = true;
  else if (type === 'zip') isDraggingZip.value = true;
}

function handleDragLeave(event, type) {
  event.preventDefault();
  event.stopPropagation();
  
  if (type === 'kindle') isDraggingKindle.value = false;
  else if (type === 'docx') isDraggingDocx.value = false;
  else if (type === 'zip') isDraggingZip.value = false;
}

function handleDrop(event, type) {
  event.preventDefault();
  event.stopPropagation();
  
  const files = event.dataTransfer.files;
  if (!files || files.length === 0) return;
  
  const file = files[0];
  
  if (type === 'kindle') {
    uploadKindleFile(file);
  } else if (type === 'docx') {
    uploadDocxFile(file);
  } else if (type === 'zip') {
    uploadZipFile(file);
  }
}

// Load import history when component mounts
onMounted(() => {
  fetchImportHistory();
});
</script>

<template>
  <div class="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-900 rounded-3xl">
    <!-- Header Section -->
    <div class="sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 rounded-t-3xl">
      <div class="container mx-auto px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 class="text-4xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent rounded text-center sm:text-left">
            Import Quotes
          </h1>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8">
      <div class="grid">
        <!-- Import Options Section -->
        <div class="col-12 mb-6">
          <div class="card bg-surface-ground dark:bg-surface-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <div class="flex flex-column gap-4 p-6">
              <!-- Kindle Import Option -->
              <div class="p-6 border-round-xl bg-surface-card dark:bg-surface-800 cursor-pointer hover:bg-surface-hover dark:hover:bg-surface-700 transition-all duration-300 transform hover:-translate-y-1"
                   :class="{ 'drag-active': isDraggingKindle }"
                   @click="importFromKindle"
                   @dragover="handleDragOver($event, 'kindle')"
                   @dragleave="handleDragLeave($event, 'kindle')"
                   @drop="handleDrop($event, 'kindle')">
                <div class="flex align-items-center gap-4">
                  <div class="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                    <i class="pi pi-book text-3xl text-primary-500"></i>
                  </div>
                  <div>
                    <h4 class="m-0 font-semibold text-xl fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Import from Kindle</h4>
                    <p class="text-sm text-500 dark:text-400 m-0 mt-2">
                      Upload your Kindle highlights export (.txt) to import quotes
                    </p>
                    <p v-if="isDraggingKindle" class="text-sm text-primary-500 m-0 mt-2">
                      <i class="pi pi-upload mr-1"></i> Drop your file here
                    </p>
                    <p v-else class="text-sm text-500 dark:text-400 m-0 mt-2">
                      Click to browse or drag and drop your file here
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Google Books Import Option -->
              <div class="p-6 border-round-xl bg-surface-card dark:bg-surface-800 cursor-pointer hover:bg-surface-hover dark:hover:bg-surface-700 transition-all duration-300 transform hover:-translate-y-1"
                   :class="{ 'drag-active': isDraggingDocx }"
                   @click="importFromGoogleBooks"
                   @dragover="handleDragOver($event, 'docx')"
                   @dragleave="handleDragLeave($event, 'docx')"
                   @drop="handleDrop($event, 'docx')">
                <div class="flex align-items-center gap-4">
                  <div class="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                    <i class="pi pi-cloud-download text-3xl text-primary-500"></i>
                  </div>
                  <div>
                    <h4 class="m-0 font-semibold text-xl fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Import from Google Books</h4>
                    <p class="text-sm text-500 dark:text-400 m-0 mt-2">
                      Upload your Google Books highlights export (.docx) to import quotes
                    </p>
                    <p v-if="isDraggingDocx" class="text-sm text-primary-500 m-0 mt-2">
                      <i class="pi pi-upload mr-1"></i> Drop your file here
                    </p>
                    <p v-else class="text-sm text-500 dark:text-400 m-0 mt-2">
                      Click to browse or drag and drop your file here
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Batch Import Option -->
              <div class="p-6 border-round-xl bg-surface-card dark:bg-surface-800 cursor-pointer hover:bg-surface-hover dark:hover:bg-surface-700 transition-all duration-300 transform hover:-translate-y-1"
                   :class="{ 'drag-active': isDraggingZip }"
                   @click="importFromGoogleBooksZip"
                   @dragover="handleDragOver($event, 'zip')"
                   @dragleave="handleDragLeave($event, 'zip')"
                   @drop="handleDrop($event, 'zip')">
                <div class="flex align-items-center gap-4">
                  <div class="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                    <i class="pi pi-file-export text-3xl text-primary-500"></i>
                  </div>
                  <div>
                    <h4 class="m-0 font-semibold text-xl fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Batch Import from Google Books</h4>
                    <p class="text-sm text-500 dark:text-400 m-0 mt-2">
                      Upload a zip file containing multiple Google Books exports (.docx files)
                    </p>
                    <p v-if="isDraggingZip" class="text-sm text-primary-500 m-0 mt-2">
                      <i class="pi pi-upload mr-1"></i> Drop your file here
                    </p>
                    <p v-else class="text-sm text-500 dark:text-400 m-0 mt-2">
                      Click to browse or drag and drop your file here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Import History Section -->
        <div class="col-12 mb-6">
          <div class="card bg-surface-ground dark:bg-surface-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <div class="flex align-items-center justify-content-between p-6 border-bottom-1 border-300">
              <div class="flex items-center gap-3">
                <i class="pi pi-history text-2xl text-primary-500"></i>
                <h3 class="text-2xl font-semibold m-0 fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Import History</h3>
              </div>
              <button v-if="importHistory.length > 0" 
                      class="p-button p-button-rounded p-button-secondary" 
                      @click="fetchImportHistory()">
                <i class="pi pi-refresh mr-1"></i> Refresh
              </button>
            </div>
            
            <div v-if="isLoadingHistory" class="flex align-items-center justify-content-center p-8">
              <div class="text-center">
                <i class="pi pi-spin pi-spinner text-primary" style="font-size: 2rem;"></i>
                <div class="mt-3 font-medium text-lg">Loading import history...</div>
              </div>
            </div>
            
            <div v-else-if="importHistory.length === 0" class="p-8 text-center text-500">
              <i class="pi pi-inbox text-5xl mb-4"></i>
              <p class="text-xl">No previous imports found</p>
            </div>
            
            <div v-else class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead class="bg-surface-100 dark:bg-surface-700">
                  <tr>
                    <th class="text-left p-4 border-bottom-1 border-300">Date</th>
                    <th class="text-left p-4 border-bottom-1 border-300">Platform</th>
                    <th class="text-left p-4 border-bottom-1 border-300">File</th>
                    <th class="text-left p-4 border-bottom-1 border-300">Quotes Added</th>
                    <th class="text-left p-4 border-bottom-1 border-300">Duplicates</th>
                    <th class="text-left p-4 border-bottom-1 border-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, index) in importHistory" :key="index" 
                      class="border-bottom-1 border-300 hover:bg-surface-hover dark:hover:bg-surface-700 transition-colors transition-duration-200">
                    <td class="p-4">{{ formatDate(log.created_at) }}</td>
                    <td class="p-4">
                      <span class="p-tag" :class="getPlatformTagClass(log.platform)">
                        {{ getPlatformName(log.platform) }}
                      </span>
                    </td>
                    <td class="p-4">{{ log.file_name }}</td>
                    <td class="p-4 font-medium">{{ log.quotes_added }}</td>
                    <td class="p-4">
                      <span v-if="log.duplicates_skipped > 0" class="p-tag bg-orange-50 text-orange-700">
                        {{ log.duplicates_skipped }}
                      </span>
                      <span v-else>-</span>
                    </td>
                    <td class="p-4">
                      <span class="p-tag" :class="{
                        'p-tag-success': log.status === 'completed', 
                        'p-tag-danger': log.status === 'failed', 
                        'p-tag-info': log.status === 'pending'
                      }">
                        {{ log.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Instructions Section -->
        <div class="col-12">
          <div class="card bg-surface-ground dark:bg-surface-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <div class="grid p-6">
              <!-- Kindle Instructions -->
              <div class="col-12 md:col-6">
                <div class="p-6">
                  <div class="flex items-center gap-3 mb-6">
                    <i class="pi pi-book text-3xl text-primary-500"></i>
                    <h4 class="text-xl font-medium m-0 fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">How to Export Kindle Highlights</h4>
                  </div>
                  <ol class="m-0 pl-4">
                    <li class="mb-4">Connect your Kindle device to your computer via USB cable</li>
                    <li class="mb-4">Navigate to the Kindle drive on your computer</li>
                    <li class="mb-4">Find and open the "documents" folder</li>
                    <li class="mb-4">Locate the "My Clippings.txt" file</li>
                    <li class="mb-4">Copy this file to your computer</li>
                    <li>Upload the "My Clippings.txt" file here</li>
                  </ol>
                </div>
              </div>

              <!-- Google Books Instructions -->
              <div class="col-12 md:col-6">
                <div class="p-6">
                  <div class="flex items-center gap-3 mb-6">
                    <i class="pi pi-cloud-download text-3xl text-primary-500"></i>
                    <h4 class="text-xl font-medium m-0 fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">How to Export Google Books Highlights</h4>
                  </div>
                  <ol class="m-0 pl-4">
                    <li class="mb-4">Open Google Play Books in your web browser</li>
                    <li class="mb-4">Go to the book with your highlights</li>
                    <li class="mb-4">Click on "Notes" to view all your highlights</li>
                    <li class="mb-4">Click on the "Export" button</li>
                    <li class="mb-4">Save the file as a .docx document</li>
                    <li>Upload the .docx file here (or package multiple .docx files in a .zip file for batch import)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file inputs -->
    <input
      type="file"
      accept=".txt"
      ref="fileInput"
      style="display: none"
      @change="handleFileUpload"
    />
    
    <input
      type="file"
      accept=".docx"
      ref="docxFileInput"
      style="display: none"
      @change="handleDocxFileUpload"
    />
    
    <input
      type="file"
      accept=".zip"
      ref="zipFileInput"
      style="display: none"
      @change="handleZipFileUpload"
    />
    
    <!-- Upload status -->
    <div v-if="isUploading" class="import-loader-overlay">
      <div class="import-loader-container">
        <div class="import-loader-circle">
          <i class="pi pi-spin pi-spinner" style="font-size: 2.5rem"></i>
        </div>
        <h3 class="mt-4 text-center text-xl font-semibold">Processing Your Import</h3>
        <p class="text-center text-500 mt-2">Your quotes are being extracted and saved...</p>
        <div class="loader-progress mt-4"></div>
      </div>
    </div>
    
    <!-- Import Results -->
    <div v-if="importResults" class="mt-6 p-6 bg-surface-ground dark:bg-surface-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
      <div class="flex items-center gap-3 mb-6">
        <i class="pi pi-check-circle text-3xl text-primary-500"></i>
        <h4 class="text-xl font-medium m-0 fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Import Results</h4>
      </div>
      
      <div class="mb-6">
        <div class="text-lg mb-2"><strong>Files Processed:</strong> {{ importResults.processed_files }} of {{ importResults.total_docx_files }}</div>
        <div class="text-lg mb-2"><strong>Successfully Imported:</strong> {{ importResults.total_quotes }}</div>
        <div v-if="importResults.duplicates_skipped" class="text-orange-500 text-lg">
          <strong>Duplicates Skipped:</strong> {{ importResults.duplicates_skipped }}
        </div>
        <div v-if="importResults.duplicates_skipped" class="text-sm text-500 mt-2">
          <i class="pi pi-info-circle mr-1"></i> Duplicate quotes were found and not imported to avoid duplication.
        </div>
      </div>
      
      <div v-if="importResults.books.length > 0" class="mb-6">
        <h5 class="text-lg font-medium mb-4 fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Imported Books:</h5>
        <ul class="m-0 pl-4 space-y-2">
          <li v-for="(book, index) in importResults.books" :key="index" class="text-lg">
            <strong>{{ book.title }}</strong> by {{ book.author }} - {{ book.quotes_count }} quotes
            <span v-if="book.duplicates_skipped" class="text-orange-500">
              ({{ book.duplicates_skipped }} duplicates skipped)
            </span>
          </li>
        </ul>
      </div>
      
      <div v-if="importResults.errors.length > 0" class="mt-6">
        <h5 class="text-lg font-medium mb-4 text-red-500">Errors:</h5>
        <ul class="m-0 pl-4 space-y-2">
          <li v-for="(error, index) in importResults.errors" :key="index" class="text-lg text-red-600">
            {{ error }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Import options styling */
.border-round-xl {
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.border-round-xl::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.border-round-xl:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.border-round-xl:hover::before {
  opacity: 1;
}

/* Card styling */
.card {
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

.card:hover {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Table styling */
table {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

thead {
  background: var(--surface-ground);
}

th {
  font-weight: 600;
  letter-spacing: 0.025em;
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid var(--surface-border);
}

td {
  padding: 1.25rem 1.5rem;
  transition: all 0.2s ease;
}

tr {
  transition: all 0.3s ease;
  border-bottom: 1px solid var(--surface-border);
}

tr:hover {
  background: var(--surface-hover);
  transform: scale(1.01);
}

/* Tag styling */
.p-tag {
  border-radius: 12px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.p-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* Button styling */
.p-button {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.p-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, var(--primary-500), var(--primary-400));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.p-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(var(--primary-500-rgb), 0.2);
}

.p-button:hover::after {
  opacity: 0.1;
}

/* Instructions section styling */
ol li {
  counter-increment: item;
  margin-bottom: 1.25rem;
  padding-left: 3rem;
  position: relative;
  transition: all 0.3s ease;
}

ol li:hover {
  transform: translateX(4px);
}

ol li:before {
  content: counter(item);
  background: var(--primary-500);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  top: 0;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.2);
  transition: all 0.3s ease;
}

ol li:hover:before {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(var(--primary-500-rgb), 0.3);
}

/* Import results styling */
.border-round {
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.border-round:hover {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Dark mode adjustments */
:root.dark {
  .card {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    background: var(--surface-card);
  }
  
  .border-round-xl {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  }
  
  .border-round-xl:hover {
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }

  .p-tag {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .p-tag:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  .border-round {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  }

  .border-round:hover {
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-in {
  animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading animation */
.import-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.import-loader-container {
  background-color: var(--surface-card);
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
  text-align: center;
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.import-loader-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--primary-500);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--primary-500-rgb), 0.2);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

.loader-progress {
  height: 6px;
  background: var(--primary-500);
  background-size: 200% 100%;
  animation: progress-animation 2s infinite;
  border-radius: 8px;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(var(--primary-500-rgb), 0.2);
}

@keyframes progress-animation {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

/* Drag and drop styling */
.drag-active {
  border: 2px dashed var(--primary-color) !important;
  background: var(--surface-hover) !important;
  box-shadow: 0 0 30px rgba(var(--primary-500-rgb), 0.2);
  transform: scale(1.02);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .card {
    border-radius: 16px;
  }
  
  .border-round-xl {
    border-radius: 12px;
  }
  
  th, td {
    padding: 1rem;
  }
}

/* View transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--surface-300);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--surface-400);
}

.dark ::-webkit-scrollbar-thumb {
  background: var(--surface-600);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: var(--surface-500);
}
</style> 