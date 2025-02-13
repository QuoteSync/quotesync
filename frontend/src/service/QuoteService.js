// src/service/QuoteService.js
import apiClient from "@/api";

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
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },

    // Create a new quote
    async createQuote(quoteData) {
        const response = await apiClient.post("/quotes/", quoteData);
        return response.data;
    },

    // Update an existing quote by its ID
    async updateQuote(quoteId, quoteData) {
        const response = await apiClient.put(`/quotes/${quoteId}/`, quoteData);
        return response.data;
    },

    // Delete a quote by its ID
    async deleteQuote(quoteId) {
        const response = await apiClient.delete(`/quotes/${quoteId}/`);
        return response.data;
    },

    // Optionally, delete multiple quotes (if supported by your backend)
    async deleteMultipleQuotes(quoteIds) {
        const response = await apiClient.delete("/quotes/", {
            data: { ids: quoteIds }
        });
        return response.data;
    },
};
