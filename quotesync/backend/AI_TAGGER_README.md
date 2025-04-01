# QuoteSync AI Tagger

This module provides automatic tag generation for quotes using either Hugging Face's multilingual models or a simpler rule-based approach when dependencies aren't available.

## Features

- Generate relevant tags for quotes in multiple languages
- Smart fallback system that works even without advanced ML libraries
- Uses zero-shot classification when available for better tag quality
- Caches results to improve performance
- Supports batch processing for multiple quotes

## Prerequisites

For the advanced ML-based tagger:
- Python 3.7+
- PyTorch
- Transformers
- Sentencepiece

If you're on macOS and want to build Sentencepiece from source:
- Homebrew
- CMake (`brew install cmake`)
- Xcode Command Line Tools (`xcode-select --install`)

## Setup

1. Run the setup script which will handle the dependencies and fallback options automatically:

```bash
cd quotesync/backend
bash setup_tagger.sh
```

The script will:
- Try to install the advanced dependencies if possible
- Fall back to a simpler implementation if required
- Download the necessary models
- Run tests to ensure everything is working

2. Make sure the URL is configured in your Django project.

The tag suggestion endpoint should be available at:
```
/api/quotes/suggest-tags/
```

## Fallback System

The tagger includes a smart fallback system:

1. **First choice**: Advanced ML-based tagger using Hugging Face models
   - Better multilingual support
   - More accurate topic classification
   - Uses zero-shot learning

2. **Fallback**: Simple rule-based tagger
   - Works without advanced ML libraries
   - Uses keyword matching and regex
   - Still provides reasonable tag suggestions
   - No external dependencies required

The system automatically chooses the best available option based on your environment.

## Usage

### API Endpoint

The API endpoint accepts POST requests with the following parameters:

```json
{
  "text": "The quote text to generate tags for",
  "language": "en",  // Optional, defaults to "en"
  "num_tags": 5      // Optional, defaults to 5
}
```

### Example Request

```bash
curl -X POST \
  http://localhost:8000/api/quotes/suggest-tags/ \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "The only limit to our realization of tomorrow will be our doubts of today.",
    "language": "en",
    "num_tags": 5
  }'
```

### Example Response

```json
{
  "suggested_tags": [
    "motivation",
    "inspiration",
    "future",
    "doubt",
    "limitation"
  ],
  "language": "en",
  "quote_length": 74
}
```

## Supported Languages

The model supports a wide range of languages, including:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- And many more

Note: The simple fallback tagger works best with English but still provides basic support for other languages.

## Technical Details

- Uses XLM-RoBERTa as the base model for multilingual support (when available)
- Implements zero-shot classification to identify relevant topics
- Extracts key terms from the quote text to enhance tag generation
- Cleans and normalizes tags to ensure consistency
- Combines predefined topic areas with extracted terms

## Troubleshooting

If you encounter issues with the installation:

1. **Sentencepiece fails to install on macOS**:
   - Ensure you have cmake installed: `brew install cmake`
   - Make sure Xcode Command Line Tools are installed: `xcode-select --install`
   - The tagger will still work using the fallback implementation

2. **PyTorch or Transformers installation issues**:
   - The tagger will automatically fall back to the simpler implementation
   - API endpoints will still work the same way

3. **Memory errors when loading models**:
   - Reduce `num_tags` to require less memory
   - The tagger will attempt to use the simple fallback if the ML model fails

## Debugging

If you encounter issues, check the Django logs for detailed error messages. The tagger includes comprehensive logging at each step of the process. 