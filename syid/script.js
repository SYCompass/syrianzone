function copyToClipboard(text) {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showNotification(`تم نسخ ${text} إلى الحافظة!`);
        }).catch(function(err) {
            console.error('Clipboard API failed: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // Use fallback method
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification(`تم نسخ ${text} إلى الحافظة!`);
        } else {
            showNotification(`فشل في نسخ ${text}`, 'error');
        }
    } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
        showNotification(`فشل في نسخ ${text}`, 'error');
    }
    
    document.body.removeChild(textArea);
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    
    // Change color based on type
    if (type === 'error') {
        notification.style.background = '#f44336';
    } else {
        notification.style.background = '#4CAF50';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Quick Navigation and Back to Top functionality
function initializeNavigation() {
    const quickNav = document.getElementById('quickNav');
    const backToTop = document.getElementById('backToTop');
    const sections = document.querySelectorAll('#typography, #colors');
    const quickNavItems = document.querySelectorAll('.quick-nav-item');

    // Back to top functionality
    function toggleBackToTop() {
        if (window.scrollY > window.innerHeight) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    }

    // Update active quick nav item based on scroll position
    function updateActiveNavItem() {
        let activeSection = '';
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                activeSection = section.id;
            }
        });

        quickNavItems.forEach(item => {
            if (item.dataset.section === activeSection) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Smooth scroll to section
    function scrollToSection(targetId) {
        const target = document.getElementById(targetId);
        if (target) {
            const offsetTop = target.offsetTop - 100; // Account for navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    // Event listeners
    window.addEventListener('scroll', () => {
        toggleBackToTop();
        updateActiveNavItem();
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    quickNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.dataset.section;
            scrollToSection(targetSection);
        });
    });

    // Initial calls
    toggleBackToTop();
    updateActiveNavItem();
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();

    // Add click event listeners to all color items
    document.querySelectorAll('.color-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const hexCode = this.getAttribute('data-hex');
            console.log('Clicking color:', hexCode); // Debug log
            copyToClipboard(hexCode);
        });
    });
    
    console.log('Color palette loaded. Found', document.querySelectorAll('.color-item').length, 'color items.');
}); 