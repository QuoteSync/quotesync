import axios from 'axios';

export const OllamaService = {
  generateTags: async (quoteText) => {
    try {
      const response = await axios.post('http://localhost:11434/api/chat', {
        model: "zephyr:latest",
        messages: [
          {
            role: "system",
            content: "Eres un etiquetador de citas. FORMATO ESTRICTO: Debes responder ÚNICAMENTE con palabras clave o etiquetas cortas separadas por comas, sin números, sin explicaciones, sin introducciones, sin conclusiones y sin punto final. Máximo 6 etiquetas, siempre en el mismo idioma de la cita. Ejemplos correctos: \"Amor, Tiempo, Esperanza\" o \"Filosofía, Existencialismo, Vida\". NO uses números, NO añadas texto explicativo, NO incluyas más de 6 etiquetas, NO incluyas nada que no sean las etiquetas separadas por comas."
          },
          {
            role: "user",
            content: quoteText
          }
        ],
        temperature: 0.0,
        stream: false
      }, { timeout: 10000 });
      
      // Return tags as an array from the content of the response
      // and apply title case (first letter of each word capitalized)
      let tagContent = response.data.message.content;
      
      // Eliminar cualquier numeración (1. 2. etc)
      tagContent = tagContent.replace(/\d+\.\s*/g, '');
      
      // Eliminar cualquier texto explicativo después de las etiquetas
      if (tagContent.includes('.')) {
        tagContent = tagContent.split('.')[0];
      }
      
      const tags = tagContent.split(',').map(tag => {
        const trimmedTag = tag.trim();
        return trimmedTag.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }).filter(tag => tag.length > 0); // Filtrar etiquetas vacías
      
      // Ensure we never have more than 6 tags
      const limitedTags = tags.slice(0, 6);
      
      return { tags: limitedTags };
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      
      // Provide more specific error messages
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error('Could not connect to Ollama. Make sure Ollama is running on http://localhost:11434');
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new Error('Connection to Ollama timed out. The model may be still loading or your request is too complex.');
      }
      
      throw error;
    }
  },
  
  checkStatus: async () => {
    try {
      // Use /api/tags endpoint instead of /api/models
      const response = await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
      if (response.data && response.data.models) {
        const hasZephyr = response.data.models.some(model => model.name === 'zephyr:latest');
        if (!hasZephyr) {
          console.warn('Ollama is running but zephyr:latest model is not available');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ollama server not reachable:', error);
      return false;
    }
  }
}; 