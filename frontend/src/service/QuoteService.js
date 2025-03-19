// src/service/QuoteService.js
import { apiClient } from "@/api";

export const QuoteService = {
    // Fetch all quotes from the Django API
    async getQuotes() {
        const response = await apiClient.get("/quotes/");
        return response.data;
    },

    // Upload a .txt file containing quotes to the Django API
    async uploadQuotes(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post("/upload-quotes/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                "X-CSRFToken": getCookie("csrftoken")
            }
        });
        return response.data;
    },

    // Create a new quote
    async createQuote(quoteData) {
        const response = await apiClient.post("/quotes/", quoteData);
        return response.data;
    },
    async updateQuote(quoteId, quoteData) {
        // Validate the book exists
        if (quoteData.book) {
            const bookResponse = await apiClient.get(`/books/${quoteData.book}`);
            if (bookResponse.data.length === 0) {
                throw new Error(`Book with title "${quoteData.book}" does not exist.`);
            }
        }
        
        let tagIds = [];
        if (quoteData.tags && quoteData.tags.length > 0) {
            // Create a copy of the tags array to iterate over
            const originalTags = [...quoteData.tags];
            for (const tag of originalTags) {
                // If tag is an object, use its title; otherwise, assume tag is a string
                const tagTitle = typeof tag === 'object' ? tag.title : tag;
                console.log("tag", tagTitle.trim());
                const tagResponse = await apiClient.get(`/tags/?title=${tagTitle.trim()}`);
                
                if (tagResponse.data.length > 0) {
                    console.log("tagResponse", tagResponse);
                    // Push the tag ID (or the entire tag object, depending on what your API expects)
                    tagIds.push(tagResponse.data[0].id);
                } else {
                    throw new Error(`Tag with name "${tagTitle}" does not exist.`);
                }
            }
        }
        
        // Remove duplicate IDs if necessary
        quoteData.tags = [...new Set(tagIds)];
        console.log("quoteData", quoteData);
    
        const response = await apiClient.put(`/quotes/${quoteId}/`, quoteData);
        console.log("response", response);
        return response.data;
    },

    // Delete a quote by its ID
    async deleteQuote(quoteId) {
        const response = await apiClient.delete(`/quotes/${quoteId}/`);
        return response.data;
    },

    // Optionally, delete multiple quotes (if supported by your backend)
    async deleteMultipleQuotes(quoteIds) {
        const response = await apiClient.post("/quotes/delete-multiple/", {
            data: { ids: quoteIds }
        });
        return response.data;
    },
};
