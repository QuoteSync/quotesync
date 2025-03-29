<script setup>
import { ref, onMounted } from 'vue';
import { BookService } from '@/service/BookService';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const updatingCovers = ref(false);
const cachingCovers = ref(false);
const stats = ref({
  totalBooks: 0,
  booksWithoutCovers: 0,
  totalAuthors: 0,
  totalQuotes: 0,
  uncachedCovers: 0
});

// Cover preview dialog state
const coverPreviewDialog = ref(false);
const currentBook = ref(null);
const previewCoverUrl = ref(null);
const booksToProcess = ref([]);
const currentBookIndex = ref(0);
const customSearchTitle = ref('');
const coverOptions = ref([]);

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
  previewCoverUrl.value = null;
  coverPreviewDialog.value = true;
  
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
    previewCoverUrl.value = coverOptions.value[0].url;
    toast.add({
      severity: 'success',
      summary: 'Covers Found',
      detail: `Found ${coverOptions.value.length} covers for "${currentBook.value.title}"`,
      life: 2000
    });
  } else {
    previewCoverUrl.value = null;
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
  previewCoverUrl.value = coverUrl;
};

// Accept the current cover and save it to the database
const acceptCover = async () => {
  if (!previewCoverUrl.value || !currentBook.value) return;
  
  try {
    // Update the book with the cover URL
    await BookService.updateBook(currentBook.value.id, {
      ...currentBook.value,
      cover: previewCoverUrl.value
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
  coverPreviewDialog.value = false;
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

// Function to cache all book covers
const cacheAllBookCovers = async () => {
  try {
    cachingCovers.value = true;
    
    const result = await BookService.cacheAllBookCovers();
    
    if (result.cachedCount === 0) {
      toast.add({
        severity: 'info',
        summary: 'No Covers to Cache',
        detail: 'All book covers are already cached',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'success',
        summary: 'Covers Cached',
        detail: `Successfully cached ${result.cachedCount} book covers`,
        life: 3000
      });
    }
    
    // Refresh stats after caching
    await fetchStats();
    
  } catch (error) {
    console.error('Error caching covers:', error);
    toast.add({
      severity: 'error',
      summary: 'Caching Failed',
      detail: `Error caching covers: ${error.message}`,
      life: 3000
    });
  } finally {
    cachingCovers.value = false;
  }
};

// Fetch statistics
const fetchStats = async () => {
  try {
    const books = await BookService.getBooks();
    stats.value.totalBooks = books.length;
    stats.value.booksWithoutCovers = books.filter(book => !book.cover).length;
    stats.value.uncachedCovers = books.filter(book => book.cover && !book.cover_cached).length;
    
    // Here you would also fetch other stats like author count and quote count
    // For now we'll leave placeholders
    stats.value.totalAuthors = 0;
    stats.value.totalQuotes = 0;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

// Exit the cover process
const exitCoverProcess = () => {
  coverPreviewDialog.value = false;
  updatingCovers.value = false;
  
  toast.add({
    severity: 'info',
    summary: 'Process Cancelled',
    detail: 'Cover update process cancelled',
    life: 3000
  });
};

onMounted(async () => {
  await fetchStats();
});
</script>

<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Stats Cards -->
      <div class="p-6 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold text-gray-700">Total Books</h3>
        <p class="text-3xl font-bold mt-2">{{ stats.totalBooks }}</p>
      </div>
      
      <div class="p-6 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold text-gray-700">Books Without Covers</h3>
        <p class="text-3xl font-bold mt-2">{{ stats.booksWithoutCovers }}</p>
      </div>
      
      <div class="p-6 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold text-gray-700">Total Authors</h3>
        <p class="text-3xl font-bold mt-2">{{ stats.totalAuthors }}</p>
      </div>
      
      <div class="p-6 bg-white rounded-lg shadow">
        <h3 class="text-xl font-semibold text-gray-700">Total Quotes</h3>
        <p class="text-3xl font-bold mt-2">{{ stats.totalQuotes }}</p>
      </div>
    </div>
    
    <!-- Book Covers Management Card -->
    <div class="p-6 bg-white rounded-lg shadow mb-8">
      <h2 class="text-2xl font-bold mb-4">Book Covers Management</h2>
      <p class="mb-4">
        Update your book collection with covers from OpenLibrary. This will search for book covers
        based on title and author information, and update your database.
      </p>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <span class="font-semibold">Books without covers: </span>
          <span>{{ stats.booksWithoutCovers }} of {{ stats.totalBooks }}</span>
        </div>
        <Button 
          label="Update All Book Covers" 
          icon="pi pi-refresh" 
          severity="primary"
          :loading="updatingCovers"
          @click="updateAllBookCovers"
          :disabled="stats.booksWithoutCovers === 0"
        />
      </div>
      
      <hr class="my-4">
      
      <h3 class="text-xl font-bold mb-2">Performance Optimization</h3>
      <p class="mb-4">
        Cache book covers locally to improve performance and reduce external dependencies.
        This will download all cover images from OpenLibrary to your server.
      </p>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span class="font-semibold">Uncached covers: </span>
          <span>{{ stats.uncachedCovers }} of {{ stats.totalBooks }}</span>
        </div>
        <Button 
          label="Cache All Book Covers" 
          icon="pi pi-download" 
          severity="secondary"
          :loading="cachingCovers"
          @click="cacheAllBookCovers"
          :disabled="stats.uncachedCovers === 0"
        />
      </div>
    </div>
    
    <!-- Cover Preview Dialog -->
    <Dialog 
      v-model:visible="coverPreviewDialog" 
      :style="{width: '800px'}" 
      header="Book Cover Preview" 
      :modal="true"
      :closable="true"
      @hide="exitCoverProcess"
    >
      <div class="flex flex-col items-center p-4">
        <h3 class="text-xl font-semibold mb-2">{{ currentBook?.title }}</h3>
        <p class="text-sm mb-4">by {{ currentBook?.author?.name }}</p>
        
        <div class="grid grid-cols-2">
          <!-- Selected cover preview (large) -->
          <div class="col-span-1 flex flex-col items-center">
            <h4 class="font-medium mb-2">Selected Cover:</h4>
            <div class="relative mb-4 w-64 h-96 bg-gray-100 flex items-center justify-center border rounded shadow-sm">
              <img 
                v-if="previewCoverUrl" 
                :src="previewCoverUrl" 
                :alt="currentBook?.title"
                class="max-w-full max-h-full object-contain"
              />
              <div v-else class="text-gray-400">No cover selected</div>
            </div>
          </div>
          
          <!-- Cover options grid -->
          <div class="col-span-1 flex flex-col">
            <h4 class="font-medium mb-2">Available Covers ({{ coverOptions.length }}):</h4>
            <div v-if="coverOptions.length > 0" class="grid grid-cols-2 gap-2 overflow-y-auto max-h-96 p-2">
              <div 
                v-for="(cover, index) in coverOptions" 
                :key="index" 
                class="cursor-pointer border rounded hover:shadow-md transition-shadow p-1"
                :class="{ 'border-blue-500 ring-2 ring-blue-300': previewCoverUrl === cover.url }"
                @click="selectCover(cover.url)"
              >
                <div class="w-full h-40 flex items-center justify-center bg-gray-100">
                  <img 
                    :src="cover.url" 
                    :alt="`Cover option ${index+1}`"
                    class="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 p-4 text-center border rounded bg-gray-50">
              No cover options found
            </div>
          </div>
        </div>
        
        <!-- Manual search section -->
        <div class="w-full my-4">
          <h4 class="font-medium mb-2">Search for more covers:</h4>
          <div class="flex gap-2">
            <InputText 
              v-model="customSearchTitle" 
              placeholder="Enter alternative title" 
              class="flex-1"
              @keydown.enter="searchCoverForCurrentBook(customSearchTitle)"
            />
            <Button 
              icon="pi pi-search" 
              @click="searchCoverForCurrentBook(customSearchTitle)"
            />
          </div>
          <small class="text-gray-500 mt-1 block">
            Tip: Try with a more general title or series name
          </small>
        </div>
        
        <div class="flex justify-center gap-3 mt-4 w-full">
          <Button 
            icon="pi pi-times" 
            label="Reject" 
            severity="secondary" 
            @click="rejectCover"
          />
          <Button 
            icon="pi pi-check" 
            label="Accept" 
            :disabled="!previewCoverUrl"
            @click="acceptCover"
          />
          <Button 
            icon="pi pi-step-forward" 
            label="Skip" 
            class="p-button-outlined" 
            @click="processNextBook"
          />
        </div>
        
        <div class="w-full pt-4 mt-4 border-t border-gray-200 text-center">
          <Button 
            icon="pi pi-times-circle" 
            label="Exit Without Changes" 
            class="p-button-text p-button-danger"
            @click="exitCoverProcess"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template> 