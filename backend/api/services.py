import requests
import json
from django.conf import settings
import httpx
from typing import List, Dict, Any, Optional
import numpy as np

class OllamaService:
    """Service for interacting with Ollama API for DeepSeek model."""
    
    def __init__(self):
        self.base_url = settings.OLLAMA_API_URL
        self.model = settings.OLLAMA_MODEL
    
    async def get_embeddings_async(self, text: str) -> List[float]:
        """Get embeddings for a text using DeepSeek model (async version)."""
        url = f"{self.base_url}/api/embeddings"
        payload = {
            "model": self.model,
            "prompt": text
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["embedding"]
    
    def get_embeddings(self, text: str) -> List[float]:
        """Get embeddings for a text using DeepSeek model (synchronous version)."""
        url = f"{self.base_url}/api/embeddings"
        payload = {
            "model": self.model,
            "prompt": text
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["embedding"]
    
    def generate_tags(self, quote_text: str) -> List[str]:
        """Generate tags for a quote using DeepSeek model."""
        url = f"{self.base_url}/api/generate"
        prompt = f"""
        You are a literary quote tagging assistant. Given the following quote, 
        generate 3-5 thematic tags that represent the core ideas, themes, or concepts in the quote.
        Format your response as a JSON array of strings.
        
        Quote: "{quote_text}"
        
        Tags (JSON array):
        """
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "temperature": 0.3,
            "max_tokens": 100
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Extract the generated text and parse it as JSON
        generated_text = data["response"].strip()
        
        # Extract JSON array from the response
        try:
            # Try to parse the entire text as JSON
            tags = json.loads(generated_text)
            if isinstance(tags, list):
                return tags
            
            # If that fails, look for array pattern [...]
            import re
            array_match = re.search(r'\[(.*)\]', generated_text)
            if array_match:
                array_text = f"[{array_match.group(1)}]"
                return json.loads(array_text)
                
            return []
        except Exception as e:
            print(f"Error parsing tags: {e}")
            # If parsing fails, try to extract comma-separated tags manually
            lines = generated_text.split('\n')
            for line in lines:
                if ',' in line:
                    return [tag.strip().strip('"\'') for tag in line.split(',')]
            return []
    
    def find_related_quotes(self, query_embedding: List[float], 
                            quote_embeddings: Dict[int, List[float]], 
                            threshold: float = 0.7,
                            max_results: int = 5) -> List[Dict[str, Any]]:
        """Find related quotes based on embedding similarity."""
        results = []
        
        # Convert the query embedding to numpy array
        query_np = np.array(query_embedding)
        
        for quote_id, embedding in quote_embeddings.items():
            # Convert the quote embedding to numpy array
            quote_np = np.array(embedding)
            
            # Calculate cosine similarity
            similarity = np.dot(query_np, quote_np) / (np.linalg.norm(query_np) * np.linalg.norm(quote_np))
            
            if similarity >= threshold:
                results.append({
                    "quote_id": quote_id,
                    "similarity_score": float(similarity)
                })
        
        # Sort by similarity score in descending order
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        # Return top N results
        return results[:max_results]

    def chat(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
        """Generate a chat response from DeepSeek model."""
        url = f"{self.base_url}/api/chat"
        
        formatted_messages = []
        
        # Add system prompt if provided
        if system_prompt:
            formatted_messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        # Add user messages
        formatted_messages.extend(messages)
        
        payload = {
            "model": self.model,
            "messages": formatted_messages,
            "stream": False
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        return data["message"]["content"]
    
    def stream_chat(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None):
        """Stream a chat response from DeepSeek model."""
        url = f"{self.base_url}/api/chat"
        
        formatted_messages = []
        
        # Add system prompt if provided
        if system_prompt:
            formatted_messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        # Add user messages
        formatted_messages.extend(messages)
        
        payload = {
            "model": self.model,
            "messages": formatted_messages,
            "stream": True
        }
        
        response = requests.post(url, json=payload, stream=True)
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                yield json.loads(line) 