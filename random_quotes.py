#!/usr/bin/env python3
import json
import random
import os

def main():
    # Path to the JSON file
    json_file_path = os.path.expanduser('~/Downloads/quotes-export (2).json')
    
    # Load the JSON data
    with open(json_file_path, 'r', encoding='utf-8') as file:
        quotes = json.load(file)
    
    # Check if there are enough quotes
    if len(quotes) < 100:
        print(f"WARNING: The file only contains {len(quotes)} quotes, selecting all of them.")
        random_quotes = quotes
    else:
        # Select 100 random quotes
        random_quotes = random.sample(quotes, 100)
    
    # Save the random quotes to a new file
    output_file_path = os.path.expanduser('~/tfg/quotesync/random_quotes.json')
    with open(output_file_path, 'w', encoding='utf-8') as file:
        json.dump(random_quotes, file, ensure_ascii=False, indent=2)
    
    print(f"Successfully selected {len(random_quotes)} random quotes from a total of {len(quotes)}.")
    print(f"Saved to: {output_file_path}")

if __name__ == "__main__":
    main() 