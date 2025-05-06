import { apiClient } from '@/api';

export const SearchService = {
  /**
   * Search for books, authors, and tags
   * @param {string} query - The search query
   * @returns {Promise<Object>} - Promise that resolves to search results
   */
  async search(query) {
    try {
      const response = await apiClient.get(`/search?query=${encodeURIComponent(query.trim())}`);
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      return { books: [], authors: [], tags: [] };
    }
  },
  
  /**
   * Get recent searches
   * @returns {Array} - Array of recent searches
   */
  getRecentSearches() {
    try {
      const searches = localStorage.getItem('recentSearches');
      return searches ? JSON.parse(searches) : [];
    } catch (error) {
      console.error('Error fetching recent searches:', error);
      return [];
    }
  },
  
  /**
   * Save a search query to recent searches
   * @param {string} query - The search query to save
   */
  saveRecentSearch(query) {
    try {
      if (!query || query.trim() === '') return;
      
      const searches = this.getRecentSearches();
      
      // Remove if already exists
      const filteredSearches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
      
      // Add to beginning of array
      filteredSearches.unshift(query);
      
      // Limit to 5 recent searches
      const limitedSearches = filteredSearches.slice(0, 5);
      
      localStorage.setItem('recentSearches', JSON.stringify(limitedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  },
  
  /**
   * Clear all recent searches
   */
  clearRecentSearches() {
    localStorage.removeItem('recentSearches');
  }
}; 