// Content script - runs on all pages
// Extracts page metadata for the extension

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getPageInfo') {
        const pageInfo = {
            title: document.title,
            description: getMetaDescription(),
            url: window.location.href,
            ogImage: getOGImage()
        };

        sendResponse(pageInfo);
    }
});

// Get meta description
function getMetaDescription() {
    // Try Open Graph description first
    let desc = document.querySelector('meta[property="og:description"]');
    if (desc) return desc.content;

    // Try standard meta description
    desc = document.querySelector('meta[name="description"]');
    if (desc) return desc.content;

    // Try Twitter description
    desc = document.querySelector('meta[name="twitter:description"]');
    if (desc) return desc.content;

    // Fallback: get first paragraph
    const firstP = document.querySelector('p');
    if (firstP) {
        return firstP.textContent.substring(0, 200);
    }

    return '';
}

// Get Open Graph image
function getOGImage() {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) return ogImage.content;

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) return twitterImage.content;

    return '';
}
