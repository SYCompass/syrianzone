import { marked } from 'https://cdn.jsdelivr.net/npm/marked@4.3.0/lib/marked.esm.js';

// Configure marked with custom renderer
const renderer = {
  heading(text, level) {
    return `<h${level}>${text}</h${level}>`;
  },

  paragraph(text) {
    return `<p>${text}</p>`;
  },

  link(href, title, text) {
    return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  },

  list(body, ordered) {
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag}>${body}</${tag}>`;
  },

  listitem(text) {
    return `<li>${text}</li>`;
  },

  strong(text) {
    return `<strong>${text}</strong>`;
  },

  em(text) {
    return `<em>${text}</em>`;
  },

  codespan(text) {
    return `<code>${text}</code>`;
  },

  code(text, language) {
    const langClass = language ? ` class="language-${language}"` : '';
    return `<pre><code${langClass}>${text}</code></pre>`;
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