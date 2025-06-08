# ChessHawk Puzzle Import System

## Oversikt

Puzzle Import System er nå refaktorert til et modulært system som er lettere å vedlikeholde og utvide. Systemet er delt opp i følgende moduler:

## Modul Struktur

```
src/js/
├── puzzle-import-system.js         # Hovedindex og loader
├── puzzle-importer-main.js         # Hovedorchestrator klasse
├── importers/
│   └── lichess-importer.js         # Lichess API import
├── converters/
│   └── puzzle-converter.js         # Data transformasjon
├── validators/
│   └── puzzle-validator.js         # Validering og statistikk
└── exporters/
    └── puzzle-exporter.js          # Export og merge funksjonalitet
```

## Moduler

### 1. PuzzleImporter (Hovedklasse)
**Fil:** `puzzle-importer-main.js`

Hovedorchestrator som koordinerer alle andre moduler. Inneholder høynivå API for import.

```javascript
const importer = new PuzzleImporter();
await importer.importFromLichess(50, 'fork');
console.log(importer.getStatistics());
```

### 2. LichessImporter
**Fil:** `importers/lichess-importer.js`

Håndterer all Lichess API kommunikasjon og basis transformering.

- Fetch puzzles fra Lichess API
- Konverter Lichess løsninger
- Map rating til difficulty
- Map themes til kategorier

### 3. PuzzleConverter
**Fil:** `converters/puzzle-converter.js`

Statiske metoder for data transformering og formattering.

- Konverter Lichess format til ChessHawk format
- Generer titler og beskrivelser på norsk
- Generer hints basert på temaer
- Kalkuler poeng basert på rating

### 4. PuzzleValidator
**Fil:** `validators/puzzle-validator.js`

Validering og statistikk for puzzle collections.

- Valider enkelt puzzles
- Valider puzzle collections
- Generer statistikk
- Fjern duplikater

### 5. PuzzleExporter
**Fil:** `exporters/puzzle-exporter.js`

Export og merge funksjonalitet.

- Export til JSON
- Merge med eksisterende database
- Backup funksjonalitet
- Download filer i browser

## Bruk

### I Browser

```html
<!-- Last puzzle import system -->
<script src="src/js/puzzle-import-system.js"></script>

<script>
// Last alle moduler
const PuzzleImporter = await window.PuzzleImportSystem.loadModules();

// Bruk systemet
const importer = new PuzzleImporter();
await importer.importFromLichess(10, 'fork');

// Export resultater
importer.downloadImportedPuzzles('nye-puzzles.json');
</script>
```

### I Node.js

```javascript
// Last puzzle import system
const PuzzleImporter = require('./src/js/puzzle-import-system.js');

// Bruk systemet
const importer = new PuzzleImporter();
await importer.importFromLichess(10, 'fork');

// Få statistikk
console.log(importer.getStatistics());
```

## API Referanse

### PuzzleImporter Metoder

#### Import Metoder
- `importFromLichess(count, theme)` - Import fra Lichess
- `importFromChessCom(apiKey, count)` - Import fra Chess.com (placeholder)

#### Export Metoder
- `exportToJSON()` - Export til JSON string
- `mergeWithExistingProblems()` - Merge med database
- `downloadImportedPuzzles(filename)` - Last ned som fil
- `backupDatabase()` - Backup eksisterende database

#### Utility Metoder
- `clear()` - Tøm importerte puzzles
- `getStatistics()` - Få statistikk
- `validateImportedPuzzles()` - Valider alle puzzles
- `removeDuplicates()` - Fjern duplikater
- `getImportedCount()` - Antall importerte
- `getImportedPuzzles()` - Alle importerte puzzles

## Fordeler med Modular Struktur

1. **Separation of Concerns**: Hver modul har ett ansvar
2. **Lettere Testing**: Kan teste hver modul separat
3. **Bedre Vedlikehold**: Endringer påvirker kun relevante moduler
4. **Utvidbarhet**: Lett å legge til nye importers (Chess.com, ChessTempo)
5. **Gjenbrukbarhet**: Moduler kan brukes uavhengig av hverandre

## Migrering fra Gammel Kode

Gammel kode som brukte `puzzle-importer.js` kan fortsatt fungere ved å:

1. Laste det nye systemet
2. Bruke samme API metoder på `PuzzleImporter` klassen

```javascript
// Gammel måte
const importer = new PuzzleImporter();
await importer.importFromLichess(50);

// Ny måte (samme API)
const PuzzleImporter = await window.PuzzleImportSystem.loadModules();
const importer = new PuzzleImporter();
await importer.importFromLichess(50);
```

## Utvidelse

For å legge til nye puzzle kilder:

1. Opprett ny fil i `importers/` directory
2. Implementer import logikk
3. Legg til converter logikk i `PuzzleConverter` hvis nødvendig
4. Legg til metode i `PuzzleImporter` hovedklasse
5. Oppdater `puzzle-import-system.js` med ny modul

Eksempel struktur for Chess.com importer:
```javascript
// src/js/importers/chesscom-importer.js
class ChessComImporter {
    async importPuzzles(apiKey, count) {
        // Implementation
    }
}
```
