# DeepSeek AI Integration for QuoteSync

This guide explains how to set up the DeepSeek-7b model via Ollama to power AI-driven features in QuoteSync.

## Features

Extrae todos los tags únicos de la base de datos
Pide a la IA (LLM) que identifique cuáles de esos tags son relevantes para la consulta del usuario
Filtra las citas que tengan esos tags específicos identificados por la IA
El nuevo proceso de búsqueda funciona así:
Obtener todos los tags: Primero recoge todas las citas y extrae los tags únicos, normalizando cualquier formato extraño.
Consultar a la IA: Le envía al LLM local la consulta del usuario y la lista completa de tags disponibles, pidiéndole que identifique cuáles son relevantes para la búsqueda.
Filtrar por tags relevantes: Una vez la IA identifica los tags pertinentes, buscamos citas que contengan esos tags específicos.
Métodos de respaldo: Si no encuentra citas con los tags sugeridos por la IA, usa búsqueda semántica o busca términos específicos en el contenido de las citas.
Esto debería solucionar el problema por completo, ya que:
La IA entenderá mejor el contexto de la consulta y seleccionará los tags adecuados
No dependeremos de endpoints que no existen
Trabajaremos con los tags reales disponibles en tu base de datos
Tendremos varios métodos de respaldo para garantizar que siempre se encuentren citas
Por ejemplo, cuando busques "citas sobre amor", la IA identificará tags como "amor", "pasión", "corazón", etc., y luego mostrará las citas que tengan esos tags.

1. **Auto-Tagging Service**: Automatically generate tags for quotes using DeepSeek's language understanding
2. **Related-Quote Search**: Find semantically similar quotes using vector embeddings
3. **Real-Time Review UI**: Review and edit AI-suggested tags for your quotes
4. **Conversational AI**: Chat with DeepSeek about your quotes, authors, and literary themes
5. **Advanced Relationship Search**: Search your quotes using complex filters and semantic similarity

## Setup Instructions

### 1. Start the Ollama Service with DeepSeek-7b

```bash
# Start the Ollama service
docker-compose up -d ollama

# Wait for Ollama to start, then pull the DeepSeek-7b model
docker exec -it quotesync-ollama-1 ollama pull deepseek-coder:7b
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Update Django Settings

Make sure the local_settings.py file is included in your Django settings. The file should contain:

```python
# Ollama API Configuration
OLLAMA_API_URL = "http://localhost:11434"  # or "http://ollama:11434" if using Docker
OLLAMA_MODEL = "deepseek-coder:7b"  # DeepSeek 7B model
```

### 4. Run Database Migrations

```bash
cd backend
python manage.py migrate
```

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install marked dompurify
```

### 6. Run the Application

```bash
# Start the Django backend
cd backend
python manage.py runserver

# Start the Vue frontend
cd frontend
npm run dev
```

## User Guide

### Automatic Tag Generation

1. Open any quote in the application
2. Click the menu icon (three dots) in the top right corner of the quote card
3. Select "AI Tag Suggestions"
4. Review the suggested tags in the sidebar
5. Click the checkmark to accept a tag or the X to reject it

### AI Chat Assistant

1. Navigate to "AI Tools > AI Chat Assistant" in the sidebar menu
2. Type your query about quotes, authors, books, or literary themes
3. The AI will respond with relevant information

### Advanced Search

1. Navigate to "AI Tools > Advanced Search" in the sidebar menu
2. Build your search query using the filters
3. Add semantic search filters by selecting "Similar to (Semantic)" as the filter type
4. Enter text to find quotes similar to that text
5. Click "Search Quotes" to execute the search

## Troubleshooting

- **Ollama Connection Issues**: Ensure the Ollama service is running and accessible at the URL specified in settings
- **Model Not Found**: Make sure you've pulled the DeepSeek model using `ollama pull deepseek-coder:7b`
- **Slow Response Times**: The first few requests to DeepSeek might be slow as the model loads into memory

## Technical Details

- The DeepSeek model runs locally via Ollama, keeping your data private
- Vector embeddings are generated on-the-fly for related quote search
- For production, consider using a dedicated vector database like FAISS, Pinecone, or Redis Vector Search

## Resource Requirements

- At least 8GB RAM for running DeepSeek-7b in Ollama
- Approximately 4GB disk space for the model

## Extending the Integration

- Add more models through Ollama (like Llama 2, Mistral, etc.)
- Implement batch processing for embedding generation
- Add voice input/output for the chat interface 