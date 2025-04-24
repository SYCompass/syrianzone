#!/bin/bash

# Copyright 2025 Syrian Zone
# Licensed under the MIT License

# This script optimizes images in the /images directory and its subdirectories
# and puts the optimized images in the /optimized-images directory
# using mogrify from imagemagick

# Create the optimized-images directory if it doesn't exi
rm -rf images

cp -r unprocessed-images images

# Remove non-image files like .DS_Store
find images -name ".DS_Store" -type f -delete

# Use mogrify to optimize images in the /images directory and its subdirectories recursively
find images -type f -exec mogrify -resize 250x250 -quality 85 -strip -interlace Plane {} +
