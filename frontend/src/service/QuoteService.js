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
    
    async toggleFavorite(quoteId) {
        const response = await apiClient.post(`quotes/${quoteId}/toggle_favorite/`);
        // Emit an event for the favorite status change
        EventBus.emit('quote:favoriteChanged', {
            quoteId: quoteId,
            isFavorite: response.data.is_favorite
        });
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
            const response = await axios.post(`${API_BASE_URL}/api/quotes/search`, searchParams);
            return response.data;
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
            const response = await axios.post(`${API_BASE_URL}/api/quotes/${quoteId}/toggle-favorite`);
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
