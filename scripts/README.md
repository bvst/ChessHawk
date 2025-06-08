# 🛠️ Scripts Directory

Dette er verktøy-scripts for Chess Hawk prosjektet.

## 📂 Filer

### Database Scripts
- `generate-full-database.js` - Generer komplett database med 1000 problemer
- `verify-database.js` - Valider database struktur og innhold
- `batch-import.js` - Batch import fra Lichess API

### Import Scripts  
- `import-puzzles-fixed.js` - Forbedret puzzle importer med feilhåndtering
- `import-puzzles.js` - Original puzzle importer
- `batch-import.ps1` - PowerShell script for batch operasjoner

## 🚀 Bruk

### Kjør fra prosjektets root directory:

```bash
# Generer ny database
node scripts/generate-full-database.js

# Valider eksisterende database
node scripts/verify-database.js

# Import nye puzzles
node scripts/import-puzzles-fixed.js
```

### PowerShell script:
```powershell
# Kjør batch operasjoner
./scripts/batch-import.ps1
```

## ⚠️ Viktig

- Kjør alltid scripts fra rot-mappen (`c:\git\chess-hawk\`)
- Scripts lager automatisk backup av `problems.json` før endringer
- Sjekk alltid output for eventuelle feil

## 📝 Notes

- Alle scripts støtter norsk lokalisering
- Rate limiting er implementert for API calls
- Backup-filer lagres automatisk med tidsstempel
