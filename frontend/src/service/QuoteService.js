// src/service/QuoteService.js
import { apiClient } from "@/api";
import { EventBus } from "./EventBusService";
import axios from "axios";

export const QuoteService = {
    // Fetch all quotes from the Django API
    async getQuotes() {
        const response = await apiClient.get("quotes/");
        return response.data;
    },

    // Get quotes with pagination
    async getQuotesPaginated(page = 1, rows = 10, sortField = null, sortOrder = null, filters = null) {
        let queryParams = `?page=${page}&limit=${rows}`;
        
        // Add sorting if provided
        if (sortField) {
            queryParams += `&sort_field=${sortField}&sort_order=${sortOrder || 'asc'}`;
        }
        
        // Add filters if provided
        if (filters) {
            // Handle global search filter
            if (filters.global && filters.global.value) {
                queryParams += `&search=${encodeURIComponent(filters.global.value)}`;
            }
            
            // Handle specific field filters
            Object.entries(filters).forEach(([key, filter]) => {
                if (key !== 'global' && filter.value) {
                    queryParams += `&${key}=${encodeURIComponent(filter.value)}`;
                }
            });
        }
        
        const response = await apiClient.get(`quotes/paginated/${queryParams}`);
        return {
            data: response.data.results,
            total: response.data.count,
            page: page
        };
    },

    async getQuote(quoteId) {
        const response = await apiClient.get(`quotes/${quoteId}/`);
        return response.data;
    },

    async getQuotesByBook(bookId) {
        const response = await apiClient.get(`quotes/?book=${bookId}`);
        return response.data;
    },

    async getQuotesByTag(tagTitle) {
        const response = await apiClient.get(`quotes/?tag=${tagTitle}`);
        return response.data;
    },

    async getQuotesByAuthor(authorId) {
        const response = await apiClient.get(`quotes/?author=${authorId}`);
        return response.data;
    },

    async updateQuote(quoteId, quoteData) {
        const response = await apiClient.patch(`quotes/${quoteId}/`, quoteData);
        return response.data;
    },

    async deleteQuote(quoteId) {
        const response = await apiClient.delete(`quotes/${quoteId}/`);
        return response.data;
    },

    // Optionally, delete multiple quotes (if supported by your backend)
    async deleteMultipleQuotes(quoteIds) {
        const response = await apiClient.post("quotes/delete-multiple/", {
            data: { ids: quoteIds }
        });
        return response.data;
    },

    // Upload a .txt file containing quotes to the Django API
    async uploadQuotes(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post("upload-quotes/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                "X-CSRFToken": getCookie("csrftoken")
            }
        });
        return response.data;
    },

    // Create a new quote
    async createQuote(quoteData) {
        const response = await apiClient.post("quotes/", quoteData);
        return response.data;
    },
    
    async getRandomFavorites() {
        const response = await apiClient.get('quotes/random_favorites/');
        return response.data;
    },

    async getSharedQuotes() {
        const response = await apiClient.get('quote-lists/shared/');
        return response.data;
    },

    /**
     * Search quotes with advanced filters
     * @param {Object} searchParams - The search parameters
     * @returns {Promise} - The API response with search results
     */
    async searchQuotes(searchParams) {
        try {
            // Get all quotes for the current user
            const allQuotes = await this.getQuotes();
            
            // If there are no filters, return all quotes
            if (!searchParams.filters || searchParams.filters.length === 0) {
                return {
                    results: allQuotes
                };
            }
            
            // Apply filters using the specified logic operator
            let filteredQuotes = [];
            
            // Process each quote with the filters
            filteredQuotes = allQuotes.filter(quote => {
                // Check if the quote matches each filter based on the logic operator
                const filterResults = searchParams.filters.map(filter => {
                    return matchesFilter(quote, filter);
                });
                
                // Apply logic operator (AND requires all true, OR requires at least one true)
                return searchParams.logic_operator === 'AND' 
                    ? filterResults.every(result => result)
                    : filterResults.some(result => result);
            });
            
            // Apply sorting
            if (searchParams.sort_by) {
                filteredQuotes.sort((a, b) => {
                    let valueA = a[searchParams.sort_by];
                    let valueB = b[searchParams.sort_by];
                    
                    // Handle special cases
                    if (searchParams.sort_by === 'created' || searchParams.sort_by === 'updated') {
                        valueA = new Date(valueA || 0).getTime();
                        valueB = new Date(valueB || 0).getTime();
                    }
                    
                    // Apply sort direction
                    const direction = searchParams.sort_order === 'desc' ? -1 : 1;
                    
                    if (valueA < valueB) return -1 * direction;
                    if (valueA > valueB) return 1 * direction;
                    return 0;
                });
            }
            
            // Apply limit
            if (searchParams.limit && searchParams.limit > 0) {
                filteredQuotes = filteredQuotes.slice(0, searchParams.limit);
            }
            
            return {
                results: filteredQuotes
            };
        } catch (error) {
            console.error('Error searching quotes:', error);
            throw error;
        }
    },

    /**
     * Toggle favorite status of a quote
     * @param {number} quoteId - The ID of the quote
     * @returns {Promise} - The API response
     */
    async toggleFavorite(quoteId) {
        try {
            const response = await apiClient.post(`quotes/${quoteId}/toggle_favorite/`);
            // Emit an event for the favorite status change
            EventBus.emit('quote:favoriteChanged', {
                quoteId: quoteId,
                isFavorite: response.data.is_favorite
            });
            return response.data;
        } catch (error) {
            console.error('Error toggling favorite status:', error);
            throw error;
        }
    },

    /**
     * Add a tag to a quote
     * @param {number} quoteId - The ID of the quote
     * @param {number} tagId - The ID of the tag to add
     * @returns {Promise} - The API response
     */
    async addTagToQuote(quoteId, tagId) {
        try {
            console.log(`Adding tag ${tagId} to quote ${quoteId}`);
            
            // First, get the current quote to retrieve its existing tags
            const quote = await this.getQuote(quoteId);
            
            // Extract tag titles from the current tags
            const currentTagTitles = quote.tags.map(tag => {
                // If the tag has description (Pascal Case), use that
                if (tag.description) {
                    return tag.description;
                }
                // Otherwise use the title (which may be in slug format)
                return tag.title;
            });
            
            // Get the tag object to add
            const response = await apiClient.get(`/tags/${tagId}/`);
            const tagToAdd = response.data;
            
            // Determine the tag title to use (prefer description if available)
            let tagTitle = tagToAdd.description ? tagToAdd.description : tagToAdd.title;
            
            // Add the new tag title if it's not already there
            if (!currentTagTitles.some(title => title.toLowerCase() === tagTitle.toLowerCase())) {
                currentTagTitles.push(tagTitle);
            }
            
            // Update the quote with the new tags array
            const updateResponse = await apiClient.patch(`quotes/${quoteId}/`, {
                tags: currentTagTitles
            });
            
            return updateResponse.data;
        } catch (error) {
            console.error('Error adding tag to quote:', error);
            throw error;
        }
    },
    
    /**
     * Remove a tag from a quote
     * @param {number} quoteId - The ID of the quote
     * @param {number} tagId - The ID of the tag to remove
     * @returns {Promise} - The API response
     */
    async removeTagFromQuote(quoteId, tagId) {
        try {
            console.log(`Removing tag ${tagId} from quote ${quoteId}`);
            
            // First, get the current quote to retrieve its existing tags
            const quote = await this.getQuote(quoteId);
            
            // Get the tag to remove
            const tagResponse = await apiClient.get(`/tags/${tagId}/`);
            const tagToRemove = tagResponse.data;
            const tagTitle = tagToRemove.description ? tagToRemove.description : tagToRemove.title;
            
            // Filter out the tag to remove by comparing either ID or title
            const updatedTags = quote.tags
                .filter(tag => {
                    // If we have an ID, use that for comparison
                    if (tag.id && tag.id === tagId) {
                        return false;
                    }
                    
                    // Compare by title as fallback
                    const currentTitle = tag.description ? tag.description : tag.title;
                    return currentTitle.toLowerCase() !== tagTitle.toLowerCase();
                })
                .map(tag => tag.description ? tag.description : tag.title);
            
            // Update the quote with the new tags array
            const updateResponse = await apiClient.patch(`quotes/${quoteId}/`, {
                tags: updatedTags
            });
            
            return updateResponse.data;
        } catch (error) {
            console.error('Error removing tag from quote:', error);
            throw error;
        }
    },
};

/**
 * Helper function to check if a quote matches a given filter
 * @param {Object} quote - The quote object to check
 * @param {Object} filter - The filter to apply
 * @returns {boolean} - Whether the quote matches the filter
 */
function matchesFilter(quote, filter) {
    const { type, operator, value } = filter;
    
    // If value is empty, consider it a match (to avoid filtering out everything)
    if (value === null || value === undefined || value === '' || 
       (Array.isArray(value) && value.length === 0)) {
        return true;
    }
    
    switch (type) {
        case 'quote_content':
            const quoteContent = (quote.body || '').toLowerCase();
            const searchValue = (value || '').toLowerCase();
            
            switch (operator) {
                case 'contains':
                    return quoteContent.includes(searchValue);
                case 'exact':
                    return quoteContent === searchValue;
                case 'starts_with':
                    return quoteContent.startsWith(searchValue);
                case 'ends_with':
                    return quoteContent.endsWith(searchValue);
                default:
                    return quoteContent.includes(searchValue);
            }
            
        case 'tags':
            const quoteTags = quote.tags || [];
            
            switch (operator) {
                case 'has_any':
                    return value.some(tagId => 
                        quoteTags.some(tag => tag.id === tagId || tag.title === tagId));
                case 'has_all':
                    return value.every(tagId => 
                        quoteTags.some(tag => tag.id === tagId || tag.title === tagId));
                case 'not_has':
                    return !value.some(tagId => 
                        quoteTags.some(tag => tag.id === tagId || tag.title === tagId));
                default:
                    return false;
            }
            
        case 'author':
            if (!quote.book || !quote.book.author) return false;
            
            const authorId = quote.book.author.id;
            
            switch (operator) {
                case 'is':
                    return authorId === value;
                case 'is_not':
                    return authorId !== value;
                default:
                    return false;
            }
            
        case 'book':
            if (!quote.book) return false;
            
            const bookId = quote.book.id;
            
            switch (operator) {
                case 'is':
                    return bookId === value;
                case 'is_not':
                    return bookId !== value;
                default:
                    return false;
            }
            
        case 'date':
            if (!quote.created_at) return false;
            
            const quoteDate = new Date(quote.created_at);
            
            switch (operator) {
                case 'between':
                    if (!Array.isArray(value) || value.length !== 2) return false;
                    const fromDate = new Date(value[0]);
                    const toDate = new Date(value[1]);
                    return quoteDate >= fromDate && quoteDate <= toDate;
                case 'before':
                    const beforeDate = new Date(value);
                    return quoteDate < beforeDate;
                case 'after':
                    const afterDate = new Date(value);
                    return quoteDate > afterDate;
                default:
                    return false;
            }
            
        case 'is_favorite':
            return quote.is_favorite === value;
            
        default:
            return true;
    }
}
