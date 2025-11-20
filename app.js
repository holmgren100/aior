// AI Tool Data Model
class AIToolModel {
    // Schema definition for validation
    static schema = {
        required: ['name', 'description', 'category', 'price', 'rating'],
        properties: {
            id: { type: 'string' },
            name: { type: 'string', minLength: 1 },
            url: { type: 'string' },
            description: { type: 'string', minLength: 1 },
            category: { 
                type: 'string', 
                enum: ['Marknadsföring', 'Assistent', 'Automatisering', 'Bildgenerering', 
                       'Textgenerering', 'Videogenerering', 'Kodning', 'Analys', 'Annat'] 
            },
            price: { 
                type: 'string', 
                enum: ['free', 'freemium', 'paid', 'subscription'] 
            },
            cost: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            tags: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
            imageUrl: { type: 'string' },
            dateAdded: { type: 'string', format: 'date-time' }
        }
    };

    // Factory method to create a new AI Tool
    static create(data) {
        // Default values
        const defaults = {
            id: Date.now().toString(),
            tags: [],
            notes: '',
            dateAdded: new Date().toISOString()
        };

        // Merge with defaults
        const toolData = { ...defaults, ...data };

        // Basic validation
        if (!toolData.name) throw new Error('Name is required');
        if (!toolData.description) throw new Error('Description is required');
        if (!toolData.category) throw new Error('Category is required');
        if (!toolData.price) throw new Error('Price model is required');
        if (!toolData.rating || toolData.rating < 1 || toolData.rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        return toolData;
    }

    // Storage Operations
    static storageKey = 'ai-tools-data';

    // Storage abstraction - supports both localStorage and Firebase
    static async getAll() {
        if (window.FirebaseStorage && window.FirebaseStorage.isEnabled()) {
            return await window.FirebaseStorage.getAll();
        }
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    static async save(tools) {
        if (window.FirebaseStorage && window.FirebaseStorage.isEnabled()) {
            await window.FirebaseStorage.save(tools);
        } else {
            localStorage.setItem(this.storageKey, JSON.stringify(tools));
        }
    }

    static async add(tool) {
        const tools = await this.getAll();
        tools.push(tool);
        await this.save(tools);
        return tool;
    }

    static async update(id, updates) {
        const tools = await this.getAll();
        const index = tools.findIndex(t => t.id === id);

        if (index === -1) {
            throw new Error(`Tool with ID ${id} not found`);
        }

        tools[index] = { ...tools[index], ...updates };
        await this.save(tools);
        return tools[index];
    }

    static async delete(id) {
        const tools = await this.getAll();
        const newTools = tools.filter(t => t.id !== id);

        if (newTools.length === tools.length) {
            throw new Error(`Tool with ID ${id} not found`);
        }

        await this.save(newTools);
        return true;
    }

    static async find(id) {
        const tools = await this.getAll();
        return tools.find(t => t.id === id);
    }

    // Förbättrad filterfunktion med Fuse.js för fuzzy-sökning
    static async filter(criteria) {
        const tools = await this.getAll();
        let filteredTools = [...tools];
        
        // Använd fuzzy-sökning om Fuse.js finns tillgängligt och searchText är specificerat
        if (criteria.searchText && typeof Fuse !== 'undefined') {
            const options = {
                includeScore: true,
                threshold: 0.4, // Mindre värde ger striktare matchning
                keys: [
                    { name: 'name', weight: 2 }, // Namn har högre prioritet
                    { name: 'description', weight: 1.5 },
                    { name: 'notes', weight: 1 },
                    { name: 'tags', weight: 1.3 }
                ]
            };
            
            const fuse = new Fuse(filteredTools, options);
            const results = fuse.search(criteria.searchText);
            filteredTools = results.map(result => result.item);
        }
        // Fallback till enkel sökning om Fuse.js inte är tillgängligt
        else if (criteria.searchText) {
            const searchText = criteria.searchText.toLowerCase();
            filteredTools = filteredTools.filter(tool => {
                return (
                    tool.name.toLowerCase().includes(searchText) ||
                    tool.description.toLowerCase().includes(searchText) ||
                    (tool.notes && tool.notes.toLowerCase().includes(searchText)) ||
                    (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(searchText)))
                );
            });
        }
        
        // Filtrera efter kategori
        if (criteria.category && criteria.category !== 'all') {
            filteredTools = filteredTools.filter(tool => tool.category === criteria.category);
        }
        
        // Filtrera efter prismodell
        if (criteria.price && criteria.price !== 'all') {
            filteredTools = filteredTools.filter(tool => tool.price === criteria.price);
        }
        
        // Filtrera efter betyg
        if (criteria.minRating) {
            filteredTools = filteredTools.filter(tool => tool.rating >= criteria.minRating);
        }
        
        // Sortera resultaten om sortering är specificerad
        if (criteria.sortBy) {
            filteredTools = this.sortTools(filteredTools, criteria.sortBy, criteria.sortDirection);
        }
        
        return filteredTools;
    }
    
    // Ny metod för sortering av verktyg
    static sortTools(tools, sortBy, direction = 'desc') {
        const directionMultiplier = direction === 'asc' ? 1 : -1;
        
        return [...tools].sort((a, b) => {
            switch(sortBy) {
                case 'name':
                    return directionMultiplier * a.name.localeCompare(b.name);
                case 'rating':
                    return directionMultiplier * (a.rating - b.rating);
                case 'date':
                    return directionMultiplier * (new Date(a.dateAdded) - new Date(b.dateAdded));
                case 'category':
                    return directionMultiplier * a.category.localeCompare(b.category);
                case 'price':
                    // Egen sorteringslogik för priser
                    const priceOrder = { free: 1, freemium: 2, paid: 3, subscription: 4 };
                    return directionMultiplier * (priceOrder[a.price] - priceOrder[b.price]);
                default:
                    return directionMultiplier * (new Date(b.dateAdded) - new Date(a.dateAdded));
            }
        });
    }
}

// Configuration
const CONFIG = {
    // Cloudflare Worker URL for metadata scraping
    // Set this to your deployed worker URL, or leave empty to disable
    CLOUDFLARE_WORKER_URL: 'https://metadata-scraper.holmgren100.workers.dev',
    // Enable metadata scraping (set to false if worker not deployed)
    ENABLE_METADATA_SCRAPING: true,

    // OCR.space API key for image text extraction
    // Get free key at: https://ocr.space/ocrapi
    // Free tier: 25,000 requests/month
    OCR_API_KEY: 'K86490861088957',
    // Enable OCR (set to false if no API key)
    ENABLE_OCR: true,

    // Enable automated tagging and categorization
    ENABLE_AUTO_TAGGING: true
};

// Text Analysis Engine for Auto-Tagging
const TextAnalyzer = {
    // Category keywords mapping
    categoryKeywords: {
        'Marknadsföring': ['marketing', 'seo', 'ads', 'campaign', 'social media', 'email marketing', 'analytics', 'conversion', 'marknadsföring', 'annonsering'],
        'Assistent': ['assistant', 'chatbot', 'chat', 'conversation', 'helper', 'support', 'assistent', 'hjälp', 'gpt', 'claude'],
        'Automatisering': ['automation', 'workflow', 'zapier', 'integration', 'automate', 'automatisering', 'arbetsflöde'],
        'Bildgenerering': ['image', 'picture', 'photo', 'visual', 'art', 'design', 'midjourney', 'dall-e', 'stable diffusion', 'bild', 'foto'],
        'Textgenerering': ['text', 'writing', 'content', 'copy', 'writer', 'text', 'skriva', 'innehåll'],
        'Videogenerering': ['video', 'animation', 'film', 'movie', 'video'],
        'Kodning': ['code', 'programming', 'developer', 'github', 'copilot', 'coding', 'kod', 'programmering'],
        'Analys': ['analytics', 'data', 'analysis', 'insights', 'metrics', 'reporting', 'analys', 'data']
    },

    // Pricing model keywords
    pricingKeywords: {
        'free': ['free', 'gratis', 'no cost', 'open source', 'opensource', '0$', '$0'],
        'freemium': ['freemium', 'free trial', 'basic free', 'free tier', 'limited free'],
        'paid': ['paid', 'purchase', 'one-time', 'buy', 'betald', 'köp'],
        'subscription': ['subscription', 'monthly', 'yearly', 'per month', '/month', 'prenumeration', 'månad']
    },

    // Common AI tool tags
    commonTags: {
        'chatbot': ['chat', 'chatbot', 'conversation', 'messaging'],
        'generativ': ['generate', 'generation', 'generative', 'create'],
        'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'],
        'produktivitet': ['productivity', 'efficient', 'workflow', 'produktivitet'],
        'kreativitet': ['creative', 'art', 'design', 'kreativitet', 'kreativ'],
        'business': ['business', 'enterprise', 'commercial', 'företag'],
        'personlig': ['personal', 'individual', 'personlig'],
        'api': ['api', 'integration', 'developer'],
        'no-code': ['no-code', 'no code', 'low-code', 'drag-and-drop']
    },

    /**
     * Analyze text and suggest category
     */
    suggestCategory(text) {
        if (!text) return 'Annat';

        const lowerText = text.toLowerCase();
        const scores = {};

        // Score each category based on keyword matches
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            scores[category] = 0;
            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    scores[category] += 1;
                }
            }
        }

        // Find category with highest score
        let maxScore = 0;
        let bestCategory = 'Annat';

        for (const [category, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }

        return maxScore > 0 ? bestCategory : 'Annat';
    },

    /**
     * Analyze text and suggest pricing model
     */
    suggestPricing(text) {
        if (!text) return 'freemium';

        const lowerText = text.toLowerCase();

        // Check for pricing keywords
        for (const [pricing, keywords] of Object.entries(this.pricingKeywords)) {
            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    return pricing;
                }
            }
        }

        return 'freemium'; // Default
    },

    /**
     * Extract and suggest tags from text
     */
    suggestTags(text) {
        if (!text) return [];

        const lowerText = text.toLowerCase();
        const suggestedTags = [];

        // Check for common tag keywords
        for (const [tag, keywords] of Object.entries(this.commonTags)) {
            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    suggestedTags.push(tag);
                    break; // Only add tag once
                }
            }
        }

        return suggestedTags;
    },

    /**
     * Analyze tool data and return suggestions
     */
    analyze(toolData) {
        const combinedText = `${toolData.name || ''} ${toolData.description || ''} ${toolData.notes || ''}`.toLowerCase();

        return {
            category: this.suggestCategory(combinedText),
            price: this.suggestPricing(combinedText),
            tags: this.suggestTags(combinedText),
            confidence: this.calculateConfidence(combinedText)
        };
    },

    /**
     * Calculate confidence score for suggestions
     */
    calculateConfidence(text) {
        const wordCount = text.split(/\s+/).length;
        if (wordCount < 5) return 'low';
        if (wordCount < 15) return 'medium';
        return 'high';
    }
};

// Main Application Code
document.addEventListener('DOMContentLoaded', async function() {
    // Initial data load
    let toolsData = await AIToolModel.getAll();

    // DOM-element
    const toolForm = document.getElementById('tool-form');
    const toolsList = document.getElementById('tools-list');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resetButton = document.getElementById('reset-search');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const sortBySelect = document.getElementById('sort-by');
    const sortDirectionSelect = document.getElementById('sort-direction');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');

    // Bulk import elements
    const bulkImportBtn = document.getElementById('bulk-import-btn');
    const bulkImportModal = document.getElementById('bulk-import-modal');
    const modalCloseBtn = bulkImportModal.querySelector('.modal-close');
    const modalCancelBtn = bulkImportModal.querySelector('.modal-cancel-btn');
    const bulkTextInput = document.getElementById('bulk-text-input');
    const bulkImageInput = document.getElementById('bulk-image-input');
    const extractUrlsBtn = document.getElementById('extract-urls-btn');
    const importUrlsBtn = document.getElementById('import-urls-btn');
    const extractedUrlsSection = document.getElementById('extracted-urls-section');
    const extractedUrlsList = document.getElementById('extracted-urls-list');
    const urlCount = document.getElementById('url-count');

    // Paginering
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;

    // Aktiva taggfilter
    let activeTagFilters = [];

    // Edit mode tracking
    let editingToolId = null;
    
    // Visa alla verktyg när sidan laddas
    displayTools();

    // AI-förslag knapp
    const autoSuggestBtn = document.getElementById('auto-suggest-btn');
    if (autoSuggestBtn && CONFIG.ENABLE_AUTO_TAGGING) {
        autoSuggestBtn.addEventListener('click', function() {
            const name = document.getElementById('tool-name').value;
            const description = document.getElementById('tool-description').value;
            const notes = document.getElementById('tool-notes').value;

            if (!name && !description) {
                showNotification('Fyll i namn och/eller beskrivning först för att få AI-förslag.', 'warning');
                return;
            }

            // Analyze the text
            const analysis = TextAnalyzer.analyze({ name, description, notes });

            // Apply suggestions
            document.getElementById('tool-category').value = analysis.category;
            document.getElementById('tool-price').value = analysis.price;

            // Add suggested tags to checkboxes
            const predefinedTags = ['marknadsföring', 'assistent', 'automatisering', 'text', 'bild', 'video', 'kod', 'analys'];
            analysis.tags.forEach(tag => {
                const tagLower = tag.toLowerCase();
                if (predefinedTags.includes(tagLower)) {
                    const checkbox = document.querySelector(`.checkbox-group input[value="${tagLower}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                }
            });

            // Add other tags to custom tags field
            const customTags = analysis.tags.filter(tag => !predefinedTags.includes(tag.toLowerCase()));
            const existingCustomTags = document.getElementById('custom-tags').value;
            const allCustomTags = existingCustomTags ?
                [...existingCustomTags.split(',').map(t => t.trim()), ...customTags] :
                customTags;
            document.getElementById('custom-tags').value = [...new Set(allCustomTags)].join(', ');

            showNotification(`AI-förslag tillämpade! Kategori: ${analysis.category}, Pris: ${analysis.price}, Taggar: ${analysis.tags.length}`, 'success');
        });
    }

    // Hantera formulärinskickning
    toolForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Hämta taggar från checkboxes
        const tagCheckboxes = document.querySelectorAll('.checkbox-group input:checked');
        const tags = Array.from(tagCheckboxes).map(cb => cb.value);

        // Hämta egna taggar och lägg till dem
        const customTags = document.getElementById('custom-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');

        tags.push(...customTags);

        try {
            const toolData = {
                name: document.getElementById('tool-name').value,
                url: document.getElementById('tool-url').value,
                description: document.getElementById('tool-description').value,
                category: document.getElementById('tool-category').value,
                price: document.getElementById('tool-price').value,
                cost: document.getElementById('tool-cost').value,
                rating: parseInt(document.getElementById('tool-rating').value),
                tags: tags,
                notes: document.getElementById('tool-notes').value
            };

            if (editingToolId) {
                // Uppdatera befintligt verktyg
                AIToolModel.update(editingToolId, toolData);
                showNotification(`${toolData.name} har uppdaterats!`, 'success');
                exitEditMode();
            } else {
                // Skapa nytt verktyg
                const tool = AIToolModel.create(toolData);
                AIToolModel.add(tool);
                showNotification(`${toolData.name} har lagts till!`, 'success');
            }

            // Uppdatera den lokala listan
            toolsData = await AIToolModel.getAll();

            // Uppdatera visningen
            displayTools();

            // Återställ formuläret
            toolForm.reset();

            // Rensa alla checkboxes
            document.querySelectorAll('.checkbox-group input').forEach(cb => {
                cb.checked = false;
            });
        } catch (error) {
            showNotification('Fel vid skapande av verktyg: ' + error.message, 'error');
        }
    });
    
    // Hantera sökningar
    searchButton.addEventListener('click', function() {
        resetPagination();
        displayTools();
    });
    
    // När Enter trycks i sökfältet
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            resetPagination();
            displayTools();
            e.preventDefault();
        }
    });
    
    resetButton.addEventListener('click', function() {
        searchInput.value = '';
        categoryFilter.value = 'all';
        priceFilter.value = 'all';
        ratingFilter.value = 'all';
        resetPagination();
        displayTools();
    });
    
    // Filter-ändringar
    categoryFilter.addEventListener('change', function() {
        resetPagination();
        displayTools();
    });
    
    priceFilter.addEventListener('change', function() {
        resetPagination();
        displayTools();
    });
    
    ratingFilter.addEventListener('change', function() {
        resetPagination();
        displayTools();
    });
    
    // Sorteringsändringar
    sortBySelect.addEventListener('change', function() {
        resetPagination();
        displayTools();
    });
    
    sortDirectionSelect.addEventListener('change', function() {
        resetPagination();
        displayTools();
    });
    
    // Exportera data
    exportDataBtn.addEventListener('click', function() {
        const dataStr = JSON.stringify(toolsData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-tools-export-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Datan har exporterats till en fil!', 'success');
    });
    
    // Importera data
    importDataBtn.addEventListener('click', function() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);

                    if (Array.isArray(importedData)) {
                        // Fråga användaren hur importen ska hanteras
                        const importAction = confirm('Vill du ersätta befintlig data (OK) eller lägga till den nya datan (Avbryt)?');

                        if (importAction) {
                            // Ersätt befintlig data
                            await AIToolModel.save(importedData);
                        } else {
                            // Lägg till ny data
                            const currentTools = await AIToolModel.getAll();
                            await AIToolModel.save([...currentTools, ...importedData]);
                        }

                        // Uppdatera den lokala listan
                        toolsData = await AIToolModel.getAll();
                        // Uppdatera visningen
                        resetPagination();
                        displayTools();
                        showNotification(`Import slutförd! ${importedData.length} verktyg har importerats.`, 'success');
                    } else {
                        showNotification('Ogiltig filformat. Filen måste innehålla en JSON-array.', 'error');
                    }
                } catch (err) {
                    showNotification('Fel vid importering: ' + err.message, 'error');
                }
            };
            
            reader.readAsText(file);
        } else {
            showNotification('Vänligen välj en fil att importera.', 'info');
        }
    });

    // Bulk Import Modal funktionalitet
    bulkImportBtn.addEventListener('click', function() {
        bulkImportModal.classList.add('active');
        bulkImportModal.setAttribute('aria-hidden', 'false');
        bulkTextInput.focus();
    });

    modalCloseBtn.addEventListener('click', closeBulkImportModal);
    modalCancelBtn.addEventListener('click', closeBulkImportModal);

    // Stäng modal vid klick utanför
    bulkImportModal.addEventListener('click', function(e) {
        if (e.target === bulkImportModal) {
            closeBulkImportModal();
        }
    });

    function closeBulkImportModal() {
        bulkImportModal.classList.remove('active');
        bulkImportModal.setAttribute('aria-hidden', 'true');
        // Återställ modal
        bulkTextInput.value = '';
        extractedUrlsSection.style.display = 'none';
        extractedUrlsList.innerHTML = '';
        importUrlsBtn.style.display = 'none';
        extractUrlsBtn.style.display = 'inline-flex';
    }

    // Hantera bilduppladdning för OCR
    bulkImageInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!CONFIG.ENABLE_OCR || !CONFIG.OCR_API_KEY) {
            showNotification('OCR är inte aktiverat. Lägg till API-nyckel i CONFIG för att aktivera bildextrahering.', 'warning');
            bulkImageInput.value = '';
            return;
        }

        // Visa laddningsmeddelande
        extractUrlsBtn.textContent = 'Extraherar text från bild...';
        extractUrlsBtn.disabled = true;

        try {
            const extractedText = await performOCR(file);

            if (extractedText) {
                // Sätt extraherad text i textfältet
                bulkTextInput.value = extractedText;
                showNotification('Text extraherad från bild! Klicka på "Extrahera URL:er" för att fortsätta.', 'success');
            } else {
                showNotification('Ingen text kunde extraheras från bilden.', 'warning');
            }
        } catch (error) {
            console.error('OCR error:', error);
            showNotification('Fel vid textextrahering: ' + error.message, 'error');
        } finally {
            extractUrlsBtn.textContent = 'Extrahera URL:er';
            extractUrlsBtn.disabled = false;
            bulkImageInput.value = '';
        }
    });

    // Extrahera URL:er från text
    extractUrlsBtn.addEventListener('click', function() {
        const text = bulkTextInput.value.trim();

        if (!text) {
            showNotification('Vänligen klistra in text med URL:er eller ladda upp en bild.', 'warning');
            return;
        }

        const urls = extractURLsFromText(text);

        if (urls.length === 0) {
            showNotification('Inga URL:er hittades i texten.', 'warning');
            return;
        }

        displayExtractedURLs(urls);
        showNotification(`${urls.length} URL:er extraherade!`, 'success');
    });

    // Funktion för att extrahera URL:er från text
    function extractURLsFromText(text) {
        // Regex för att hitta URL:er (inkluderar http, https, och www)
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
        const matches = text.match(urlRegex) || [];

        // Rensa och deduplicera URL:er
        const urls = matches.map(url => {
            // Lägg till https:// om URL börjar med www
            if (url.startsWith('www.')) {
                url = 'https://' + url;
            }
            // Ta bort avslutande punkter, komma etc
            url = url.replace(/[.,;:!?)]+$/, '');
            return url;
        });

        // Deduplicera och sortera
        return [...new Set(urls)].sort();
    }

    // Visa extraherade URL:er
    function displayExtractedURLs(urls) {
        extractedUrlsList.innerHTML = '';
        urlCount.textContent = urls.length;

        urls.forEach((url, index) => {
            const urlItem = document.createElement('div');
            urlItem.className = 'url-item';

            // Extrahera domän för visning
            let domain = '';
            try {
                domain = new URL(url).hostname;
            } catch (e) {
                domain = url;
            }

            urlItem.innerHTML = `
                <input type="checkbox" id="url-${index}" value="${url}" checked aria-label="Välj ${url}">
                <div class="url-item-content">
                    <a href="${url}" target="_blank" class="url-item-link" rel="noopener noreferrer">${url}</a>
                    <div class="url-item-domain">${domain}</div>
                </div>
            `;

            extractedUrlsList.appendChild(urlItem);
        });

        extractedUrlsSection.style.display = 'block';
        extractUrlsBtn.style.display = 'none';
        importUrlsBtn.style.display = 'inline-flex';
    }

    // Hämta metadata från Cloudflare Worker
    async function fetchMetadata(url) {
        if (!CONFIG.ENABLE_METADATA_SCRAPING || !CONFIG.CLOUDFLARE_WORKER_URL) {
            return null;
        }

        try {
            const response = await fetch(CONFIG.CLOUDFLARE_WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url }),
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });

            if (!response.ok) {
                console.error('Metadata fetch failed:', response.status);
                return null;
            }

            const metadata = await response.json();
            return metadata;
        } catch (error) {
            console.error('Error fetching metadata:', error);
            return null;
        }
    }

    // Utför OCR på en bild med OCR.space API
    async function performOCR(imageFile) {
        if (!CONFIG.ENABLE_OCR || !CONFIG.OCR_API_KEY) {
            return null;
        }

        try {
            // Skapa FormData för bilduppladdning
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('apikey', CONFIG.OCR_API_KEY);
            formData.append('language', 'eng');
            formData.append('isOverlayRequired', 'false');
            formData.append('detectOrientation', 'true');
            formData.append('scale', 'true');
            formData.append('OCREngine', '2'); // Engine 2 is more accurate

            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(30000) // 30 second timeout for OCR
            });

            if (!response.ok) {
                throw new Error(`OCR API returned ${response.status}`);
            }

            const result = await response.json();

            if (result.IsErroredOnProcessing) {
                throw new Error(result.ErrorMessage || 'OCR processing failed');
            }

            if (!result.ParsedResults || result.ParsedResults.length === 0) {
                return '';
            }

            // Extrahera text från alla sidor/resultat
            const extractedText = result.ParsedResults
                .map(page => page.ParsedText)
                .join('\n')
                .trim();

            return extractedText;

        } catch (error) {
            console.error('OCR error:', error);
            throw new Error('Kunde inte extrahera text från bild: ' + error.message);
        }
    }

    // Importera valda URL:er
    importUrlsBtn.addEventListener('click', async function() {
        const checkedCheckboxes = extractedUrlsList.querySelectorAll('input[type="checkbox"]:checked');
        const selectedUrls = Array.from(checkedCheckboxes).map(cb => cb.value);

        if (selectedUrls.length === 0) {
            showNotification('Välj minst en URL att importera.', 'warning');
            return;
        }

        // Visa laddningsindikator
        importUrlsBtn.textContent = `Importerar 0/${selectedUrls.length}...`;
        importUrlsBtn.disabled = true;

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < selectedUrls.length; i++) {
            const url = selectedUrls[i];
            try {
                // Update progress
                importUrlsBtn.textContent = `Importerar ${i + 1}/${selectedUrls.length}...`;

                const urlObj = new URL(url);
                let toolName = urlObj.hostname.replace('www.', '');
                let description = `AI-verktyg från ${urlObj.hostname}`;
                let imageUrl = '';

                // Försök hämta metadata från Cloudflare Worker
                if (CONFIG.ENABLE_METADATA_SCRAPING) {
                    const metadata = await fetchMetadata(url);
                    if (metadata) {
                        toolName = metadata.title || toolName;
                        description = metadata.description || description;
                        imageUrl = metadata.image || metadata.icon || '';
                    }
                }

                // Use AI text analysis to suggest category, pricing, and tags
                let suggestedCategory = 'Annat';
                let suggestedPrice = 'freemium';
                let suggestedTags = ['importerad'];

                if (CONFIG.ENABLE_AUTO_TAGGING) {
                    const analysis = TextAnalyzer.analyze({
                        name: toolName,
                        description: description,
                        notes: ''
                    });

                    suggestedCategory = analysis.category;
                    suggestedPrice = analysis.price;
                    suggestedTags = ['importerad', ...analysis.tags];
                }

                const tool = AIToolModel.create({
                    name: toolName,
                    url: url,
                    description: description,
                    category: suggestedCategory,
                    price: suggestedPrice,
                    rating: 3,
                    tags: suggestedTags,
                    notes: CONFIG.ENABLE_AUTO_TAGGING ?
                        'Importerad via massimport med automatisk kategorisering och taggning.' :
                        'Importerad via massimport. Uppdatera information manuellt.',
                    imageUrl: imageUrl
                });

                AIToolModel.add(tool);
                successCount++;
            } catch (error) {
                console.error('Fel vid import av URL:', url, error);
                errorCount++;
            }
        }

        // Uppdatera lokal data och visning
        toolsData = AIToolModel.getAll();
        displayTools();

        // Återställ knapp
        importUrlsBtn.textContent = 'Importera valda URL:er';
        importUrlsBtn.disabled = false;

        // Visa resultat
        if (successCount > 0) {
            const message = CONFIG.ENABLE_METADATA_SCRAPING ?
                `${successCount} verktyg importerade med metadata! ${errorCount > 0 ? `(${errorCount} misslyckades)` : ''}` :
                `${successCount} verktyg importerade! ${errorCount > 0 ? `(${errorCount} misslyckades)` : ''}\n\nTips: Aktivera Cloudflare Worker för automatisk metadata-extrahering.`;
            showNotification(message, 'success');
        } else {
            showNotification('Ingen import lyckades.', 'error');
        }

        // Stäng modal
        closeBulkImportModal();
    });

    // Funktion för att visa notifikationer
    function showNotification(message, type = 'info') {
        // Ta bort eventuella existerande notifikationer
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Skapa notifikationselement
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        notification.style.maxWidth = '300px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.fontWeight = '500';
        notification.style.animation = 'fadeIn 0.3s, fadeOut 0.3s 2.7s forwards';
        
        // Färger baserade på typ
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#2ecc71';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#e74c3c';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f39c12';
                notification.style.color = 'white';
                break;
            default: // info
                notification.style.backgroundColor = '#3498db';
                notification.style.color = 'white';
                break;
        }
        
        // Lägg till i DOM
        document.body.appendChild(notification);
        
        // Lägg till CSS för animation
        if (!document.getElementById('notification-style')) {
            const style = document.createElement('style');
            style.id = 'notification-style';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Ta bort notifikationen efter 3 sekunder
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Hämta alla unika taggar
    function getAllUniqueTags() {
        const allTags = new Set();
        toolsData.forEach(tool => {
            if (tool.tags && Array.isArray(tool.tags)) {
                tool.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags).sort();
    }

    // Återställa paginering
    function resetPagination() {
        currentPage = 1;
    }
    
    // Funktion för att visa verktyg med filtrering
    async function displayTools() {
        // Hämta filtervärden
        const searchText = searchInput.value;
        const categoryFilterValue = categoryFilter.value;
        const priceFilterValue = priceFilter.value;
        const ratingFilterValue = parseInt(ratingFilter.value) || 0;
        const sortBy = sortBySelect.value;
        const sortDirection = sortDirectionSelect.value;

        // Debounce för sökningen
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(async () => {
            // Använd datamodellen för filtrering och sortering
            let filteredTools = await AIToolModel.filter({
                searchText: searchText || undefined,
                category: categoryFilterValue,
                price: priceFilterValue,
                minRating: ratingFilterValue || undefined,
                sortBy: sortBy,
                sortDirection: sortDirection
            });
            
            // Tillämpa taggfilter om det finns aktiva
            if (activeTagFilters.length > 0) {
                filteredTools = filteredTools.filter(tool => {
                    if (!tool.tags || !Array.isArray(tool.tags)) return false;
                    return activeTagFilters.every(filterTag => 
                        tool.tags.some(toolTag => 
                            toolTag.toLowerCase() === filterTag.toLowerCase()
                        )
                    );
                });
            }
            
            // Rensa listan
            toolsList.innerHTML = '';
            
            // Visa filterderade verktyg
            if (filteredTools.length === 0) {
                toolsList.innerHTML = '<div class="no-results">Inga verktyg hittades med de valda filtren.</div>';
                return;
            }
            
            // Implementera paginering för större datamängder
            const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredTools.length);
            const pageTools = filteredTools.slice(startIndex, endIndex);
            
            // Uppdatera sökresultatstatistik
            updateSearchStats(filteredTools.length, toolsData.length, currentPage, totalPages);
            
            // Visa verktyg
            pageTools.forEach(tool => {
                const toolCard = document.createElement('div');
                toolCard.className = 'tool-card';
                toolCard.setAttribute('role', 'listitem');
                
                // Hämta prisinformation
                let priceText = '';
                switch(tool.price) {
                    case 'free': priceText = 'Gratis'; break;
                    case 'freemium': priceText = 'Freemium'; break;
                    case 'paid': priceText = 'Betald'; break;
                    case 'subscription': priceText = 'Prenumeration'; break;
                }
                if (tool.cost) {
                    priceText += ` (${tool.cost})`;
                }
                
                // Skapa taggar-HTML
                const tagsHtml = (tool.tags || []).map(tag => {
                    // Definiera CSS-klasser för specifika taggar
                    let tagClass = '';
                    if (['marknadsföring', 'assistenter', 'automatisering', 'text', 'bild', 'video', 'kod', 'analys'].includes(tag)) {
                        tagClass = `tag-${tag}`;
                    }
                    
                    return `<span class="tool-tag ${tagClass}">${tag}</span>`;
                }).join('');
                
                toolCard.innerHTML = `
                    <div class="tool-header">
                        <h3 class="tool-title">${tool.name}</h3>
                        <div class="tool-rating" aria-label="${tool.rating} av 5 stjärnor">${'★'.repeat(tool.rating)}</div>
                    </div>
                    <div class="tool-category">${tool.category}</div>
                    <div class="tool-price">${priceText}</div>
                    ${tool.url ? `<div class="tool-url"><a href="${tool.url}" target="_blank" aria-label="Besök ${tool.name} webbplats">${tool.url}</a></div>` : ''}
                    <div class="tool-description">${tool.description}</div>
                    ${tool.notes ? `<div class="tool-notes"><strong>Anteckningar:</strong> ${tool.notes}</div>` : ''}
                    <div class="tool-tags">${tagsHtml}</div>
                    <div class="tool-actions">
                        <button class="edit-tool" data-id="${tool.id}" aria-label="Redigera ${tool.name}">Redigera</button>
                        <button class="delete-tool" data-id="${tool.id}" aria-label="Ta bort ${tool.name}">Ta bort</button>
                    </div>
                `;
                
                // Lägg till knapphändelser
                const editBtn = toolCard.querySelector('.edit-tool');
                const deleteBtn = toolCard.querySelector('.delete-tool');
                
                editBtn.addEventListener('click', function() {
                    const toolId = this.getAttribute('data-id');
                    editTool(toolId);
                });
                
                deleteBtn.addEventListener('click', async function() {
                    const toolId = this.getAttribute('data-id');
                    const toolToDelete = await AIToolModel.find(toolId);

                    if (confirm(`Är du säker på att du vill ta bort "${toolToDelete.name}"?`)) {
                        try {
                            await AIToolModel.delete(toolId);
                            // Uppdatera den lokala listan
                            toolsData = await AIToolModel.getAll();
                            displayTools();
                            showNotification(`"${toolToDelete.name}" har tagits bort.`, 'info');
                        } catch (error) {
                            showNotification('Fel vid borttagning: ' + error.message, 'error');
                        }
                    }
                });
                
                toolsList.appendChild(toolCard);
            });
            
            // Visa paginering om det finns fler sidor
            if (totalPages > 1) {
                displayPagination(currentPage, totalPages);
            }
        }, 300); // 300ms debounce för bättre prestanda
    }
    
    // Funktion för att visa paginering
    function displayPagination(current, total) {
        // Ta bort befintlig paginering om den finns
        const existingPagination = document.querySelector('.pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        paginationContainer.setAttribute('role', 'navigation');
        paginationContainer.setAttribute('aria-label', 'Sidnavigering');
        
        // Föregående sida
        if (current > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'pagination-button';
            prevButton.textContent = '« Föregående';
            prevButton.addEventListener('click', () => {
                currentPage--;
                displayTools();
                // Scrolla till toppen av listan
                toolsList.scrollIntoView({ behavior: 'smooth' });
            });
            paginationContainer.appendChild(prevButton);
        }
        
        // Sidnummer
        const pageInfo = document.createElement('span');
        pageInfo.className = 'pagination-info';
        pageInfo.textContent = `Sida ${current} av ${total}`;
        paginationContainer.appendChild(pageInfo);
        
        // Nästa sida
        if (current < total) {
            const nextButton = document.createElement('button');
            nextButton.className = 'pagination-button';
            nextButton.textContent = 'Nästa »';
            nextButton.addEventListener('click', () => {
                currentPage++;
                displayTools();
                // Scrolla till toppen av listan
                toolsList.scrollIntoView({ behavior: 'smooth' });
            });
            paginationContainer.appendChild(nextButton);
        }
        
        toolsList.parentElement.appendChild(paginationContainer);
    }

    // Uppdatera sökstatistik
    function updateSearchStats(filteredCount, totalCount, currentPage, totalPages) {
        // Ta bort befintlig statistikruta om den finns
        const existingStats = document.querySelector('.search-stats');
        if (existingStats) {
            existingStats.remove();
        }
        
        // Skapa statistikruta
        const statsDiv = document.createElement('div');
        statsDiv.className = 'search-stats';
        
        if (filteredCount < totalCount) {
            statsDiv.textContent = `Visar ${filteredCount} av ${totalCount} verktyg`;
            
            // Lägg till paginering om det behövs
            if (totalPages > 1) {
                statsDiv.textContent += ` (Sida ${currentPage} av ${totalPages})`;
            }
        } else {
            statsDiv.textContent = `Totalt ${totalCount} verktyg`;
            
            // Lägg till paginering om det behövs
            if (totalPages > 1) {
                statsDiv.textContent += ` (Sida ${currentPage} av ${totalPages})`;
            }
        }
        
        statsDiv.style.textAlign = 'right';
        statsDiv.style.fontSize = '14px';
        statsDiv.style.color = '#666';
        statsDiv.style.marginBottom = '10px';
        
        // Lägg till i DOM före verktygsrutnätet
        toolsList.parentElement.insertBefore(statsDiv, toolsList);
    }
    
    // Funktion för att redigera ett verktyg
    async function editTool(id) {
        const tool = await AIToolModel.find(id);

        if (!tool) {
            showNotification('Verktyget kunde inte hittas!', 'error');
            return;
        }

        // Sätt redigeringsläge
        editingToolId = id;

        // Uppdatera formulärrubriken
        const formHeading = document.getElementById('form-heading');
        formHeading.textContent = 'Redigera AI-verktyg';

        // Fyll i formuläret med verktygsdata
        document.getElementById('tool-name').value = tool.name || '';
        document.getElementById('tool-url').value = tool.url || '';
        document.getElementById('tool-description').value = tool.description || '';
        document.getElementById('tool-category').value = tool.category || '';
        document.getElementById('tool-price').value = tool.price || '';
        document.getElementById('tool-cost').value = tool.cost || '';
        document.getElementById('tool-rating').value = tool.rating || 5;
        document.getElementById('tool-notes').value = tool.notes || '';

        // Hantera taggar
        if (tool.tags && Array.isArray(tool.tags)) {
            // Rensa alla checkboxes först
            document.querySelectorAll('.checkbox-group input').forEach(cb => {
                cb.checked = false;
            });

            // Separera fördefinierade taggar och egna taggar
            const predefinedTags = ['marknadsföring', 'assistent', 'automatisering', 'text', 'bild', 'video', 'kod', 'analys'];
            const customTagsList = [];

            tool.tags.forEach(tag => {
                const tagLower = tag.toLowerCase();
                if (predefinedTags.includes(tagLower)) {
                    // Kryssa i checkboxen
                    const checkbox = document.querySelector(`.checkbox-group input[value="${tagLower}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                } else {
                    // Lägg till i egna taggar
                    customTagsList.push(tag);
                }
            });

            // Fyll i egna taggar
            document.getElementById('custom-tags').value = customTagsList.join(', ');
        }

        // Lägg till avbryt-knapp om den inte redan finns
        if (!document.getElementById('cancel-edit-btn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancel-edit-btn';
            cancelBtn.textContent = 'Avbryt';
            cancelBtn.style.marginLeft = '10px';
            cancelBtn.style.backgroundColor = '#95a5a6';
            cancelBtn.addEventListener('click', exitEditMode);

            const submitBtn = toolForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Uppdatera verktyg';
            submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
        }

        // Scrolla till formuläret
        toolForm.scrollIntoView({ behavior: 'smooth', block: 'start' });

        showNotification('Redigerar verktyg: ' + tool.name, 'info');
    }

    // Funktion för att avsluta redigeringsläge
    function exitEditMode() {
        editingToolId = null;

        // Återställ formulärrubriken
        const formHeading = document.getElementById('form-heading');
        formHeading.textContent = 'Lägg till AI-verktyg';

        // Ta bort avbryt-knappen
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.remove();
        }

        // Återställ submit-knappen
        const submitBtn = toolForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Lägg till verktyg';

        // Rensa formuläret
        toolForm.reset();
        document.querySelectorAll('.checkbox-group input').forEach(cb => {
            cb.checked = false;
        });
    }
    
    // Lägg till exempelverktyg om listan är tom
    if (toolsData.length === 0) {
        const exampleTools = [
            {
                id: "example1",
                name: "ChatGPT",
                url: "https://chat.openai.com",
                description: "Generativ AI-chatbot som kan svara på frågor, skriva text, och hjälpa med olika uppgifter.",
                category: "Assistent",
                price: "freemium",
                cost: "Gratis / $20/månad för Plus",
                rating: 5,
                tags: ["assistent", "text", "openai", "chatbot"],
                notes: "Mycket bra för textgenerering, research och idégenerering. Plus-versionen ger tillgång till GPT-4.",
                dateAdded: new Date().toISOString()
            },
            {
                id: "example2",
                name: "Midjourney",
                url: "https://www.midjourney.com",
                description: "AI-verktyg för att generera bilder från textbeskrivningar.",
                category: "Bildgenerering",
                price: "subscription",
                cost: "$10-30/månad beroende på plan",
                rating: 4,
                tags: ["bild", "kreativitet", "design"],
                notes: "Mycket bra bildkvalitet. Kräver Discord-konto för att använda.",
                dateAdded: new Date().toISOString()
            },
            {
                id: "example3",
                name: "Claude",
                url: "https://claude.ai",
                description: "Avancerad AI-assistent från Anthropic med starka förmågor inom konversation och analys.",
                category: "Assistent",
                price: "freemium",
                cost: "Gratis / $20/månad för Pro",
                rating: 5,
                tags: ["assistent", "text", "anthropic"],
                notes: "Mycket bra för längre konversationer och analyser. Har förmåga att hantera dokument.",
                dateAdded: new Date().toISOString()
            }
        ];
        
        // Spara exempelverktyg med den nya datamodellen
        AIToolModel.save(exampleTools);
        // Uppdatera den lokala listan
        toolsData = AIToolModel.getAll();
        displayTools();
    }

    // UI-förbättringar
    function setupFocusHandling() {
        // När ett verktyg läggs till, fokusera på ett lämpligt element
        document.getElementById('tool-form').addEventListener('submit', function() {
            // Efter formuläret skickas in och återställs, fokusera på namn-fältet
            setTimeout(() => {
                document.getElementById('tool-name').focus();
            }, 100);
        });
        
        // Förbättrad tangentbordsnavigation för filter
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('keydown', function(e) {
                // Om användaren trycker på Enter efter att ha valt ett filter, utför filtrering
                if (e.key === 'Enter') {
                    displayTools();
                }
            });
        });

        // Förbättrad sökfunktion med Enter-tangent
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                searchButton.click();
                e.preventDefault();
            }
        });
    }

    // Lägg till tooltips för bättre UX
    function addTooltips() {
        const elements = [
            { id: 'export-data', text: 'Exportera dina AI-verktyg till en JSON-fil för backup eller delning' },
            { id: 'import-data', text: 'Importera AI-verktyg från en tidigare exporterad JSON-fil' },
            { id: 'search-button', text: 'Sök bland dina sparade AI-verktyg' },
            { id: 'reset-search', text: 'Återställ alla filter och sökresultat' }
        ];
        
        elements.forEach(el => {
            const element = document.getElementById(el.id);
            if (element) {
                element.setAttribute('title', el.text);
            }
        });
    }

    // Förbättrad felhantering i formulär
    function enhanceFormValidation() {
        const form = document.getElementById('tool-form');
        
        // Visa valideringsmeddelanden direkt vid inmatning
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('invalid', function(e) {
                // Förhindra standardpopup
                e.preventDefault();
                
                // Anpassa valideringsmeddelanden
                if (field.validity.valueMissing) {
                    this.setCustomValidity('Detta fält är obligatoriskt');
                } else if (field.validity.typeMismatch && field.type === 'url') {
                    this.setCustomValidity('Ange en giltig URL (t.ex. https://exempel.se)');
                } else {
                    this.setCustomValidity('');
                }
                
                // Visuell indikation
                field.style.borderColor = '#e74c3c';
                
                // Visa meddelande
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = this.validationMessage;
                errorElement.style.color = '#e74c3c';
                errorElement.style.fontSize = '12px';
                errorElement.style.marginTop = '5px';
                
                // Ta bort tidigare felmeddelanden
                const existingError = field.parentElement.querySelector('.error-message');
                if (existingError) {
                    field.parentElement.removeChild(existingError);
                }
                
                field.parentElement.appendChild(errorElement);
                
                // Återställ valideringen så den kan utlösas igen
                setTimeout(() => this.setCustomValidity(''), 0);
            });
            
            field.addEventListener('input', function() {
                // Återställ visuell indikation
                this.style.borderColor = '';
                
                // Ta bort felmeddelande
                const errorElement = this.parentElement.querySelector('.error-message');
                if (errorElement) {
                    this.parentElement.removeChild(errorElement);
                }
            });
        });
        
        // Förbättra visningen vid formulärsändning
        form.addEventListener('submit', function() {
            // Lägg till en visuell indikation för att visa att formuläret skickas
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sparar...';
            
            // Återställ knappen efter en kort stund
            setTimeout(() => {
                submitButton.textContent = originalText;
            }, 500);
        });
    }

    // Förbättrad verktygsvisning
    function enhanceToolDisplay() {
        // Om det inte finns några verktyg, visa ett meddelande
        if (toolsData.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'Inga AI-verktyg har lagts till ännu. Använd formuläret till vänster för att lägga till ditt första verktyg.';
            toolsList.appendChild(noResults);
        }
        
        // Lägg till animation när ett nytt verktyg läggs till
        document.getElementById('tool-form').addEventListener('submit', function() {
            setTimeout(() => {
                const newTool = document.querySelector('.tool-card:first-child');
                if (newTool) {
                    newTool.style.animation = 'highlightNew 2s ease-out';
                }
            }, 100);
        });
        
        // Lägg till CSS för animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes highlightNew {
                0% { background-color: #fff9c4; }
                100% { background-color: white; }
            }

            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-top: 20px;
                gap: 15px;
            }
            
            .pagination-button {
                padding: 8px 15px;
                border-radius: 4px;
                background-color: #f1f1f1;
                border: none;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .pagination-button:hover {
                background-color: #3498db;
                color: white;
            }
            
            .pagination-info {
                font-size: 14px;
                color: #666;
            }

            .sort-section {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }
            
            .sort-group {
                display: flex;
                align-items: center;
                gap: 5px;
                background: #f1f1f1;
                padding: 5px 10px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .sort-group:hover {
                background: #e9ecef;
            }
            
            .sort-label {
                font-weight: bold;
                font-size: 14px;
            }
            
            .sort-select {
                width: auto;
                padding: 5px;
            }
            
            /* Anpassning för mobila enheter */
            @media (max-width: 768px) {
                .sort-section {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .sort-group {
                    width: 100%;
                    justify-content: space-between;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Aktivera alla UI-förbättringar
    setupFocusHandling();
    addTooltips();
    enhanceFormValidation();
    enhanceToolDisplay();
});