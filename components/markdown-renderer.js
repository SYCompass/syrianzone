import { marked } from 'https://cdn.jsdelivr.net/npm/marked@4.3.0/lib/marked.esm.js';

// Configure marked with custom renderer
const renderer = {
  heading(text, level) {
    const baseClasses = 'font-bold mb-4';
    const levelClasses = {
      1: 'text-4xl text-gray-900',
      2: 'text-3xl text-gray-800',
      3: 'text-2xl text-gray-700',
      4: 'text-xl text-gray-600',
      5: 'text-lg text-gray-600',
      6: 'text-base text-gray-600'
    };
    
    return `<h${level} class="${baseClasses} ${levelClasses[level]}">${text}</h${level}>`;
  },

  paragraph(text) {
    return `<p class="text-gray-700 mb-4 leading-relaxed">${text}</p>`;
  },

  link(href, title, text) {
    return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200">${text}</a>`;
  },

  list(body, ordered) {
    const listClass = ordered ? 'list-decimal' : 'list-disc';
    return `<ul class="${listClass} mb-4 pl-4">${body}</ul>`;
  },

  listitem(text) {
    return `<li class="mb-2 pl-2">${text}</li>`;
  },

  strong(text) {
    return `<strong class="font-bold">${text}</strong>`;
  },

  em(text) {
    return `<em class="italic">${text}</em>`;
  },

  codespan(text) {
    return `<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">${text}</code>`;
  },

  code(text, language) {
    return `<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4"><code class="text-sm font-mono">${text}</code></pre>`;
  }
};

// Configure marked options
marked.use({
  renderer,
  gfm: true, // GitHub Flavored Markdown
  breaks: true // Convert line breaks to <br>
});

export async function renderMarkdown() {
    try {
        const response = await fetch('/README.md');
        const markdown = await response.text();
        const html = marked.parse(markdown);
        document.getElementById('readme-content').innerHTML = html;
    } catch (error) {
        console.error('Error loading markdown:', error);
        document.getElementById('readme-content').innerHTML = '<p class="text-red-500">Error loading content</p>';
    }
} 