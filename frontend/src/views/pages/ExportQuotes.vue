<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { QuoteService } from "@/service/QuoteService";
import axios from "axios";
import { apiClient, getCookie } from "@/api";

const toast = useToast();
const isLoading = ref(false);
const quotes = ref([]);
const selectedFormat = ref("json");
const exportOptions = [
  { name: "JSON Format", value: "json" },
  { name: "CSV Format", value: "csv" }
];

// Get all quotes for export
async function fetchQuotes() {
  isLoading.value = true;
  try {
    const data = await QuoteService.getQuotes();
    quotes.value = data;
    toast.add({
      severity: "info",
      summary: "Ready to Export",
      detail: `${data.length} quotes ready to export`,
      life: 3000,
    });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to load quotes for export",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchQuotes);

// Export quotes to JSON file
function exportJSON() {
  try {
    // Transform quotes to the requested format
    const formattedQuotes = quotes.value.map(quote => ({
      body: quote.body || quote.quote,
      book: {
        title: quote.book?.title || "",
        author: {
          name: quote.book?.author?.name || "",
        },
      },
      tags: Array.isArray(quote.tags) ? 
        quote.tags.map(tag => ({
          title: typeof tag === 'string' ? tag : tag.title,
        })) : []
    }));
    
    const jsonData = JSON.stringify(formattedQuotes, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quotes-export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.add({
      severity: "success",
      summary: "Export Successful",
      detail: `Successfully exported ${quotes.value.length} quotes as JSON`,
      life: 3000,
    });
  } catch (error) {
    console.error("Error exporting JSON:", error);
    toast.add({
      severity: "error",
      summary: "Export Failed",
      detail: "Failed to export quotes as JSON",
      life: 3000,
    });
  }
}

// Export quotes to CSV file
function exportCSV() {
  try {
    // Define CSV headers based on the quote structure
    const headers = [
      "ID", 
      "Title", 
      "Quote Body", 
      "Book Title", 
      "Author Name", 
      "Created", 
      "Updated", 
      "Location", 
      "Tags"
    ];
    
    // Convert quotes to CSV rows
    const rows = quotes.value.map(quote => [
      quote.id,
      quote.title,
      quote.body,
      quote.book?.title || "",
      quote.book?.author?.name || "",
      quote.created,
      quote.updated,
      quote.location || "",
      Array.isArray(quote.tags) ? 
        quote.tags.map(tag => typeof tag === 'string' ? tag : tag.title).join(", ") : 
        ""
    ]);
    
    // Create CSV content
    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      // Escape any fields that contain commas or quotes
      const processedRow = row.map(field => {
        if (field === null || field === undefined) return "";
        const stringField = String(field);
        // If the field contains commas, quotes or newlines, wrap it in quotes and escape any existing quotes
        if (stringField.includes(",") || stringField.includes("\"") || stringField.includes("\n")) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      });
      csvContent += processedRow.join(",") + "\n";
    });
    
    // Create and download blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quotes-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.add({
      severity: "success",
      summary: "Export Successful",
      detail: `Successfully exported ${quotes.value.length} quotes as CSV`,
      life: 3000,
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    toast.add({
      severity: "error",
      summary: "Export Failed",
      detail: "Failed to export quotes as CSV",
      life: 3000,
    });
  }
}

// Handle export button click
function handleExport() {
  if (selectedFormat.value === "json") {
    exportJSON();
  } else {
    exportCSV();
  }
}

// Refresh quotes data
function refreshQuotes() {
  fetchQuotes();
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-900 rounded-3xl">
    <!-- Header Section -->
    <div class="sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 rounded-t-3xl">
      <div class="container mx-auto px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 class="text-4xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent rounded text-center sm:text-left">
            Export Quotes
          </h1>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8">
      <div class="grid">
        <div class="col-12">
          <div class="card bg-surface-ground dark:bg-surface-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <div class="p-6">
              <p class="text-lg text-500 dark:text-400 mb-6">Export all your quotes in either JSON or CSV format for backup or use in other applications.</p>
              
              <div class="flex flex-col sm:flex-row sm:align-items-center sm:justify-content-between gap-4 mb-6">
                <div class="flex items-center gap-3">
                  <div class="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                    <i class="pi pi-file-export text-2xl text-primary-500"></i>
                  </div>
                  <div>
                    <span v-if="quotes.length > 0" class="text-lg font-medium">
                      {{ quotes.length }} quotes ready for export
                    </span>
                    <span v-else class="text-lg font-medium text-500">
                      No quotes available for export
                    </span>
                  </div>
                </div>
                
                <Button 
                  icon="pi pi-refresh" 
                  label="Refresh" 
                  class="p-button-rounded p-button-secondary" 
                  @click="refreshQuotes"
                  :loading="isLoading"
                />
              </div>
              
              <!-- Export format cards -->
              <div class="grid">
                <div class="col-12 md:col-6">
                  <div 
                    class="export-card border-round-xl cursor-pointer"
                    @click="exportJSON"
                    :class="{ 'disabled': quotes.length === 0 || isLoading }"
                  >
                    <div class="flex align-items-center p-6">
                      <div class="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl mr-4">
                        <i class="pi pi-file-export text-3xl text-primary-500"></i>
                      </div>
                      <div>
                        <h4 class="m-0 font-semibold text-xl fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">JSON Format</h4>
                        <p class="text-500 dark:text-400 m-0 mt-2">
                          Export in JSON format for complete data preservation and easy import into other systems.
                          Contains all quote data with relationships preserved.
                        </p>
                      </div>
                    </div>
                    <div class="export-card-overlay">
                      <i class="pi pi-download text-3xl mb-2"></i>
                      <span class="text-lg font-medium">Export as JSON</span>
                    </div>
                  </div>
                </div>
                
                <div class="col-12 md:col-6">
                  <div 
                    class="export-card border-round-xl cursor-pointer"
                    @click="exportCSV"
                    :class="{ 'disabled': quotes.length === 0 || isLoading }"
                  >
                    <div class="flex align-items-center p-6">
                      <div class="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl mr-4">
                        <i class="pi pi-file-excel text-3xl text-primary-500"></i>
                      </div>
                      <div>
                        <h4 class="m-0 font-semibold text-xl fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">CSV Format</h4>
                        <p class="text-500 dark:text-400 m-0 mt-2">
                          Export in CSV format for easy viewing in spreadsheet applications like Excel or Google Sheets.
                          Basic data only in tabular format.
                        </p>
                      </div>
                    </div>
                    <div class="export-card-overlay">
                      <i class="pi pi-download text-3xl mb-2"></i>
                      <span class="text-lg font-medium">Export as CSV</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

/* Export cards styling */
.export-card {
  position: relative;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  overflow: hidden;
}

.export-card::before {
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

.export-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.export-card:hover::before {
  opacity: 1;
}

.export-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(100%);
  backdrop-filter: blur(4px);
}

.export-card:hover .export-card-overlay {
  opacity: 1;
  transform: translateY(0);
}

.export-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-card.disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--surface-border);
}

.export-card.disabled:hover .export-card-overlay {
  display: none;
}

/* Dark mode adjustments */
:root.dark {
  .card {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    background: var(--surface-card);
  }
  
  .export-card {
    background: var(--surface-ground);
  }
  
  .export-card:hover {
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
}

/* Grid spacing */
.grid {
  gap: 1.5rem;
}

/* Loading state styling */
.p-button.p-button-loading {
  opacity: 0.8;
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

/* Responsive adjustments */
@media (max-width: 640px) {
  .card {
    border-radius: 16px;
  }
  
  .export-card {
    border-radius: 12px;
  }
}
</style> 