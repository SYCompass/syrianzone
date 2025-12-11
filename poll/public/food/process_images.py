#!/usr/bin/env python3
"""
Script to process recipe images:
1. Strip metadata from images
2. Rename images based on recipe dish_name
3. Update recipes.json with local image paths
"""

import json
import os
import re
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS

# Mapping of contributor names to help match images
CONTRIBUTOR_MAPPING = {
    'Rama Haa': 'RAMA',
    'Rama': 'RAMA',
    'Tassnim Abou selo': '',  # Empty contributor
    'Hadi Ahmet': '',  # Empty contributor
    'Hadi': '',  # Empty contributor
    'Rahaf Alzoubi': 'رهف الزعبي',
    'Rahaf': 'رهف',  # Can match both "رهف الزعبي" and "رهف"
    'Hdisnan': '',  # Empty contributor
    'Fefe 1989': '',  # Empty contributor
    'Fefe': '',  # Empty contributor
    'Aya Hasson': '',  # Empty contributor
    'Aya': ''  # Empty contributor
}

def sanitize_filename(name):
    """Convert Arabic dish name to a safe filename"""
    # Remove special characters, keep Arabic and basic alphanumeric
    # Replace spaces with underscores
    name = re.sub(r'[^\w\s\u0600-\u06FF]', '', name)
    name = name.replace(' ', '_')
    name = name.replace('(', '').replace(')', '')
    return name

def strip_metadata(image_path):
    """Strip metadata from image and save as new file"""
    try:
        img = Image.open(image_path)
        
        # Create a new image without metadata
        data = list(img.getdata())
        image_without_exif = Image.new(img.mode, img.size)
        image_without_exif.putdata(data)
        
        return image_without_exif
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

def get_image_extension(image_path):
    """Get the file extension from image path"""
    return Path(image_path).suffix.lower()

def match_image_to_recipe(image_filename, recipes, used_indices):
    """Match an image to a recipe based on contributor name in filename"""
    # Extract contributor name from filename
    for contributor_key, contributor_value in CONTRIBUTOR_MAPPING.items():
        if contributor_key.lower() in image_filename.lower():
            # Find recipe with exact matching contributor
            for idx, recipe in enumerate(recipes):
                if idx in used_indices:
                    continue
                contributor_info = recipe.get('contributor_info', '').strip()
                if contributor_info == contributor_value:
                    return (idx, recipe)
            
            # If no exact match, try partial match (contributor_value in contributor_info)
            if contributor_value:
                for idx, recipe in enumerate(recipes):
                    if idx in used_indices:
                        continue
                    contributor_info = recipe.get('contributor_info', '').strip()
                    # Check if contributor_value is contained in contributor_info
                    if contributor_value in contributor_info or contributor_info in contributor_value:
                        return (idx, recipe)
                    # Also check if contributor name appears in Arabic (for "رهف" matching "رهف الزعبي")
                    if contributor_key.lower() in contributor_info.lower():
                        return (idx, recipe)
            
            # For empty contributors, try to find recipes with empty contributor_info
            if not contributor_value:
                for idx, recipe in enumerate(recipes):
                    if idx in used_indices:
                        continue
                    contributor_info = recipe.get('contributor_info', '').strip()
                    if not contributor_info:
                        return (idx, recipe)
    
    return None

def process_images():
    """Main function to process all images"""
    script_dir = Path(__file__).parent
    images_dir = script_dir / 'images'
    json_path = script_dir / 'recipes.json'
    
    # Load recipes
    with open(json_path, 'r', encoding='utf-8') as f:
        recipes = json.load(f)
    
    # Get all image files
    image_files = list(images_dir.glob('*.*'))
    image_files = [f for f in image_files if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']]
    
    print(f"Found {len(image_files)} images")
    print(f"Found {len(recipes)} recipes")
    
    # Track which recipes have been matched
    used_indices = set()
    unmatched_images = []
    image_recipe_map = {}
    
    # First pass: Try to match images to recipes by contributor
    for image_file in image_files:
        match = match_image_to_recipe(image_file.name, recipes, used_indices)
        if match:
            recipe_index, recipe = match
            image_recipe_map[image_file] = (recipe_index, recipe)
            used_indices.add(recipe_index)
        else:
            unmatched_images.append(image_file)
    
    # Second pass: Match remaining images to remaining recipes in order
    remaining_recipes = [(i, r) for i, r in enumerate(recipes) if i not in used_indices]
    for i, image_file in enumerate(unmatched_images):
        if i < len(remaining_recipes):
            recipe_index, recipe = remaining_recipes[i]
            image_recipe_map[image_file] = (recipe_index, recipe)
            used_indices.add(recipe_index)
    
    print(f"\nMatched {len(image_recipe_map)} images to recipes")
    print(f"Unmatched images: {len(unmatched_images) - len([img for img in unmatched_images if img in image_recipe_map])}")
    
    # Process and rename images
    for image_file, (recipe_index, recipe) in image_recipe_map.items():
        dish_name = recipe['dish_name']
        sanitized_name = sanitize_filename(dish_name)
        extension = get_image_extension(image_file)
        new_filename = f"{sanitized_name}{extension}"
        new_path = images_dir / new_filename
        
        # Strip metadata and save
        print(f"Processing: {image_file.name} -> {new_filename}")
        img_without_exif = strip_metadata(image_file)
        
        if img_without_exif:
            # Convert to RGB if necessary (for JPEG)
            if extension in ['.jpg', '.jpeg'] and img_without_exif.mode in ['RGBA', 'LA', 'P']:
                rgb_img = Image.new('RGB', img_without_exif.size, (255, 255, 255))
                if img_without_exif.mode == 'P':
                    img_without_exif = img_without_exif.convert('RGBA')
                rgb_img.paste(img_without_exif, mask=img_without_exif.split()[-1] if img_without_exif.mode == 'RGBA' else None)
                img_without_exif = rgb_img
            
            # Save without metadata
            img_without_exif.save(new_path, quality=95, optimize=True)
            
            # Delete old file if different name
            if image_file != new_path:
                image_file.unlink()
            
            # Update recipe JSON
            recipes[recipe_index]['image_url'] = f"/food/images/{new_filename}"
            print(f"  Updated recipe: {dish_name}")
        else:
            print(f"  Failed to process: {image_file.name}")
    
    # Save updated JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    
    print(f"\nUpdated {json_path}")
    print(f"Processed {len(image_recipe_map)} images")

if __name__ == '__main__':
    process_images()

