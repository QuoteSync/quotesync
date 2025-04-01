#!/usr/bin/env python
"""
Simple test script for the tagger system.
Run this script directly to test tag generation.
"""

import logging
import sys
import importlib.util

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

# Sample quotes in different languages
SAMPLE_QUOTES = {
    'en': "The only limit to our realization of tomorrow will be our doubts of today.",
    'es': "La educación es el arma más poderosa que puedes usar para cambiar el mundo.",
    'fr': "La vie est un mystère qu'il faut vivre, et non un problème à résoudre.",
    'de': "Der Mensch kann nur Mensch werden durch Erziehung.",
}

def test_tagger():
    """Test the tagger with sample quotes in different languages."""
    print("\n----- QuoteSync Tagger Test -----\n")
    
    # First check which tagger we can use
    has_advanced_deps = False
    
    try:
        # Check if transformers is available
        if importlib.util.find_spec("transformers") is not None and importlib.util.find_spec("torch") is not None:
            has_advanced_deps = True
            print("Advanced dependencies detected - will test HuggingFaceTagger")
        else:
            print("Advanced dependencies not found - will test SimpleTagger")
    except Exception as e:
        print(f"Error checking dependencies: {e}")
        print("Will test SimpleTagger")
    
    # Initialize the appropriate tagger
    if has_advanced_deps:
        try:
            from tagger import HuggingFaceTagger
            print("Initializing HuggingFaceTagger (this may take a while on first run)...")
            tagger = HuggingFaceTagger()
        except Exception as e:
            print(f"Error initializing HuggingFaceTagger: {e}")
            print("Falling back to SimpleTagger")
            try:
                from simple_tagger import SimpleTagger
                tagger = SimpleTagger()
            except Exception as fallback_e:
                print(f"Error initializing SimpleTagger: {fallback_e}")
                print("Both taggers failed to initialize - exiting test")
                return
    else:
        try:
            from simple_tagger import SimpleTagger
            print("Initializing SimpleTagger...")
            tagger = SimpleTagger()
        except Exception as e:
            print(f"Error initializing SimpleTagger: {e}")
            print("Tagger failed to initialize - exiting test")
            return
    
    print("\n----- Testing tag generation -----")
    for lang, quote in SAMPLE_QUOTES.items():
        print(f"\nLanguage: {lang}")
        print(f"Quote: {quote}")
        
        tags = tagger.generate_tags(quote, language=lang)
        
        print(f"Generated tags: {tags}")
    
    print("\n----- Testing batch tag generation -----")
    texts = list(SAMPLE_QUOTES.values())
    languages = list(SAMPLE_QUOTES.keys())
    
    batch_results = tagger.batch_generate_tags(texts, languages)
    
    for lang, quote, tags in zip(languages, texts, batch_results):
        print(f"\nLanguage: {lang}")
        print(f"Quote: {quote[:50]}...")
        print(f"Generated tags: {tags}")
    
    print("\n----- Test complete -----")
    print("Tagger is working correctly!")

if __name__ == "__main__":
    test_tagger() 