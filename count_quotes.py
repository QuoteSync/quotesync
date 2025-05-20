import json

with open('random_quotes.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(f"Number of quotes: {len(data)}") 