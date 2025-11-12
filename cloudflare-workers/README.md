# Cloudflare Worker - Metadata Scraper

This Cloudflare Worker fetches and extracts metadata from URLs for the AI Tools Organizer.

## Features

- Extracts page title, description, images
- Supports Open Graph and Twitter Card metadata
- CORS-enabled for browser requests
- Free tier: 100,000 requests/day
- 10-second timeout for slow websites
- Automatic URL validation

## Setup & Deployment

### Option 1: Cloudflare Dashboard (Easiest)

1. **Sign up for Cloudflare Workers**
   - Go to https://workers.cloudflare.com/
   - Sign up for a free account
   - Navigate to "Workers & Pages"

2. **Create a new Worker**
   - Click "Create Worker"
   - Name it `metadata-scraper` (or your preferred name)
   - Click "Deploy"

3. **Edit the Worker**
   - Click "Edit Code"
   - Delete the default code
   - Copy and paste the entire content from `metadata-scraper.js`
   - Click "Save and Deploy"

4. **Get your Worker URL**
   - Copy the worker URL (e.g., `https://metadata-scraper.yourname.workers.dev`)
   - You'll need this for the frontend configuration

### Option 2: Wrangler CLI (Advanced)

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create wrangler.toml**
   ```toml
   name = "metadata-scraper"
   main = "metadata-scraper.js"
   compatibility_date = "2024-01-01"

   [vars]
   ENVIRONMENT = "production"
   ```

4. **Deploy**
   ```bash
   wrangler deploy
   ```

## Frontend Integration

After deploying, update your `app.js` to use the worker:

```javascript
const CLOUDFLARE_WORKER_URL = 'https://metadata-scraper.yourname.workers.dev';
```

The bulk import feature will automatically use the worker to enrich imported URLs with metadata.

## API Usage

### Request

```bash
POST https://metadata-scraper.yourname.workers.dev
Content-Type: application/json

{
  "url": "https://example.com"
}
```

### Response

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "description": "This domain is for use in illustrative examples...",
  "image": "https://example.com/image.png",
  "icon": "https://example.com/favicon.ico",
  "siteName": "Example",
  "type": "website",
  "scrapedAt": "2025-11-12T00:00:00.000Z"
}
```

## Security Considerations

### Production Setup

1. **Restrict CORS Origins**
   In `metadata-scraper.js`, change:
   ```javascript
   'Access-Control-Allow-Origin': '*'
   ```
   to your domain:
   ```javascript
   'Access-Control-Allow-Origin': 'https://yourdomain.com'
   ```

2. **Add Rate Limiting**
   Consider adding rate limiting to prevent abuse:
   ```javascript
   // Check request headers for abuse patterns
   const clientIP = request.headers.get('CF-Connecting-IP');
   // Implement rate limiting logic
   ```

3. **Add Request Validation**
   - Validate URLs are from allowed domains
   - Block suspicious patterns
   - Log requests for monitoring

## Limitations

- **Free Tier**: 100,000 requests/day
- **Timeout**: 10 seconds per request
- **CPU Time**: 10ms per request (Worker limit)
- **Some sites may block requests** - Consider adding user-agent rotation

## Troubleshooting

### CORS Errors
- Ensure CORS headers are set correctly
- Check browser console for specific errors

### Timeout Errors
- Some websites are slow - the worker has a 10-second timeout
- Consider implementing a fallback for slow sites

### 429 Rate Limit Errors
- You've exceeded the free tier limit
- Consider upgrading or implementing client-side caching

## Cost

- **Free Tier**: 100,000 requests/day (sufficient for most users)
- **Paid Tier**: $5/month for 10 million requests
- **Storage**: Free (Workers don't store data by default)

## Monitoring

View your worker metrics in the Cloudflare dashboard:
- Request count
- Error rate
- Response time
- CPU usage

## Next Steps

After deploying:
1. Test the worker with a simple curl request
2. Update `CLOUDFLARE_WORKER_URL` in your frontend code
3. Enable the worker in bulk import settings
4. Monitor usage in Cloudflare dashboard
