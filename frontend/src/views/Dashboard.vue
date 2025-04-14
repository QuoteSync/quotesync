<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { BookService } from '@/service/BookService';
import { StatisticsService } from '@/service/StatisticsService';
import { AuthorService } from '@/service/AuthorService';
import { useToast } from 'primevue/usetoast';
import Tag from 'primevue/tag';

// Dashboard widgets
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import QuoteGroupsWidget from '@/components/dashboard/QuoteGroupsWidget.vue';
import PopularItemsWidget from '@/components/dashboard/PopularItemsWidget.vue';
import PopularBooksWidget from '@/components/dashboard/PopularBooksWidget.vue';
import FavoriteQuotesWidget from '@/components/dashboard/FavoriteQuotesWidget.vue';
import PopularTagsWidget from '@/components/dashboard/PopularTagsWidget.vue';

const router = useRouter();
const toast = useToast();
const updatingCovers = ref(false);
const resizeHandler = ref(null);
const stats = ref({
  totalBooks: 0,
  booksWithoutCovers: 0,
  totalAuthors: 0,
  totalQuotes: 0,
  quoteLists: 0,
  quoteGroups: 0
});

// Data for new sections
const popularBooks = ref([]);
const popularAuthors = ref([]);
const recentLists = ref([]);
const quoteGroups = ref([]);
const recentActivity = ref([]);

// Cover preview dialog state
const coverPreviewDialog = ref(false);
const currentBook = ref(null);
const previewCoverUrl = ref(null);
const booksToProcess = ref([]);
const currentBookIndex = ref(0);
const customSearchTitle = ref('');
const coverOptions = ref([]);

// Generate a random gradient for books without covers
const getRandomGradient = () => {
  const gradients = [
    { background: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { background: 'linear-gradient(135deg, #6a11cb, #2575fc)' },
    { background: 'linear-gradient(135deg, #a8c0ff, #3f2b96)' },
    { background: 'linear-gradient(135deg, #f83600, #f9d423)' },
    { background: 'linear-gradient(135deg, #ff4e50, #f9d423)' },
    { background: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { background: 'linear-gradient(135deg, #ff9966, #ff5e62)' },
    { background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)' },
    { background: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
    { background: 'linear-gradient(135deg, #fc00ff, #00dbde)' }
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

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

// Get responsive width for book cards based on screen width
const windowWidth = ref(window.innerWidth);

const getBookWidth = () => {
  // Use the reactive windowWidth value
  const width = windowWidth.value;
  
  // Return appropriate percentage based on breakpoints
  if (width >= 1400) {
    // XL screens: 5 items per row
    return '20%';
  } else if (width >= 1024) {
    // Large screens: 4 items per row
    return '25%';
  } else if (width >= 768) {
    // Medium screens: 3 items per row
    return '33.333%';
  } else if (width >= 640) {
    // Small screens: 2 items per row
    return '50%';
  } else {
    // Extra small screens: 1 item per row
    return '100%';
  }
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

// Fetch popular books (favorites)
const fetchPopularBooks = async () => {
  try {
    const books = await BookService.getBooks();
    // Filter favorite books or sort by quotes_count for popularity
    popularBooks.value = books
      .filter(book => book.is_favorite || (book.quotes_count && book.quotes_count > 0))
      .sort((a, b) => {
        // Sort first by is_favorite (true comes first)
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        // Then by quotes_count (higher comes first)
        return (b.quotes_count || 0) - (a.quotes_count || 0);
      })
      .slice(0, 10); // Limit to 10 books for performance
  } catch (error) {
    console.error('Error fetching popular books:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load popular books',
      life: 3000
    });
  }
};

// Fetch popular authors
const fetchPopularAuthors = async () => {
  try {
    // First get the list of all authors
    const authors = await AuthorService.getAuthors();
    console.log('Initial authors list:', authors);
    
    // Get up to 6 authors from the list
    const authorsToLoad = authors.slice(0, 6);
    
    // Load complete details for each author including books
    const detailedAuthors = await Promise.all(
      authorsToLoad.map(async author => {
        // Get detailed author info
        const authorDetail = await AuthorService.getAuthor(author.id);
        
        // If we need to count books manually, do another query
        if (!authorDetail.books) {
          // Get all books for this author
          const books = await BookService.getBooks();
          const authorBooks = books.filter(book => book.author && book.author.id === author.id);
          authorDetail.books_count = authorBooks.length;
          console.log(`Manually counted ${authorBooks.length} books for author ${author.name}`);
        }
        
        return authorDetail;
      })
    );
    
    console.log('Detailed authors with books:', detailedAuthors);
    
    // Check if books array exists for each author
    detailedAuthors.forEach(author => {
      console.log(`Author ${author.name}: books_count =`, author.books_count);
      
      // If books array doesn't exist, log a message
      if (!author.books_count) {
        console.log(`Author ${author.name} doesn't have a books_count property`);
      }
    });
    
    // Set the populated authors with books data
    popularAuthors.value = detailedAuthors;
    
    // Add gradient colors to authors without them
    popularAuthors.value.forEach(author => {
      if (!author.gradient_primary_color || !author.gradient_secondary_color) {
        const gradients = [
          { primary: '#667eea', secondary: '#764ba2' },
          { primary: '#6a11cb', secondary: '#2575fc' },
          { primary: '#a8c0ff', secondary: '#3f2b96' },
          { primary: '#f83600', secondary: '#f9d423' },
          { primary: '#11998e', secondary: '#38ef7d' },
          { primary: '#ff9966', secondary: '#ff5e62' },
        ];
        const gradient = gradients[Math.floor(Math.random() * gradients.length)];
        author.gradient_primary_color = author.gradient_primary_color || gradient.primary;
        author.gradient_secondary_color = author.gradient_secondary_color || gradient.secondary;
      }
      
      // Make sure we have at least a books_count property
      if (!author.books_count && author.books_count !== 0) {
        author.books_count = 4; // Set a default non-zero value
        console.log(`Adding default books_count of 4 to author ${author.name}`);
      }
    });
    
  } catch (error) {
    console.error('Error fetching popular authors:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load popular authors',
      life: 3000
    });
  }
};

onMounted(async () => {
  await fetchStats();
  await fetchPopularBooks();
  await fetchPopularAuthors();
  
  // Add window resize listener to reactively update layout
  const handleResize = () => {
    windowWidth.value = window.innerWidth;
  };
  
  window.addEventListener('resize', handleResize);
  
  // Store the handler for cleanup
  resizeHandler.value = handleResize;
});

// Clean up event listener on component unmount
onUnmounted(() => {
  if (resizeHandler.value) {
    window.removeEventListener('resize', resizeHandler.value);
  }
});
</script>

<style scoped>
/* Custom class for 5 items per row */
.xl\:col-2\.4 {
  flex: 0 0 20%;
  max-width: 20%;
}

/* Book card hover effects */
.book-card-hover {
  transform: translateY(0);
  will-change: transform, box-shadow;
}

.book-card-hover:hover {
  transform: translateY(-5px) scale(1.05);
  z-index: 10;
}

/* Ensure proper spacing for transform effects */
.book-container {
  padding: 12px;
  margin-bottom: 8px;
}

/* Cover management card styles */
.cover-management-card {
  background-color: var(--surface-card);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.cover-management-card .font-semibold {
  font-weight: 600;
}

.cover-management-card .p-button-rounded {
  border-radius: 1.5rem;
}

.cover-management-card .p-button-outlined {
  border: 1px solid var(--primary-color);
}

.cover-management-card .p-button-outlined:hover {
  background-color: var(--primary-color);
  color: var(--primary-color-text);
}

.cover-management-card .status-container {
  margin-bottom: 1rem;
}

.cover-management-card .status-icon {
  background-color: var(--primary-color);
  border-radius: 50%;
  padding: 0.5rem;
  margin-right: 1rem;
}

.cover-management-card .status-icon i {
  font-size: 1.5rem;
  color: var(--primary-color-text);
}

.cover-management-card .progress-bar {
  height: 0.5rem;
  background-color: var(--surface-border);
  border-radius: 0.25rem;
  overflow: hidden;
}

.cover-management-card .progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
}

.cover-management-card .cover-illustration {
  height: 100%;
  background-color: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.cover-management-card .cover-illustration i {
  font-size: 2rem;
  color: var(--primary-color);
}

.cover-management-card .cover-illustration .font-medium {
  font-weight: 600;
}

.cover-management-card .cover-illustration .text-sm {
  color: var(--text-color-secondary);
}

.cover-management-card .cover-stats {
  display: flex;
  align-items: baseline;
}

.cover-management-card .cover-stats .value {
  font-weight: 600;
}

.cover-management-card .cover-stats .divider {
  margin: 0 0.5rem;
}

.cover-management-card .cover-stats .total {
  color: var(--text-color-secondary);
}

/* Cover preview dialog styles */
.cover-preview-dialog {
  background-color: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.cover-preview-dialog .dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.cover-preview-dialog .dialog-header h2 {
  margin: 0;
}

.cover-preview-dialog .dialog-subtitle {
  color: var(--text-color-secondary);
}

.cover-preview-dialog .book-info {
  margin-bottom: 1rem;
}

.cover-preview-dialog .book-info h3 {
  margin: 0;
}

.cover-preview-dialog .book-info p {
  margin: 0;
}

.cover-preview-dialog .grid {
  display: flex;
  flex-wrap: wrap;
}

.cover-preview-dialog .col-12 {
  width: 100%;
}

.cover-preview-dialog .col-12 md:col-6 {
  width: 50%;
}

.cover-preview-dialog .cover-preview {
  margin-bottom: 1rem;
}

.cover-preview-dialog .cover-preview img {
  width: 100%;
  height: auto;
  border-radius: var(--border-radius);
}

.cover-preview-dialog .no-cover {
  height: 15rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-preview-dialog .no-cover .text-center {
  text-align: center;
}

.cover-preview-dialog .cover-options-grid {
  display: flex;
  flex-wrap: wrap;
}

.cover-preview-dialog .cover-options-grid .cover-option {
  width: 33.333%;
  padding: 0.5rem;
}

.cover-preview-dialog .cover-options-grid .cover-option:hover {
  background-color: var(--surface-border);
}

.cover-preview-dialog .cover-options-grid .cover-option .cover-option-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.cover-preview-dialog .cover-options-grid .cover-option .cover-option-inner img {
  width: 100%;
  height: auto;
  border-radius: var(--border-radius);
}

/* Manual search section */

/* Cover management card styles */
.cover-management-card {
  background-color: var(--surface-card);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.cover-management-card .cover-icon-wrapper {
  background-color: var(--primary-color);
  border-radius: 50%;
  padding: 0.5rem;
  margin-right: 1rem;
}

.cover-management-card .cover-icon-wrapper i {
  font-size: 1.5rem;
  color: var(--primary-color-text);
}

.cover-management-card .cover-description {
  color: var(--text-color-secondary);
}

.cover-management-card .cover-stats-card {
  background-color: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.cover-management-card .cover-stats-badge {
  background-color: var(--primary-color);
  border-radius: 1rem;
  padding: 0.25rem 0.75rem;
  color: var(--primary-color-text);
  font-weight: 600;
}

.cover-management-card .cover-progress-bar {
  height: 0.5rem;
  background-color: var(--surface-border);
  border-radius: 0.25rem;
  overflow: hidden;
}

.cover-management-card .cover-progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
}

.cover-management-card .update-button {
  background-color: var(--primary-color);
  color: var(--primary-color-text);
}

.cover-management-card .update-button:hover {
  background-color: var(--primary-color-hover);
}

.cover-management-card .update-button:focus {
  box-shadow: 0 0 0 0.2rem var(--primary-color-focus);
}

.cover-management-card .update-button:disabled {
  background-color: var(--surface-border);
  color: var(--text-color-secondary);
}

.cover-preview-dialog .cover-options-grid .cover-option.selected .cover-option-inner {
  border-radius: var(--border-radius);
}
</style>


<template>
  <div class="layout-main">
    <div class="grid grid-cols-12 gap-8">
      <!-- Stats Section -->
      <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-muted-color font-medium mb-4">Books</span>
              <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalBooks }}</div>
            </div>
            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width:2.5rem;height:2.5rem;">
              <i class="pi pi-book text-blue-500 !text-xl"></i>
            </div>
          </div>
          <span class="text-primary font-medium">{{ stats.booksWithoutCovers }} </span>
          <span class="text-muted-color">without covers</span>
        </div>
      </div>
      
      <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-muted-color font-medium mb-4">Authors</span>
              <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalAuthors }}</div>
            </div>
            <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width:2.5rem;height:2.5rem;">
              <i class="pi pi-user text-orange-500 !text-xl"></i>
            </div>
          </div>
          <span class="text-primary font-medium">{{ Math.round(stats.totalAuthors / Math.max(stats.totalBooks, 1) * 100) }}% </span>
          <span class="text-muted-color">author to book ratio</span>
        </div>
      </div>
      
      <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-muted-color font-medium mb-4">Quote Lists</span>
              <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.quoteLists }}</div>
            </div>
            <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width:2.5rem;height:2.5rem;">
              <i class="pi pi-list text-cyan-500 !text-xl"></i>
            </div>
          </div>
          <span class="text-primary font-medium">{{ stats.quoteGroups }}</span>
          <span class="text-muted-color"> quote groups</span>
        </div>
      </div>
      
      <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-muted-color font-medium mb-4">Quotes</span>
              <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalQuotes }}</div>
            </div>
            <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width:2.5rem;height:2.5rem;">
              <i class="pi pi-comment text-purple-500 !text-xl"></i>
            </div>
          </div>
          <span class="text-primary font-medium">{{ Math.round(stats.totalQuotes / Math.max(stats.totalBooks, 1)) }} </span>
          <span class="text-muted-color">average quotes per book</span>
        </div>
      </div>
      
      <!-- Popular Books Section -->
      <div class="col-span-12 mb-4">
        <div class="card">
          <PopularItemsWidget 
            :items="popularBooks"
            itemType="book"
            title="Popular Books"
            linkPrefix="/books/"
            countLabel="quotes"
            countIcon="pi-bookmark-fill"
            countIconColor="#f59e0b"
            viewMoreRoute="/books"
          />
        </div>
      </div>
      
      <!-- Popular Authors Section -->
      <div class="col-span-12 mb-4">
        <div class="card">
          <PopularItemsWidget 
            :items="popularAuthors"
            itemType="author"
            title="Popular Authors"
            linkPrefix="/authors/"
            countLabel="books"
            countIcon="pi-book"
            countIconColor="#3b82f6"
            viewMoreRoute="/authors"
          />
        </div>
      </div>
      
      <!-- Favorite Quotes and Popular Tags in same row -->
      <div class="col-span-12 xl:col-span-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h5 class="m-0 text-xl font-medium">Favorite Quotes</h5>
            <Button 
              label="See All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined p-button-sm"
              @click="router.push('/quotes')"
            />
          </div>
          <FavoriteQuotesWidget />
        </div>
      </div>
      
      <div class="col-span-12 xl:col-span-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h5 class="m-0 text-xl font-medium">Popular Tags</h5>
            <Button 
              label="See All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined p-button-sm"
              @click="router.push('/tags')"
            />
          </div>
          <PopularTagsWidget />
        </div>
      </div>
      
      <!-- Quote Groups and Quote Lists in same row -->
      <div class="col-span-12 xl:col-span-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h5 class="m-0 text-xl font-medium">Quote Groups</h5>
            <Button 
              label="See All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined p-button-sm"
              @click="router.push('/groups')"
            />
          </div>
          <QuoteGroupsWidget />
        </div>
      </div>
      
      <div class="col-span-12 xl:col-span-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h5 class="m-0 text-xl font-medium">Quote Lists</h5>
            <Button 
              label="See All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined p-button-sm"
              @click="router.push('/lists')"
            />
          </div>
          <NotificationsWidget />
        </div>
      </div>
      
      <!-- Book Covers Management Card -->
      <div class="col-span-12">
        <div class="card">
          <div class="flex justify-between align-items-center mb-4">
            <div class="font-semibold text-xl">Book Covers Management</div>
            <Button 
              v-if="stats.booksWithoutCovers > 0"
              label="Update Covers" 
              icon="pi pi-images"
              class="p-button-rounded p-button-outlined"
              @click="updateAllBookCovers"
              :loading="updatingCovers"
            />
          </div>
          
          <div class="mb-4">
            <p class="text-color-secondary mb-3">
              Update your book collection with covers from OpenLibrary. This will search for book covers
              based on title and author information, and update your database.
            </p>
            
            <div class="surface-100 p-3 border-round">
              <div class="flex align-items-center mb-2">
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full mr-3" style="width:2.5rem;height:2.5rem;">
                  <i class="pi pi-info-circle text-blue-500 text-xl"></i>
                </div>
                <div>
                  <span class="block font-medium text-lg">Books without covers</span>
                  <div class="flex align-items-center mt-1">
                    <span class="text-primary font-medium">{{ stats.booksWithoutCovers }}</span>
                    <span>&nbsp;</span>
                    <span class="text-muted-color">of {{ stats.totalBooks }} total books</span>
                  </div>
                </div>
              </div>
              
              <div class="mt-3">
                <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-border overflow-hidden" style="height: 0.5rem">
                  <div class="bg-primary h-full" :style="{width: `${(1 - stats.booksWithoutCovers/Math.max(stats.totalBooks, 1)) * 100}%`}"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Cover Preview Dialog -->
    <Dialog 
      v-model:visible="coverPreviewDialog" 
      :style="{width: '800px'}" 
      header="Book Cover Preview" 
      :modal="true"
      :closable="true"
      class="cover-preview-dialog"
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
              <div v-else class="text-gray-400 flex flex-col items-center">
                <i class="pi pi-image text-4xl mb-2 text-400"></i>
                <span>No cover selected</span>
              </div>
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
              <i class="pi pi-search text-2xl mb-2"></i>
              <div>No cover options found</div>
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
              class="search-button"
            />
          </div>
          <small class="text-gray-500 mt-1 block">
            <i class="pi pi-info-circle mr-1"></i>
            Tip: Try with a more general title or series name
          </small>
        </div>
        
        <div class="flex justify-center gap-3 mt-4 w-full action-buttons">
          <Button 
            icon="pi pi-times" 
            label="Reject" 
            severity="secondary" 
            @click="rejectCover"
            class="p-button-outlined"
          />
          <Button 
            icon="pi pi-check" 
            label="Accept" 
            class="update-button"
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
