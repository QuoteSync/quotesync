#!/usr/bin/env python
"""
CLI utility to test the tag system.
This script provides a command-line interface to test tag generation
and view the available tags.
"""

import argparse
import json
import sys
import os

# Add the parent directory to the path so we can import the services
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from quotes.services.tagger import get_tagger
from quotes.services.tag_vocabulary import get_all_tags, get_tags_by_category

def print_title(title):
    """Print a formatted title."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def generate_tags_for_text(text, language='en', num_tags=5):
    """Generate tags for the given text."""
    print_title("GENERATING TAGS")
    
    print(f"\nText: {text}")
    print(f"Language: {language}")
    print(f"Number of tags: {num_tags}")
    
    tagger = get_tagger()
    tags = tagger.generate_tags(text, language, num_tags)
    
    print("\nGenerated tags:")
    for i, tag in enumerate(tags, 1):
        print(f"  {i}. {tag}")
    
    return tags

def list_available_tags(by_category=False):
    """List all available tags."""
    if by_category:
        print_title("AVAILABLE TAGS BY CATEGORY")
        categories = get_tags_by_category()
        
        for category, tags in categories.items():
            print(f"\n{category.upper()} ({len(tags)} tags):")
            # Print tags in rows for readability
            tags_per_row = 5
            for i in range(0, len(tags), tags_per_row):
                row = tags[i:i+tags_per_row]
                print("  " + ", ".join(row))
    else:
        print_title("ALL AVAILABLE TAGS")
        tags = get_all_tags()
        print(f"\nTotal tags: {len(tags)}")
        
        # Print in multiple columns
        tags_per_row = 5
        for i in range(0, len(tags), tags_per_row):
            row = tags[i:i+tags_per_row]
            print("  " + ", ".join(row))

def export_tags_to_json(output_file, by_category=False):
    """Export all tags to a JSON file."""
    print_title("EXPORTING TAGS TO JSON")
    
    if by_category:
        data = {
            "tags_by_category": get_tags_by_category(),
            "total_tags": len(get_all_tags())
        }
    else:
        data = {
            "tags": get_all_tags(),
            "total_tags": len(get_all_tags())
        }
    
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\nExported {data['total_tags']} tags to {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Test tag generation and browse available tags')
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Generate tags command
    generate_parser = subparsers.add_parser('generate', help='Generate tags for text')
    generate_parser.add_argument('text', help='Text to generate tags for')
    generate_parser.add_argument('--language', '-l', default='en', help='Language code (default: en)')
    generate_parser.add_argument('--num-tags', '-n', type=int, default=5, help='Number of tags to generate (default: 5)')
    
    # List tags command
    list_parser = subparsers.add_parser('list', help='List all available tags')
    list_parser.add_argument('--by-category', '-c', action='store_true', help='Organize tags by category')
    
    # Export tags command
    export_parser = subparsers.add_parser('export', help='Export tags to JSON file')
    export_parser.add_argument('output_file', help='Output JSON file path')
    export_parser.add_argument('--by-category', '-c', action='store_true', help='Organize tags by category')
    
    args = parser.parse_args()
    
    if args.command == 'generate':
        generate_tags_for_text(args.text, args.language, args.num_tags)
    elif args.command == 'list':
        list_available_tags(args.by_category)
    elif args.command == 'export':
        export_tags_to_json(args.output_file, args.by_category)
    else:
        parser.print_help()

if __name__ == '__main__':
    main() 