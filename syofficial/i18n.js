// i18n.js - Internationalization handler
let currentLanguage = 'ar';
let translations = {};

// Load translations for a specific language
async function loadTranslations(lang) {
    try {
        const response = await fetch(`/syofficial/languages/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load ${lang} translations`);
        }
        translations[lang] = await response.json();
        return translations[lang];
    } catch (error) {
        console.error('Error loading translations:', error);
        return null;
    }
}

// Initialize translations
async function initTranslations() {
    await loadTranslations('ar');
    await loadTranslations('en');
    await loadTranslations('tr');
    await loadTranslations('ku');
    updatePageLanguage();
}

// Update the page language
function updatePageLanguage() {
    const lang = translations[currentLanguage];
    if (!lang) return;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const value = getNestedValue(lang, key);
        if (value) {
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = value;
            } else {
                element.textContent = value;
            }
        }
    });

    // Update HTML lang and dir attributes
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';

    // Update language switcher buttons
    document.querySelectorAll('.language-switcher button').forEach(button => {
        if (button.dataset.lang === currentLanguage) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
}

// Switch language
async function switchLanguage(lang) {
    if (currentLanguage === lang) return;
    
    if (!translations[lang]) {
        await loadTranslations(lang);
    }
    
    currentLanguage = lang;
    updatePageLanguage();
    
    // Save language preference
    localStorage.setItem('preferredLanguage', lang);
}

// Initialize language switcher
function initLanguageSwitcher() {
    document.querySelectorAll('.language-switcher button').forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.dataset.lang;
            switchLanguage(lang);
        });
    });
}

// Load preferred language from localStorage
function loadPreferredLanguage() {
    const preferredLang = localStorage.getItem('preferredLanguage');
    if (preferredLang) {
        currentLanguage = preferredLang;
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadPreferredLanguage();
    initTranslations().then(() => {
        initLanguageSwitcher();
    });
}); 