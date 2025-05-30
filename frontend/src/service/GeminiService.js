import { apiClient } from "@/api";

export const GeminiService = {
  generateTags: async (quoteText) => {
    // Limitar el texto para mejor rendimiento
    const limitedQuoteText = quoteText.substring(0, 200);
    
    try {
      // Crear prompt para Gemini
      const prompt = `Generate 3-5 thematic tags for this quote.
The tags MUST be in the SAME LANGUAGE as the quote.
DO NOT use fragments from the original text.
DO NOT include translations.
Respond ONLY with the tags separated by commas.

Quote: "${limitedQuoteText}"
Tags:`;

      console.log('Enviando solicitud a API de Gemini...');
      
      // Usar apiClient para incluir automáticamente las credenciales de sesión
      const response = await apiClient.post('/gemini/generate-tags', {
        prompt,
        quoteText: limitedQuoteText
      });
      
      // Procesar la respuesta
      if (response.data && response.data.tags) {
        return { tags: response.data.tags };
      }
      
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }
      
      throw new Error('No se pudieron obtener etiquetas de Gemini');
    } catch (error) {
      console.error('Error al generar etiquetas con Gemini:', error);
      
      // Mostrar error específico si está disponible
      if (error.response) {
        console.error('Respuesta de error:', error.response.data);
        const errorMessage = error.response.data.error || error.response.data.detail || 'Error de servidor';
        throw new Error(`Error de Gemini: ${errorMessage}`);
      }
      
      // Si el error es de conexión o CORS
      if (error.code === 'ERR_NETWORK') {
        throw new Error('No se pudo conectar al servicio de Gemini. Verifica la conexión del servidor.');
      }
      
      // Si el error es 403 Forbidden
      if (error.response && error.response.status === 403) {
        throw new Error('Error de autenticación con Gemini. La API key podría ser inválida o estar mal configurada.');
      }
      
      // Errores genéricos
      throw new Error(error.message || 'Error al generar etiquetas con Gemini');
    }
  }
}; 