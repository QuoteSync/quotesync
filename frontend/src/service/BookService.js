import { apiClient } from "@/api";

export const BookService = {
    async getBooks() {
        const response = await apiClient.get("/books/");
        return response.data;
    },
    async getBook(bookId) {
        const response = await apiClient.get(`/books/${bookId}/`);
        return response.data;
    },
    async getBooksByAuthor(authorId) {
        const response = await apiClient.get(`/books/?author=${authorId}`);
        return response.data;
    }
    ,

    async createBook(bookData) {
        const response = await apiClient.post("/books/", bookData);
        return response.data;
    },

    async updateBook(bookId, bookData) {
        const response = await apiClient.put(`/books/${bookId}/`, bookData);
        return response.data;
    },

    async deleteBook(bookId) {
        const response = await apiClient.delete(`/books/${bookId}/`);
        return response.data;
    },

    async deleteMultipleBooks(bookIds) {
        const response = await apiClient.delete("/books/", {
            data: { ids: bookIds }
        });
        return response.data;
    },
};
