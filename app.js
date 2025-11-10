// Datalagring
const STORAGE_KEY = 'ai-tools-data';

// Hämta sparade verktyg eller använd tomma array om det inte finns några
let toolsData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

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
    
    // Skapa ett verktyg-objekt
    const tool = {
        id: Date.now().toString(), // Enkelt unikt ID baserat på nuvarande tid
        name: document.getElementById('tool-name').value,
        url: document.getElementById('tool-url').value,
        description: document.getElementById('tool-description').value,
        category: document.getElementById('tool-category').value,
        price: document.getElementById('tool-price').value,
        cost: document.getElementById('tool-cost').value,
        rating: parseInt(document.getElementById('tool-rating').value),
        tags: tags,
        notes: document.getElementById('tool-notes').value,
        dateAdded: new Date().toISOString()
    };
    
    // Lägg till verktyget i datan
    toolsData.push(tool);
    
    // Spara i localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toolsData));
    
    // Uppdatera visningen
    displayTools();
    
    // Återställ formuläret
    toolForm.reset();
    
    // Rensa alla checkboxes
    document.querySelectorAll('.checkbox-group input').forEach(cb => {
        cb.checked = false;
    });
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
                        toolsData = importedData;
                    } else {
                        // Lägg till ny data
                        toolsData = [...toolsData, ...importedData];
                    }
                    
                    // Spara och uppdatera visning
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(toolsData));
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
    
    // Rensa listan
    toolsList.innerHTML = '';
    
    // Filtrera och sortera verktyg (senast tillagda först)
    const filteredTools = toolsData
        .filter(tool => {
            // Textsökning
            const matchesSearch = 
                !searchText || 
                tool.name.toLowerCase().includes(searchText) ||
                tool.description.toLowerCase().includes(searchText) ||
                tool.notes.toLowerCase().includes(searchText) ||
                tool.tags.some(tag => tag.toLowerCase().includes(searchText));
            
            // Kategorifilter
            const matchesCategory = categoryFilterValue === 'all' || tool.category === categoryFilterValue;
            
            // Prisfilter
            const matchesPrice = priceFilterValue === 'all' || tool.price === priceFilterValue;
            
            // Betygsfilter
            const matchesRating = ratingFilterValue === 0 || tool.rating >= ratingFilterValue;
            
            return matchesSearch && matchesCategory && matchesPrice && matchesRating;
        })
        .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    
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
        const tagsHtml = tool.tags.map(tag => {
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
            // Implementera redigering senare
            alert('Redigering kommer i nästa version!');
        });
        
        deleteBtn.addEventListener('click', function() {
            const toolId = this.getAttribute('data-id');
            if (confirm('Är du säker på att du vill ta bort detta verktyg?')) {
                toolsData = toolsData.filter(t => t.id !== toolId);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(toolsData));
                displayTools();
            }
        });
        
        toolsList.appendChild(toolCard);
    });
}

// Lägg till några exempelverktyg om listan är tom
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
    
    toolsData = exampleTools;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toolsData));
    displayTools();
}