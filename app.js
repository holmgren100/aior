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

    static getAll() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    static save(tools) {
        localStorage.setItem(this.storageKey, JSON.stringify(tools));
    }

    static add(tool) {
        const tools = this.getAll();
        tools.push(tool);
        this.save(tools);
        return tool;
    }

    static update(id, updates) {
        const tools = this.getAll();
        const index = tools.findIndex(t => t.id === id);
        
        if (index === -1) {
            throw new Error(`Tool with ID ${id} not found`);
        }
        
        tools[index] = { ...tools[index], ...updates };
        this.save(tools);
        return tools[index];
    }

    static delete(id) {
        const tools = this.getAll();
        const newTools = tools.filter(t => t.id !== id);
        
        if (newTools.length === tools.length) {
            throw new Error(`Tool with ID ${id} not found`);
        }
        
        this.save(newTools);
        return true;
    }

    static find(id) {
        const tools = this.getAll();
        return tools.find(t => t.id === id);
    }

    static filter(criteria) {
        const tools = this.getAll();
        
        return tools.filter(tool => {
            // Search text match
            if (criteria.searchText) {
                const searchText = criteria.searchText.toLowerCase();
                const matchesSearch = 
                    tool.name.toLowerCase().includes(searchText) ||
                    tool.description.toLowerCase().includes(searchText) ||
                    (tool.notes && tool.notes.toLowerCase().includes(searchText)) ||
                    (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(searchText)));
                
                if (!matchesSearch) return false;
            }
            
            // Category filter
            if (criteria.category && criteria.category !== 'all' && tool.category !== criteria.category) {
                return false;
            }
            
            // Price filter
            if (criteria.price && criteria.price !== 'all' && tool.price !== criteria.price) {
                return false;
            }
            
            // Rating filter
            if (criteria.minRating && tool.rating < criteria.minRating) {
                return false;
            }
            
            return true;
        });
    }
}

// Uppdatera existerande kod för att använda den nya datamodellen
document.addEventListener('DOMContentLoaded', function() {
    // Initial data load
    let toolsData = AIToolModel.getAll();
    
    // DOM-element
    const toolForm = document.getElementById('tool-form');
    const toolsList = document.getElementById('tools-list');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resetButton = document.getElementById('reset-search');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    
    // Visa alla verktyg när sidan laddas
    displayTools();
    
    // Hantera formulärinskickning
    toolForm.addEventListener('submit', function(e) {
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
            // Skapa ett verktyg med vår datamodell
            const tool = AIToolModel.create({
                name: document.getElementById('tool-name').value,
                url: document.getElementById('tool-url').value,
                description: document.getElementById('tool-description').value,
                category: document.getElementById('tool-category').value,
                price: document.getElementById('tool-price').value,
                cost: document.getElementById('tool-cost').value,
                rating: parseInt(document.getElementById('tool-rating').value),
                tags: tags,
                notes: document.getElementById('tool-notes').value
            });
            
            // Lägg till verktyget med vår datamodell
            AIToolModel.add(tool);
            
            // Uppdatera den lokala listan
            toolsData = AIToolModel.getAll();
            
            // Uppdatera visningen
            displayTools();
            
            // Återställ formuläret
            toolForm.reset();
            
            // Rensa alla checkboxes
            document.querySelectorAll('.checkbox-group input').forEach(cb => {
                cb.checked = false;
            });
        } catch (error) {
            alert('Fel vid skapande av verktyg: ' + error.message);
        }
    });
    
    // Hantera sökningar
    searchButton.addEventListener('click', function() {
        displayTools();
    });
    
    resetButton.addEventListener('click', function() {
        searchInput.value = '';
        categoryFilter.value = 'all';
        priceFilter.value = 'all';
        ratingFilter.value = 'all';
        displayTools();
    });
    
    // Filter-ändringar
    categoryFilter.addEventListener('change', displayTools);
    priceFilter.addEventListener('change', displayTools);
    ratingFilter.addEventListener('change', displayTools);
    
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
    });
    
    // Importera data
    importDataBtn.addEventListener('click', function() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (Array.isArray(importedData)) {
                        // Fråga användaren hur importen ska hanteras
                        const importAction = confirm('Vill du ersätta befintlig data (OK) eller lägga till den nya datan (Avbryt)?');
                        
                        if (importAction) {
                            // Ersätt befintlig data
                            AIToolModel.save(importedData);
                        } else {
                            // Lägg till ny data
                            const currentTools = AIToolModel.getAll();
                            AIToolModel.save([...currentTools, ...importedData]);
                        }
                        
                        // Uppdatera den lokala listan
                        toolsData = AIToolModel.getAll();
                        // Uppdatera visningen
                        displayTools();
                        alert('Import slutförd!');
                    } else {
                        alert('Ogiltig filformat. Filen måste innehålla en JSON-array.');
                    }
                } catch (err) {
                    alert('Fel vid importering: ' + err.message);
                }
            };
            
            reader.readAsText(file);
        } else {
            alert('Vänligen välj en fil att importera.');
        }
    });
    
    // Funktion för att visa verktyg med filtrering
    function displayTools() {
        // Hämta filtervärden
        const searchText = searchInput.value.toLowerCase();
        const categoryFilterValue = categoryFilter.value;
        const priceFilterValue = priceFilter.value;
        const ratingFilterValue = parseInt(ratingFilter.value) || 0;
        
        // Använd datamodellen för filtrering
        const filteredTools = AIToolModel.filter({
            searchText: searchText || undefined,
            category: categoryFilterValue,
            price: priceFilterValue,
            minRating: ratingFilterValue || undefined
        }).sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        
        // Rensa listan
        toolsList.innerHTML = '';
        
        // Visa filterderade verktyg
        if (filteredTools.length === 0) {
            toolsList.innerHTML = '<p>Inga verktyg hittades med de valda filtren.</p>';
            return;
        }
        
        filteredTools.forEach(tool => {
            const toolCard = document.createElement('div');
            toolCard.className = 'tool-card';
            
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
                    <div class="tool-rating">${'★'.repeat(tool.rating)}</div>
                </div>
                <div class="tool-category">${tool.category}</div>
                <div class="tool-price">${priceText}</div>
                ${tool.url ? `<div class="tool-url"><a href="${tool.url}" target="_blank">${tool.url}</a></div>` : ''}
                <div class="tool-description">${tool.description}</div>
                ${tool.notes ? `<div class="tool-notes"><strong>Anteckningar:</strong> ${tool.notes}</div>` : ''}
                <div class="tool-tags">${tagsHtml}</div>
                <div class="tool-actions">
                    <button class="edit-tool" data-id="${tool.id}">Redigera</button>
                    <button class="delete-tool" data-id="${tool.id}">Ta bort</button>
                </div>
            `;
            
            // Lägg till knapphändelser
            const editBtn = toolCard.querySelector('.edit-tool');
            const deleteBtn = toolCard.querySelector('.delete-tool');
            
            editBtn.addEventListener('click', function() {
                const toolId = this.getAttribute('data-id');
                editTool(toolId);
            });
            
            deleteBtn.addEventListener('click', function() {
                const toolId = this.getAttribute('data-id');
                if (confirm('Är du säker på att du vill ta bort detta verktyg?')) {
                    try {
                        AIToolModel.delete(toolId);
                        // Uppdatera den lokala listan
                        toolsData = AIToolModel.getAll();
                        displayTools();
                    } catch (error) {
                        alert('Fel vid borttagning: ' + error.message);
                    }
                }
            });
            
            toolsList.appendChild(toolCard);
        });
    }
    
    // Funktion för att redigera ett verktyg
    function editTool(id) {
        // För närvarande bara en platshållare
        alert('Redigering kommer i nästa version!');
        
        // När implementerad, ladda verktyg med:
        // const tool = AIToolModel.find(id);
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
});
```

