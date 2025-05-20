import { apiClient } from "@/api";

// Book cover caching utilities
const COVERS_CACHE_NAME = 'book-covers-cache';
const COVERS_DB_NAME = 'book-covers-db';
const COVERS_STORE_NAME = 'covers';

// Initialize the IndexedDB for covers
const initCoverDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(COVERS_DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(COVERS_STORE_NAME)) {
        db.createObjectStore(COVERS_STORE_NAME, { keyPath: 'url' });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

// Save a cover image to IndexedDB
const saveCoverToIndexedDB = async (url, blob) => {
  try {
    const db = await initCoverDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([COVERS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(COVERS_STORE_NAME);
      
      // Store both URL and the binary data
      const item = {
        url: url,
        blob: blob,
        timestamp: Date.now()
      };
      
      const request = store.put(item);
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error saving cover to IndexedDB:', error);
    return false;
  }
};

// Get a cover from IndexedDB
const getCoverFromIndexedDB = async (url) => {
  try {
    const db = await initCoverDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([COVERS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(COVERS_STORE_NAME);
      
      const request = store.get(url);
      request.onsuccess = (event) => {
        const data = event.target.result;
        resolve(data ? data.blob : null);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error retrieving cover from IndexedDB:', error);
    return null;
  }
};

// Fetch and cache a cover image
const fetchAndCacheCover = async (url) => {
  // First check if we already have this cover in IndexedDB
  try {
    const cachedBlob = await getCoverFromIndexedDB(url);
    if (cachedBlob) {
      console.log('Retrieved cover from IndexedDB cache:', url);
      return URL.createObjectURL(cachedBlob);
    }
  } catch (error) {
    console.warn('Error checking IndexedDB cache:', error);
  }
  
  // If not in IndexedDB, fetch it and cache it
  try {
    // Check if the URL is likely to have CORS issues (non-openlibrary domains)
    const isLikelyCORSIssue = !url.includes('openlibrary.org') && 
                             !url.includes('librarything.com') &&
                             url.startsWith('http');
    
    // Handle OpenLibrary URLs specially
    if (url.includes('openlibrary.org')) {
      console.log('OpenLibrary URL detected:', url);
      // Check for OpenLibrary URLs with ID 0, which causes errors
      if (url.includes('/id/0-') || url.includes('/id/0.') || url.match(/\/id\/0($|\?)/)) {
        console.warn('Invalid OpenLibrary ID (0) detected:', url);
        return '/assets/images/book-placeholder.png';
      }
    }
    
    // For OpenLibrary or other known CORS-friendly APIs
    const fetchOptions = {
      mode: isLikelyCORSIssue ? 'no-cors' : 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
    };
    
    console.log(`Fetching cover with ${fetchOptions.mode} mode:`, url);
    const response = await fetch(url, fetchOptions);
    
    // If we get a response with no-cors mode, it will be an opaque response
    // We can't check if it's ok, but we can still use it for the cache
    if ((fetchOptions.mode === 'cors' && !response.ok) || 
        (response.type === 'opaque' && response.status === 0)) {
      // If it's OpenLibrary and not OK, don't throw - just return placeholder
      if (url.includes('openlibrary.org')) {
        console.warn(`OpenLibrary cover not available: ${response.status}`);
        return '/assets/images/book-placeholder.png';
      }
      throw new Error(`Failed to fetch cover: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // Check if the blob is too small (likely a transparent or empty image)
    if (blob.size < 100) {
      console.warn('Cover image too small (may be empty):', url);
      return '/assets/images/book-placeholder.png';
    }
    
    // Skip caching if response is opaque (no-cors mode)
    if (response.type !== 'opaque') {
      // Cache in IndexedDB
      await saveCoverToIndexedDB(url, blob);
      console.log('Cached cover in IndexedDB:', url);
      
      // Also cache in Cache API if Service Worker is supported
      if ('caches' in window) {
        try {
          const cache = await caches.open(COVERS_CACHE_NAME);
          // Only cache real HTTP/HTTPS URLs
          if (url.startsWith('http')) {
            await cache.put(url, new Response(blob));
            console.log('Cached cover in Cache API:', url);
          }
        } catch (cacheError) {
          console.warn('Failed to cache in Cache API:', cacheError);
        }
      }
    } else {
      console.log('Opaque response, using image but skipping cache for:', url);
    }
    
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching cover:', error);
    
    // Try the Cache API as fallback
    if ('caches' in window && url.startsWith('http')) {
      try {
        const cache = await caches.open(COVERS_CACHE_NAME);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          console.log('Retrieved cover from Cache API:', url);
          return URL.createObjectURL(await cachedResponse.blob());
        }
      } catch (cacheError) {
        console.error('Error retrieving from Cache API:', cacheError);
      }
    }
    
    // Return a placeholder if both fetch and cache failed
    return '/assets/images/book-placeholder.png';
  }
};

// Preload and cache a book's cover
const preloadBookCover = async (book) => {
  if (!book || !book.cover) return;

  try {
    let coverUrl;
    
    // Handle different cover formats
    if (typeof book.cover === 'string') {
      // Check if this is a full URL or just an ID
      if (book.cover.startsWith('http')) {
        coverUrl = book.cover;
      } else if (!isNaN(parseInt(book.cover))) { 
        // If it's a numeric ID, use OpenLibrary format
        // Check for ID "0" which is known to cause errors
        const coverId = parseInt(book.cover);
        if (coverId === 0 || coverId < 0) {
          console.warn('Invalid cover ID (0 or negative) for book:', book.title);
          return;
        }
        coverUrl = `https://covers.openlibrary.org/b/id/${book.cover}-L.jpg`;
      } else {
        // Might be another format, try to handle gracefully
        coverUrl = book.cover;
      }
    } else {
      // If cover is not a string, skip it
      console.warn('Invalid cover format for book:', book.title);
      return;
    }
    
    // Skip chrome-extension:// and other non-HTTP URLs
    if (!coverUrl.startsWith('http')) {
      console.warn('Skipping non-HTTP cover URL:', coverUrl);
      return;
    }
    
    // Validate URL format before fetch
    try {
      new URL(coverUrl);
    } catch (urlError) {
      console.warn('Invalid URL format for cover:', coverUrl);
      return;
    }
    
    // Fetch and cache the cover
    await fetchAndCacheCover(coverUrl);
    console.log('Preloaded book cover:', book.title);
  } catch (error) {
    console.error('Error preloading book cover:', book.title, error);
  }
};

// Enhancement for existing book service methods to cache covers
const enhanceWithCoverCache = (bookService) => {
  // Create a new object that preserves all original methods
  const enhancedService = { ...bookService };
  
  // Wrap the original getBooks method to cache covers
  const originalGetBooks = enhancedService.getBooks;
  enhancedService.getBooks = async function() {
    try {
      const books = await originalGetBooks.apply(this, arguments);
      
      // Preload covers for the first 10 books (to avoid too many requests)
      Promise.all(books.slice(0, 10).map(book => preloadBookCover(book)));
      
      return books;
    } catch (error) {
      console.error('Error in enhanced getBooks:', error);
      throw error;
    }
  };
  
  // Wrap getBooksByAuthor to also cache covers
  const originalGetBooksByAuthor = enhancedService.getBooksByAuthor;
  enhancedService.getBooksByAuthor = async function(authorId) {
    try {
      const books = await originalGetBooksByAuthor.apply(this, arguments);
      
      // Preload covers for the first 10 books (to avoid too many requests)
      Promise.all(books.slice(0, 10).map(book => preloadBookCover(book)));
      
      return books;
    } catch (error) {
      console.error('Error in enhanced getBooksByAuthor:', error);
      throw error;
    }
  };
  
  // Add backward compatibility for updateGradientColors
  enhancedService.updateGradientColors = async function(bookId, primaryColor, secondaryColor) {
    try {
      // Use PATCH instead of PUT for partial updates
      const response = await apiClient.patch(`/books/${bookId}/`, {
        gradient_primary_color: primaryColor,
        gradient_secondary_color: secondaryColor
      });
      return response.data;
    } catch (error) {
      console.error('Error in enhanced updateGradientColors:', error);
      throw error;
    }
  };
  
  // Update the updateBook method
  enhancedService.updateBook = async function(bookId, bookData) {
    try {
      // Create a minimal book object with only the fields the backend needs
      const minimalBookData = {};
      
      // Copy only the essential fields that the backend model accepts
      const allowedFields = [
        'title', 'description', 'isbn', 'publication_year', 
        'language', 'cover', 'gradient_primary_color', 
        'gradient_secondary_color'
      ];
      
      allowedFields.forEach(field => {
        if (bookData[field] !== undefined) {
          minimalBookData[field] = bookData[field];
        }
      });
      
      // Special handling for cover
      if (minimalBookData.cover) {
        // If it's an OpenLibrary URL, extract just the ID
        if (typeof minimalBookData.cover === 'string' && 
            minimalBookData.cover.includes('openlibrary.org/b/id/')) {
          const match = minimalBookData.cover.match(/\/b\/id\/(\d+)/);
          if (match && match[1]) {
            // For OpenLibrary covers, use the full URL format
            minimalBookData.cover = `https://covers.openlibrary.org/b/id/${match[1]}-L.jpg`;
            console.log('Using full OpenLibrary URL:', minimalBookData.cover);
          }
        } else if (typeof minimalBookData.cover === 'string' && /^\d+$/.test(minimalBookData.cover)) {
          // If it's just a numeric ID, convert to full URL
          minimalBookData.cover = `https://covers.openlibrary.org/b/id/${minimalBookData.cover}-L.jpg`;
          console.log('Converted numeric ID to full URL:', minimalBookData.cover);
        }
      }
      
      // Log the exact data being sent
      console.log('Sending book update data:', JSON.stringify(minimalBookData, null, 2));
      
      // If we're only updating the cover, use PATCH with just the cover field
      if (Object.keys(minimalBookData).length === 1 && minimalBookData.cover) {
        const response = await apiClient.patch(`/books/${bookId}/`, { cover: minimalBookData.cover });
        return response.data;
      }
      
      // For other updates, get the current book data
      const currentBook = await this.getBook(bookId);
      
      // Merge current book data with updates, but exclude author field
      const updateData = {
        ...currentBook,
        ...minimalBookData
      };
      
      // Remove author field to prevent validation errors
      delete updateData.author;
      
      // Make the API request using PATCH for partial update
      const response = await apiClient.patch(`/books/${bookId}/`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error in updateBook:', error);
      if (error.response) {
        console.error('API error response status:', error.response.status);
        console.error('API error response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Request data that caused error:', JSON.stringify(error.config.data, null, 2));
      }
      throw error;
    }
  };
  
  return enhancedService;
};

// Get cover URL (from cache if available, otherwise fetch and cache)
export const getCoverUrl = async (coverId) => {
  if (!coverId) return '/assets/images/book-placeholder.png';
  
  let coverUrl;
  
  // Handle different cover ID formats
  if (typeof coverId === 'string') {
    // If it's a full URL, use it directly
    if (coverId.startsWith('http')) {
      coverUrl = coverId;
    } else if (coverId.match(/^\d+$/)) {
      // If it's a numeric ID as string (like "12345"), use OpenLibrary format
      // Check for invalid IDs
      const numericId = parseInt(coverId, 10);
      if (numericId === 0 || isNaN(numericId) || numericId < 0) {
        console.warn('Invalid OpenLibrary ID format:', coverId);
        return '/assets/images/book-placeholder.png';
      }
      coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    } else {
      // If it has non-numeric characters, use as-is (might be data URL or other format)
      coverUrl = coverId;
    }
  } else if (typeof coverId === 'number') {
    // If it's a numeric ID, use OpenLibrary format
    // Check for invalid IDs
    if (coverId === 0 || coverId < 0) {
      console.warn('Invalid OpenLibrary ID value:', coverId);
      return '/assets/images/book-placeholder.png';
    }
    coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  } else {
    // If coverId is not a string or number, return placeholder
    console.warn('Invalid cover ID format:', coverId);
    return '/assets/images/book-placeholder.png';
  }
  
  // Skip chrome-extension:// and other non-HTTP URLs for data URLs
  if (coverUrl.startsWith('chrome-extension:') || 
      (!coverUrl.startsWith('http') && !coverUrl.startsWith('data:') && !coverUrl.startsWith('blob:'))) {
    console.warn('Skipping unsupported URL scheme:', coverUrl);
    return '/assets/images/book-placeholder.png';
  }
  
  // Validate the URL format for HTTP URLs
  if (coverUrl.startsWith('http')) {
    try {
      new URL(coverUrl);
    } catch (error) {
      console.warn('Invalid URL format:', coverUrl);
      return '/assets/images/book-placeholder.png';
    }
  }
  
  return await fetchAndCacheCover(coverUrl);
};

// Create the base BookService object
const baseBookService = {
    async getBooks() {
        const response = await apiClient.get('/books/');
        return response.data;
    },
    
    async getBook(bookId) {
        const response = await apiClient.get(`/books/${bookId}/`);
        return response.data;
    },
    
    async createBook(bookData) {
        const response = await apiClient.post('/books/', bookData);
        return response.data;
    },
    
    async updateBook(bookId, bookData) {
        try {
            // Create a minimal book object with only the fields the backend needs
            const minimalBookData = {};
            
            // Copy only the essential fields that the backend model accepts
            const allowedFields = [
                'title', 'description', 'isbn', 'publication_year', 
                'language', 'cover', 'gradient_primary_color', 
                'gradient_secondary_color'
            ];
            
            allowedFields.forEach(field => {
                if (bookData[field] !== undefined) {
                    minimalBookData[field] = bookData[field];
                }
            });
            
            // Special handling for cover
            if (minimalBookData.cover) {
                // If it's an OpenLibrary URL, extract just the ID
                if (typeof minimalBookData.cover === 'string' && 
                    minimalBookData.cover.includes('openlibrary.org/b/id/')) {
                    const match = minimalBookData.cover.match(/\/b\/id\/(\d+)/);
                    if (match && match[1]) {
                        // For OpenLibrary covers, use the full URL format
                        minimalBookData.cover = `https://covers.openlibrary.org/b/id/${match[1]}-L.jpg`;
                        console.log('Using full OpenLibrary URL:', minimalBookData.cover);
                    }
                } else if (typeof minimalBookData.cover === 'string' && /^\d+$/.test(minimalBookData.cover)) {
                    // If it's just a numeric ID, convert to full URL
                    minimalBookData.cover = `https://covers.openlibrary.org/b/id/${minimalBookData.cover}-L.jpg`;
                    console.log('Converted numeric ID to full URL:', minimalBookData.cover);
                }
            }
            
            // Log the exact data being sent
            console.log('Sending book update data:', JSON.stringify(minimalBookData, null, 2));
            
            // If we're only updating the cover, use PATCH with just the cover field
            if (Object.keys(minimalBookData).length === 1 && minimalBookData.cover) {
                const response = await apiClient.patch(`/books/${bookId}/`, { cover: minimalBookData.cover });
                return response.data;
            }
            
            // For other updates, get the current book data
            const currentBook = await this.getBook(bookId);
            
            // Merge current book data with updates, but exclude author field
            const updateData = {
                ...currentBook,
                ...minimalBookData
            };
            
            // Remove author field to prevent validation errors
            delete updateData.author;
            
            // Make the API request using PATCH for partial update
            const response = await apiClient.patch(`/books/${bookId}/`, updateData);
            return response.data;
        } catch (error) {
            console.error('Error in updateBook:', error);
            if (error.response) {
                console.error('API error response status:', error.response.status);
                console.error('API error response data:', JSON.stringify(error.response.data, null, 2));
                console.error('Request data that caused error:', JSON.stringify(error.config.data, null, 2));
            }
            throw error;
        }
    },
    
    async deleteBook(bookId) {
        const response = await apiClient.delete(`/books/${bookId}/`);
        return response.data;
    },
    
    async toggleFavorite(bookId) {
        const response = await apiClient.post(`/books/${bookId}/toggle_favorite/`);
        return response.data;
    },
    
    async searchBooks(searchTerm) {
        const response = await apiClient.get(`/books/search/?q=${searchTerm}`);
        return response.data;
    },
    
    async getBooksByAuthor(authorId) {
        const response = await apiClient.get(`/books/?author=${authorId}`);
        return response.data;
    },
    
    async fetchBookCovers(title, author) {
        try {
            // Construct search term, use both title and author if available
            let searchTerm = title || '';
            if (author) {
                searchTerm += ` ${author}`;
            }
            
            // Escape to make it URL-safe
            searchTerm = encodeURIComponent(searchTerm.trim());
            
            if (!searchTerm) {
                return { covers: [] };
            }
            
            const response = await fetch(`https://openlibrary.org/search.json?q=${searchTerm}`);
            const data = await response.json();
            
            // Extract cover IDs if available
            const covers = [];
            if (data.docs && data.docs.length > 0) {
                // Get up to 5 book results
                const books = data.docs.slice(0, 5);
                
                for (const book of books) {
                    if (book.cover_i) {
                        covers.push({
                            id: book.cover_i,
                            title: book.title,
                            author: book.author_name ? book.author_name[0] : 'Unknown',
                            url: `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
                        });
                    }
                }
            }
            
            return { covers };
        } catch (error) {
            console.error('Error fetching book covers:', error);
            return { covers: [] };
        }
    },
    
    // Add a new method specifically for covers
    async getBookCover(bookId) {
        try {
            const book = await this.getBook(bookId);
            if (book && book.cover) {
                return await getCoverUrl(book.cover);
            }
            return '/assets/images/book-placeholder.png';
        } catch (error) {
            console.error('Error getting book cover:', error);
            return '/assets/images/book-placeholder.png';
        }
    }
};

// Export the enhanced book service
export const BookService = enhanceWithCoverCache(baseBookService);
