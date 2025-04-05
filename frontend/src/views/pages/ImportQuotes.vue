<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import axios from "axios";
import { getCookie } from "@/api";

// Reactive variables
const toast = useToast();
const fileInput = ref(null); // Hidden file input for importing quotes
const isUploading = ref(false);

// Method to trigger the file input dialog
function importFromKindle() {
  fileInput.value.click();
}

// Handle file selection and upload to Django
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
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
    
    // Reset the file input
    event.target.value = '';
    
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
               @click="importFromKindle">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-book text-3xl text-blue-500"></i>
              <div>
                <h4 class="m-0 font-semibold">Import from Kindle</h4>
                <p class="text-sm text-500 dark:text-400 m-0 mt-1">
                  Upload your Kindle highlights export (.txt) to import quotes
                </p>
              </div>
            </div>
          </div>
          
          <!-- Hidden file input -->
          <input
            type="file"
            accept=".txt"
            ref="fileInput"
            style="display: none"
            @change="handleFileUpload"
          />
          
          <!-- Upload status -->
          <div v-if="isUploading" class="flex align-items-center mt-3">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            <span>Uploading and processing your file...</span>
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
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles here if needed */
</style> 