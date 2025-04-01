from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from .services.tagger import get_tagger
from .services.tag_vocabulary import get_all_tags, get_tags_by_category
import logging

logger = logging.getLogger(__name__)

@cache_page(60 * 15)  # Cache results for 15 minutes
@api_view(['POST'])
def suggest_tags(request):
    """API endpoint to suggest tags for a quote using Hugging Face.
    
    Request body should include:
    - text: The quote text to generate tags for
    - language: The language of the quote (default: 'en')
    - num_tags: Number of tags to generate (default: 5)
    
    Returns:
        A list of suggested tags
    """
    text = request.data.get('text', '')
    language = request.data.get('language', 'en')
    num_tags = int(request.data.get('num_tags', 5))
    
    if not text:
        return Response({"error": "Text is required"}, status=400)
    
    try:
        # Get the tagger singleton
        tagger = get_tagger()
        
        # Generate tags
        suggested_tags = tagger.generate_tags(text, language, num_tags)
        
        return Response({
            "suggested_tags": suggested_tags,
            "language": language,
            "quote_length": len(text)
        })
        
    except Exception as e:
        logger.exception(f"Error suggesting tags: {e}")
        return Response({"error": "Failed to generate tags"}, status=500)

@cache_page(60 * 60 * 24)  # Cache for 24 hours - tag list rarely changes
@api_view(['GET'])
def get_available_tags(request):
    """API endpoint to get all available tags.
    
    Fetches the complete list of predefined tags that can be used in the application.
    
    Query parameters:
    - by_category: If 'true', returns tags organized by category
    
    Returns:
        List of all available tags, optionally organized by category
    """
    try:
        # Check if we should organize by category
        by_category = request.query_params.get('by_category', '').lower() == 'true'
        
        if by_category:
            # Get tags organized by category
            tags_data = get_tags_by_category()
            return Response({
                "tags_by_category": tags_data,
                "total_tags": len(get_all_tags())
            })
        else:
            # Get all tags as a flat list
            all_tags = get_all_tags()
            return Response({
                "tags": all_tags,
                "total_tags": len(all_tags)
            })
        
    except Exception as e:
        logger.exception(f"Error getting available tags: {e}")
        return Response({"error": "Failed to fetch tags"}, status=500) 