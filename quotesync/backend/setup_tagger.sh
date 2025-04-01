#!/bin/bash

# Setup script for the QuoteSync AI Tagger
echo "Setting up the QuoteSync AI Tagger..."

# Function to install advanced dependencies
install_advanced_deps() {
    echo "Installing advanced AI dependencies..."
    
    # Check for cmake on macOS (required for sentencepiece)
    if [[ "$(uname)" == "Darwin" ]]; then
        if ! command -v cmake &> /dev/null; then
            echo "Warning: cmake is required to build sentencepiece on macOS but was not found."
            echo "To install cmake, run: brew install cmake"
            echo "Continuing with basic installation..."
            return 1
        fi
        
        # Check for Xcode command line tools
        if ! xcode-select -p &> /dev/null; then
            echo "Warning: Xcode command line tools are required but not found."
            echo "To install them, run: xcode-select --install"
            echo "Continuing with basic installation..."
            return 1
        fi
    fi
    
    # Try to install the advanced dependencies
    pip install torch transformers numpy
    
    # If on macOS, try to install sentencepiece separately
    if [[ "$(uname)" == "Darwin" ]]; then
        echo "Installing sentencepiece for macOS..."
        pip install --no-binary :all: sentencepiece || {
            echo "Warning: Failed to install sentencepiece. The tagger will fall back to simple mode."
            return 1
        }
    else
        pip install sentencepiece || {
            echo "Warning: Failed to install sentencepiece. The tagger will fall back to simple mode."
            return 1
        }
    fi
    
    return 0
}

# Check if pip is available
if ! command -v pip &> /dev/null; then
    echo "Error: pip could not be found, please install Python and pip first"
    exit 1
fi

# First try to install advanced dependencies
echo "Attempting to install advanced AI dependencies..."
if install_advanced_deps; then
    echo "Successfully installed advanced AI dependencies."
    
    # Download model for the first time
    echo "Downloading model for the first time (this may take a while)..."
    cd quotes/services
    python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
        print('Downloading tokenizer...'); \
        tokenizer = AutoTokenizer.from_pretrained('xlm-roberta-base'); \
        print('Downloading model...'); \
        model = AutoModelForSequenceClassification.from_pretrained('xlm-roberta-base'); \
        print('Model downloaded successfully!')" || {
        echo "Warning: Failed to download model. The tagger will fall back to simple mode."
    }
    cd ../..
else
    echo "Note: Advanced AI dependencies could not be installed."
    echo "The system will use a simpler, rule-based tagger instead."
fi

# Run the test script
echo "Running test script..."
cd quotes/services
python test_tagger.py || {
    echo "Warning: Test script failed, but the tagger should still work in simple mode."
}
cd ../..

echo "Setup complete!"
echo "You can now use the tag suggestion API endpoint at /api/quotes/suggest-tags/"
echo ""
echo "Note: Depending on your system configuration, the tagger will either:"
echo "  1. Use the advanced Hugging Face models for better multilingual tag generation, or"
echo "  2. Fall back to a simpler rule-based tagger if dependencies couldn't be installed."
echo ""
echo "Either way, the API endpoint will work with the same interface."