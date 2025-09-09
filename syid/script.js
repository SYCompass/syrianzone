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
    
    // Change color based on type using theme colors
    if (type === 'error') {
        notification.style.background = 'var(--sz-color-accent)';
    } else {
        notification.style.background = 'var(--sz-color-primary)';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Back to Top functionality
function initializeNavigation() {
    const backToTop = document.getElementById('backToTop');

    // Back to top functionality
    function toggleBackToTop() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        backToTop.style.display = scrollTop > 300 ? 'block' : 'none';
    }

    // Event listeners
    window.addEventListener('scroll', () => {
        toggleBackToTop();
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Initial call
    toggleBackToTop();
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();

    // Add click event listeners to all color items
    document.querySelectorAll('[data-hex]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const hexCode = this.getAttribute('data-hex');
            copyToClipboard(hexCode);
        });
    });
    
    console.log('Color palette loaded. Found', document.querySelectorAll('[data-hex]').length, 'color items.');
}); 

// Dynamic content loading is no longer needed since we removed wallpapers