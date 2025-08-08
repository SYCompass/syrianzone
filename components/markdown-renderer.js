export async function renderMarkdown() {
    try {
        const response = await fetch('/README.md');
        const markdown = await response.text();
        
        // Convert markdown to HTML using simple regex replacements for basic formatting
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Lists
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            // Convert line breaks to paragraphs
            .split('\n\n')
            .map(block => block.trim())
            .filter(block => block.length > 0)
            .map(block => {
                if (block.startsWith('<h')) return block;
                if (block.startsWith('<pre>')) return block;
                if (block.startsWith('<li>')) {
                    // Handle lists
                    const items = block.split('\n').filter(line => line.trim().startsWith('<li>'));
                    return `<ul>${items.join('')}</ul>`;
                }
                return `<p>${block}</p>`;
            })
            .join('');
        
        document.getElementById('readme-content').innerHTML = html;
    } catch (error) {
        console.error('Error loading markdown:', error);
        document.getElementById('readme-content').innerHTML = '<p class="text-red-500">Error loading content</p>';
    }
} 