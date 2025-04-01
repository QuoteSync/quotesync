"""
Quote tagger using Hugging Face models for multilingual tag generation.
"""

import logging
import os
import re
import importlib.util
from typing import List, Optional, Dict, Any, Union

# Import the tag vocabulary
from .tag_vocabulary import TAG_VOCABULARY, get_all_tags, get_tags_by_category

# Set up logging
logger = logging.getLogger(__name__)

# Global tagger instance (singleton)
_TAGGER_INSTANCE = None

# Check if required packages are available
def _check_dependencies():
    """Check if the required dependencies for HuggingFaceTagger are available."""
    try:
        # Check if transformers is available
        if importlib.util.find_spec("transformers") is None:
            return False
        
        # Check if torch is available
        if importlib.util.find_spec("torch") is None:
            return False
            
        return True
    except Exception as e:
        logger.warning(f"Error checking dependencies: {e}")
        return False

def get_tagger():
    """Get the singleton tagger instance.
    
    Will try to use HuggingFaceTagger if dependencies are available,
    otherwise falls back to SimpleTagger.
    """
    global _TAGGER_INSTANCE
    if _TAGGER_INSTANCE is None:
        # First check if the advanced dependencies are available
        if _check_dependencies():
            try:
                logger.info("Creating HuggingFaceTagger instance")
                _TAGGER_INSTANCE = HuggingFaceTagger()
            except Exception as e:
                logger.error(f"Failed to create HuggingFaceTagger: {e}")
                logger.info("Falling back to SimpleTagger")
                from .simple_tagger import SimpleTagger
                _TAGGER_INSTANCE = SimpleTagger()
        else:
            logger.info("Required dependencies for HuggingFaceTagger not found, using SimpleTagger")
            from .simple_tagger import SimpleTagger
            _TAGGER_INSTANCE = SimpleTagger()
    return _TAGGER_INSTANCE

class HuggingFaceTagger:
    """Tag generator using Hugging Face models."""
    
    # Default model name
    DEFAULT_MODEL = "xlm-roberta-base"
    
    def __init__(self, model_name: str = None):
        """Initialize the tagger with the specified model or default.
        
        Args:
            model_name: Name of the Hugging Face model to use
        """
        self.model_name = model_name or self.DEFAULT_MODEL
        self.model = None
        self.tokenizer = None
        self.zero_shot_classifier = None
        
        logger.info(f"Initializing HuggingFaceTagger with model: {self.model_name}")
        
        # Use the predefined vocabulary rather than generating our own keywords
        self.tag_vocabulary = TAG_VOCABULARY
        
        # Common prefixes and suffixes to clean up
        self.prefixes_to_remove = ['the ', 'a ', 'an ', 'to ', 'of ', 'in ', 'on ', 'at ', 'by ']
        self.suffixes_to_remove = [' and', ' or', ' but', ' yet', ' so', ' nor', ' for']
        
    def _ensure_model_loaded(self):
        """Ensure the model and tokenizer are loaded."""
        if self.model is None or self.tokenizer is None or self.zero_shot_classifier is None:
            try:
                # Import here to avoid loading until needed
                import torch
                from transformers import pipeline
                
                logger.info("Loading Hugging Face model and tokenizer")
                
                # Create a zero-shot classification pipeline
                self.zero_shot_classifier = pipeline(
                    "zero-shot-classification", 
                    model=self.model_name,
                    device=0 if torch.cuda.is_available() else -1  # Use GPU if available
                )
                
                logger.info("Model loaded successfully")
                
            except ImportError as e:
                logger.error(f"Failed to import required libraries: {e}")
                raise ImportError(
                    "Please install the required libraries with: "
                    "pip install torch transformers"
                )
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise RuntimeError(f"Failed to initialize model: {e}")
    
    def _extract_key_terms(self, text: str, min_term_length: int = 3) -> List[str]:
        """Extract key terms from the text.
        
        Args:
            text: The text to extract terms from
            min_term_length: Minimum length of terms to extract
            
        Returns:
            List of key terms
        """
        # Simple regex-based term extraction
        # Remove punctuation and convert to lowercase
        clean_text = re.sub(r'[^\w\s]', ' ', text.lower())
        
        # Split into words and filter out short words
        words = [word for word in clean_text.split() if len(word) >= min_term_length]
        
        # Remove common stop words (simplified list)
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                      'be', 'been', 'being', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 
                      'against', 'between', 'into', 'through', 'during', 'before', 'after', 
                      'above', 'below', 'to', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 
                      'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 
                      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 
                      'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 
                      'can', 'will', 'just', 'should', 'now'}
        
        filtered_words = [word for word in words if word not in stop_words]
        
        # Return unique terms
        return list(set(filtered_words))
    
    def _clean_tag(self, tag: str) -> str:
        """Clean up a tag by removing common prefixes/suffixes and normalizing.
        
        Args:
            tag: Tag to clean
            
        Returns:
            Cleaned tag
        """
        tag = tag.lower().strip()
        
        # Remove common prefixes
        for prefix in self.prefixes_to_remove:
            if tag.startswith(prefix):
                tag = tag[len(prefix):]
                break
        
        # Remove common suffixes
        for suffix in self.suffixes_to_remove:
            if tag.endswith(suffix):
                tag = tag[:-len(suffix)]
                break
        
        return tag.strip()
    
    def generate_tags(self, text: str, language: str = 'en', num_tags: int = 5) -> List[str]:
        """Generate tags for a given text.
        
        Args:
            text: The text to generate tags for
            language: Language code (en, es, fr, etc.)
            num_tags: Number of tags to generate
            
        Returns:
            List of generated tags from the predefined vocabulary
        """
        try:
            self._ensure_model_loaded()
            
            # Extract key terms from the text to help with tag selection
            key_terms = self._extract_key_terms(text)
            
            logger.info(f"Running zero-shot classification with {len(self.tag_vocabulary)} candidate tags")
            
            # Run zero-shot classification on our predefined tag vocabulary
            result = self.zero_shot_classifier(
                text,
                self.tag_vocabulary,
                multi_label=True,
            )
            
            # Extract the top tags by score
            top_tags = []
            for label, score in zip(result['labels'], result['scores']):
                if score > 0.1:  # Only include tags with reasonable confidence
                    # No need to clean - our vocabulary is already clean
                    top_tags.append(label)
                if len(top_tags) >= num_tags:
                    break
            
            # Return the tags
            return top_tags[:num_tags]
            
        except Exception as e:
            logger.exception(f"Error generating tags: {e}")
            
            # If Hugging Face tagger fails, fall back to the simple tagger
            try:
                logger.info("Falling back to SimpleTagger for this request")
                from .simple_tagger import SimpleTagger
                simple_tagger = SimpleTagger()
                return simple_tagger.generate_tags(text, language, num_tags)
            except Exception as fallback_error:
                logger.exception(f"Fallback tagger also failed: {fallback_error}")
                return []
    
    def batch_generate_tags(self, texts: List[str], languages: List[str] = None, 
                           num_tags: int = 5) -> List[List[str]]:
        """Generate tags for multiple texts in batch.
        
        Args:
            texts: List of texts to generate tags for
            languages: List of language codes (defaults to 'en' for all)
            num_tags: Number of tags to generate per text
            
        Returns:
            List of tag lists, one per input text
        """
        if languages is None:
            languages = ['en'] * len(texts)
        
        if len(languages) != len(texts):
            languages = languages * len(texts)
            languages = languages[:len(texts)]
        
        results = []
        for text, lang in zip(texts, languages):
            tags = self.generate_tags(text, lang, num_tags)
            results.append(tags)
        
        return results
        
    def get_available_tags(self) -> List[str]:
        """Get a list of all available tags in the vocabulary.
        
        Returns:
            List of available tags
        """
        return self.tag_vocabulary.copy()
        
    def get_tags_by_category(self) -> Dict[str, List[str]]:
        """Get tags organized by category.
        
        Returns:
            Dictionary of category -> list of tags
        """
        return get_tags_by_category() 