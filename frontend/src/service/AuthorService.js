import { apiClient } from "@/api";
import axios from "axios";

export const AuthorService = {
    async getAuthors() {
        const response = await apiClient.get("/authors/");
        return response.data;
    },
    async getAuthor(authorId) {
        try {
            console.log(`Getting author details for ID: ${authorId}`);
            const response = await apiClient.get(`/authors/${authorId}/`);
            console.log(`Author API response:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error getting author ${authorId}:`, error);
            throw error;
        }
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

    async toggleFavorite(authorId) {
        const response = await apiClient.post(`/authors/${authorId}/toggle_favorite/`);
        return response.data;
    },
    
    // Method to update just the gradient colors using PATCH
    async updateGradientColors(authorId, primaryColor, secondaryColor) {
        console.log(`AuthorService: Updating gradient colors for author ${authorId}`, primaryColor, secondaryColor);
        try {
            const response = await apiClient.patch(`/authors/${authorId}/`, {
                gradient_primary_color: primaryColor,
                gradient_secondary_color: secondaryColor
            });
            console.log("Gradient update success:", response.data);
            return response.data;
        } catch (error) {
            console.error("AuthorService: Error updating gradient colors:", error);
            console.error("Response data:", error.response?.data);
            throw error;
        }
    },
    
    // Method to check gradient colors
    async getGradientColors(authorId) {
        try {
            const response = await apiClient.get(`/authors/${authorId}/`);
            console.log("Gradient colors for author", authorId, ":", {
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
    
    /**
     * Fetch author covers from OpenLibrary or Wikipedia
     * @param {string} authorName - Author name to search for
     * @param {boolean} prioritizeWikipedia - Whether to prioritize Wikipedia search
     * @returns {Promise<Array>} - Array of cover image URLs
     */
    async fetchAuthorCoverFromOpenLibrary(authorName, prioritizeWikipedia = false) {
        console.log(`Searching for author covers for "${authorName}", prioritizeWikipedia: ${prioritizeWikipedia}`);
        
        // Store all found cover options
        let coverOptions = [];
        
        try {
            // If prioritizeWikipedia is true, first try Wikipedia
            if (prioritizeWikipedia) {
                console.log(`Searching Wikipedia for "${authorName}"`);
                try {
                    // Search Wikipedia for the author
                    const wikipediaResponse = await axios.get(
                        `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=${encodeURIComponent(authorName)}&srlimit=5&origin=*`
                    );
                    
                    const searchResults = wikipediaResponse.data.query.search;
                    console.log(`Wikipedia search returned ${searchResults.length} results`);
                    
                    // For each search result, get the page info and extract images if available
                    for (const result of searchResults) {
                        try {
                            // Get page images
                            const pageImagesResponse = await axios.get(
                                `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=500&pageids=${result.pageid}&origin=*`
                            );
                            
                            const pages = pageImagesResponse.data.query.pages;
                            const page = pages[result.pageid];
                            
                            if (page.thumbnail && page.thumbnail.source) {
                                // Add to cover options with source information
                                coverOptions.push({
                                    url: page.thumbnail.source,
                                    source: 'wikipedia',
                                    title: page.title || result.title
                                });
                                console.log(`Found Wikipedia image for "${result.title}": ${page.thumbnail.source}`);
                            }
                        } catch (error) {
                            console.error(`Error fetching Wikipedia page images for ${result.title}:`, error);
                        }
                    }
                } catch (error) {
                    console.error("Error searching Wikipedia:", error);
                }
                
                // If we found Wikipedia images, return them
                if (coverOptions.length > 0) {
                    console.log(`Returning ${coverOptions.length} Wikipedia images`);
                    return coverOptions;
                }
            }
            
            // Search OpenLibrary (either as primary source or as fallback if Wikipedia search failed)
            console.log(`Searching OpenLibrary for "${authorName}"`);
            
            // Clean and prepare the search term
            const cleanAuthorName = authorName.trim().replace(/[^\w\s]/gi, '');
            
            // First try author search endpoint
            const authorSearchResponse = await axios.get(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(cleanAuthorName)}`);
            
            if (authorSearchResponse.data.docs && authorSearchResponse.data.docs.length > 0) {
                // Get author keys for the top 5 results
                const authorKeys = authorSearchResponse.data.docs.slice(0, 5).map(doc => doc.key);
                
                // For each author key, get their details
                for (const authorKey of authorKeys) {
                    try {
                        const authorResponse = await axios.get(`https://openlibrary.org${authorKey}.json`);
                        const authorData = authorResponse.data;
                        
                        // Check if author has a photo
                        if (authorData.photos && authorData.photos.length > 0) {
                            // Add each photo to the cover options with source information
                            authorData.photos.forEach(photoId => {
                                const photoUrl = `https://covers.openlibrary.org/a/id/${photoId}-L.jpg`;
                                coverOptions.push({
                                    url: photoUrl,
                                    source: 'openlibrary',
                                    id: photoId
                                });
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching OpenLibrary author details for ${authorKey}:`, error);
                    }
                }
            }
            
            // If we didn't find any OpenLibrary images and we didn't already try Wikipedia, try it as a fallback
            if (coverOptions.length === 0 && !prioritizeWikipedia) {
                console.log(`No OpenLibrary images found, trying Wikipedia as fallback for "${authorName}"`);
                try {
                    // Search Wikipedia for the author
                    const wikipediaResponse = await axios.get(
                        `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=${encodeURIComponent(authorName)}&srlimit=5&origin=*`
                    );
                    
                    const searchResults = wikipediaResponse.data.query.search;
                    console.log(`Wikipedia fallback search returned ${searchResults.length} results`);
                    
                    // For each search result, get the page info and extract images if available
                    for (const result of searchResults) {
                        try {
                            // Get page images
                            const pageImagesResponse = await axios.get(
                                `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=500&pageids=${result.pageid}&origin=*`
                            );
                            
                            const pages = pageImagesResponse.data.query.pages;
                            const page = pages[result.pageid];
                            
                            if (page.thumbnail && page.thumbnail.source) {
                                // Add to cover options with source information
                                coverOptions.push({
                                    url: page.thumbnail.source,
                                    source: 'wikipedia',
                                    title: page.title || result.title
                                });
                                console.log(`Found Wikipedia fallback image for "${result.title}": ${page.thumbnail.source}`);
                            }
                        } catch (error) {
                            console.error(`Error fetching Wikipedia fallback page images for ${result.title}:`, error);
                        }
                    }
                } catch (error) {
                    console.error("Error searching Wikipedia as fallback:", error);
                }
            }
            
            // Remove any duplicate URLs
            coverOptions = coverOptions.filter((option, index, self) => 
                index === self.findIndex(t => t.url === option.url)
            );
            
            console.log(`Returning ${coverOptions.length} total cover options`);
            return coverOptions;
        } catch (error) {
            console.error("Error fetching author covers:", error);
            throw error;
        }
    },
    
    // Method to update an author's cover
    async updateAuthorCover(authorId, coverUrl) {
        try {
            // If coverUrl is null, send a null value to properly remove the cover field
            const payload = {
                cover: coverUrl
            };
            
            console.log(`AuthorService: Updating cover for author ${authorId} to ${coverUrl === null ? 'null (removing)' : coverUrl}`);
            
            const response = await apiClient.patch(`/authors/${authorId}/`, payload);
            console.log("Author cover update success:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error updating author cover:", error);
            console.error("Response data:", error.response?.data);
            throw error;
        }
    }
};
