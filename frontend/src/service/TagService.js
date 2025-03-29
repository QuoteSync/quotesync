import { apiClient } from "@/api";

export const TagService = {
    async getTags() {
        const response = await apiClient.get("/tags/");
        return response.data;
    },
    async getTag(tagId) {
        const response = await apiClient.get(`/tags/${tagId}/`);
        return response.data;
    },
    async getQuotesByTag(tagTitle) {
        const response = await apiClient.get(`/quotes/?tag=${tagTitle}`);
        return response.data;
    },
    async createTag(tagData) {
        const response = await apiClient.post("/tags/", tagData);
        return response.data;
    },
    async updateTag(tagId, tagData) {
        const response = await apiClient.put(`/tags/${tagId}/`, tagData);
        return response.data;
    },
    async deleteTag(tagId) {
        const response = await apiClient.delete(`/tags/${tagId}/`);
        return response.data;
    },
    async toggleFavorite(tagId) {
        const response = await apiClient.post(`/tags/${tagId}/toggle_favorite/`);
        return response.data;
    },
};
