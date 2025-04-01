import { apiClient } from "@/api";

export const QuoteListService = {
    async getQuoteLists() {
        const response = await apiClient.get("/quote-lists/");
        return response.data;
    },
    
    async getQuoteList(listId) {
        const response = await apiClient.get(`/quote-lists/${listId}/`);
        return response.data;
    },
    
    async createQuoteList(listData) {
        const response = await apiClient.post("/quote-lists/", listData);
        return response.data;
    },
    
    async updateQuoteList(listId, listData) {
        const response = await apiClient.put(`/quote-lists/${listId}/`, listData);
        return response.data;
    },
    
    async deleteQuoteList(listId) {
        const response = await apiClient.delete(`/quote-lists/${listId}/`);
        return response.data;
    },
    
    async addQuoteToList(listId, quoteId) {
        const response = await apiClient.post(`/quote-lists/${listId}/add_quote/`, {
            quote_id: quoteId
        });
        return response.data;
    },
    
    async removeQuoteFromList(listId, quoteId) {
        const response = await apiClient.post(`/quote-lists/${listId}/remove_quote/`, {
            quote_id: quoteId
        });
        return response.data;
    }
}; 