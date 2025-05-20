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
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <h5>Export Quotes</h5>
        <p>Export all your quotes in either JSON or CSV format for backup or use in other applications.</p>
        
        <div class="flex align-items-center justify-content-between mt-4">
          <div>
            <span v-if="quotes.length > 0" class="text-600">
              {{ quotes.length }} quotes ready for export
            </span>
            <span v-else class="text-600">
              No quotes available for export
            </span>
          </div>
          
          <Button 
            icon="pi pi-refresh" 
            label="Refresh" 
            class="p-button-outlined p-button-secondary" 
            @click="refreshQuotes"
            :loading="isLoading"
          />
        </div>
        
        <!-- Export format cards -->
        <div class="grid mt-4">
          <div class="col-12 md:col-6">
            <div 
              class="export-card border-round cursor-pointer"
              @click="exportJSON"
              :class="{ 'disabled': quotes.length === 0 || isLoading }"
            >
              <div class="flex align-items-center justify-content-center p-4">
                <i class="pi pi-file-export text-xl mr-3"></i>
                <div>
                  <h6 class="text-900 font-bold mb-1">JSON Format</h6>
                  <p class="text-600 m-0">
                    Export in JSON format for complete data preservation and easy import into other systems.
                    Contains all quote data with relationships preserved.
                  </p>
                </div>
              </div>
              <div class="export-card-overlay">
                <i class="pi pi-download text-2xl"></i>
                <span>Export as JSON</span>
              </div>
            </div>
          </div>
          
          <div class="col-12 md:col-6">
            <div 
              class="export-card border-round cursor-pointer"
              @click="exportCSV"
              :class="{ 'disabled': quotes.length === 0 || isLoading }"
            >
              <div class="flex align-items-center justify-content-center p-4">
                <i class="pi pi-file-excel text-xl mr-3"></i>
                <div>
                  <h6 class="text-900 font-bold mb-1">CSV Format</h6>
                  <p class="text-600 m-0">
                    Export in CSV format for easy viewing in spreadsheet applications like Excel or Google Sheets.
                    Basic data only in tabular format.
                  </p>
                </div>
              </div>
              <div class="export-card-overlay">
                <i class="pi pi-download text-2xl"></i>
                <span>Export as CSV</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 1.5rem;
  padding: 2rem;
}

.card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

h5 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.p-button {
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.p-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.p-button.p-button-outlined {
  border-width: 2px;
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

.export-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-color);
}

.export-card i {
  font-size: 2rem;
  padding: 1rem;
  border-radius: 12px;
  background: var(--primary-50);
  color: var(--primary-color);
  transition: all 0.3s ease;
}

.export-card:hover i {
  transform: scale(1.1);
  background: var(--primary-color);
  color: white;
}

.export-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--primary-color-rgb), 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: all 0.3s ease;
  transform: translateY(100%);
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
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  
  .export-card {
    background: var(--surface-ground);
  }
  
  .export-card i {
    background: var(--primary-900);
  }
  
  .export-card:hover i {
    background: var(--primary-color);
  }
}

/* Grid spacing */
.grid {
  gap: 1.5rem;
}

/* Text styling */
.text-600 {
  color: var(--text-color-secondary);
}

.text-900 {
  color: var(--text-color);
}

/* Loading state styling */
.p-button.p-button-loading {
  opacity: 0.8;
}
</style> 