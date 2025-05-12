import axios from 'axios';
import { API_BASE_URL } from '../api.js';

/**
 * Interface for ChatResponse
 * @typedef {Object} ChatResponse
 * @property {string} response - The AI's response text
 * @property {Array<{quote: string, source: string}>} context - Context quotes used in the response
 */

export class QuoteSyncChatService {
  /**
   * Ask a question to the QuoteSync AI chat
   * @param {string} question - The user's question
   * @returns {Promise<ChatResponse>} - The API response
   */
  static async askQuoteSyncChat(question) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/`, {
        question
      });
      return response.data;
    } catch (error) {
      console.error('Error asking question:', error);
      throw error;
    }
  }

  /**
   * Fetch relevant context data from the database based on the user query
   * @param {string} query - The user's question/query
   * @returns {Promise<Array>} - Array of relevant context items
   */
  static async fetchRelevantContext(query) {
    try {
      // First try the backend endpoint (which might not be implemented yet)
      try {
        const response = await axios.post(`${API_BASE_URL}/deepseek/context`, {
          query
        });
        return response.data;
      } catch (backendError) {
        console.log('Backend context API not available, using direct Ollama approach:', backendError);
        
        // Fallback: If the backend endpoint fails or isn't implemented, 
        // we'll use a direct approach with Ollama API
        const directResponse = await fetch(`http://localhost:11434/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            model: "zephyr:latest", 
            messages: [
              {
                role: "system", 
                content: "You are an AI working as part of a quote management app. I will provide a user query. Your job is to extract key concepts, themes, and search terms that would be relevant for finding quotes in a database. Respond with ONLY a JSON list of keywords, no other text."
              },
              {
                role: "user",
                content: `User query: "${query}"\n\nExtract relevant search keywords for finding quotes, books, or authors in our database:`
              }
            ],
            stream: false
          })
        });
        
        const directData = await directResponse.json();
        
        if (directData.message && directData.message.content) {
          // Try to parse the response as JSON
          try {
            const keywordsText = directData.message.content;
            // Try to extract a JSON array if present
            const jsonMatch = keywordsText.match(/\[.*\]/s);
            const keywords = jsonMatch 
              ? JSON.parse(jsonMatch[0])
              : keywordsText.split(/[\s,]+/).filter(k => k.length > 3);
            
            // Return empty structure with the keywords for potential search
            return { 
              quotes: [], 
              books: [], 
              authors: [],
              keywords: keywords
            };
          } catch (parseError) {
            console.error('Error parsing keywords:', parseError);
          }
        }
        
        // If all else fails, return empty context
        return { quotes: [], books: [], authors: [] };
      }
    } catch (error) {
      console.error('Error fetching context:', error);
      // Return empty context if there's an error
      return { quotes: [], books: [], authors: [] };
    }
  }

  /**
   * Create a system message with database context
   * @param {Object} contextData - Contextual data from database
   * @returns {Object} - Formatted system message with context
   */
  static createContextMessage(contextData) {
    // Build a context string with information from the database
    let contextString = "You are QuoteSyncAI, a helpful assistant for a quote management platform. Format all your responses using Markdown syntax to ensure they display properly, using headers, lists, bold, italic and other formatting where appropriate. ";
    
    if (contextData.quotes && contextData.quotes.length > 0) {
      contextString += "\n\nHere are some relevant quotes from the database:\n";
      contextData.quotes.forEach((quote, i) => {
        contextString += `[${i+1}] "${quote.body}" `;
        if (quote.book) {
          contextString += `- from "${quote.book.title}" `;
          if (quote.book.author) {
            contextString += `by ${quote.book.author.name}`;
          }
        }
        contextString += "\n";
      });
    }
    
    if (contextData.books && contextData.books.length > 0) {
      contextString += "\n\nRelevant books:\n";
      contextData.books.forEach((book, i) => {
        contextString += `[${i+1}] "${book.title}" by ${book.author?.name || 'Unknown'}\n`;
      });
    }
    
    if (contextData.authors && contextData.authors.length > 0) {
      contextString += "\n\nRelevant authors:\n";
      contextData.authors.forEach((author, i) => {
        contextString += `[${i+1}] ${author.name}\n`;
      });
    }
    
    contextString += "\n\nYou can reference these items in your response. When referring to quotes, reference them by their numbers. Remember to always format your responses using Markdown.";
    
    return {
      role: "system",
      content: contextString
    };
  }

  /**
   * Stream chat with QuoteSync AI, adding database context
   * @param {Array} messages - Array of chat messages
   * @param {function} onChunk - Callback function for each chunk
   * @param {function} onDone - Callback function when done
   * @param {function} onError - Callback function for errors
   */
  static async streamChat(messages, onChunk, onDone, onError) {
    const controller = new AbortController();
    const { signal } = controller;
    
    try {
      // Extract the latest user query
      const userMessages = messages.filter(msg => msg.role === 'user');
      const latestUserQuery = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
      
      // Fetch relevant context from the database based on the query
      const contextData = await this.fetchRelevantContext(latestUserQuery);
      
      // Add a system message with the context
      const systemContextMessage = this.createContextMessage(contextData);
      
      // Create enhanced messages array with the context
      const enhancedMessages = [systemContextMessage, ...messages];
      
      // Use the local Ollama API directly
      fetch(`http://localhost:11434/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          model: "zephyr:latest", 
          messages: enhancedMessages,
          stream: true 
        }),
        signal,
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let responseText = '';
          
          function readChunk() {
            return reader.read().then(({ value, done }) => {
              if (done) {
                onDone && onDone();
                return;
              }
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.trim() === '') continue;
                
                try {
                  const parsedData = JSON.parse(line);
                  
                  if (parsedData.done) {
                    onDone && onDone();
                    return;
                  }
                  
                  if (parsedData.message && parsedData.message.content) {
                    // Append to the ongoing response text
                    responseText += parsedData.message.content;
                    
                    // Create a format that matches what the component expects
                    const formattedChunk = {
                      message: {
                        role: 'assistant',
                        content: responseText
                      },
                      // Include any quotes used as context
                      context: contextData.quotes ? contextData.quotes.map(quote => ({
                        quote: quote.body,
                        source: quote.book 
                          ? `${quote.book.title}${quote.book.author ? ` by ${quote.book.author.name}` : ''}`
                          : 'Unknown source'
                      })) : []
                    };
                    
                    onChunk && onChunk(formattedChunk);
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
              
              return readChunk();
            });
          }
          
          return readChunk();
        })
        .catch(err => {
          onError && onError(err);
        });
    } catch (error) {
      onError && onError(error);
    }
    
    // Return abort controller to allow canceling the stream
    return {
      abort: () => controller.abort(),
    };
  }

  /**
   * Generate tags for a quote using QuoteSync AI
   * @param {number} quoteId - The ID of the quote to tag
   * @returns {Promise} - The API response with generated tags
   */
  static async generateTags(quoteId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/tag`, {
        quote_id: quoteId
      });
      return response.data;
    } catch (error) {
      console.error('Error generating tags:', error);
      throw error;
    }
  }

  /**
   * Find related quotes using QuoteSync AI
   * @param {number} quoteId - The ID of the quote to find related quotes for
   * @param {number} threshold - Similarity threshold (0.0 to 1.0)
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise} - The API response with related quotes
   */
  static async findRelatedQuotes(quoteId, threshold = 0.7, maxResults = 5) {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/related`, {
        params: {
          quote_id: quoteId,
          threshold,
          max_results: maxResults
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error finding related quotes:', error);
      throw error;
    }
  }

  /**
   * Find related quotes by text using QuoteSync AI
   * @param {string} text - The text to find related quotes for
   * @param {number} threshold - Similarity threshold (0.0 to 1.0)
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Promise} - The API response with related quotes
   */
  static async findRelatedQuotesByText(text, threshold = 0.7, maxResults = 5) {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/related-by-text`, {
        text,
        threshold,
        max_results: maxResults
      });
      return response.data.related_quotes;
    } catch (error) {
      console.error('Error finding related quotes by text:', error);
      throw error;
    }
  }
} 