/**
 * Cloudflare Worker for AI Tools Metadata Scraper
 *
 * This worker fetches metadata from URLs and extracts:
 * - Page title
 * - Description
 * - Open Graph data
 * - Twitter Card data
 * - Favicon/images
 *
 * Deploy this to Cloudflare Workers (free tier: 100,000 requests/day)
 */

// CORS headers for allowing requests from your domain
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Change to your domain in production
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch the page
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Tools-Scraper/1.0)',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Failed to fetch: ${response.status} ${response.statusText}`
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get HTML content
    const html = await response.text();

    // Extract metadata
    const metadata = extractMetadata(html, targetUrl);

    return new Response(JSON.stringify(metadata), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Worker error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Extract metadata from HTML content
 */
function extractMetadata(html, url) {
  const metadata = {
    url: url.toString(),
    title: '',
    description: '',
    image: '',
    icon: '',
    siteName: '',
    type: '',
    scrapedAt: new Date().toISOString()
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = decodeHTML(titleMatch[1].trim());
  }

  // Extract meta tags
  const metaRegex = /<meta\s+([^>]+)>/gi;
  let metaMatch;

  while ((metaMatch = metaRegex.exec(html)) !== null) {
    const metaTag = metaMatch[1];

    // Extract name/property and content
    const nameMatch = metaTag.match(/(?:name|property)=["']([^"']+)["']/i);
    const contentMatch = metaTag.match(/content=["']([^"']+)["']/i);

    if (nameMatch && contentMatch) {
      const name = nameMatch[1].toLowerCase();
      const content = decodeHTML(contentMatch[1]);

      switch (name) {
        case 'description':
          if (!metadata.description) metadata.description = content;
          break;
        case 'og:title':
          metadata.title = content || metadata.title;
          break;
        case 'og:description':
          metadata.description = content || metadata.description;
          break;
        case 'og:image':
          metadata.image = resolveURL(content, url);
          break;
        case 'og:site_name':
          metadata.siteName = content;
          break;
        case 'og:type':
          metadata.type = content;
          break;
        case 'twitter:title':
          if (!metadata.title) metadata.title = content;
          break;
        case 'twitter:description':
          if (!metadata.description) metadata.description = content;
          break;
        case 'twitter:image':
          if (!metadata.image) metadata.image = resolveURL(content, url);
          break;
      }
    }
  }

  // Extract favicon
  const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i);
  if (faviconMatch) {
    metadata.icon = resolveURL(faviconMatch[1], url);
  } else {
    // Default favicon location
    metadata.icon = `${url.protocol}//${url.host}/favicon.ico`;
  }

  // If no title found, use hostname
  if (!metadata.title) {
    metadata.title = url.hostname.replace('www.', '');
  }

  // If no site name, use hostname
  if (!metadata.siteName) {
    metadata.siteName = url.hostname.replace('www.', '');
  }

  return metadata;
}

/**
 * Resolve relative URLs to absolute
 */
function resolveURL(relativeURL, baseURL) {
  try {
    return new URL(relativeURL, baseURL).toString();
  } catch (e) {
    return relativeURL;
  }
}

/**
 * Decode HTML entities
 */
function decodeHTML(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };

  return text.replace(/&[^;]+;/g, entity => entities[entity] || entity);
}
