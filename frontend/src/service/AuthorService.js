import { apiClient } from "@/api";

export const AuthorService = {
    async getAuthors() {
        const response = await apiClient.get("/authors/");
        return response.data;
    },

    async createAuthor(authorData) {
        const response = await apiClient.post("/authors/", authorData);
        return response.data;
    },

    async updateAuthor(authorId, authorData) {
        const response = await apiClient.put(`/authors/${authorId}/`, authorData);
        return response.data;
    },

    async deleteAuthor(authorId) {
        const response = await apiClient.delete(`/authors/${authorId}/`);
        return response.data;
    },

    async deleteMultipleAuthors(authorIds) {
        const response = await apiClient.delete("/authors/", {
            data: { ids: authorIds }
        });
        return response.data;
    },
};
