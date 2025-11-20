# AI Tools Organizer - Browser Extension 🔌

Snabbt lägg till AI-verktyg från vilken webbsida som helst!

## Features ✨

- **En-klicks tillägg** - Lägg till verktyg direkt från webbläsaren
- **Auto-upptäckt** - Hämtar automatiskt titel, beskrivning och URL
- **Offline-kö** - Sparar verktyg även när appen inte är öppen
- **Smart metadata** - Använder Open Graph och meta tags
- **Snabbtangenter** - Ctrl+Shift+A för att öppna popup

## Installation 🚀

### Chrome/Edge/Brave

1. **Öppna Extension Management:**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

2. **Aktivera Developer Mode** (toggle i övre högra hörnet)

3. **Ladda extension:**
   - Klicka **"Load unpacked"** / **"Ladda opackad"**
   - Välj mappen: `browser-extension/`
   - Klicka **"Select Folder"**

4. **Klar!** Extensionen visas nu i din toolbar

### Firefox

1. Öppna `about:debugging#/runtime/this-firefox`
2. Klicka **"Load Temporary Add-on"**
3. Välj filen: `browser-extension/manifest.json`
4. Extensionen laddas (fungerar tills du stänger Firefox)

---

## Använda Extension 📖

### Lägg till verktyg

1. **Gå till en AI-verktygs webbsida** (t.ex. chatgpt.com)
2. **Klicka på extension-ikonen** i toolbar
3. Formuläret fylls i automatiskt med:
   - Namn (från sidtitel)
   - URL (nuvarande sida)
   - Beskrivning (från meta tags)
4. **Justera om nödvändigt**
5. **Klicka "Spara verktyg"**

### Auto-upptäck

Om auto-ifyllning misslyckas:
1. Klicka **"✨ Auto-upptäck"**
2. Extension hämtar all metadata från sidan

### Synka med huvudappen

Verktyg sparas i Chrome storage och väntar på att synkas:

**Automatisk sync:**
1. Öppna https://aior-ai.netlify.app
2. Appen upptäcker väntande verktyg automatiskt
3. Klicka **"Importera [X] verktyg från extension"**

**Manuell sync:**
1. Klicka **"🚀 Öppna app"** i extension
2. Appen öppnas i ny flik

---

## Ikoner 🎨

Extension behöver tre ikonstorlekar:
- `icon-16.png` (16x16 px)
- `icon-48.png` (48x48 px)
- `icon-128.png` (128x128 px)

### Skapa ikoner snabbt

**Option 1: Använda PWA-ikonerna**
```bash
# I din projektmapp
cp icon-192.png browser-extension/icon-128.png
# Använd bildeditor för att skapa 16x16 och 48x48 versioner
```

**Option 2: Online Generator**
1. Gå till https://www.favicon-generator.org/
2. Ladda upp din logo
3. Generera alla storlekar
4. Ladda ner och flytta till `browser-extension/`

**Option 3: Placeholder (för testning)**
- Extension fungerar utan ikoner (visar default puzzle-ikon)
- Lägg till riktiga ikoner innan publicering

---

## Keyboard Shortcuts ⌨️

För att lägga till keyboard shortcuts:

1. Gå till `chrome://extensions/shortcuts`
2. Hitta **"AI Tools Organizer - Quick Add"**
3. Sätt shortcut, t.ex.:
   - **Ctrl+Shift+A** (Windows/Linux)
   - **Cmd+Shift+A** (Mac)

---

## Utveckling 🛠️

### Fil-struktur

```
browser-extension/
├── manifest.json      # Extension configuration
├── popup.html         # UI när du klickar på ikonen
├── popup.js           # Logik för popup
├── content.js         # Körs på alla sidor, hämtar metadata
├── icon-16.png        # Small icon
├── icon-48.png        # Medium icon
├── icon-128.png       # Large icon
└── README.md          # This file
```

### Testa ändringar

1. Gör ändring i filerna
2. Gå till `chrome://extensions/`
3. Klicka **refresh icon** ⟳ på extensionen
4. Testa igen!

### Debug

**Popup debugger:**
- Högerklicka på extension-ikonen
- Välj **"Inspect popup"**
- DevTools öppnas

**Content script debugger:**
- Öppna DevTools på vilken sida som helst (F12)
- Kolla Console för loggar från content.js

---

## Publishing 📦

### Chrome Web Store

1. Skapa ZIP av browser-extension mappen
2. Gå till [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Betala $5 en-gångsavgift
4. Ladda upp ZIP
5. Fyll i detaljer, screenshots, etc.
6. Skicka för granskning

### Firefox Add-ons

1. Skapa ZIP av browser-extension mappen
2. Gå till [Firefox Developer Hub](https://addons.mozilla.org/developers/)
3. Ladda upp ZIP (gratis!)
4. Fyll i metadata
5. Skicka för granskning

### Edge Add-ons

1. Samma som Chrome (kompatibel!)
2. Gå till [Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge/overview)
3. Ladda upp Chrome-compatible extension

---

## Kommande features 🔮

Planerade förbättringar:

- [ ] **Background sync** - Auto-sync när appen är öppen
- [ ] **Context menu** - Högerklicka → "Lägg till som AI-verktyg"
- [ ] **Options page** - Konfigurera standardkategori, API-nycklar, etc.
- [ ] **Badge** - Visa antal väntande verktyg på ikonen
- [ ] **Keyboard shortcuts** - Fördefinierade shortcuts
- [ ] **Dark mode** - Matcha browser theme

---

## Support 💬

Problem? Förslag?

1. Kolla först denna README
2. Testa i incognito mode (stäng av andra extensions)
3. Kolla browser console för errors
4. Öppna issue på GitHub

---

## License

MIT License - Använd fritt!
