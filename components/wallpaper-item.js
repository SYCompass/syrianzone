class WallpaperItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['title', 'image-src', 'download-png', 'download-svg', 'download-jpg', 'designer-name', 'designer-link'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const title = this.getAttribute('title') || 'بدون عنوان';
        const imageSrc = this.getAttribute('image-src');
        const downloadPng = this.getAttribute('download-png');
        const downloadSvg = this.getAttribute('download-svg');
        const downloadJpg = this.getAttribute('download-jpg');
        const designerName = this.getAttribute('designer-name');
        const designerLink = this.getAttribute('designer-link');

        if (!imageSrc) {
            this.shadowRoot.innerHTML = '<p>Image source is missing.</p>';
            return;
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .wallpaper-card {
                    background-color: #f9fafb; /* bg-gray-50 */
                    padding: 1.5rem; /* p-6 */
                    border-radius: 0.5rem; /* rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); /* shadow-md */
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                }
                h3 {
                    font-size: 1.5rem; /* text-2xl */
                    font-weight: 600; /* font-semibold */
                    margin-bottom: 1rem; /* mb-4 */
                }
                .image-container {
                    margin-bottom: 1rem; /* mb-4 */
                    width: 100%;
                }
                img {
                    width: 100%;
                    height: auto;
                    border-radius: 0.5rem; /* rounded-lg */
                    border: 2px solid #e5e7eb; /* border-gray-200 */
                }
                .buttons-container {
                    display: flex;
                    justify-content: center;
                    gap: 1rem; /* gap-4 */
                    margin-top: auto; /* mt-auto */
                    margin-bottom: 0.5rem; /* mb-2 */
                }
                .download-btn {
                    display: inline-block;
                    background-color: #054239;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: 700;
                    transition: background-color 0.3s;
                }
                .download-btn:hover {
                    background-color: #002623;
                }
                .designer-info {
                    font-size: 0.75rem; /* text-xs */
                    color: #6b7280; /* text-gray-500 */
                    margin-top: 0.25rem; /* mt-1 */
                }
                .designer-info a {
                    text-decoration: underline;
                    color: #2563eb; /* hover:text-blue-600 */
                }
            </style>
            <div class="wallpaper-card">
                <h3>${title}</h3>
                <div class="image-container">
                    <img src="${imageSrc}" alt="${title}" loading="lazy" class="w-full h-auto rounded-lg border-2 border-gray-200">
                </div>
                <div class="buttons-container">
                    ${downloadPng ? `<a href="${downloadPng}" class="download-btn" download>تحميل PNG</a>` : ''}
                    ${downloadSvg ? `<a href="${downloadSvg}" class="download-btn" download>تحميل SVG</a>` : ''}
                    ${downloadJpg ? `<a href="${downloadJpg}" class="download-btn" download>تحميل JPG</a>` : ''}
                </div>
                ${designerName && designerLink ? `
                    <div class="designer-info">
                        تصميم: <a href="${designerLink}" target="_blank" rel="noopener">${designerName}</a>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('wallpaper-item', WallpaperItem); 