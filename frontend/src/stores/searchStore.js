import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash-es';
import { SearchService } from '@/service/SearchService';

export const useSearchStore = defineStore('search', () => {
  // State
  const isOpen = ref(false);
  const query = ref('');
  const results = ref({
    books: [],
    authors: [],
    tags: [],
    quotes: []
  });
  const loading = ref(false);
  const selectedSection = ref('books');
  const selectedIndex = ref(0);
  const router = useRouter();
  const recentSearches = ref([]);

  // Getters
  const hasResults = computed(() => {
    return results.value.books.length > 0 || 
           results.value.authors.length > 0 || 
           results.value.tags.length > 0 ||
           results.value.quotes.length > 0;
  });

  const allResults = computed(() => {
    return [
      ...results.value.books.map(book => ({ ...book, type: 'book' })),
      ...results.value.authors.map(author => ({ ...author, type: 'author' })),
      ...results.value.tags.map(tag => ({ ...tag, type: 'tag' })),
      ...results.value.quotes.map(quote => ({ ...quote, type: 'quote' }))
    ];
  });

  // Actions
  const toggleOverlay = () => {
    isOpen.value = !isOpen.value;
    if (!isOpen.value) {
      resetSearch();
    } else {
      // Load recent searches when opening
      loadRecentSearches();
    }
  };

  const openOverlay = () => {
    isOpen.value = true;
    loadRecentSearches();
  };

  const closeOverlay = () => {
    isOpen.value = false;
    resetSearch();
  };

  const resetSearch = () => {
    query.value = '';
    results.value = { books: [], authors: [], tags: [], quotes: [] };
    selectedIndex.value = 0;
    selectedSection.value = 'books';
  };

  const loadRecentSearches = () => {
    recentSearches.value = SearchService.getRecentSearches();
  };

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      results.value = { books: [], authors: [], tags: [], quotes: [] };
      loading.value = false;
      return;
    }

    try {
      const response = await SearchService.search(searchQuery);
      results.value = response;
      
      // Save to recent searches only when we've completed a search with results
      if (hasResults.value) {
        SearchService.saveRecentSearch(searchQuery);
        loadRecentSearches(); // Refresh the recent searches list
      }
    } catch (error) {
      console.error('Search error:', error);
      results.value = { books: [], authors: [], tags: [], quotes: [] };
    } finally {
      loading.value = false;
    }
  }, 300);

  // Search action
  const search = (searchQuery) => {
    query.value = searchQuery;
    loading.value = true;
    debouncedSearch(searchQuery);
  };

  // Navigation between results
  const navigateDown = () => {
    const sections = ['books', 'authors', 'tags', 'quotes'];
    const currentSectionIndex = sections.indexOf(selectedSection.value);
    const currentSection = results.value[selectedSection.value];
    
    if (selectedIndex.value < currentSection.length - 1) {
      // Move down within the current section
      selectedIndex.value++;
    } else {
      // Move to the next section with results
      let nextSectionIndex = (currentSectionIndex + 1) % sections.length;
      while (nextSectionIndex !== currentSectionIndex) {
        if (results.value[sections[nextSectionIndex]].length > 0) {
          selectedSection.value = sections[nextSectionIndex];
          selectedIndex.value = 0;
          break;
        }
        nextSectionIndex = (nextSectionIndex + 1) % sections.length;
      }
    }
  };

  const navigateUp = () => {
    const sections = ['books', 'authors', 'tags', 'quotes'];
    const currentSectionIndex = sections.indexOf(selectedSection.value);
    
    if (selectedIndex.value > 0) {
      // Move up within the current section
      selectedIndex.value--;
    } else {
      // Move to the previous section with results
      let prevSectionIndex = (currentSectionIndex - 1 + sections.length) % sections.length;
      while (prevSectionIndex !== currentSectionIndex) {
        if (results.value[sections[prevSectionIndex]].length > 0) {
          selectedSection.value = sections[prevSectionIndex];
          selectedIndex.value = results.value[sections[prevSectionIndex]].length - 1;
          break;
        }
        prevSectionIndex = (prevSectionIndex - 1 + sections.length) % sections.length;
      }
    }
  };

  const selectResult = () => {
    const selectedItem = results.value[selectedSection.value][selectedIndex.value];
    if (!selectedItem) return;
    
    // Navigate to the appropriate route based on the result type
    switch (selectedSection.value) {
      case 'books':
        router.push(`/books/${selectedItem.id}`);
        break;
      case 'authors':
        router.push(`/authors/${selectedItem.id}`);
        break;
      case 'tags':
        router.push(`/tags/${selectedItem.id}`);
        break;
      case 'quotes':
        router.push(`/quotes/${selectedItem.id}`);
        break;
    }
    
    closeOverlay();
  };

  const clearRecentSearches = () => {
    SearchService.clearRecentSearches();
    recentSearches.value = [];
  };

  return {
    // State
    isOpen,
    query,
    results,
    loading,
    selectedSection,
    selectedIndex,
    recentSearches,
    
    // Getters
    hasResults,
    allResults,
    
    // Actions
    toggleOverlay,
    openOverlay,
    closeOverlay,
    search,
    navigateDown,
    navigateUp,
    selectResult,
    resetSearch,
    loadRecentSearches,
    clearRecentSearches
  };
}); 