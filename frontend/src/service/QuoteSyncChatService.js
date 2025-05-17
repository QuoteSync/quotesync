import axios from 'axios';
import { API_BASE_URL, apiClient, getCookie } from '../api.js';

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
      console.log('Fetching context for query:', query);
      
      // Obtener todas las citas
      try {
        console.log('Getting all quotes');
        const allQuotesResponse = await apiClient.get(`/quotes/`);
        
        if (allQuotesResponse.data && 
            Array.isArray(allQuotesResponse.data) && 
            allQuotesResponse.data.length > 0) {
          
          console.log('Found all quotes:', allQuotesResponse.data.length);
          
          // Extraer todos los tags únicos de las citas
          const allTags = new Set();
          
          allQuotesResponse.data.forEach(quote => {
            if (quote.tags && Array.isArray(quote.tags)) {
              quote.tags.forEach(tag => {
                const tagStr = typeof tag === 'string' ? tag : 
                             (typeof tag === 'object' && tag !== null && tag.name) ? tag.name :
                             String(tag);
                allTags.add(tagStr.toLowerCase());
              });
            }
          });
          
          const uniqueTags = Array.from(allTags);
          console.log('Unique tags in database:', uniqueTags);
          
          if (uniqueTags.length > 0) {
            // Usar el LLM para identificar qué tags son relevantes para la consulta
            const relevantTags = await this.findRelevantTagsWithLLM(query, uniqueTags);
            console.log('AI identified relevant tags:', relevantTags);
            
            if (relevantTags.length > 0) {
              // Filtrar citas que tengan los tags relevantes
              const quotesWithRelevantTags = allQuotesResponse.data.filter(quote => {
                if (!quote.tags || !Array.isArray(quote.tags)) return false;
                
                return quote.tags.some(tag => {
                  const tagStr = typeof tag === 'string' ? tag : 
                               (typeof tag === 'object' && tag !== null && tag.name) ? tag.name :
                               String(tag);
                  const tagLower = tagStr.toLowerCase();
                  
                  return relevantTags.some(relevantTag => 
                    tagLower === relevantTag || 
                    tagLower.includes(relevantTag) || 
                    relevantTag.includes(tagLower)
                  );
                });
              });
              
              if (quotesWithRelevantTags.length > 0) {
                console.log(`Found ${quotesWithRelevantTags.length} quotes with AI-identified relevant tags`);
                return {
                  quotes: quotesWithRelevantTags,
                  books: [],
                  authors: [],
                  source: 'ai_tags'
                };
              }
            }
          }
          
          // Si no se encuentran citas con tags relevantes, usar búsqueda semántica
          console.log('No quotes with AI-identified tags, using semantic similarity');
          const similarQuotes = await this.findSimilarQuotesWithLocalLLM(query, allQuotesResponse.data);
          
          if (similarQuotes && similarQuotes.length > 0) {
            console.log('Found semantically similar quotes:', similarQuotes.length);
            return {
              quotes: similarQuotes,
              books: [],
              authors: [],
              source: 'semantic'
            };
          }
          
          // Si tampoco hay coincidencias semánticas, buscar citas que contengan términos relevantes en su texto
          const quotesWithRelevantText = allQuotesResponse.data.filter(quote => {
            if (!quote.body) return false;
            
            const quoteText = quote.body.toLowerCase();
            // Buscar términos específicos relacionados con el amor
            if (query.toLowerCase().includes('love') || query.toLowerCase().includes('amor')) {
              const hasLoveTerms = quoteText.includes('love') || quoteText.includes('amor') || 
                                  quoteText.includes('loving') || quoteText.includes('amar') ||
                                  quoteText.includes('amando') || quoteText.includes('querer') ||
                                  quoteText.includes('queriendo') || quoteText.includes('passion') ||
                                  quoteText.includes('pasión') || quoteText.includes('heart') ||
                                  quoteText.includes('corazón') || quoteText.includes('loved');
              if (hasLoveTerms) {
                console.log(`Found love-related content in quote: "${quote.body.substring(0, 50)}..."`);
                return true;
              }
            }
            
            // Extraer términos clave para buscar en el texto
            const searchTerms = query.toLowerCase()
              .split(/[\s,]+/)
              .filter(word => word.length > 2)
              .map(word => word.replace(/[^\w]/g, ''));
              
            return searchTerms.some(term => {
              const contains = quoteText.includes(term);
              if (contains) {
                console.log(`Found term '${term}' in quote: "${quote.body.substring(0, 50)}..."`);
              }
              return contains;
            });
          });
          
          if (quotesWithRelevantText.length > 0) {
            console.log(`Found ${quotesWithRelevantText.length} quotes with matching text`);
            return {
              quotes: quotesWithRelevantText.slice(0, 10), // Limitar a 10 resultados
              books: [],
              authors: [],
              source: 'text'
            };
          }
          
          // 4. Como último recurso, seleccionar algunas citas aleatorias
          console.log('No relevant matches, selecting random quotes');
          const randomQuotes = allQuotesResponse.data
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
            
          return {
            quotes: randomQuotes,
            books: [],
            authors: [],
            source: 'random'
          };
        }
      } catch (error) {
        console.error('Error getting and filtering quotes:', error);
      }
      
      // Si todo falla, retorna un contexto vacío
      console.log('No quotes found in database');
      return { quotes: [], books: [], authors: [] };
    } catch (error) {
      console.error('Error fetching context:', error);
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
    let contextString = "You are QuoteSyncAI, a helpful assistant for a quote management platform. EXTREMELY IMPORTANT INSTRUCTION: You must ONLY respond using quotes that exist in the user's database and are listed below. NEVER invent, generate, or provide any quotes that are not explicitly included in the context provided below, even if they are famous or well-known. If no relevant quotes are found in the database, you must inform the user that no matching quotes were found in their collection and suggest adding some. Format all your responses using Markdown syntax to ensure they display properly, using headers, lists, bold, italic and other formatting where appropriate. ";
    
    if (contextData.quotes && contextData.quotes.length > 0) {
      contextString += "\n\n## Database Quotes Available for Your Response:\n";
      contextData.quotes.forEach((quote, i) => {
        contextString += `### Quote ${i+1}:\n`;
        contextString += `> "${quote.body}"\n\n`;
        
        if (quote.book) {
          contextString += `**Source:** ${quote.book.title}\n`;
          if (quote.book.author) {
            contextString += `**Author:** ${quote.book.author.name}\n`;
          }
        }
        
        if (quote.tags && quote.tags.length > 0) {
          contextString += `**Tags:** ${quote.tags.join(', ')}\n`;
        }
        
        // Añadir cualquier otra metadata disponible
        if (quote.notes) {
          contextString += `**Notes:** ${quote.notes}\n`;
        }
        
        contextString += "\n";
      });
      
      // Ahora añade instrucciones específicas para presentar las citas
      contextString += "\n## Formatting Instructions for Your Response:\n";
      contextString += "1. Start with a brief, engaging introduction before presenting the quotes.\n";
      contextString += "2. Present each quote in a beautifully formatted block using Markdown's quote syntax (> symbol).\n";
      contextString += "3. Format the attribution elegantly beneath each quote, including author if available.\n";
      contextString += "4. If a quote has tags, mention them as relevant themes or categories.\n";
      contextString += "5. Make the presentation visually appealing using markdown formatting - use italics, bold, and headers wisely.\n";
      contextString += "6. Arrange quotes in a logical order that makes sense for the user's query.\n";
      contextString += "7. End with a brief conclusion offering further assistance.\n";
      contextString += "8. NEVER mention that you're limited to the quotes above - just present them as natural matches for the query.\n";
    } else {
      contextString += "\n\nThere are NO quotes in the database that match the user's query. You MUST inform the user that you couldn't find any relevant quotes in their collection and suggest that they add some.\n";
    }
    
    if (contextData.books && contextData.books.length > 0) {
      contextString += "\n\n## Relevant books in the database:\n";
      contextData.books.forEach((book, i) => {
        contextString += `${i+1}. "${book.title}" by ${book.author?.name || 'Unknown'}\n`;
      });
    }
    
    if (contextData.authors && contextData.authors.length > 0) {
      contextString += "\n\n## Relevant authors in the database:\n";
      contextData.authors.forEach((author, i) => {
        contextString += `${i+1}. ${author.name}\n`;
      });
    }
    
    contextString += "\n\n## CRITICAL: You can ONLY reference the items provided above in your response. When referring to quotes, present them elegantly with proper attribution. If there are no quotes provided or none match the user's query, clearly state that no matching quotes were found in their database. NEVER invent or provide quotes that aren't in the user's database. Remember to always format your responses using Markdown to ensure they are visually appealing and well-organized.";
    
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
   * @param {AbortSignal} signal - Optional abort signal for cancelling the request
   */
  static async streamChat(messages, onChunk, onDone, onError, signal) {
    try {
      // Extract the latest user query
      const userMessages = messages.filter(msg => msg.role === 'user');
      const latestUserQuery = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
      
      // Fetch relevant context from the database based on the query
      const contextData = await this.fetchRelevantContext(latestUserQuery);
      
      // Log para depuración
      console.log('Context data:', {
        quotesCount: contextData.quotes ? contextData.quotes.length : 0,
        source: contextData.source || 'unknown'
      });
      
      // If no quotes found in the database, try to get at least some random quotes
      if (!contextData.quotes || contextData.quotes.length === 0) {
        console.log('No specific quotes found, getting random quotes');
        
        try {
          const allQuotesResponse = await apiClient.get(`/quotes/`);
          
          if (allQuotesResponse.data && 
              Array.isArray(allQuotesResponse.data) && 
              allQuotesResponse.data.length > 0) {
            
            // Seleccionar algunas citas aleatorias para mostrar
            const randomQuotes = allQuotesResponse.data
              .sort(() => 0.5 - Math.random())
              .slice(0, 5);
              
            console.log(`Including ${randomQuotes.length} random quotes as fallback`);
            
            contextData.quotes = randomQuotes;
            contextData.source = 'random_fallback';
          }
        } catch (error) {
          console.error('Error getting random quotes:', error);
        }
      }
      
      // Si aún no hay citas, mostrar mensaje de que no se encontraron
      if (!contextData.quotes || contextData.quotes.length === 0) {
        console.log('No quotes found in database, providing direct response');
        
        // Create a response that informs the user no matching quotes were found
        const noQuotesResponse = {
          message: {
            role: 'assistant',
            content: "I searched your database but couldn't find any quotes matching your query. Your collection currently doesn't have quotes related to this topic. Would you like to:\n\n1. Add new quotes to your collection using the 'Add Quote' feature\n2. Try a different search term\n3. Learn how to import quotes from external sources"
          },
          context: []
        };
        
        // Send this response immediately
        onChunk && onChunk(noQuotesResponse);
        onDone && onDone();
        return;
      }
      
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
        signal, // Use the provided abort signal
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
                      // Include any quotes used as context with proper tag information
                      context: contextData.quotes ? contextData.quotes.map(quote => {
                        // Procesar los tags correctamente
                        let tags = [];
                        if (quote.tags) {
                          if (Array.isArray(quote.tags)) {
                            tags = quote.tags.map(tag => {
                              // Si es un string, usarlo directamente
                              if (typeof tag === 'string') return tag;
                              // Si es un objeto con propiedad name, usar esa
                              if (typeof tag === 'object' && tag !== null && tag.name) {
                                return tag.name;
                              }
                              // En cualquier otro caso, convertir a string
                              return String(tag);
                            });
                          } else if (typeof quote.tags === 'string') {
                            // Si tags es un string, dividirlo por comas
                            tags = quote.tags.split(',').map(t => t.trim());
                          }
                        }
                        
                        // Verificar si hay un elemento book válido
                        let sourceText = 'Unknown source';
                        let authorText = '';
                        
                        if (quote.book) {
                          sourceText = quote.book.title || 'Unknown title';
                          if (quote.book.author && quote.book.author.name) {
                            authorText = ` by ${quote.book.author.name}`;
                          }
                        }
                        
                        return {
                          quote: quote.body,
                          source: sourceText + authorText,
                          tags: tags
                        };
                      }) : []
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

  /**
   * Fallback method to find quotes by semantic similarity using the local LLM
   * This is used when other methods fail
   * @param {string} query - The user's question/query
   * @param {Array} allQuotes - Array of all quotes
   * @returns {Array} - Filtered array of quotes
   */
  static async findSimilarQuotesWithLocalLLM(query, allQuotes) {
    if (!allQuotes || allQuotes.length === 0) {
      return [];
    }
    
    try {
      console.log('Using local LLM to find similar quotes by semantic similarity');
      
      // Construct a prompt that asks the model to select quotes that match the query
      const prompt = `I have a collection of quotes, and I need to find ones that are semantically related to this query: "${query}".
      
Here are the quotes (with IDs):
${allQuotes.map((q, idx) => `[${idx+1}] "${q.body}" ${q.book ? `- from ${q.book.title}` : ''}`).join('\n')}

Analyze the query and return ONLY the IDs of quotes that are semantically related to the query, in JSON format like this: [1, 3, 5]. If no quotes match, return an empty array: []. Provide NO explanation, just the JSON array of IDs.`;
      
      // Call the local LLM
      const response = await fetch(`http://localhost:11434/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          model: "zephyr:latest", 
          messages: [
            {
              role: "system", 
              content: "You are an AI tasked with finding quotes that match a query based on semantic similarity. You should return ONLY a JSON array of quote IDs, nothing else."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          stream: false
        })
      });
      
      const data = await response.json();
      
      if (data.message && data.message.content) {
        // Extract the JSON array from the response
        const content = data.message.content;
        const match = content.match(/\[\s*\d+(?:\s*,\s*\d+)*\s*\]/);
        
        if (match) {
          try {
            const ids = JSON.parse(match[0]);
            console.log('Found semantically similar quotes with IDs:', ids);
            
            // Convert 1-based indices to 0-based and filter the quotes
            const filteredQuotes = ids
              .filter(id => id >= 1 && id <= allQuotes.length)
              .map(id => allQuotes[id-1]);
            
            return filteredQuotes;
          } catch (parseError) {
            console.error('Error parsing IDs:', parseError);
          }
        }
      }
      
      // If we get here, something went wrong
      console.log('Failed to extract similar quotes from LLM response');
      return [];
    } catch (error) {
      console.error('Error finding similar quotes with LLM:', error);
      return [];
    }
  }

  /**
   * Usa el LLM para identificar qué tags son relevantes para la consulta del usuario
   * @param {string} query - La consulta del usuario
   * @param {Array} availableTags - Lista de tags disponibles
   * @returns {Array} - Lista de tags relevantes
   */
  static async findRelevantTagsWithLLM(query, availableTags) {
    try {
      console.log('Using LLM to identify relevant tags');
      
      // Construir un prompt que le pida al modelo seleccionar tags relevantes
      const prompt = `Se está buscando citas para esta consulta: "${query}".
      
Estos son los tags disponibles en la base de datos:
${availableTags.join(', ')}

Analiza la consulta e identifica cuáles de estos tags son relevantes para la consulta.
Devuelve SOLO un array JSON con los tags relevantes, por ejemplo: ["amor", "amistad"].
Si no hay tags relevantes, devuelve un array vacío: [].
NO proporciones explicación, solo el array JSON de tags.`;
      
      // Llamar al LLM local
      const response = await fetch(`http://localhost:11434/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          model: "zephyr:latest", 
          messages: [
            {
              role: "system", 
              content: "Eres una IA que ayuda a identificar tags relevantes para una consulta de búsqueda. Debes devolver SOLO un array JSON de tags relevantes, nada más."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          stream: false
        })
      });
      
      const data = await response.json();
      
      if (data.message && data.message.content) {
        // Extraer el array JSON de la respuesta
        const content = data.message.content;
        const match = content.match(/\[\s*".*?"\s*(,\s*".*?"\s*)*\]/);
        
        if (match) {
          try {
            const relevantTags = JSON.parse(match[0]);
            console.log('Identified relevant tags:', relevantTags);
            return relevantTags;
          } catch (parseError) {
            console.error('Error parsing tags:', parseError);
          }
        } else {
          // Intentar extraer palabras individuales si no hay formato JSON
          const words = content.match(/"([^"]*)"/g);
          if (words) {
            const tags = words.map(word => word.replace(/"/g, ''));
            console.log('Extracted tags from words:', tags);
            return tags;
          }
        }
      }
      
      // Si no podemos extraer tags relevantes, devolver algunos términos de la consulta
      const fallbackTerms = query.toLowerCase()
        .split(/[\s,]+/)
        .filter(word => word.length > 3)
        .map(word => word.replace(/[^\w]/g, ''));
      
      console.log('Using fallback terms as tags:', fallbackTerms);
      return fallbackTerms;
    } catch (error) {
      console.error('Error finding relevant tags with LLM:', error);
      return [];
    }
  }
} 