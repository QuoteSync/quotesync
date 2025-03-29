// src/service/QuoteService.js
import { apiClient } from "@/api";

export const QuoteService = {
    // Fetch all quotes from the Django API
    async getQuotes() {
        const response = await apiClient.get("/quotes/");
        return response.data;
    },

    async getQuote(quoteId) {
        const response = await apiClient.get(`/quotes/${quoteId}/`);
        return response.data;
    },

    async getQuotesByBook(bookId) {
        const response = await apiClient.get(`/quotes/?book=${bookId}`);
        return response.data;
    },

    async getQuotesByTag(tagTitle) {
        const response = await apiClient.get(`/quotes/?tag=${tagTitle}`);
        return response.data;
    },

    async getQuotesByAuthor(authorId) {
        const response = await apiClient.get(`/quotes/?author=${authorId}`);
        return response.data;
    },

    async updateQuote(quoteId, quoteData) {
        const response = await apiClient.patch(`/quotes/${quoteId}/`, quoteData);
        return response.data;
    },

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
    
    async toggleFavorite(quoteId) {
        const response = await apiClient.post(`/quotes/${quoteId}/toggle_favorite/`);
        return response.data;
    },
};
