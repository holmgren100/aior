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

    // Förbättrad filterfunktion med Fuse.js för fuzzy-sökning
    static filter(criteria) {
        const tools = this.getAll();
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

// Main Application Code
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
    const sortBySelect = document.getElementById('sort-by');
    const sortDirectionSelect = document.getElementById('sort-direction');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    
    // Paginering
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    
    // Aktiva taggfilter
    let activeTagFilters = [];
    
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

            // Notifiera användaren om att verktyget har lagts till
            const toolName = tool.name;
            showNotification(`${toolName} har lagts till!`, 'success');
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
    function displayTools() {
        // Hämta filtervärden
        const searchText = searchInput.value;
        const categoryFilterValue = categoryFilter.value;
        const priceFilterValue = priceFilter.value;
        const ratingFilterValue = parseInt(ratingFilter.value) || 0;
        const sortBy = sortBySelect.value;
        const sortDirection = sortDirectionSelect.value;
        
        // Debounce för sökningen
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            // Använd datamodellen för filtrering och sortering
            let filteredTools = AIToolModel.filter({
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
                
                deleteBtn.addEventListener('click', function() {
                    const toolId = this.getAttribute('data-id');
                    const toolToDelete = AIToolModel.find(toolId);
                    
                    if (confirm(`Är du säker på att du vill ta bort "${toolToDelete.name}"?`)) {
                        try {
                            AIToolModel.delete(toolId);
                            // Uppdatera den lokala listan
                            toolsData = AIToolModel.getAll();
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
    function editTool(id) {
        // För närvarande bara en platshållare
        showNotification('Redigering kommer i nästa version!', 'info');
        
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