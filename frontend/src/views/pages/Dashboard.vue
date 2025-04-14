<script setup>
import { ref, onMounted } from 'vue';
import { BookService } from '@/service/BookService';
import { StatisticsService } from '@/service/StatisticsService';
import { useToast } from 'primevue/usetoast';
import Tag from 'primevue/tag';

const toast = useToast();
const updatingCovers = ref(false);
const stats = ref({
  totalBooks: 0,
  booksWithoutCovers: 0,
  totalAuthors: 0,
  totalQuotes: 0,
  quoteLists: 0,
  quoteGroups: 0
});

// Cover preview dialog state
const showCoverDialog = ref(false);
const currentBook = ref(null);
const selectedCoverUrl = ref(null);
const coverOptions = ref([]);
const coverIndex = ref(0);
const searchQuery = ref('');
const processingCover = ref(false);
const processingMessage = ref('');
const showSearchInput = ref(true);
const showSearchButton = ref(true);
const booksToProcess = ref([]);
const currentBookIndex = ref(0);
const customSearchTitle = ref('');

// Function to start the book cover update process
const updateAllBookCovers = async () => {
  try {
    updatingCovers.value = true;
    
    // Get all books without covers
    const books = await BookService.getBooks();
    booksToProcess.value = books.filter(book => !book.cover);
    
    if (booksToProcess.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No Books to Update',
        detail: 'All books already have covers',
        life: 3000
      });
      updatingCovers.value = false;
      return;
    }
    
    // Start the cover approval process
    currentBookIndex.value = 0;
    await processCurrentBook();
    
  } catch (error) {
    console.error('Error fetching books:', error);
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'There was an error starting the cover update process: ' + error.message,
      life: 3000
    });
    updatingCovers.value = false;
  }
};

// Process the current book and fetch its cover for preview
const processCurrentBook = async () => {
  if (currentBookIndex.value >= booksToProcess.value.length) {
    finishCoverUpdate();
    return;
  }
  
  currentBook.value = booksToProcess.value[currentBookIndex.value];
  selectedCoverUrl.value = null;
  showCoverDialog.value = true;
  
  try {
    await searchCoverForCurrentBook(customSearchTitle.value);
  } catch (error) {
    console.error('Error fetching cover:', error);
    toast.add({
      severity: 'error',
      summary: 'Cover Fetch Error',
      detail: `Error fetching cover for "${currentBook.value.title}"`,
      life: 2000
    });
  }
};

// Search for a cover for the current book
const searchCoverForCurrentBook = async (customTitle) => {
  // Use the provided custom title or the book's title
  const searchTitle = customTitle || currentBook.value.title;
  
  // Fetch cover options from OpenLibrary
  const result = await BookService.fetchCoverFromOpenLibrary(
    searchTitle, 
    currentBook.value.author.name
  );
  
  coverOptions.value = result.covers;
  
  if (coverOptions.value.length > 0) {
    // Set the first cover as the preview by default
    selectedCoverUrl.value = coverOptions.value[0].url;
    toast.add({
      severity: 'success',
      summary: 'Covers Found',
      detail: `Found ${coverOptions.value.length} covers for "${currentBook.value.title}"`,
      life: 2000
    });
  } else {
    selectedCoverUrl.value = null;
    toast.add({
      severity: 'info',
      summary: 'No Covers Found',
      detail: `Could not find covers for "${currentBook.value.title}"`,
      life: 2000
    });
  }
};

// Select a cover from the options
const selectCover = (coverUrl) => {
  selectedCoverUrl.value = coverUrl;
};

// Accept the current cover and save it to the database
const acceptCover = async () => {
  if (!selectedCoverUrl.value || !currentBook.value) return;
  
  try {
    // Update the book with the cover URL
    await BookService.updateBook(currentBook.value.id, {
      ...currentBook.value,
      cover: selectedCoverUrl.value
    });
    
    toast.add({
      severity: 'success',
      summary: 'Cover Accepted',
      detail: `Cover for "${currentBook.value.title}" has been saved`,
      life: 2000
    });
    
    // Process next book
    processNextBook();
    
  } catch (error) {
    console.error('Error saving cover:', error);
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: `Error saving cover for "${currentBook.value.title}"`,
      life: 3000
    });
  }
};

// Reject the current cover and move to next book
const rejectCover = () => {
  toast.add({
    severity: 'info',
    summary: 'Cover Rejected',
    detail: `Cover for "${currentBook.value.title}" was rejected`,
    life: 2000
  });
  
  processNextBook();
};

// Move to the next book in the queue
const processNextBook = () => {
  currentBookIndex.value++;
  processCurrentBook();
};

// Finish the cover update process
const finishCoverUpdate = () => {
  showCoverDialog.value = false;
  updatingCovers.value = false;
  
  toast.add({
    severity: 'success',
    summary: 'Process Completed',
    detail: 'Book cover update process is complete',
    life: 3000
  });
  
  // Refresh stats after updating covers
  fetchStats();
};

// Exit the cover process
const exitCoverProcess = () => {
  showCoverDialog.value = false;
  updatingCovers.value = false;
  
  toast.add({
    severity: 'info',
    summary: 'Process Cancelled',
    detail: 'Cover update process cancelled',
    life: 3000
  });
};

// Fetch statistics
const fetchStats = async () => {
  try {
    const apiStats = await StatisticsService.getStatistics();
    
    // Map API stats to component state
    stats.value.totalBooks = apiStats.total_books;
    stats.value.booksWithoutCovers = apiStats.books_without_covers;
    stats.value.totalAuthors = apiStats.total_authors;
    stats.value.totalQuotes = apiStats.total_quotes;
    stats.value.quoteLists = apiStats.quote_lists;
    stats.value.quoteGroups = apiStats.quote_groups;
  } catch (error) {
    console.error('Error fetching stats:', error);
    toast.add({
      severity: 'error',
      summary: 'Stats Error',
      detail: 'Failed to load dashboard statistics',
      life: 3000
    });
  }
};

const selectPreviousCover = () => {
  if (coverIndex.value > 0) {
    coverIndex.value--;
    selectedCoverUrl.value = coverOptions.value[coverIndex.value].url;
  }
};

const selectNextCover = () => {
  if (coverIndex.value < coverOptions.value.length - 1) {
    coverIndex.value++;
    selectedCoverUrl.value = coverOptions.value[coverIndex.value].url;
  }
};

const skipCurrentCover = () => {
  selectedCoverUrl.value = null;
  processNextBook();
};

const toggleSearchInput = () => {
  showSearchInput.value = !showSearchInput.value;
};

onMounted(async () => {
  await fetchStats();
});
</script>

<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <h5>Dashboard Overview</h5>
        
        <!-- Stats Cards -->
        <div class="grid mt-2">
          <!-- Total Books -->
          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Total Books</span>
                  <div class="text-900 font-medium text-xl">{{ stats.totalBooks }}</div>
                </div>
                <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-book text-blue-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Books Without Covers -->
          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Books Without Covers</span>
                  <div class="text-900 font-medium text-xl">{{ stats.booksWithoutCovers }}</div>
                </div>
                <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-image text-orange-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Total Authors -->
          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Total Authors</span>
                  <div class="text-900 font-medium text-xl">{{ stats.totalAuthors }}</div>
                </div>
                <div class="flex align-items-center justify-content-center bg-cyan-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-user text-cyan-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Total Quotes -->
          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Total Quotes</span>
                  <div class="text-900 font-medium text-xl">{{ stats.totalQuotes }}</div>
                </div>
                <div class="flex align-items-center justify-content-center bg-purple-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-comment text-purple-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Collections Stats -->
        <div class="grid mt-4">
          <!-- Quote Lists -->
          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Quote Lists</span>
                  <div class="text-900 font-medium text-xl">{{ stats.quoteLists }}</div>
                </div>
                <div class="flex align-items-center justify-content-center bg-green-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-list text-green-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quote Groups -->
          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card shadow-2 p-3 border-round">
              <div class="flex justify-content-between mb-3">
                <div>
                  <span class="block text-500 font-medium mb-3">Quote Groups</span>
                  <div class="text-900 font-medium text-xl">{{ stats.quoteGroups }}</div>
                </div>
                <div class="flex align-items-center justify-content-center bg-indigo-100 border-round" style="width:2.5rem;height:2.5rem">
                  <i class="pi pi-users text-indigo-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Book Covers Management Card -->
    <div class="col-12 xl:col-6">
      <div class="card border-round-xl shadow-3 overflow-hidden">
        <div class="flex justify-content-between align-items-center p-3 bg-primary" style="background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%);">
          <h3 class="m-0 text-white">Book Covers Management</h3>
          <Button 
            icon="pi pi-images" 
            label="Update Covers" 
            severity="secondary" 
            class="p-button-rounded" 
            @click="updateAllBookCovers"
            :loading="updatingCovers"
          />
        </div>
        <div class="p-3 px-4 surface-0" style="background-color: #FAFBFC; border-left: 4px solid #EEF2FF;">
          <p class="mb-3 px-2">
            <span v-if="stats.booksWithoutCovers > 0">{{ stats.booksWithoutCovers }} books are missing covers.</span>
            <span v-else class="text-green-600">All books have covers assigned!</span>
          </p>
          
          <div class="flex align-items-center mb-2" v-if="stats.booksWithoutCovers > 0">
            <div class="flex-1">
              <div class="flex align-items-center">
                <Tag icon="pi pi-image" severity="warning" class="p-tag-rounded">{{ stats.booksWithoutCovers }} Missing</Tag>
              </div>
            </div>
          </div>
          
          <div v-if="recentlyUpdatedCovers.length > 0">
            <div class="text-lg font-medium mt-3 mb-2">Recently Updated Covers</div>
            <div class="grid">
              <div 
                v-for="book in recentlyUpdatedCovers" 
                :key="book.id" 
                class="col-4 md:col-3 p-2"
              >
                <div class="relative h-10rem border-round-lg overflow-hidden shadow-2 hover:shadow-4 transition-all transition-duration-200">
                  <img 
                    :src="book.cover" 
                    :alt="book.title"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute bottom-0 left-0 right-0 p-2 bg-black-alpha-70">
                    <div class="text-white font-medium text-xs overflow-hidden text-overflow-ellipsis white-space-nowrap">
                      {{ book.title }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Cover Preview Dialog -->
    <Dialog 
      v-model:visible="showCoverDialog" 
      :style="{ width: '500px' }" 
      header="Book Cover Preview" 
      :modal="true"
      :closable="!processingCover"
      :closeOnEscape="!processingCover"
      class="p-fluid"
      :contentStyle="{ 'border-radius': '12px' }"
    >
      <div v-if="currentBook" class="flex flex-column align-items-center">
        <div class="text-center mb-4">
          <h3 class="mt-0 mb-2">{{ currentBook.title }}</h3>
          <p class="text-color-secondary m-0">by {{ currentBook.author_name }}</p>
        </div>
        
        <div class="cover-preview-container mb-4 text-center w-full" style="position: relative;">
          <img 
            v-if="selectedCoverUrl" 
            :src="selectedCoverUrl" 
            alt="Book Cover" 
            style="max-height: 300px; max-width: 100%; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);"
          />
          <div 
            v-else 
            class="flex align-items-center justify-content-center bg-gray-100 border-round" 
            style="height: 300px; width: 200px; margin: 0 auto; border-radius: 8px;"
          >
            <i class="pi pi-image text-500" style="font-size: 3rem"></i>
          </div>
          
          <div class="cover-controls mt-3 flex justify-content-center" v-if="coverOptions.length > 1">
            <Button 
              icon="pi pi-chevron-left" 
              @click="selectPreviousCover" 
              class="p-button-rounded p-button-text" 
              :disabled="coverIndex === 0 || processingCover"
            />
            <div class="mx-3 flex align-items-center">
              <span class="font-medium">{{ coverIndex + 1 }} of {{ coverOptions.length }}</span>
            </div>
            <Button 
              icon="pi pi-chevron-right" 
              @click="selectNextCover" 
              class="p-button-rounded p-button-text" 
              :disabled="coverIndex === coverOptions.length - 1 || processingCover"
            />
          </div>
        </div>
        
        <div class="w-full mb-4" v-if="!processingCover && showSearchInput">
          <span class="p-input-icon-right w-full">
            <i class="pi pi-search" />
            <InputText 
              v-model="searchQuery" 
              placeholder="Search for a different cover..." 
              class="w-full" 
              @keydown.enter="searchCovers"
            />
          </span>
          <small class="block text-center mt-2 text-color-secondary">
            Press Enter to search for alternative covers
          </small>
        </div>
      </div>
      
      <div v-if="processingCover" class="flex flex-column align-items-center p-4">
        <ProgressSpinner style="width: 50px; height: 50px;" />
        <span class="mt-3">{{ processingMessage }}</span>
      </div>
      
      <template #footer>
        <div class="flex justify-content-between w-full">
          <Button 
            label="Skip" 
            class="p-button-outlined p-button-secondary"
            @click="rejectCover" 
          />
          <Button 
            label="Accept" 
            class="p-button-success" 
            :disabled="!selectedCoverUrl || processingCover"
            @click="acceptCover" 
          />
          <Button 
            label="Cancel" 
            class="p-button-outlined"
            @click="$refs.coverDialog.hide()" 
          />
        </div>
      </template>
    </Dialog>
  </div>
</template> 