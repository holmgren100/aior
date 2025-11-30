// AI Tools Organizer - Browser Extension
// Popup script for quick adding tools

const APP_URL = 'https://aior-ai.netlify.app';

// DOM Elements
const toolNameInput = document.getElementById('tool-name');
const toolUrlInput = document.getElementById('tool-url');
const toolDescriptionInput = document.getElementById('tool-description');
const toolCategorySelect = document.getElementById('tool-category');
const saveBtn = document.getElementById('save-btn');
const autoDetectBtn = document.getElementById('auto-detect-btn');
const openAppBtn = document.getElementById('open-app-btn');
const statusDiv = document.getElementById('status');

// Get current tab info on load
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];

    // Auto-fill URL
    toolUrlInput.value = currentTab.url;

    // Auto-fill title
    toolNameInput.value = currentTab.title || '';

    // Try to get page description
    chrome.tabs.sendMessage(currentTab.id, { action: 'getPageInfo' }, function(response) {
        if (response && response.description) {
            toolDescriptionInput.value = response.description;
        }
    });
});

// Auto-detect button
autoDetectBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];

        chrome.tabs.sendMessage(currentTab.id, { action: 'getPageInfo' }, function(response) {
            if (response) {
                if (response.title) toolNameInput.value = response.title;
                if (response.description) toolDescriptionInput.value = response.description;

                showStatus('Auto-upptäckt klar!', 'success');
            }
        });
    });
});

// Save button
saveBtn.addEventListener('click', function() {
    const toolData = {
        name: toolNameInput.value.trim(),
        url: toolUrlInput.value.trim(),
        description: toolDescriptionInput.value.trim(),
        category: toolCategorySelect.value,
        price: 'freemium',
        rating: 3,
        tags: [],
        notes: 'Tillagt via browser extension',
        dateAdded: new Date().toISOString()
    };

    if (!toolData.name) {
        showStatus('Namn krävs!', 'error');
        return;
    }

    // Save to Chrome storage (so main app can access it)
    chrome.storage.local.get(['pendingTools'], function(result) {
        const pendingTools = result.pendingTools || [];
        pendingTools.push(toolData);

        chrome.storage.local.set({ pendingTools: pendingTools }, function() {
            showStatus('✅ Verktyg sparat! Öppna appen för att synka.', 'success');

            // Clear form
            setTimeout(() => {
                window.close();
            }, 1500);
        });
    });
});

// Open app button
openAppBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: APP_URL });
});

// Show status message
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;

    if (type === 'error') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}
