// Configuration file for Syrian Recipes
const CONFIG = {
    // Application Settings
    APP: {
        // Number of items to display per page
        ITEMS_PER_PAGE: 12,
        
        // Search debounce delay in milliseconds
        SEARCH_DEBOUNCE: 300,
        
        // Animation duration for smooth transitions
        ANIMATION_DURATION: 300,
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        FETCH_FAILED: 'فشل في تحميل الوصفات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
        NO_DATA: 'لم يتم العثور على وصفات. يرجى تعديل معايير البحث.',
        JSON_ERROR: 'غير قادر على تحميل البيانات. يرجى المحاولة لاحقاً.',
        NETWORK_ERROR: 'خطأ في الشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
        PARSE_ERROR: 'خطأ في تحليل البيانات. يرجى التحقق من تنسيق الملف.'
    },
    
    // Loading States
    LOADING_STATES: {
        INITIAL: 'جاري تحميل الوصفات...',
        SEARCHING: 'جاري البحث في الوصفات...',
        FILTERING: 'جاري تصفية النتائج...',
        LOADING_MORE: 'جاري تحميل المزيد من الوصفات...'
    }
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
