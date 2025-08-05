// Configuration file for Syria Development Network
const CONFIG = {
    // Google Sheets Configuration
    GOOGLE_SHEETS: {
        // The Google Sheets file ID from the URL
        SPREADSHEET_ID: '1vTxa48kbdV2X5Umd3WGDeU7xX5qFVRpyA3uDFhI9w2FAOuxSiGebSpKrVpjU-13XswnNgxHvfWw-sbJ',
        
        // CSV Export URL (publicly accessible)
        // Syrian Political Organizations Database
        CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxa48kbdV2X5Umd3WGDeU7xX5qFVRpyA3uDFhI9w2FAOuxSiGebSpKrVpjU-13XswnNgxHvfWw-sbJ/pub?output=csv',
        
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
        'social - x': {
            baseUrl: '',
            color: '#002623'
        },
        'social - insta': {
            baseUrl: '',
            color: '#002623'
        },
        'social - fb': {
            baseUrl: '',
            color: '#002623'
        }
    },
    
    // Data Column Mapping
    COLUMNS: {
        INITIATIVE_NAME: 'name',
        X_ACCOUNT: 'social - x',
        INSTAGRAM_ACCOUNT: 'social - insta',
        FACEBOOK_ACCOUNT: 'social - fb',
        WEBSITE: 'website',
        COUNTRY: 'country of origin',
        CITY: 'city',
        PHONE: 'Phone',
        EMAIL: 'Email',
        CATEGORY: 'type',
        DESCRIPTION: 'short description',
        POLITICAL_LEANINGS: 'political leanings',
        MVP_MEMBERS: 'MVP members',
        MANIFESTO_LINK: 'manifesto link',
        LANG: 'lang'
    },
    
    // Default Categories (will be populated from data)
    DEFAULT_CATEGORIES: [
        'حزب سياسي',
        'حركة سياسية',
        'حركة سياسية محلية',
        'منظمة غير حكومية',
        'وثيقة',
        'تجمع سياسي',
        'منصة مدنية'
    ],
    
    // Error Messages
    ERROR_MESSAGES: {
        FETCH_FAILED: 'فشل في تحميل المنظمات السياسية. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
        NO_DATA: 'لم يتم العثور على منظمات سياسية. يرجى تعديل معايير البحث.',
        CSV_ERROR: 'غير قادر على تحميل البيانات من جوجل شيتس. يرجى المحاولة لاحقاً.',
        NETWORK_ERROR: 'خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
        INVALID_RESPONSE: 'تم استلام بيانات CSV غير صحيحة. يرجى التحقق من تنسيق الجدول.',
        PARSE_ERROR: 'خطأ في تحليل بيانات CSV. يرجى التحقق من تنسيق الجدول.',
        REDIRECT_ERROR: 'غير قادر على الوصول إلى بيانات CSV. يرجى التأكد من نشر الجدول على الويب وصحة الرابط.'
    },
    
    // Loading States
    LOADING_STATES: {
        INITIAL: 'جاري تحميل المنظمات السياسية...',
        SEARCHING: 'جاري البحث في المنظمات السياسية...',
        FILTERING: 'جاري تصفية النتائج...',
        LOADING_MORE: 'جاري تحميل المزيد من المنظمات السياسية...'
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        CACHED_DATA: 'syria_political_orgs_data',
        CACHE_TIMESTAMP: 'syria_political_orgs_cache_timestamp',
        USER_PREFERENCES: 'syria_political_orgs_preferences',
        SEARCH_HISTORY: 'syria_political_orgs_search_history'
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_CACHING: true,
        ENABLE_SEARCH_HISTORY: true,
        ENABLE_AUTO_REFRESH: false,
        ENABLE_ANALYTICS: false,
        ENABLE_OFFLINE_MODE: false
    },
    
    // Analytics Configuration (if enabled)
    ANALYTICS: {
        GOOGLE_ANALYTICS_ID: '', // Add your GA4 ID here
        TRACK_SEARCHES: true,
        TRACK_FILTERS: true,
        TRACK_CLICKS: true
    }
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 