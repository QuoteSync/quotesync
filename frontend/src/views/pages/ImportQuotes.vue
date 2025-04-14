<script setup>
import { ref } from "vue";
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
</script>

<template>
  <div>
    <div class="card">
      <h2 class="text-3xl font-bold mb-6">Import Quotes</h2>
      
      <div class="p-6 bg-white dark:bg-gray-900 border-round shadow-2">
        <h3 class="text-xl font-semibold mb-4">Choose an Import Source</h3>
        
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
          <div v-if="isUploading" class="flex align-items-center mt-3">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            <span>Uploading and processing your file...</span>
          </div>
          
          <!-- Import Results -->
          <div v-if="importResults" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border-round">
            <h4 class="text-lg font-medium mb-3">Import Results</h4>
            
            <div class="mb-3">
              <div><strong>Files Processed:</strong> {{ importResults.processed_files }} of {{ importResults.total_docx_files }}</div>
              <div><strong>Total Quotes Imported:</strong> {{ importResults.total_quotes }}</div>
            </div>
            
            <div v-if="importResults.books.length > 0" class="mb-3">
              <h5 class="text-base font-medium mb-2">Imported Books:</h5>
              <ul class="m-0 pl-4">
                <li v-for="(book, index) in importResults.books" :key="index" class="mb-1">
                  <strong>{{ book.title }}</strong> by {{ book.author }} - {{ book.quotes_count }} quotes
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
        
        <!-- Instructions -->
        <div class="mt-6 p-3 bg-gray-50 dark:bg-gray-800 border-round">
          <h4 class="text-lg font-medium mb-2">How to Export Kindle Highlights from My Clippings</h4>
          <ol class="m-0 pl-4">
            <li class="mb-2">Connect your Kindle device to your computer via USB cable</li>
            <li class="mb-2">Navigate to the Kindle drive on your computer</li>
            <li class="mb-2">Find and open the "documents" folder</li>
            <li class="mb-2">Locate the "My Clippings.txt" file</li>
            <li class="mb-2">Copy this file to your computer</li>
            <li>Upload the "My Clippings.txt" file here</li>
          </ol>
        </div>
        
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border-round">
          <h4 class="text-lg font-medium mb-2">How to Export Google Books Highlights</h4>
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
</template>

<style scoped>
.drag-active {
  border: 2px dashed var(--primary-color) !important;
  background-color: rgba(var(--primary-color-rgb), 0.1) !important;
  box-shadow: 0 0 10px rgba(var(--primary-color-rgb), 0.3);
  transform: scale(1.01);
  transition: all 0.2s ease-in-out;
}
</style> 