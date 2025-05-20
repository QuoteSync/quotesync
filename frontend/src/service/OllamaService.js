import axios from 'axios';

export const OllamaService = {
  // Modelos disponibles, ordenados por preferencia
  models: [
    { name: "deepseek-r1:14b", timeout: 20000 },
    { name: "phi3.5:latest", timeout: 20000 },
    { name: "llama2:13b-chat", timeout: 30000 },
    { name: "zephyr:latest", timeout: 15000 },
    { name: "llama3.2:latest", timeout: 15000 }
  ],
  
  generateTags: async (quoteText) => {
    // Limitar el texto para mejor rendimiento
    const limitedQuoteText = quoteText.substring(0, 200);
    
    // Detectar idioma
    const isSpanish = /[áéíóúüñ¿¡]/i.test(limitedQuoteText);
    
    // Crear prompt simplificado
    const createPrompt = () => {
      const languageText = isSpanish ? 
        "GENERA ETIQUETAS EN ESPAÑOL. NO TRADUZCAS LAS ETIQUETAS." : 
        "GENERATE TAGS IN ENGLISH. DO NOT TRANSLATE THE TAGS.";
      
      return `<SISTEMA>
Genera 3-5 etiquetas temáticas.
${languageText}
NO uses fragmentos del texto original.
NO incluyas traducciones.
Responde solo con las etiquetas separadas por comas.
</SISTEMA>

Ejemplos:
"Knowledge is power." → Knowledge, Power, Wisdom
"En un beso, sabrás todo lo que he callado." → Amor, Silencio, Revelación

Cita: "${limitedQuoteText}"
Etiquetas:`;
    };
    
    // Proceso de limpieza mejorado
    const cleanResponse = (rawResponse) => {
      let tagContent = rawResponse;
      
      // Limpiar prefijos y formato
      tagContent = tagContent.replace(/Etiquetas:?|Tags:?|ETIQUETAS:?|TAGS:?|Tag\d+:?|Respuesta:?|Cita:?.*|Here are|Here's|Based on the given|The tags for this quote would be/gi, '');
      tagContent = tagContent.replace(/[\*\#\`\~\>\<\[\]\(\)\{\}\-\_\+\d+\.→]/g, '');
      tagContent = tagContent.replace(/[✓✗]/g, '');
      
      // Normalizar separadores
      tagContent = tagContent.replace(/[\r\n]+/g, ', ');
      tagContent = tagContent.replace(/\s{2,}/g, ' ');
      tagContent = tagContent.replace(/,\s*,/g, ',');
      tagContent = tagContent.replace(/\s*,\s*/g, ', ');
      tagContent = tagContent.trim().replace(/^[,\s]+|[,\s]+$/g, '');
      
      // Obtener tags limpiados
      const words = quoteText.toLowerCase().split(/\s+/);
      const twoWordPhrases = [];
      for (let i = 0; i < words.length - 1; i++) {
        twoWordPhrases.push(`${words[i]} ${words[i+1]}`);
      }
      
      let tags = tagContent.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length < 30)
        // Eliminar traducciones: palabras que contienen espacios y tienen el formato "Palabra Translation"
        .map(tag => {
          // Si el tag contiene un espacio y parece tener formato de traducción (Palabra Translation)
          if (tag.includes(' ')) {
            const parts = tag.split(' ');
            // Verificar si la segunda palabra comienza con mayúscula y no es parte del tag original
            // O si hay más de 2 palabras (probablemente con traducción)
            if ((parts.length === 2 && /^[A-Z]/.test(parts[1])) || parts.length > 2) {
              // Devolver solo la primera palabra (asumiendo que es la etiqueta principal)
              return parts[0];
            }
          }
          return tag;
        })
        .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1))
        .filter(tag => {
          const tagLower = tag.toLowerCase();
          const commonWords = ['amor', 'love', 'dios', 'god', 'vida', 'life', 'fe', 'faith'];
          
          // Eliminar frases que están en la cita original
          if (tagLower.split(/\s+/).length > 1 && twoWordPhrases.includes(tagLower)) {
            return false;
          }
          
          // Mantener palabras comunes incluso si aparecen en la cita
          if (words.includes(tagLower) && !commonWords.includes(tagLower)) {
            return false;
          }
          
          return true;
        });
      
      // Eliminar duplicados
      tags = [...new Set(tags)];
      
      // Etiquetas de respaldo si no hay suficientes
      if (tags.length < 2) {
        tags = isSpanish ? 
          ["Amor", "Dios", "Fe", "Filosofía", "Espiritualidad"] : 
          ["Love", "God", "Faith", "Philosophy", "Spirituality"];
      }
      
      return tags.slice(0, 5); // Limitar a 5 etiquetas
    };
    
    // Intento principal con reintentos y fallback
    let lastError = null;
    
    // Probar con cada modelo, comenzando con el preferido
    for (const model of OllamaService.models) {
      try {
        console.log(`Intentando con modelo: ${model.name}`);
        
        const response = await axios.post('http://localhost:11434/api/generate', {
          model: model.name,
          prompt: createPrompt(),
          temperature: 0.1,
          stream: false
        }, { timeout: model.timeout });
        
        const tags = cleanResponse(response.data.response || '');
        console.log(`Tags generados con ${model.name}:`, tags);
        
        return { tags };
      } catch (error) {
        console.error(`Error con modelo ${model.name}:`, error);
        lastError = error;
        
        // Si el error no es de timeout, probar con el siguiente modelo
        if (error.code !== 'ECONNABORTED') {
          // Si no es timeout sino un error de conexión, no tiene sentido seguir intentando
          if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
            break;
          }
        }
        // Continuar con el siguiente modelo si hay timeout
      }
    }
    
    // Todos los modelos fallaron, intentar construir etiquetas basadas en el contenido
    console.log("Todos los modelos fallaron, usando etiquetas predeterminadas");
    
    try {
      // Analizar el texto para detectar términos clave
      const religiousTerms = ['dios', 'god', 'señor', 'lord', 'jesús', 'jesus', 'cristo', 'christ', 'fe', 'faith', 'amor', 'love'];
      const hasReligiousTerms = religiousTerms.some(term => quoteText.toLowerCase().includes(term));
      
      // Etiquetas predeterminadas según el análisis básico del contenido
      let fallbackTags;
      if (hasReligiousTerms) {
        fallbackTags = isSpanish ? 
          ["Amor", "Dios", "Fe", "Espiritualidad", "Religión"] : 
          ["Love", "God", "Faith", "Spirituality", "Religion"];
      } else {
        fallbackTags = isSpanish ? 
          ["Filosofía", "Reflexión", "Vida", "Sabiduría", "Pensamiento"] : 
          ["Philosophy", "Reflection", "Life", "Wisdom", "Thought"];
      }
      
      return { tags: fallbackTags };
    } catch (finalError) {
      console.error("Error generando etiquetas de respaldo:", finalError);
      
      // Mensaje de error adecuado
      if (lastError?.code === 'ECONNABORTED') {
        throw new Error('El servidor Ollama está tardando demasiado en responder. Intenta reiniciarlo o usar una cita más corta.');
      } else if (lastError?.code === 'ECONNREFUSED' || lastError?.code === 'ERR_NETWORK') {
        throw new Error('No se pudo conectar con el servidor Ollama. Asegúrate de que esté en ejecución.');
      }
      
      throw new Error('No se pudieron generar etiquetas. Por favor, intenta de nuevo más tarde.');
    }
  },
  
  checkStatus: async () => {
    try {
      const response = await axios.get('http://localhost:11434/api/version', { timeout: 3000 });
      
      // Verificar modelos disponibles
      try {
        const modelsResponse = await axios.get('http://localhost:11434/api/tags', { timeout: 3000 });
        const availableModels = modelsResponse.data.models || [];
        
        // Actualizar la lista de modelos disponibles
        OllamaService.models = OllamaService.models.filter(model => 
          availableModels.some(m => m.name === model.name)
        );
        
        // Si no hay modelos disponibles, mantener la lista predeterminada
        if (OllamaService.models.length === 0) {
          OllamaService.models = [
            { name: "phi3.5:latest", timeout: 20000 },
            { name: "llama2:13b-chat", timeout: 30000 },
            { name: "zephyr:latest", timeout: 15000 },
            { name: "llama3.2:latest", timeout: 15000 }
          ];
        }
        
        console.log("Modelos disponibles:", OllamaService.models.map(m => m.name));
      } catch (modelError) {
        console.warn("No se pudieron obtener los modelos disponibles:", modelError);
      }
      
      return true;
    } catch (error) {
      console.error('Ollama server not reachable:', error);
      return false;
    }
  }
}; 