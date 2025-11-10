# AI-verktygsorganiserare

En webbapplikation för att organisera, tagga och analysera AI-verktyg och program. Appen möjliggör att spara information om olika AI-verktyg med automatiserad taggning och kategorisering.

## Funktioner

- Spara information om AI-verktyg (namn, URL, beskrivning, kategori, pris, etc.)
- Tagga verktyg för enkel kategorisering
- Filtrera och söka bland sparade verktyg
- Exportera och importera data som JSON

## Installation

Inga speciella installationssteg krävs. Öppna bara `index.html` i en webbläsare.

### För utveckling

1. Klona repositoryt
2. Öppna filerna i din favorit-kodredigerare
3. Testa lokalt genom att öppna index.html i en webbläsare

## Användning

1. Lägg till nya AI-verktyg via formuläret till vänster
2. Sök och filtrera verktyg via sökfältet och dropdownmenyerna
3. Exportera dina data för backup genom att klicka på "Exportera till fil"
4. Importera data genom att klicka på "Importera"

## Kommande funktioner

- Automatisk taggning och kategorisering
- OCR för skärmdumpar
- Integration med Cloudflare Workers för webbskrapning
- Firebase-synkronisering mellan enheter

## Teknisk information

Denna app använder:
- Ren HTML, CSS och JavaScript utan externa ramverk
- localStorage för lokal datalagring
- Responsiv design för mobil och desktop
```

## Steg 4: Testa applikationen lokalt

Öppna `index.html` i en webbläsare för att verifiera att allt fungerar korrekt med de separata filerna.

## Steg 5: Konfigurera GitHub för hosting

Nu ska vi sätta upp GitHub Pages för hosting:

1. Skapa ett nytt repository på GitHub
   - Gå till https://github.com/new
   - Namnge repositoryt, t.ex. "ai-verktygsorganiserare"
   - Välj "Public" för synlighet

2. Initiera git i din projektmapp och lägg till filerna:
```
   cd C:\Users\fiske\aior
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/DITTANVÄNDARNAMN/ai-verktygsorganiserare.git
   git push -u origin main
```

3. Aktivera GitHub Pages:
   - Gå till ditt GitHub repository
   - Klicka på "Settings"
   - Skrolla ner till "GitHub Pages"
   - Under "Source", välj "main" branch
   - Klicka på "Save"

## Steg 6: Markera uppgiften som klar

När du har testat att allt fungerar lokalt och har satt upp GitHub Pages, markera uppgiften som slutförd:
```
task-master set-task-status --id=1 --status=done