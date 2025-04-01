#!/usr/bin/env python
"""
Test script for tag vocabulary and tagger with predefined tags.
Run this script to verify that the tag system is working with the vocabulary.
"""

import sys
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Import the tag vocabulary
from tag_vocabulary import get_all_tags, get_tags_by_category
from tagger import get_tagger

def print_all_tags():
    """Print all available tags."""
    tags = get_all_tags()
    print(f"\nTotal available tags: {len(tags)}")
    print("First 20 tags:", tags[:20])
    print("...")
    print("Last 20 tags:", tags[-20:])

def print_tags_by_category():
    """Print tags organized by category."""
    categories = get_tags_by_category()
    print(f"\nTags by Category ({len(categories)} categories):")
    
    for category, tags in categories.items():
        print(f"\n{category.upper()} ({len(tags)} tags):")
        # Print tags in rows for readability
        tags_per_row = 5
        for i in range(0, len(tags), tags_per_row):
            row = tags[i:i+tags_per_row]
            print("  " + ", ".join(row))

def test_tagger_with_sample_quotes():
    """Test tag generation with sample quotes."""
    tagger = get_tagger()
    
    sample_quotes = [
        "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        "The way to get started is to quit talking and begin doing.",
        "Life is what happens when you're busy making other plans.",
        "The future belongs to those who believe in the beauty of their dreams.",
        "Tell me and I forget. Teach me and I remember. Involve me and I learn."
    ]
    
    print("\n\nTesting tag generation with sample quotes:")
    for i, quote in enumerate(sample_quotes, 1):
        print(f"\nQuote {i}: {quote}")
        tags = tagger.generate_tags(quote, 'en', 6)
        print(f"Generated tags: {tags}")
        
        # Verify tags are from our vocabulary
        vocabulary = set(get_all_tags())
        valid_tags = [tag for tag in tags if tag in vocabulary]
        invalid_tags = [tag for tag in tags if tag not in vocabulary]
        
        if invalid_tags:
            print(f"WARNING: {len(invalid_tags)} tags are not in the vocabulary: {invalid_tags}")
        else:
            print(f"✓ All {len(tags)} tags are from the predefined vocabulary")

if __name__ == "__main__":
    print("\n===== TAG VOCABULARY TEST =====")
    
    # Print all available tags
    print_all_tags()
    
    # Print tags by category
    print_tags_by_category()
    
    # Test tag generation
    test_tagger_with_sample_quotes()
    
    print("\n===== TEST COMPLETE =====") 