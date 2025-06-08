# 🔍 ChessHawk Puzzle Importer

Dette verktøyet lar deg importere tusenvis av sjakk-taktikkproblemer fra forskjellige kilder og konvertere dem til ChessHawk-format.

## 🌟 Funksjoner

- **Lichess API Integration**: Import direkte fra Lichess' massive database
- **Automatisk Konvertering**: Konverterer til ChessHawk's problemformat
- **Filtering**: Filtrer på tema, vanskelighetsgrad, rating
- **Batch Import**: Importer mange problemer samtidig
- **Merge Functionality**: Kombiner med eksisterende problemer
- **Norsk Lokalisering**: Automatisk oversettelse til norsk

## 🚀 Kom i gang

### 1. Web-grensesnitt (Anbefalt for testing)

Åpne `puzzle-importer.html` i nettleseren din:

```bash
# Åpne filen direkte eller via en web server
open puzzle-importer.html
```

**Funksjoner i web-grensesnittet:**
- 📥 Import fra Lichess med tema-filter
- 📊 Live statistikk og forhåndsvisning
- 💾 Eksporter til JSON eller last ned fil
- 🔄 Merge med eksisterende problems.json
- 👀 Forhåndsvisning av importerte problemer

### 2. Kommandolinje (For batch-operasjoner)

```bash
# Importer 50 problemer (standard)
node import-puzzles.js

# Importer 100 problemer med fork-tema
node import-puzzles.js --count=100 --theme=fork

# Importer problemer i et spesifikt rating-område
node import-puzzles.js --count=50 --min-rating=1500 --max-rating=2000

# Importer matt-problemer til spesifikk fil
node import-puzzles.js --theme=mate --output=mate-puzzles.json
```

**Tilgjengelige kommandolinje-opsjoner:**
```
--count=N           Antall problemer (standard: 50)
--theme=THEME       Filter på tema (valgfritt)
--min-rating=N      Minimum rating (standard: 1000)
--max-rating=N      Maksimum rating (standard: 2500)
--output=FILE       Output-filnavn (auto-generert hvis ikke spesifisert)
--help              Vis hjelp
```

## 🎯 Tilgjengelige temaer

| Tema | Beskrivelse | Norsk |
|------|-------------|-------|
| `fork` | Gaffel-taktikk | Angrep på to brikker samtidig |
| `pin` | Binding | Brikke som ikke kan flytte |
| `skewer` | Spidding | Tvinge verdifull brikke til å flytte |
| `mate` | Matt | Sjakkmatt-kombinasjoner |
| `mateIn1` | Matt i 1 | Ett trekk til matt |
| `mateIn2` | Matt i 2 | To trekk til matt |
| `sacrifice` | Offer | Ofre material for fordel |
| `deflection` | Avledning | Avlede forsvarsbrikke |
| `decoy` | Lokkemiddel | Lokke brikke til dårlig rute |
| `discoveredAttack` | Oppdaget angrep | Flytte brikke for å åpne angrep |

## 📁 Output-format

Importerte problemer konverteres til ChessHawk's format:

```json
{
  "problems": [
    {
      "id": "lichess_12345",
      "type": "tactical",
      "title": "Gaffel-taktikk",
      "description": "Hvit å spille. fork taktikk. (Rating: 1456)",
      "fen": "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 3",
      "toMove": "w",
      "solution": [
        {
          "move": "Nf3",
          "explanation": "Første trekk i kombinasjonen",
          "opponentResponse": "Nc6"
        },
        {
          "move": "Bc4",
          "explanation": "Avsluttende trekk"
        }
      ],
      "hints": [
        "Se etter gaffel-muligheter",
        "Kan du angripe to brikker samtidig?",
        "Hvilken brikke kan gi dobbelt angrep?"
      ],
      "difficulty": "intermediate",
      "category": "fork",
      "points": 15,
      "source": "lichess",
      "originalId": "12345",
      "rating": 1456,
      "themes": ["fork", "middlegame"]
    }
  ],
  "metadata": {
    "exportDate": "2025-06-08T10:30:00.000Z",
    "totalProblems": 50,
    "sources": ["lichess"]
  }
}
```

## 🔧 Teknisk oversikt

### PuzzleImporter-klassen

```javascript
const importer = new PuzzleImporter();

// Import 50 problemer fra Lichess
await importer.importFromLichess(50, 'fork');

// Få statistikk
const stats = importer.getStatistics();

// Eksporter til JSON
const json = importer.exportToJSON();

// Merge med eksisterende problemer
const merged = await importer.mergeWithExistingProblems();
```

### Konverteringslogikk

1. **FEN Analysis**: Utleder hvem som skal spille fra FEN-notasjon
2. **Theme Mapping**: Konverterer Lichess-temaer til norske kategorier
3. **Difficulty Mapping**: Mapper rating til vanskelighetsgrad:
   - `beginner`: < 1200
   - `intermediate`: 1200-1599
   - `advanced`: 1600-1999
   - `expert`: 2000+
4. **Solution Processing**: Konverterer trekksekvenser til vårt format
5. **Hint Generation**: Genererer norske hints basert på temaer

## 🌐 API-kilder

### Lichess API
- **Endpoint**: `https://lichess.org/api/puzzle/batch`
- **Gratis**: Ja, ingen API-nøkkel nødvendig
- **Rate limit**: Rimelig, men vær hyggelig
- **Data kvalitet**: Høy, profesjonelt kurert

### Fremtidige kilder (planlagt)
- **Chess.com**: Krever API-nøkkel, begrenset gratis tilgang
- **ChessTempo**: Eksport-muligheter
- **FICS**: Åpen database

## 📊 Eksempel på import-sesjon

```bash
🎯 ChessHawk Puzzle Importer CLI
=================================

🌐 === Importing 50 puzzles from Lichess ===
   🎯 Theme: fork
   📊 Rating range: 1200-1800
📡 Fetching: https://lichess.org/api/puzzle/batch?nb=50&themes=fork
✅ Received 50 puzzles from Lichess
📊 Filtered to 42 puzzles within rating range
🔄 Converting 42 Lichess puzzles...
   ✅ Converted 10/42 puzzles
   ✅ Converted 20/42 puzzles
   ✅ Converted 30/42 puzzles
   ✅ Converted 40/42 puzzles

📊 === IMPORT STATISTICS ===
   Total puzzles: 42

   📈 By Difficulty:
      beginner: 8
      intermediate: 24
      advanced: 10

   🏷️  By Category:
      fork: 42

   ⭐ Rating Range: 1203-1789 (avg: 1456)

💾 Saved 42 puzzles to: /path/to/imported-puzzles/chesshawk-puzzles-2025-06-08.json
✅ Import completed successfully!
💡 Use the generated file in your ChessHawk application
```

## 🎮 Integrasjon med ChessHawk

### 1. Erstatt eksisterende problemer

```bash
# Backup first
cp src/data/problems.json src/data/problems.json.backup

# Replace with imported problems
cp imported-puzzles/chesshawk-puzzles-2025-06-08.json src/data/problems.json
```

### 2. Merge med eksisterende

Bruk web-grensesnittet's "Merge med eksisterende" funksjon, eller:

```javascript
// Load existing
const existing = require('./src/data/problems.json');

// Load imported
const imported = require('./imported-puzzles/chesshawk-puzzles-2025-06-08.json');

// Merge and remove duplicates
const merged = {
  problems: [
    ...existing.problems,
    ...imported.problems
  ].filter((problem, index, arr) => 
    arr.findIndex(p => p.id === problem.id) === index
  )
};

// Save merged
fs.writeFileSync('src/data/problems.json', JSON.stringify(merged, null, 2));
```

## 🛠️ Tilpasning

### Legge til nye kilder

1. Utvid `PuzzleImporter`-klassen
2. Implementer `importFromNewSource()` metode
3. Legg til konverteringsfunksjoner
4. Oppdater web-grensesnitt

### Endre konverteringslogikk

Rediger metodene i `puzzle-importer.js`:
- `mapRatingToDifficulty()`: Justere rating-kategorier
- `generateHints()`: Endre hint-generering
- `generateTitle()`: Tilpass titler
- `calculatePoints()`: Justere poeng-system

## 🤝 Bidrag

Vi ønsker bidrag! Spesielt:
- Support for flere API-kilder
- Bedre hint-generering
- Forbedret norsk oversettelse
- UI-forbedringer

## 📜 Lisens

Same som ChessHawk hovedprosjekt.

---

**Happy importing! 🎯**
