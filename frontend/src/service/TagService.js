import { apiClient } from "@/api";

/**
 * Converts a string to a slug format
 * - Removes accents
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * @param {string} text - The text to convert to slug
 * @returns {string} - The slug
 */
const toSlug = (text) => {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-'); // Replace multiple - with single -
};

/**
 * Converts a string to Pascal Case (first letter of each word capitalized)
 * @param {string} text - The text to convert to Pascal Case
 * @returns {string} - The text in Pascal Case
 */
const toPascalCase = (text) => {
    return text
        .toString()
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

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
        // Convert the title to Pascal Case
        const pascalCaseTitle = toPascalCase(tagData.title);
        
        // Convert the tag title to slug format for the DB
        const sluggedTitle = toSlug(tagData.title);
        
        // Create a copy of the tag data with the slugged title and Pascal Case description
        const processedTagData = {
            ...tagData,
            title: sluggedTitle,
            description: pascalCaseTitle // Store the Pascal Case version in description
        };
        
        console.log('Creating tag with slugged title:', sluggedTitle);
        console.log('Storing Pascal Case in description:', pascalCaseTitle);
        const response = await apiClient.post("/tags/", processedTagData);
        
        // Return the response, but modify title to show the Pascal Case version
        const tagWithPascalCase = {
            ...response.data,
            title: pascalCaseTitle // Override title with Pascal Case for display
        };
        
        return tagWithPascalCase;
    },
    async updateTag(tagId, tagData) {
        // If title is being updated, convert it
        if (tagData.title) {
            const pascalCaseTitle = toPascalCase(tagData.title);
            const sluggedTitle = toSlug(tagData.title);
            
            tagData = {
                ...tagData,
                title: sluggedTitle,
                description: pascalCaseTitle
            };
        }
        
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
