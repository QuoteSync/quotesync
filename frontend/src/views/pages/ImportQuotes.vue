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
  <div class="flex flex-col">
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <div class="font-semibold text-xl">Import Quotes</div>
      </div>

      <div class="grid">
        <!-- Import Options Section -->
        <div class="col-12 mb-4">
          <div class="card">
            <div class="flex flex-column gap-4">
              <!-- Kindle Import Option -->
              <div class="p-4 border-round-xl bg-blue-50 dark:bg-blue-900 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors transition-duration-200"
                   :class="{ 'drag-active': isDraggingKindle }"
                   @click="importFromKindle"
                   @dragover="handleDragOver($event, 'kindle')"
                   @dragleave="handleDragLeave($event, 'kindle')"
                   @drop="handleDrop($event, 'kindle')">
                <div class="flex align-items-center gap-3">
                  <i class="pi pi-book text-3xl text-blue-500"></i>
                  <div>
                    <h4 class="m-0 font-semibold">Import from Kindle</h4>
                    <p class="text-sm text-500 dark:text-400 m-0 mt-1">
                      Upload your Kindle highlights export (.txt) to import quotes
                    </p>
                    <p v-if="isDraggingKindle" class="text-sm text-blue-500 m-0 mt-1">
                      <i class="pi pi-upload mr-1"></i> Drop your file here
                    </p>
                    <p v-else class="text-sm text-500 dark:text-400 m-0 mt-1">
                      Click to browse or drag and drop your file here
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Google Books Import Option -->
              <div class="p-4 border-round-xl bg-green-50 dark:bg-green-900 cursor-pointer hover:bg-green-100 dark:hover:bg-green-800 transition-colors transition-duration-200"
                   :class="{ 'drag-active': isDraggingDocx }"
                   @click="importFromGoogleBooks"
                   @dragover="handleDragOver($event, 'docx')"
                   @dragleave="handleDragLeave($event, 'docx')"
                   @drop="handleDrop($event, 'docx')">
                <div class="flex align-items-center gap-3">
                  <i class="pi pi-cloud-download text-3xl text-green-500"></i>
                  <div>
                    <h4 class="m-0 font-semibold">Import from Google Books</h4>
                    <p class="text-sm text-500 dark:text-400 m-0 mt-1">
                      Upload your Google Books highlights export (.docx) to import quotes
                    </p>
                    <p v-if="isDraggingDocx" class="text-sm text-green-500 m-0 mt-1">
                      <i class="pi pi-upload mr-1"></i> Drop your file here
                    </p>
                    <p v-else class="text-sm text-500 dark:text-400 m-0 mt-1">
                      Click to browse or drag and drop your file here
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Batch Import Option -->
              <div class="p-4 border-round-xl bg-purple-50 dark:bg-purple-900 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors transition-duration-200"
                   :class="{ 'drag-active': isDraggingZip }"
                   @click="importFromGoogleBooksZip"
                   @dragover="handleDragOver($event, 'zip')"
                   @dragleave="handleDragLeave($event, 'zip')"
                   @drop="handleDrop($event, 'zip')">
                <div class="flex align-items-center gap-3">
                  <i class="pi pi-file-export text-3xl text-purple-500"></i>
                  <div>
                    <h4 class="m-0 font-semibold">Batch Import from Google Books</h4>
                    <p class="text-sm text-500 dark:text-400 m-0 mt-1">
                      Upload a zip file containing multiple Google Books exports (.docx files)
                    </p>
                    <p v-if="isDraggingZip" class="text-sm text-purple-500 m-0 mt-1">
                      <i class="pi pi-upload mr-1"></i> Drop your file here
                    </p>
                    <p v-else class="text-sm text-500 dark:text-400 m-0 mt-1">
                      Click to browse or drag and drop your file here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Import History Section -->
        <div class="col-12 mb-4">
          <div class="card">
            <div class="flex align-items-center justify-content-between mb-3">
              <h3 class="text-xl font-semibold m-0">Import History</h3>
              <button v-if="importHistory.length > 0" class="p-button p-button-text p-button-secondary" @click="fetchImportHistory()">
                <i class="pi pi-refresh mr-1"></i> Refresh
              </button>
            </div>
            
            <div v-if="isLoadingHistory" class="flex align-items-center justify-content-center p-5">
              <div class="text-center">
                <i class="pi pi-spin pi-spinner text-primary" style="font-size: 1.5rem;"></i>
                <div class="mt-2 font-medium">Loading import history...</div>
              </div>
            </div>
            
            <div v-else-if="importHistory.length === 0" class="p-3 text-center text-500">
              <i class="pi pi-inbox text-xl mb-2"></i>
              <p>No previous imports found</p>
            </div>
            
            <div v-else class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th class="text-left p-3 border-bottom-1 border-300">Date</th>
                    <th class="text-left p-3 border-bottom-1 border-300">Platform</th>
                    <th class="text-left p-3 border-bottom-1 border-300">File</th>
                    <th class="text-left p-3 border-bottom-1 border-300">Quotes Added</th>
                    <th class="text-left p-3 border-bottom-1 border-300">Duplicates</th>
                    <th class="text-left p-3 border-bottom-1 border-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, index) in importHistory" :key="index" 
                      class="border-bottom-1 border-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors transition-duration-200">
                    <td class="p-3">{{ formatDate(log.created_at) }}</td>
                    <td class="p-3">
                      <span class="p-tag" :class="getPlatformTagClass(log.platform)">
                        {{ getPlatformName(log.platform) }}
                      </span>
                    </td>
                    <td class="p-3">{{ log.file_name }}</td>
                    <td class="p-3 font-medium">{{ log.quotes_added }}</td>
                    <td class="p-3">
                      <span v-if="log.duplicates_skipped > 0" class="p-tag bg-orange-50 text-orange-700">
                        {{ log.duplicates_skipped }}
                      </span>
                      <span v-else>-</span>
                    </td>
                    <td class="p-3">
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
          <div class="card">
            <div class="grid">
              <!-- Kindle Instructions -->
              <div class="col-12 md:col-6">
                <div class="p-4">
                  <h4 class="text-lg font-medium mb-3">How to Export Kindle Highlights</h4>
                  <ol class="m-0 pl-4">
                    <li class="mb-2">Connect your Kindle device to your computer via USB cable</li>
                    <li class="mb-2">Navigate to the Kindle drive on your computer</li>
                    <li class="mb-2">Find and open the "documents" folder</li>
                    <li class="mb-2">Locate the "My Clippings.txt" file</li>
                    <li class="mb-2">Copy this file to your computer</li>
                    <li>Upload the "My Clippings.txt" file here</li>
                  </ol>
                </div>
              </div>

              <!-- Google Books Instructions -->
              <div class="col-12 md:col-6">
                <div class="p-4">
                  <h4 class="text-lg font-medium mb-3">How to Export Google Books Highlights</h4>
                  <ol class="m-0 pl-4">
                    <li class="mb-2">Open Google Play Books in your web browser</li>
                    <li class="mb-2">Go to the book with your highlights</li>
                    <li class="mb-2">Click on "Notes" to view all your highlights</li>
                    <li class="mb-2">Click on the "Export" button</li>
                    <li class="mb-2">Save the file as a .docx document</li>
                    <li>Upload the .docx file here (or package multiple .docx files in a .zip file for batch import)</li>
                  </ol>
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
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          </div>
          <h3 class="mt-3 text-center">Processing Your Import</h3>
          <p class="text-center text-500">Your quotes are being extracted and saved...</p>
          <div class="loader-progress mt-2"></div>
        </div>
      </div>
      
      <!-- Import Results -->
      <div v-if="importResults" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border-round">
        <h4 class="text-lg font-medium mb-3">Import Results</h4>
        
        <div class="mb-3">
          <div><strong>Files Processed:</strong> {{ importResults.processed_files }} of {{ importResults.total_docx_files }}</div>
          <div><strong>Successfully Imported:</strong> {{ importResults.total_quotes }}</div>
          <div v-if="importResults.duplicates_skipped" class="text-orange-500">
            <strong>Duplicates Skipped:</strong> {{ importResults.duplicates_skipped }}
          </div>
          <div v-if="importResults.duplicates_skipped" class="text-sm text-500 mt-1">
            <i class="pi pi-info-circle mr-1"></i> Duplicate quotes were found and not imported to avoid duplication.
          </div>
        </div>
        
        <div v-if="importResults.books.length > 0" class="mb-3">
          <h5 class="text-base font-medium mb-2">Imported Books:</h5>
          <ul class="m-0 pl-4">
            <li v-for="(book, index) in importResults.books" :key="index" class="mb-1">
              <strong>{{ book.title }}</strong> by {{ book.author }} - {{ book.quotes_count }} quotes
              <span v-if="book.duplicates_skipped" class="text-orange-500">
                ({{ book.duplicates_skipped }} duplicates skipped)
              </span>
            </li>
          </ul>
        </div>
        
        <div v-if="importResults.errors.length > 0" class="mt-3">
          <h5 class="text-base font-medium mb-2 text-red-500">Errors:</h5>
          <ul class="m-0 pl-4">
            <li v-for="(error, index) in importResults.errors" :key="index" class="mb-1 text-red-600">
              {{ error }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drag-active {
  border: 2px dashed var(--primary-color) !important;
  background-color: rgba(var(--primary-color-rgb), 0.1) !important;
  box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.2);
  transform: scale(1.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

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
  background-color: var(--surface-card, white);
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
  text-align: center;
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.import-loader-circle {
  width: 72px;
  height: 72px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--primary-color-lighter, #f0f7ff);
  color: var(--primary-color, #4f46e5);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.2);
}

.loader-progress {
  height: 6px;
  background: linear-gradient(90deg, var(--primary-color, #4f46e5) 0%, var(--primary-color-lighter, #f0f7ff) 50%, var(--primary-color, #4f46e5) 100%);
  background-size: 200% 100%;
  animation: progress-animation 1.5s infinite;
  border-radius: 8px;
  margin-top: 1rem;
}

@keyframes progress-animation {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

.p-tag {
  border-radius: 12px;
  padding: 0.35rem 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.p-tag-success {
  background-color: #EBF9F1;
  color: #36B37E;
}

.p-tag-danger {
  background-color: #FFEBE6;
  color: #FF5630;
}

.p-tag-info {
  background-color: #E6F7FF;
  color: #0095FF;
}

/* Card styling */
.card {
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.card:last-child {
  margin-bottom: 0;
}

.card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* Grid spacing */
.grid {
  gap: 1.5rem;
}

/* Import options spacing */
.flex-column.gap-4 {
  gap: 1.5rem !important;
}

/* Table container spacing */
.overflow-x-auto {
  margin: 0.5rem 0;
}

/* Instructions section spacing */
.grid .col-12 {
  margin-bottom: 1.5rem;
}

.grid .col-12:last-child {
  margin-bottom: 0;
}

/* Import options styling */
.border-round-xl {
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.border-round-xl:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Table styling */
table {
  border-radius: 16px;
  overflow: hidden;
}

thead {
  background-color: var(--surface-ground);
}

th {
  font-weight: 600;
  letter-spacing: 0.025em;
}

td, th {
  padding: 1rem 1.5rem;
}

tr {
  transition: all 0.2s ease;
}

tr:hover {
  background-color: var(--surface-hover);
}

/* Button styling */
.p-button {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.p-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Instructions section styling */
ol {
  counter-reset: item;
  list-style-type: none;
  padding-left: 0;
}

ol li {
  counter-increment: item;
  margin-bottom: 1rem;
  padding-left: 2.5rem;
  position: relative;
}

ol li:before {
  content: counter(item);
  background: var(--primary-color);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  top: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Import results styling */
.border-round {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* Dark mode adjustments */
:root.dark {
  .card {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  
  .border-round-xl {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
  
  .border-round-xl:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  }
}
</style> 