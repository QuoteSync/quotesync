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
    
    // Method to update just the gradient colors using PATCH
    async updateGradientColors(tagId, primaryColor, secondaryColor) {
        console.log(`TagService: Updating gradient colors for tag ${tagId}`, primaryColor, secondaryColor);
        try {
            const response = await apiClient.patch(`/tags/${tagId}/`, {
                gradient_primary_color: primaryColor,
                gradient_secondary_color: secondaryColor
            });
            console.log("Gradient update success:", response.data);
            return response.data;
        } catch (error) {
            console.error("TagService: Error updating gradient colors:", error);
            console.error("Response data:", error.response?.data);
            throw error;
        }
    },
    
    // Method to check gradient colors
    async getGradientColors(tagId) {
        try {
            const response = await apiClient.get(`/tags/${tagId}/`);
            console.log("Gradient colors for tag", tagId, ":", {
                gradient_primary_color: response.data.gradient_primary_color,
                gradient_secondary_color: response.data.gradient_secondary_color
            });
            return {
                gradient_primary_color: response.data.gradient_primary_color,
                gradient_secondary_color: response.data.gradient_secondary_color
            };
        } catch (error) {
            console.error("Error getting gradient colors:", error);
            return null;
        }
    },
};
