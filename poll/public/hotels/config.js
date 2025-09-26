// Configuration file for Syrian Hotels Directory
const CONFIG = {
    // Google Sheets Configuration
    GOOGLE_SHEETS: {
        // The Google Sheets file ID from the URL (to be updated with actual hotels sheet)
        SPREADSHEET_ID: '',
        
        // CSV Export URL (publicly accessible)
        // Syrian Hotels Database
        CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRiqxupguALHTEo8qaY7YNi-kBCsy7sXlUIqYxxHQJrSr9nmNHZTgLZ7G7DAF-wQDnEDp5C8GngQyr1/pub?output=csv',
        
        // Cache duration in milliseconds (5 minutes)
        CACHE_DURATION: 5 * 60 * 1000,
        
        // Retry attempts for failed requests
        MAX_RETRIES: 3,
        
        // Retry delay in milliseconds
        RETRY_DELAY: 1000
    },
    
    // Application Settings
    APP: {
        // Number of items to display per page
        ITEMS_PER_PAGE: 12,
        
        // Search debounce delay in milliseconds
        SEARCH_DEBOUNCE: 300,
        
        // Animation duration for smooth transitions
        ANIMATION_DURATION: 300,
        
        // Auto-refresh interval in milliseconds (disabled by default)
        AUTO_REFRESH_INTERVAL: null, // Set to a number to enable auto-refresh
    },
    
    // Social Media Platforms
    SOCIAL_PLATFORMS: {
        'website': {
            baseUrl: '',
            color: 'var(--sz-color-primary)',
            icon: 'fas fa-globe'
        },
        'instagram': {
            baseUrl: 'https://instagram.com/',
            color: '#E4405F',
            icon: 'fab fa-instagram'
        },
        'facebook': {
            baseUrl: 'https://facebook.com/',
            color: '#1877F2',
            icon: 'fab fa-facebook'
        },
        'x_twitter': {
            baseUrl: 'https://x.com/',
            color: '#000000',
            icon: 'fab fa-x-twitter'
        }
    },
    
    // Data Column Mapping - Updated for hotels structure
    COLUMNS: {
        HOTEL_NAME: 'Hotel',
        CITY: 'City',
        STYLE: 'Style',
        PHONE_1: 'Phone Number',
        PHONE_2: 'Phone Number 2',
        PHONE_3: 'Phone Number 3',
        WEBSITE_1: 'Website',
        WEBSITE_2: 'Website 2',
        WEBSITE_3: 'Website 3',
        INSTAGRAM: 'Instagram',
        FACEBOOK: 'Facebook',
        X_TWITTER: 'X Twitter',
        LOCATION: 'location',
        MAP_EMBED: 'Map Embed',
        DESCRIPTION: 'Description',
        AMENITIES: 'Amenities',
        RATING: 'Rating',
        PRICE_RANGE: 'Price Range'
    },
    
    // Default Categories (will be populated from data)
    DEFAULT_STYLES: [
        'Damascene architectural style',
        'Modern',
        'Traditional',
        'Boutique',
        'Luxury',
        'Budget'
    ],
    
    // Default Cities (will be populated from data)
    DEFAULT_CITIES: [
        'Damascus',
        'Aleppo',
        'Homs',
        'Hama',
        'Latakia',
        'Tartus',
        'Deir ez-Zor',
        'Raqqa',
        'Idlib',
        'Daraa',
        'Quneitra',
        'As-Suwayda'
    ],
    
    // Error Messages
    ERROR_MESSAGES: {
        FETCH_FAILED: 'فشل في تحميل الفنادق. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
        NO_DATA: 'لم يتم العثور على فنادق. يرجى تعديل معايير البحث.',
        CSV_ERROR: 'غير قادر على تحميل البيانات من جوجل شيتس. يرجى المحاولة لاحقاً.',
        NETWORK_ERROR: 'خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
        INVALID_RESPONSE: 'تم استلام بيانات CSV غير صحيحة. يرجى التحقق من تنسيق الجدول.',
        PARSE_ERROR: 'خطأ في تحليل بيانات CSV. يرجى التحقق من تنسيق الجدول.',
        REDIRECT_ERROR: 'غير قادر على الوصول إلى بيانات CSV. يرجى التأكد من نشر الجدول على الويب وصحة الرابط.'
    },
    
    // Loading States
    LOADING_STATES: {
        INITIAL: 'جاري تحميل الفنادق...',
        SEARCHING: 'جاري البحث في الفنادق...',
        FILTERING: 'جاري تصفية النتائج...',
        LOADING_MORE: 'جاري تحميل المزيد من الفنادق...'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        CACHED_DATA: 'syria_hotels_data',
        CACHE_TIMESTAMP: 'syria_hotels_cache_timestamp',
        USER_PREFERENCES: 'syria_hotels_preferences',
        SEARCH_HISTORY: 'syria_hotels_search_history'
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_CACHING: true,
        ENABLE_SEARCH_HISTORY: true,
        ENABLE_AUTO_REFRESH: false,
        ENABLE_ANALYTICS: false,
        ENABLE_OFFLINE_MODE: false,
        ENABLE_MAP_EMBEDS: true,
        ENABLE_MULTIPLE_CONTACTS: true
    },
    
    // Analytics Configuration (if enabled)
    ANALYTICS: {
        GOOGLE_ANALYTICS_ID: '', // Add your GA4 ID here
        TRACK_SEARCHES: true,
        TRACK_FILTERS: true,
        TRACK_CLICKS: true
    },
    
    // Map Configuration
    MAP: {
        DEFAULT_ZOOM: 15,
        DEFAULT_CENTER: {
            lat: 33.5138,
            lng: 36.2765
        },
        PROVIDER: 'google', // 'google' or 'openstreetmap'
        API_KEY: '' // Add your Google Maps API key if using Google Maps
    }
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
