"""
Simple quote tagger using regex and basic NLP techniques.
This is a fallback option when Hugging Face models cannot be installed.
"""

import logging
import re
from typing import List, Dict, Set, Optional
import random

# Import the tag vocabulary
from .tag_vocabulary import TAG_VOCABULARY, get_all_tags, get_tags_by_category

logger = logging.getLogger(__name__)

class SimpleTagger:
    """A lightweight tagger that doesn't require machine learning models."""
    
    def __init__(self):
        """Initialize the simple tagger with predefined categories and keywords."""
        logger.info("Initializing SimpleTagger")
        
        # Use the predefined tag vocabulary
        self.tag_vocabulary = TAG_VOCABULARY
        self.tags_by_category = get_tags_by_category()
        
        # Create a map of keywords to their categories for efficient lookup
        self.keyword_to_category = {}
        for category, tags in self.tags_by_category.items():
            for tag in tags:
                self.keyword_to_category[tag] = category
        
        # Common stop words to filter out
        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
            'be', 'been', 'being', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 
            'against', 'between', 'into', 'through', 'during', 'before', 'after', 
            'above', 'below', 'to', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 
            'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 
            'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 
            'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 
            'can', 'will', 'just', 'should', 'now', 'this', 'that', 'these', 'those'
        }
    
    def _extract_terms(self, text: str, min_length: int = 3) -> List[str]:
        """Extract meaningful terms from text.
        
        Args:
            text: The text to analyze
            min_length: Minimum length for a term to be considered
            
        Returns:
            List of extracted terms
        """
        # Convert to lowercase and replace punctuation with spaces
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Split into words and filter out stop words and short words
        words = text.split()
        filtered_words = [
            word for word in words 
            if word not in self.stop_words and len(word) >= min_length
        ]
        
        return filtered_words
    
    def _score_tags(self, terms: List[str]) -> Dict[str, float]:
        """Score all tags in the vocabulary based on the extracted terms.
        
        Args:
            terms: List of extracted terms
            
        Returns:
            Dictionary of tag -> score
        """
        tag_scores = {tag: 0.0 for tag in self.tag_vocabulary}
        
        # For each term in the text
        for term in terms:
            term = term.lower()
            
            # Score each tag in our vocabulary
            for tag in self.tag_vocabulary:
                # Exact match gets highest score
                if term == tag:
                    tag_scores[tag] += 5.0
                    continue
                
                # Term contains tag or tag contains term (partial match)
                if term in tag or tag in term:
                    tag_scores[tag] += 2.0
                    continue
                
                # Common prefix (fuzzy match)
                if len(term) >= 4 and len(tag) >= 4 and term[:4] == tag[:4]:
                    tag_scores[tag] += 1.0
                    continue
                
                # Term is in the same category as the tag (semantic match)
                term_category = self._find_category_for_term(term)
                tag_category = self.keyword_to_category.get(tag)
                if term_category and tag_category and term_category == tag_category:
                    tag_scores[tag] += 0.5
                
        return tag_scores
    
    def _find_category_for_term(self, term: str) -> Optional[str]:
        """Find which category a term might belong to.
        
        Args:
            term: The term to categorize
            
        Returns:
            Category name or None if no match
        """
        # First check if the term is exactly one of our tags
        if term in self.keyword_to_category:
            return self.keyword_to_category[term]
        
        # Check for partial matches with existing tags
        for tag, category in self.keyword_to_category.items():
            if term in tag or tag in term:
                return category
        
        return None
    
    def generate_tags(self, text: str, language: str = 'en', num_tags: int = 5) -> List[str]:
        """Generate tags for a given text using the predefined vocabulary.
        
        Args:
            text: The text to generate tags for
            language: Language code (currently only English is fully supported)
            num_tags: Number of tags to generate
            
        Returns:
            List of generated tags from the predefined vocabulary
        """
        try:
            logger.info(f"Generating tags for text in {language} (length: {len(text)})")
            
            if not text or len(text) < 10:
                logger.warning("Text too short for meaningful tagging")
                return []
            
            # Extract terms
            terms = self._extract_terms(text)
            if not terms:
                logger.warning("No meaningful terms found in text")
                return []
            
            # Score all tags in our vocabulary based on the terms
            tag_scores = self._score_tags(terms)
            
            # Sort tags by score
            sorted_tags = sorted(
                tag_scores.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            
            # Get the top scoring tags
            top_tags = [tag for tag, score in sorted_tags[:num_tags] if score > 0]
            
            # If we couldn't get enough tags with positive scores, add some random tags
            # from relevant categories
            if len(top_tags) < num_tags:
                categories = set()
                for tag in top_tags:
                    category = self.keyword_to_category.get(tag)
                    if category:
                        categories.add(category)
                
                if categories:
                    # Add tags from the identified categories
                    while len(top_tags) < num_tags and categories:
                        category = random.choice(list(categories))
                        category_tags = self.tags_by_category.get(category, [])
                        available_tags = [tag for tag in category_tags if tag not in top_tags]
                        
                        if available_tags:
                            top_tags.append(random.choice(available_tags))
                        
                        # Remove this category to try others next time
                        categories.remove(category)
                
                # If still not enough, add random popular tags
                popular_categories = ['emotions', 'life', 'knowledge', 'philosophy']
                while len(top_tags) < num_tags:
                    if not popular_categories:
                        break
                    
                    category = random.choice(popular_categories)
                    popular_categories.remove(category)
                    
                    category_tags = self.tags_by_category.get(category, [])
                    available_tags = [tag for tag in category_tags if tag not in top_tags]
                    
                    if available_tags:
                        top_tags.append(random.choice(available_tags))
            
            logger.info(f"Generated {len(top_tags)} tags: {top_tags}")
            return top_tags[:num_tags]
            
        except Exception as e:
            logger.exception(f"Error generating tags: {e}")
            return []
    
    def batch_generate_tags(self, texts: List[str], languages: Optional[List[str]] = None, 
                          num_tags: int = 5) -> List[List[str]]:
        """Generate tags for multiple texts.
        
        Args:
            texts: List of texts to generate tags for
            languages: Optional list of language codes
            num_tags: Number of tags per text
            
        Returns:
            List of tag lists
        """
        if languages is None:
            languages = ['en'] * len(texts)
        
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
        return self.tags_by_category.copy() 