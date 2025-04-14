import { apiClient } from "@/api";

export const StatisticsService = {
    /**
     * Fetch dashboard statistics from the API
     * @returns {Promise<Object>} - Object containing statistics counts
     */
    async getStatistics() {
        try {
            const response = await apiClient.get("statistics/");
            return response.data;
        } catch (error) {
            console.error("Error fetching statistics:", error);
            // Return empty stats object in case of error
            return {
                total_books: 0,
                books_without_covers: 0,
                total_authors: 0,
                total_quotes: 0,
                quote_lists: 0,
                quote_groups: 0
            };
        }
    }
}; 