from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse
from django.db.models import Q
from .models import Quote, Tag, QuoteTag, Book, Author
from .serializers import QuoteSerializer, TagSerializer, BookSerializer, AuthorSerializer
from .services import OllamaService
import json
import time

class DeepSeekTagView(APIView):
    """
    API endpoint to automatically generate tags for a quote.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        quote_id = request.data.get('quote_id')
        
        if not quote_id:
            return Response(
                {"error": "Quote ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get the quote
        quote = get_object_or_404(Quote, id=quote_id, owner=request.user)
        
        if not quote.body:
            return Response(
                {"error": "Quote has no content to tag"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Generate tags
        try:
            ollama_service = OllamaService()
            generated_tags = ollama_service.generate_tags(quote.body)
            
            # Create and save tags
            saved_tags = []
            for tag_name in generated_tags:
                # Clean up tag name and convert to slug format
                tag_name = tag_name.strip().lower()
                
                # Create or get tag
                tag, created = Tag.objects.get_or_create(title=tag_name)
                
                # Add tag to quote if not already present
                if not QuoteTag.objects.filter(quote=quote, tag=tag).exists():
                    QuoteTag.objects.create(quote=quote, tag=tag)
                    
                saved_tags.append(TagSerializer(tag).data)
                
            # Return updated quote with new tags
            return Response({
                "message": "Tags generated successfully",
                "tags": saved_tags,
                "quote": QuoteSerializer(quote).data
            })
            
        except Exception as e:
            return Response(
                {"error": f"Failed to generate tags: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeepSeekRelatedView(APIView):
    """
    API endpoint to find related quotes based on semantic similarity.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        quote_id = request.query_params.get('quote_id')
        threshold = float(request.query_params.get('threshold', 0.7))
        max_results = int(request.query_params.get('max_results', 5))
        
        if not quote_id:
            return Response(
                {"error": "Quote ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get the quote
        quote = get_object_or_404(Quote, id=quote_id)
        
        if not quote.body:
            return Response(
                {"error": "Quote has no content to find related quotes"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # For demo purposes, we're not using a proper vector database
            # In production, you would use a vector database like FAISS, Pinecone, or Redis
            ollama_service = OllamaService()
            
            # Get embedding for the current quote
            query_embedding = ollama_service.get_embeddings(quote.body)
            
            # Get embeddings for all other quotes
            # WARNING: This is inefficient for large datasets
            # In production, use a vector database or precompute embeddings
            user_quotes = Quote.objects.filter(owner=request.user).exclude(id=quote_id)
            quote_embeddings = {}
            
            for q in user_quotes:
                if q.body:
                    quote_embeddings[q.id] = ollama_service.get_embeddings(q.body)
            
            # Find related quotes
            related_quotes = ollama_service.find_related_quotes(
                query_embedding, 
                quote_embeddings,
                threshold=threshold,
                max_results=max_results
            )
            
            # Get the related quotes with detailed info
            result = []
            for item in related_quotes:
                related_quote = Quote.objects.get(id=item["quote_id"])
                result.append({
                    "quote": QuoteSerializer(related_quote).data,
                    "similarity_score": item["similarity_score"]
                })
                
            return Response({
                "quote_id": quote_id,
                "related_quotes": result
            })
            
        except Exception as e:
            return Response(
                {"error": f"Failed to find related quotes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeepSeekChatView(APIView):
    """
    API endpoint to chat with DeepSeek model about quotes.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        messages = request.data.get('messages', [])
        stream = request.data.get('stream', False)
        
        if not messages or not isinstance(messages, list):
            return Response(
                {"error": "Messages are required and must be a list"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        system_prompt = """
        You are QuoteSync AI, a helpful literary assistant. You can help users understand quotes,
        find related themes, analyze writing styles, suggest tags, and offer insights about authors.
        Base your responses on literary knowledge and critical analysis principles.
        Keep responses concise, accurate, and helpful for literature enthusiasts.
        
        FORMAT ALL YOUR RESPONSES USING MARKDOWN SYNTAX to ensure they display properly. Use:
        - Headers for section titles (## or ### prefixes)
        - **Bold** for emphasis
        - *Italic* for book titles and quotes
        - Bullet points for lists
        - > Blockquotes for quote excerpts
        - Numbered lists where appropriate
        
        Always use proper Markdown formatting in your responses.
        """
        
        ollama_service = OllamaService()
        
        if stream:
            # Streaming response
            def event_stream():
                try:
                    for chunk in ollama_service.stream_chat(messages, system_prompt):
                        if chunk:
                            yield f"data: {json.dumps(chunk)}\n\n"
                    yield "data: [DONE]\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
                    
            response = StreamingHttpResponse(
                event_stream(),
                content_type='text/event-stream'
            )
            response['Cache-Control'] = 'no-cache'
            response['X-Accel-Buffering'] = 'no'
            return response
        else:
            # Regular response
            try:
                response = ollama_service.chat(messages, system_prompt)
                return Response({"response": response})
            except Exception as e:
                return Response(
                    {"error": f"Chat failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )


class DeepSeekRelatedByTextView(APIView):
    """
    API endpoint to find related quotes based on semantic similarity to a text.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        text = request.data.get('text')
        threshold = float(request.data.get('threshold', 0.7))
        max_results = int(request.data.get('max_results', 5))
        
        if not text:
            return Response(
                {"error": "Text is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Get embedding for the query text
            ollama_service = OllamaService()
            query_embedding = ollama_service.get_embeddings(text)
            
            # Get embeddings for all quotes
            # WARNING: This is inefficient for large datasets
            # In production, use a vector database or precompute embeddings
            user_quotes = Quote.objects.filter(owner=request.user)
            quote_embeddings = {}
            
            for q in user_quotes:
                if q.body:
                    quote_embeddings[q.id] = ollama_service.get_embeddings(q.body)
            
            # Find related quotes
            related_quotes = ollama_service.find_related_quotes(
                query_embedding, 
                quote_embeddings,
                threshold=threshold,
                max_results=max_results
            )
            
            # Get the related quotes with detailed info
            result = []
            for item in related_quotes:
                related_quote = Quote.objects.get(id=item["quote_id"])
                result.append({
                    "quote": QuoteSerializer(related_quote).data,
                    "similarity_score": item["similarity_score"]
                })
                
            return Response({
                "query_text": text,
                "related_quotes": result
            })
            
        except Exception as e:
            return Response(
                {"error": f"Failed to find related quotes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeepSeekContextView(APIView):
    """
    API endpoint to fetch relevant context data from the database for a chat query.
    This helps provide the AI with user-specific information.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        query = request.data.get('query', '')
        
        if not query:
            return Response(
                {"error": "Query is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get embedding for the query
            ollama_service = OllamaService()
            query_embedding = ollama_service.get_embeddings(query)
            
            # Variables to store our contextual data
            context_quotes = []
            context_books = []
            context_authors = []
            
            # 1. Find semantically similar quotes
            user_quotes = Quote.objects.filter(owner=request.user)
            quote_embeddings = {}
            
            for q in user_quotes[:50]:  # Limit to recent quotes for performance
                if q.body:
                    quote_embeddings[q.id] = ollama_service.get_embeddings(q.body)
            
            related_quotes = ollama_service.find_related_quotes(
                query_embedding, 
                quote_embeddings,
                threshold=0.6,  # Lower threshold to increase recall
                max_results=3    # Limit to top 3 for relevance
            )
            
            # Get full quote objects
            for item in related_quotes:
                related_quote = Quote.objects.get(id=item["quote_id"])
                context_quotes.append(QuoteSerializer(related_quote).data)
            
            # 2. Find relevant books using keyword matching
            keywords = query.lower().split()
            book_filter = Q()
            
            for keyword in keywords:
                if len(keyword) > 3:  # Skip short words
                    book_filter |= Q(title__icontains=keyword)
            
            relevant_books = Book.objects.filter(book_filter, owner=request.user)[:3]
            context_books = BookSerializer(relevant_books, many=True).data
            
            # 3. Find relevant authors
            author_filter = Q()
            for keyword in keywords:
                if len(keyword) > 3:
                    author_filter |= Q(name__icontains=keyword)
            
            relevant_authors = Author.objects.filter(author_filter)[:3]
            context_authors = AuthorSerializer(relevant_authors, many=True).data
            
            # 4. If no semantic matches, use keyword search for quotes too
            if not context_quotes:
                quote_filter = Q()
                for keyword in keywords:
                    if len(keyword) > 3:
                        quote_filter |= Q(body__icontains=keyword)
                
                keyword_quotes = Quote.objects.filter(quote_filter, owner=request.user)[:3]
                context_quotes = QuoteSerializer(keyword_quotes, many=True).data
            
            return Response({
                "quotes": context_quotes,
                "books": context_books,
                "authors": context_authors
            })
            
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch context: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 