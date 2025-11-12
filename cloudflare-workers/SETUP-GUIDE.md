# Quick Setup Guide: Cloudflare Worker Integration

Follow these steps to enable automatic metadata scraping for bulk imports.

## Step 1: Deploy the Cloudflare Worker

### Using Cloudflare Dashboard (Recommended for beginners)

1. **Sign up**
   - Visit: https://workers.cloudflare.com/
   - Create a free account (no credit card required)

2. **Create Worker**
   - Dashboard → Workers & Pages → Create Worker
   - Name it: `metadata-scraper`
   - Click "Deploy"

3. **Add Code**
   - Click "Edit Code"
   - Delete all default code
   - Copy entire content from `cloudflare-workers/metadata-scraper.js`
   - Paste into editor
   - Click "Save and Deploy"

4. **Copy Worker URL**
   - You'll see: `https://metadata-scraper.YOUR-SUBDOMAIN.workers.dev`
   - Copy this URL (you'll need it in Step 2)

## Step 2: Enable in Your Application

1. **Open `app.js`**

2. **Find the CONFIG section** (near the top of the file)
   ```javascript
   const CONFIG = {
       CLOUDFLARE_WORKER_URL: '',
       ENABLE_METADATA_SCRAPING: false
   };
   ```

3. **Update configuration**
   ```javascript
   const CONFIG = {
       CLOUDFLARE_WORKER_URL: 'https://metadata-scraper.YOUR-SUBDOMAIN.workers.dev',
       ENABLE_METADATA_SCRAPING: true
   };
   ```

   Replace `YOUR-SUBDOMAIN` with your actual Cloudflare subdomain!

4. **Save the file**

## Step 3: Test It Out

1. **Open your app** in a browser

2. **Click "Massimport av URL:er"**

3. **Paste a URL** (try: `https://chat.openai.com`)

4. **Click "Extrahera URL:er"** → **"Importera valda URL:er"**

5. **Check the imported tool**
   - Should have proper title: "ChatGPT"
   - Should have description from the website
   - Should have "Importerad via massimport med automatisk metadata-extrahering"

## Verification

✅ **Working correctly if you see:**
- Proper tool names (not just domain names)
- Detailed descriptions (not generic text)
- Message: "X verktyg importerade med metadata!"

❌ **Not working if you see:**
- Generic names like "chat.openai.com"
- Description: "AI-verktyg från chat.openai.com"
- Message suggests enabling Cloudflare Worker

## Troubleshooting

### "CORS Error" in browser console
**Problem**: CORS headers not set correctly

**Solution**:
1. Open worker editor
2. Find line: `'Access-Control-Allow-Origin': '*'`
3. Ensure it's set to `'*'` (or your specific domain)
4. Save and Deploy

### No metadata extracted
**Problem**: Worker URL incorrect or disabled

**Solution**:
1. Verify worker URL is correct in `app.js`
2. Test worker directly:
   ```bash
   curl -X POST https://YOUR-WORKER-URL \
     -H "Content-Type: application/json" \
     -d '{"url":"https://chat.openai.com"}'
   ```
3. Should return JSON with title, description, etc.

### Slow imports
**Problem**: Each URL takes time to scrape

**Solution**: This is normal! Each URL needs:
- HTTP request to target site
- HTML parsing
- Metadata extraction

For 10 URLs, expect 10-30 seconds.

## Advanced: Production Security

For production use, restrict CORS to your domain:

```javascript
// In metadata-scraper.js, line ~8
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com', // Your actual domain
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

## Cost & Limits

- **Free Tier**: 100,000 requests/day
- **Typical Usage**: 10-50 imports/day = 10-50 requests
- **You'll likely never exceed free tier**

## Next Steps

After metadata scraping is working:
- ✅ Task 6: Complete!
- ⏭️ Task 7: OCR integration for images
- ⏭️ Task 8: Automated tagging with NLP

Need help? Check the full documentation in `cloudflare-workers/README.md`
