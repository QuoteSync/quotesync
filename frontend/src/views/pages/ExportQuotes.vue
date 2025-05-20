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
        
        <div class="p-fluid grid formgrid">
          <div class="field col-12 md:col-6">
            <label for="format">Export Format</label>
            <div class="p-inputgroup">
              <span class="p-inputgroup-addon">
                <i class="pi pi-file"></i>
              </span>
              <Dropdown
                id="format"
                v-model="selectedFormat"
                :options="exportOptions"
                optionLabel="name"
                optionValue="value"
                placeholder="Select Format"
              />
            </div>
          </div>
        </div>
        
        <div class="flex align-items-center justify-content-between mt-4">
          <div>
            <span v-if="quotes.length > 0" class="text-600">
              {{ quotes.length }} quotes ready for export
            </span>
            <span v-else class="text-600">
              No quotes available for export
            </span>
          </div>
          
          <div class="flex gap-2">
            <Button 
              icon="pi pi-refresh" 
              label="Refresh" 
              class="p-button-outlined p-button-secondary" 
              @click="refreshQuotes"
              :loading="isLoading"
            />
            <Button 
              :icon="selectedFormat === 'json' ? 'pi pi-download' : 'pi pi-file-excel'"
              :label="selectedFormat === 'json' ? 'Export JSON' : 'Export CSV'" 
              @click="handleExport"
              :disabled="quotes.length === 0 || isLoading"
              :loading="isLoading"
            />
          </div>
        </div>
        
        <!-- Export information cards -->
        <div class="grid mt-4">
          <div class="col-12 md:col-6">
            <div class="card border-1 border-300 border-round">
              <div class="flex align-items-center justify-content-center p-3">
                <i class="pi pi-file-export text-xl text-primary mr-3"></i>
                <div>
                  <h6 class="text-900 font-bold mb-1">JSON Format</h6>
                  <p class="text-600 m-0">
                    Export in JSON format for complete data preservation and easy import into other systems.
                    Contains all quote data with relationships preserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-12 md:col-6">
            <div class="card border-1 border-300 border-round">
              <div class="flex align-items-center justify-content-center p-3">
                <i class="pi pi-file-excel text-xl text-green-500 mr-3"></i>
                <div>
                  <h6 class="text-900 font-bold mb-1">CSV Format</h6>
                  <p class="text-600 m-0">
                    Export in CSV format for easy viewing in spreadsheet applications like Excel or Google Sheets.
                    Basic data only in tabular format.
                  </p>
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
.card {
  background: var(--surface-card);
  border-radius: 10px;
  margin-bottom: 1rem;
}
</style> 