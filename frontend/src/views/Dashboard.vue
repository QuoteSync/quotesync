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

/* Enhanced card styles */
.card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Stats card enhancements */
.stats-card {
  position: relative;
  overflow: hidden;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1));
  pointer-events: none;
}

.stats-icon {
  transition: transform 0.3s ease;
}

.stats-card:hover .stats-icon {
  transform: scale(1.1);
}

/* Book card hover effects */
.book-card-hover {
  transform: translateY(0);
  will-change: transform, box-shadow;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.book-card-hover:hover {
  transform: translateY(-5px) scale(1.02);
  z-index: 10;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Ensure proper spacing for transform effects */
.book-container {
  padding: 12px;
  margin-bottom: 8px;
}

/* Cover management card styles */
.cover-management-card {
  background: linear-gradient(135deg, var(--surface-card), var(--surface-ground));
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.cover-management-card .font-semibold {
  font-weight: 600;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cover-management-card .p-button-rounded {
  border-radius: 1.5rem;
  transition: all 0.3s ease;
}

.cover-management-card .p-button-outlined {
  border: 2px solid var(--primary-color);
  background: transparent;
  color: var(--primary-color);
}

.cover-management-card .p-button-outlined:hover {
  background: var(--primary-color);
  color: var(--primary-color-text);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Progress bar enhancements */
.progress-bar {
  height: 0.5rem;
  background: var(--surface-border);
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-400));
  border-radius: 1rem;
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Cover preview dialog styles */
.cover-preview-dialog {
  background: var(--surface-ground);
  border-radius: 1rem;
  padding: 1.5rem;
}

.cover-preview-dialog .dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.cover-preview-dialog .dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cover-preview-dialog .cover-preview {
  margin-bottom: 1.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.cover-preview-dialog .cover-preview img {
  width: 100%;
  height: auto;
  transition: transform 0.3s ease;
}

.cover-preview-dialog .cover-preview:hover img {
  transform: scale(1.02);
}

.cover-preview-dialog .cover-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.cover-preview-dialog .cover-option {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cover-preview-dialog .cover-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.cover-preview-dialog .cover-option.selected {
  border: 2px solid var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-200);
}

.cover-preview-dialog .cover-option .cover-option-inner {
  aspect-ratio: 2/3;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover-preview-dialog .cover-option .cover-option-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cover-preview-dialog .cover-option:hover .cover-option-inner img {
  transform: scale(1.05);
}

/* Action buttons styling */
.action-buttons .p-button {
  transition: all 0.3s ease;
}

.action-buttons .p-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.action-buttons .update-button {
  background: linear-gradient(90deg, var(--primary-color), var(--primary-400));
  border: none;
  color: var(--primary-color-text);
}

.action-buttons .update-button:hover {
  background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
}

/* Search section styling */
.search-button {
  background: linear-gradient(90deg, var(--primary-color), var(--primary-400));
  border: none;
  color: var(--primary-color-text);
  transition: all 0.3s ease;
}

.search-button:hover {
  background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .cover-preview-dialog .cover-options-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .card {
    padding: 1rem;
  }
}

/* Dark mode enhancements */
:root[data-theme="dark"] .card {
  background: var(--surface-card);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
}

:root[data-theme="dark"] .cover-management-card {
  background: linear-gradient(135deg, var(--surface-card), var(--surface-ground));
}

:root[data-theme="dark"] .cover-preview-dialog {
  background: var(--surface-ground);
}

:root[data-theme="dark"] .cover-options-grid {
  background: var(--surface-card);
}
</style>


<template>
  <div class="layout-main">
    <!-- Header Section -->
    <div class="sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 shadow-lg backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 rounded-t-3xl mb-8">
      <div class="container mx-auto px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h1 class="text-4xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent rounded text-center sm:text-left">
            Dashboard
          </h1>
          <div class="flex gap-3 justify-center sm:justify-end mt-4 sm:mt-0">
            <Button 
              v-if="stats.booksWithoutCovers > 0"
              label="Update Covers" 
              icon="pi pi-images"
              class="p-button-rounded p-button-outlined"
              @click="updateAllBookCovers"
              :loading="updatingCovers"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-8">
      <!-- Stats Section with enhanced styling -->
      <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card stats-card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-muted-color font-medium mb-4">Library Status</span>
              <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stats.totalBooks }}</div>
            </div>
            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full stats-icon" style="width:3rem;height:3rem;">
              <i class="pi pi-book text-blue-500 !text-2xl"></i>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Tag :value="`${Math.round((1 - stats.booksWithoutCovers/Math.max(stats.totalBooks, 1)) * 100)}% Complete`" 
                 :severity="stats.booksWithoutCovers === 0 ? 'success' : 'warning'" />
            <span class="text-muted-color text-sm">{{ stats.booksWithoutCovers }} need covers</span>
          </div>
        </div>
      </div>
      
      <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card stats-card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-muted-color font-medium mb-4">Author Diversity</span>
              <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stats.totalAuthors }}</div>
            </div>
            <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-full stats-icon" style="width:3rem;height:3rem;">
              <i class="pi pi-user text-orange-500 !text-2xl"></i>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Tag :value="`${Math.round(stats.totalAuthors / Math.max(stats.totalBooks, 1) * 100)}% Unique`" 
                 :severity="stats.totalAuthors / stats.totalBooks > 0.8 ? 'success' : 'info'" />
            <span class="text-muted-color text-sm">authors per book</span>
          </div>
        </div>
      </div>
      
      <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card stats-card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-muted-color font-medium mb-4">Quote Organization</span>
              <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stats.quoteLists }}</div>
            </div>
            <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-full stats-icon" style="width:3rem;height:3rem;">
              <i class="pi pi-list text-cyan-500 !text-2xl"></i>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Tag :value="`${stats.quoteGroups} Groups`" 
                 :severity="stats.quoteGroups > 0 ? 'success' : 'info'" />
            <span class="text-muted-color text-sm">organized collections</span>
          </div>
        </div>
      </div>
      
      <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card stats-card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between mb-4">
            <div>
              <span class="block text-muted-color font-medium mb-4">Quote Collection</span>
              <div class="text-surface-900 dark:text-surface-0 font-medium text-2xl">{{ stats.totalQuotes }}</div>
            </div>
            <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-full stats-icon" style="width:3rem;height:3rem;">
              <i class="pi pi-comment text-purple-500 !text-2xl"></i>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Tag :value="`${Math.round(stats.totalQuotes / Math.max(stats.totalBooks, 1))} Avg`" 
                 :severity="stats.totalQuotes / stats.totalBooks > 5 ? 'success' : 'info'" />
            <span class="text-muted-color text-sm">quotes per book</span>
          </div>
        </div>
      </div>
      
      <!-- Popular Books Section with enhanced styling -->
      <div class="col-span-12 mb-4">
        <div class="card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              Popular Books
            </h2>
            <Button 
              label="View All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined"
              @click="router.push('/books')"
            />
          </div>
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
      
      <!-- Popular Authors Section with enhanced styling -->
      <div class="col-span-12 mb-4">
        <div class="card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              Popular Authors
            </h2>
            <Button 
              label="View All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined"
              @click="router.push('/authors')"
            />
          </div>
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
        <div class="card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              Favorite Quotes
            </h2>
            <Button 
              label="View All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined"
              @click="router.push('/quotes')"
            />
          </div>
          <FavoriteQuotesWidget />
        </div>
      </div>
      
      <div class="col-span-12 xl:col-span-6">
        <div class="card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              Popular Tags
            </h2>
            <Button 
              label="View All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined"
              @click="router.push('/tags')"
            />
          </div>
          <PopularTagsWidget />
        </div>
      </div>
      
      <!-- Quote Groups and Quote Lists in same row -->
      <div class="col-span-12 xl:col-span-6">
        <div class="card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              Quote Groups
            </h2>
            <Button 
              label="View All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined"
              @click="router.push('/groups')"
            />
          </div>
          <QuoteGroupsWidget />
        </div>
      </div>
      
      <div class="col-span-12 xl:col-span-6">
        <div class="card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              Quote Lists
            </h2>
            <Button 
              label="View All" 
              icon="pi pi-arrow-right" 
              class="p-button-rounded p-button-outlined"
              @click="router.push('/lists')"
            />
          </div>
          <NotificationsWidget />
        </div>
      </div>
      
      <!-- Book Covers Management Card with enhanced styling -->
      <div class="col-span-12">
        <div class="card hover:shadow-xl transition-all duration-300">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              Book Covers Management
            </h2>
          </div>
          
          <div class="mb-4">
            <p class="text-color-secondary mb-3">
              Update your book collection with covers from OpenLibrary. This will search for book covers
              based on title and author information, and update your database.
            </p>
            
            <div class="surface-100 p-6 border-round-lg">
              <div class="flex align-items-center mb-4">
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full mr-4" style="width:3rem;height:3rem;">
                  <i class="pi pi-info-circle text-blue-500 text-2xl"></i>
                </div>
                <div>
                  <span class="block font-medium text-xl">Books without covers</span>
                  <div class="flex align-items-center mt-2">
                    <span class="text-primary font-medium text-lg">{{ stats.booksWithoutCovers }}</span>
                    <span class="mx-2">/</span>
                    <span class="text-muted-color">{{ stats.totalBooks }} total books</span>
                  </div>
                </div>
              </div>
              
              <div class="mt-4">
                <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden" style="height: 0.75rem">
                  <div class="bg-gradient-to-r from-primary-500 to-primary-700 h-full transition-all duration-500" 
                       :style="{width: `${(1 - stats.booksWithoutCovers/Math.max(stats.totalBooks, 1)) * 100}%`}">
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
      v-model:visible="coverPreviewDialog" 
      :style="{width: '800px'}" 
      header="Book Cover Preview" 
      :modal="true"
      :closable="true"
      class="cover-preview-dialog"
      @hide="exitCoverProcess"
    >
      <div class="flex flex-col items-center p-4">
        <h3 class="text-2xl font-bold fancy-font bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent mb-2">
          {{ currentBook?.title }}
        </h3>
        <p class="text-lg mb-6">by {{ currentBook?.author?.name }}</p>
        
        <div class="grid grid-cols-2 gap-6">
          <!-- Selected cover preview (large) -->
          <div class="col-span-1 flex flex-col items-center">
            <h4 class="font-medium mb-4">Selected Cover:</h4>
            <div class="relative mb-4 w-64 h-96 bg-gray-100 dark:bg-gray-800 flex items-center justify-center border rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
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
            <h4 class="font-medium mb-4">Available Covers ({{ coverOptions.length }}):</h4>
            <div v-if="coverOptions.length > 0" class="grid grid-cols-2 gap-4 overflow-y-auto max-h-96 p-2">
              <div 
                v-for="(cover, index) in coverOptions" 
                :key="index" 
                class="cursor-pointer border rounded-lg hover:shadow-lg transition-all duration-300 p-2"
                :class="{ 'border-primary-500 ring-2 ring-primary-300': previewCoverUrl === cover.url }"
                @click="selectCover(cover.url)"
              >
                <div class="w-full h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    :src="cover.url" 
                    :alt="`Cover option ${index+1}`"
                    class="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 p-6 text-center border rounded-lg bg-gray-50 dark:bg-gray-800">
              <i class="pi pi-search text-3xl mb-3"></i>
              <div class="text-lg">No cover options found</div>
            </div>
          </div>
        </div>
        
        <!-- Manual search section -->
        <div class="w-full my-6">
          <h4 class="font-medium mb-3">Search for more covers:</h4>
          <div class="flex gap-3">
            <InputText 
              v-model="customSearchTitle" 
              placeholder="Enter alternative title" 
              class="flex-1 p-3"
              @keydown.enter="searchCoverForCurrentBook(customSearchTitle)"
            />
            <Button 
              icon="pi pi-search" 
              @click="searchCoverForCurrentBook(customSearchTitle)"
              class="search-button p-3"
            />
          </div>
          <small class="text-gray-500 mt-2 block">
            <i class="pi pi-info-circle mr-1"></i>
            Tip: Try with a more general title or series name
          </small>
        </div>
        
        <div class="flex justify-center gap-4 mt-6 w-full action-buttons">
          <Button 
            icon="pi pi-times" 
            label="Reject" 
            severity="secondary" 
            @click="rejectCover"
            class="p-button-outlined p-3"
          />
          <Button 
            icon="pi pi-check" 
            label="Accept" 
            class="update-button p-3"
            :disabled="!previewCoverUrl"
            @click="acceptCover"
          />
          <Button 
            icon="pi pi-step-forward" 
            label="Skip" 
            class="p-button-outlined p-3" 
            @click="processNextBook"
          />
        </div>
        
        <div class="w-full pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 text-center">
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
