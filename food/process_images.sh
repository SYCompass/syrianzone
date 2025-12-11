#!/bin/bash
# Alternative script using ImageMagick/exiftool to process images
# Requires: imagemagick and exiftool (or just imagemagick)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGES_DIR="$SCRIPT_DIR/images"
JSON_PATH="$SCRIPT_DIR/recipes.json"

# Check if ImageMagick is available
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick (convert) is not installed"
    echo "Install with: sudo apt-get install imagemagick (Debian/Ubuntu)"
    echo "Or use the Python script: python3 process_images.py"
    exit 1
fi

# Function to sanitize filename
sanitize_filename() {
    echo "$1" | sed 's/[^a-zA-Z0-9\u0600-\u06FF]/_/g' | sed 's/__*/_/g'
}

# Function to strip metadata using ImageMagick
strip_metadata() {
    local input="$1"
    local output="$2"
    convert "$input" -strip "$output"
}

# Load recipes JSON (requires jq for parsing, or use Python)
if ! command -v jq &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "Error: Need either jq or python3 to parse JSON"
    echo "Install jq: sudo apt-get install jq"
    echo "Or use the Python script: python3 process_images.py"
    exit 1
fi

echo "Processing images with ImageMagick..."
echo "Note: For better matching, use the Python script: python3 process_images.py"

# If Python is available, use it for JSON processing
if command -v python3 &> /dev/null; then
    python3 "$SCRIPT_DIR/process_images.py"
else
    echo "Python script recommended for better JSON handling"
    echo "Please install Python 3 and Pillow: pip3 install Pillow"
fi

