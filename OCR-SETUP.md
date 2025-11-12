# OCR.space Integration Setup Guide

This guide explains how to enable image text extraction using OCR.space's free API.

## What is OCR?

OCR (Optical Character Recognition) extracts text from images. This is useful for:
- Screenshots of Instagram posts with AI tool links
- Photos of presentations or whiteboards
- Scanned documents with AI tool information
- Any image containing URLs or text

## Setup Steps

### Step 1: Get Free API Key

1. **Visit OCR.space**
   - Go to: https://ocr.space/ocrapi
   - Scroll to "Free OCR API" section

2. **Register for Free API**
   - Enter your email address
   - Click "Register"
   - Check your email for API key
   - Example key format: `K87654321088957`

3. **Save your API key** (you'll need it in Step 2)

### Step 2: Configure Application

1. **Open `app.js`** in your code editor

2. **Find the CONFIG section** (near line 186)
   ```javascript
   const CONFIG = {
       CLOUDFLARE_WORKER_URL: '',
       ENABLE_METADATA_SCRAPING: false,

       OCR_API_KEY: '',
       ENABLE_OCR: false
   };
   ```

3. **Add your API key and enable OCR**
   ```javascript
   const CONFIG = {
       CLOUDFLARE_WORKER_URL: '',
       ENABLE_METADATA_SCRAPING: false,

       OCR_API_KEY: 'K87654321088957', // Your actual API key here
       ENABLE_OCR: true
   };
   ```

4. **Save the file**

## How to Use

1. **Open your app** in a browser

2. **Click "Massimport av URL:er"**

3. **Upload an image**:
   - Click "Choose File" under "Eller ladda upp skärmdump/bild"
   - Select an image (PNG, JPG, etc.)
   - Wait for text extraction (may take 5-15 seconds)

4. **Review extracted text**:
   - Text appears in the textarea
   - Edit if needed

5. **Click "Extrahera URL:er"** to find URLs

6. **Click "Importera valda URL:er"** to add tools

## Supported Image Formats

- ✅ PNG
- ✅ JPG/JPEG
- ✅ GIF
- ✅ BMP
- ✅ TIFF
- ✅ PDF (first page)

## Best Practices

### For Best Results:

1. **Good image quality**
   - Clear, high-resolution images
   - Good lighting
   - No blur

2. **Readable text**
   - Large enough font
   - Good contrast (dark text on light background)
   - Horizontal text (not rotated)

3. **Image size**
   - Maximum 1MB per image (free tier)
   - Recommended: 1000x1000 pixels or less
   - Larger images = slower processing

### Example Use Cases:

**Instagram Screenshot:**
```
1. Take screenshot of Instagram post
2. Upload to bulk import modal
3. OCR extracts caption text
4. URLs are found and can be imported
```

**Email Forward:**
```
1. Screenshot email with AI tool recommendations
2. Upload image
3. OCR extracts all text
4. Import discovered tools
```

## Limitations

### Free Tier Limits:
- **25,000 requests/month**
- **Max 1MB per image**
- **500 requests/day**
- **Rate limit: 10 requests/minute**

For most users, this is more than enough!

### Processing Time:
- Small images: 2-5 seconds
- Large images: 10-15 seconds
- Complex images: 15-30 seconds

## Troubleshooting

### "OCR är inte aktiverat" Error

**Problem**: API key not configured

**Solution**:
1. Check `CONFIG.ENABLE_OCR` is `true`
2. Check `CONFIG.OCR_API_KEY` has your actual key
3. Refresh the page

### No Text Extracted

**Problem**: Image quality too poor or no text in image

**Solution**:
1. Use higher quality image
2. Ensure good contrast
3. Try different image format
4. Check image actually contains text

### "OCR API returned 401" Error

**Problem**: Invalid or expired API key

**Solution**:
1. Verify API key is correct
2. Check for extra spaces in key
3. Register for new key if needed
4. Check email spam folder for original key

### Slow Processing

**Problem**: Large image taking long time

**Solution**:
1. Resize image before upload
2. Use JPG instead of PNG (smaller)
3. Crop to relevant area only
4. Be patient - OCR can take 10-30 seconds

### Rate Limit Exceeded

**Problem**: Too many requests in short time

**Solution**:
- Free tier: Max 10 requests/minute
- Wait a minute between batches
- Consider upgrading if you need more

## Cost & Upgrade Options

### Free Tier (Sufficient for Most Users)
- 25,000 requests/month
- 500 requests/day
- 10 requests/minute
- 1MB max file size
- **Cost: $0/month**

### Paid Tier (If Needed)
- PRO Plan: 100,000 requests/month for $60/month
- More if needed
- See: https://ocr.space/ocrapi#pricing

## Security Note

⚠️ **Never commit your API key to Git!**

If using Git, either:
1. Keep key in `app.js` (not committed)
2. Use environment variables (advanced)
3. Use `.env` file in `.gitignore`

## Testing

Test with this sample image:
1. Create a text document with "https://chat.openai.com"
2. Take screenshot
3. Upload to bulk import
4. Should extract the URL

## Next Steps

After OCR is working:
- ✅ Task 7: Complete!
- ⏭️ Task 8: Automated tagging with NLP
- ⏭️ Task 9: Firebase integration
- ⏭️ Task 10: PWA features

## Support

- **OCR.space docs**: https://ocr.space/ocrapi
- **Support email**: support@ocr.space
- **Status page**: Check API status if having issues

## Alternative: Tesseract.js

If you prefer a free, no-API-key solution (runs in browser):
- Library: Tesseract.js
- Pros: No API key, unlimited, works offline
- Cons: Slower, less accurate, uses browser resources
- See: https://github.com/naptha/tesseract.js

We recommend OCR.space for better accuracy and performance!
