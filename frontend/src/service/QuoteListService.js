import { apiClient } from "@/api";

export const QuoteListService = {
    async getQuoteLists() {
        console.log('Getting quote lists...');
        const response = await apiClient.get("quote-lists/");
        console.log('Quote lists response:', response.data);
        return response.data;
    },
    
    async getQuoteList(listId) {
        console.log('Getting quote list:', listId);
        const response = await apiClient.get(`quote-lists/${listId}/`);
        console.log('Quote list response:', response.data);
        return response.data;
    },
    
    async createQuoteList(listData) {
        console.log('Creating quote list:', listData);
        const response = await apiClient.post("quote-lists/", listData);
        console.log('Create quote list response:', response.data);
        return response.data;
    },
    
    async updateQuoteList(listId, listData) {
        console.log('Updating quote list:', listId, listData);
        const response = await apiClient.put(`quote-lists/${listId}/`, listData);
        console.log('Update quote list response:', response.data);
        return response.data;
    },
    
    async deleteQuoteList(listId) {
        console.log('Deleting quote list:', listId);
        const response = await apiClient.delete(`quote-lists/${listId}/`);
        console.log('Delete quote list response:', response.data);
        return response.data;
    },
    
    async addQuoteToList(listId, quoteId) {
        console.log(`QuoteListService: Adding quote ${quoteId} to list ${listId}`);
        try {
            const response = await apiClient.post(`quote-lists/${listId}/add_quote/`, {
                quote_id: quoteId
            });
            console.log('QuoteListService: Add quote response:', response.data);
            return response.data;
        } catch (error) {
            console.error('QuoteListService: Error adding quote to list:', error);
            console.error('QuoteListService: Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                quoteId: quoteId,
                listId: listId
            });
            throw error;
        }
    },
    
    async removeQuoteFromList(listId, quoteId) {
        console.log('Removing quote from list:', { listId, quoteId });
        const response = await apiClient.post(`quote-lists/${listId}/remove_quote/`, {
            quote_id: quoteId
        });
        console.log('Remove quote from list response:', response.data);
        return response.data;
    },
    
    async updateQuoteOrder(listId, quoteIds) {
        console.log('Updating quote order:', { listId, quoteIds });
        const response = await apiClient.post(`quote-lists/${listId}/update_order/`, {
            quote_ids: quoteIds
        });
        console.log('Update quote order response:', response.data);
        return response.data;
    },
    
    async getSharedLists() {
        console.log('Getting shared lists...');
        const response = await apiClient.get("quote-lists/shared/");
        console.log('Shared lists response:', response.data);
        return response.data;
    }
}; 