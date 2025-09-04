# Syrian Hotels Directory

A comprehensive directory of hotels in Syria, built with HTML, CSS, and JavaScript. This page allows users to browse, search, and filter hotels with support for multiple contact methods, social media links, and map embeds.

## Features

### 🏨 Hotel Information
- Hotel name, city, and architectural style
- Multiple phone numbers per hotel
- Multiple website URLs per hotel
- Social media links (Instagram, Facebook, X/Twitter)
- Location details and map embeds
- Hotel amenities and ratings
- Price range indicators

### 🔍 Search & Filter
- Real-time search across hotel names, cities, styles, and descriptions
- Filter by city and architectural style
- Sort by name, city, or style
- Responsive design for all devices

### 📊 Data Management
- CSV file support for easy data management
- Google Sheets integration for real-time updates
- Caching system for improved performance
- Sample data included for testing

## File Structure

```
hotels/
├── index.html          # Main HTML page
├── script.js           # JavaScript functionality
├── styles.css          # Custom CSS styles
├── config.js           # Configuration settings
├── hotels-template.csv # CSV template for data input
└── README.md           # This documentation
```

## CSV Data Structure

The hotels directory expects a CSV file with the following columns:

### Required Columns
- `Hotel` - Hotel name
- `City` - City where the hotel is located
- `Style` - Architectural style (e.g., "Damascene architectural style", "Modern")

### Contact Information (Multiple entries supported)
- `Phone Number` - Primary phone number
- `Phone Number 2` - Secondary phone number
- `Phone Number 3` - Tertiary phone number
- `Website` - Primary website URL
- `Website 2` - Secondary website URL
- `Website 3` - Tertiary website URL

### Social Media
- `Instagram` - Instagram handle (with or without @)
- `Facebook` - Facebook page name
- `X Twitter` - X/Twitter handle

### Location & Additional Info
- `location` - Physical address
- `Map Embed` - HTML iframe embed code for maps
- `Description` - Hotel description
- `Amenities` - Comma-separated list of amenities
- `Rating` - Hotel rating (e.g., "4.5")
- `Price Range` - Price range (e.g., "$$$")

## Setup Instructions

### 1. Basic Setup
1. Place all files in the `hotels/` directory
2. Ensure the `config.js` file is properly configured
3. Open `index.html` in a web browser

### 2. Google Sheets Integration
1. Create a Google Sheets document with the CSV template structure
2. Publish the sheet to the web (File > Share > Publish to web)
3. Copy the CSV export URL
4. Update `config.js` with your Google Sheets URL:
   ```javascript
   GOOGLE_SHEETS: {
       CSV_URL: 'YOUR_GOOGLE_SHEETS_CSV_URL_HERE'
   }
   ```

### 3. Local CSV File
If you prefer to use a local CSV file:
1. Replace the sample data in `script.js` with your CSV data
2. Or modify the `loadHotels()` function to fetch from a local file

## Configuration

### Basic Configuration
Edit `config.js` to customize:

```javascript
const CONFIG = {
    GOOGLE_SHEETS: {
        CSV_URL: 'your-google-sheets-csv-url',
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
        MAX_RETRIES: 3
    },
    APP: {
        ITEMS_PER_PAGE: 12,
        SEARCH_DEBOUNCE: 300
    },
    FEATURES: {
        ENABLE_CACHING: true,
        ENABLE_MAP_EMBEDS: true,
        ENABLE_MULTIPLE_CONTACTS: true
    }
};
```

### Map Integration
To enable map embeds:
1. Set `ENABLE_MAP_EMBEDS: true` in config
2. Add Google Maps iframe codes to the `Map Embed` column
3. Optionally configure Google Maps API key in `MAP.API_KEY`

## Sample Data

The page includes sample data for testing:
- Beit Al Wali (Damascus)
- Talisman 2 (Damascus)
- Four Seasons (Damascus)

## Styling

The page uses a custom CSS framework with:
- RTL (Right-to-Left) support for Arabic text
- Responsive grid layout
- Hover effects and animations
- Color-coded badges for different information types
- Mobile-first responsive design

### Color Scheme
- Primary: #556A4E (Green)
- Accent: #A73F46 (Red)
- Text: #333 (Dark Gray)
- Background: #f8f9fa (Light Gray)

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features

- **Caching**: Data is cached in localStorage for 5 minutes
- **Debounced Search**: Search input is debounced to reduce API calls
- **Lazy Loading**: Hotels are loaded in pages of 12 items
- **Error Handling**: Comprehensive error handling with retry functionality

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus indicators
- Semantic HTML structure

## Contributing

To add new hotels:
1. Use the provided CSV template
2. Fill in all relevant information
3. Upload to Google Sheets or update the local data
4. Test the new entries

## Troubleshooting

### Common Issues

1. **Data not loading**: Check Google Sheets URL and ensure it's publicly accessible
2. **Maps not showing**: Verify iframe codes are properly formatted
3. **Search not working**: Check browser console for JavaScript errors
4. **Styling issues**: Ensure all CSS files are properly linked

### Debug Mode
Enable debug logging by opening browser console to see detailed error messages and data flow.

## License

This project is part of the Syrian Zone initiative. See the main project for licensing information.

## Support

For support or questions, please contact the development team or create an issue in the project repository.
