#!/bin/bash

# Navigate to the script's directory to ensure correct relative paths
cd "$(dirname "$0")"

# Define the directories to scan
DIRS=("todo" "in-progress" "done")

# Start JSON output
JSON_OUTPUT="{"

FIRST_DIR=true
for DIR in "${DIRS[@]}"; do
    # Add comma if not the first directory entry
    if [ "$FIRST_DIR" = false ]; then
        JSON_OUTPUT="$JSON_OUTPUT,"
    fi
    FIRST_DIR=false

    JSON_OUTPUT="$JSON_OUTPUT\n  \"$DIR\": ["

    FIRST_FILE=true
    # Find markdown files, handle spaces in names, and ignore case for .md
    shopt -s nullglob nocaseglob
    FILES=("$DIR"/*.md)
    shopt -u nullglob nocaseglob

    for FILE in "${FILES[@]}"; do
        # Add comma if not the first file entry
        if [ "$FIRST_FILE" = false ]; then
            JSON_OUTPUT="$JSON_OUTPUT,"
        fi
        FIRST_FILE=false

        # Extract just the filename
        FILENAME=$(basename "$FILE")
        # Add filename to JSON array (ensure proper escaping if needed, though unlikely for simple filenames)
        JSON_OUTPUT="$JSON_OUTPUT\n    \"$FILENAME\""
    done

    JSON_OUTPUT="$JSON_OUTPUT\n  ]"
done

# Close JSON object
JSON_OUTPUT="$JSON_OUTPUT\n}"

# Write to data.json
echo -e "$JSON_OUTPUT" > data.json

echo "data.json has been updated." 