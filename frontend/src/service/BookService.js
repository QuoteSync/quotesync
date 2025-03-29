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
    },
    async createBook(bookData) {
        const response = await apiClient.post("/books/", bookData);
        return response.data;
    },
    async updateBook(bookId, bookData) {
        console.log(`BookService: Updating book ${bookId} with data:`, bookData);
        try {
            const response = await apiClient.put(`/books/${bookId}/`, bookData);
            console.log("Update success response:", response.data);
            return response.data;
        } catch (error) {
            console.error("BookService: Error in updateBook:", error);
            console.error("Response data:", error.response?.data);
            throw error;
        }
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
    async toggleFavorite(bookId) {
        const response = await apiClient.post(`/books/${bookId}/toggle_favorite/`);
        return response.data;
    },
    
    // Method to update just the gradient colors using PATCH
    async updateGradientColors(bookId, primaryColor, secondaryColor) {
        console.log(`BookService: Updating gradient colors for book ${bookId}`, primaryColor, secondaryColor);
        try {
            const response = await apiClient.patch(`/books/${bookId}/`, {
                gradient_primary_color: primaryColor,
                gradient_secondary_color: secondaryColor
            });
            console.log("Gradient update success:", response.data);
            return response.data;
        } catch (error) {
            console.error("BookService: Error updating gradient colors:", error);
            console.error("Response data:", error.response?.data);
            throw error;
        }
    },
    
    // Method to check gradient colors
    async getGradientColors(bookId) {
        try {
            const response = await apiClient.get(`/books/${bookId}/`);
            console.log("Gradient colors for book", bookId, ":", {
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
    
    // OpenLibrary API integration methods
    async fetchCoverFromOpenLibrary(title, author) {
        try {
            console.log(`Searching for cover: Title="${title}", Author="${author}"`);
            
            // Clean and prepare the search terms
            const cleanTitle = title.trim().replace(/[^\w\s]/gi, '');
            const cleanAuthor = author.trim().replace(/[^\w\s]/gi, '');
            
            const coverOptions = [];
            
            // First try with both title and author (more specific)
            let query = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`);
            let response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=10`);
            let data = await response.json();
            
            console.log(`Search results for "${cleanTitle} ${cleanAuthor}":`, data);

            // Check if we found any results
            if (data.docs && data.docs.length > 0) {
                // Find results with cover_i
                const booksWithCovers = data.docs.filter(book => book.cover_i);
                
                for (const book of booksWithCovers) {
                    coverOptions.push({
                        url: `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`,
                        source: 'cover_id',
                        title: book.title || '',
                        author: book.author_name ? book.author_name[0] : ''
                    });
                }
                
                // Try ISBN
                const booksWithISBN = data.docs.filter(book => book.isbn && book.isbn.length > 0);
                for (const book of booksWithISBN) {
                    coverOptions.push({
                        url: `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`,
                        source: 'isbn',
                        title: book.title || '',
                        author: book.author_name ? book.author_name[0] : ''
                    });
                }
                
                // Try OLID
                const booksWithOLID = data.docs.filter(book => book.key);
                for (const book of booksWithOLID) {
                    const olid = book.key.split('/').pop();
                    coverOptions.push({
                        url: `https://covers.openlibrary.org/b/olid/${olid}-L.jpg`,
                        source: 'olid',
                        title: book.title || '',
                        author: book.author_name ? book.author_name[0] : ''
                    });
                }
            }
            
            // If we didn't find with both, try just the title (less specific, but might find more)
            if (coverOptions.length < 3) {
                console.log("Not enough covers found with title+author, trying just title search");
                query = encodeURIComponent(cleanTitle);
                response = await fetch(`https://openlibrary.org/search.json?title=${query}&limit=10`);
                data = await response.json();
                
                console.log(`Search results for title "${cleanTitle}":`, data);
                
                if (data.docs && data.docs.length > 0) {
                    const booksWithCovers = data.docs.filter(book => book.cover_i);
                    
                    for (const book of booksWithCovers) {
                        // Avoid duplicates
                        if (!coverOptions.some(option => option.url.includes(book.cover_i))) {
                            coverOptions.push({
                                url: `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`,
                                source: 'cover_id_title_only',
                                title: book.title || '',
                                author: book.author_name ? book.author_name[0] : ''
                            });
                        }
                    }
                }
            }
            
            console.log(`Found ${coverOptions.length} cover options:`, coverOptions);
            
            // Remove potential duplicates by URL
            const uniqueOptions = coverOptions.filter((option, index, self) =>
                index === self.findIndex((o) => o.url === option.url)
            );
            
            if (uniqueOptions.length === 0) {
                console.log("No covers found for this book");
                return { covers: [] };
            }
            
            return { covers: uniqueOptions };
        } catch (error) {
            console.error('Error fetching book cover from OpenLibrary:', error);
            return { covers: [] };
        }
    }
};
