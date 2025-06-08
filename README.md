# ♟️ Chess Hawk - Taktisk Sjakktreningsspill

Et interaktivt nettbasert sjakktreningsspill med 1000 taktiske problemer og full mobile støtte.

## 🚀 Kom i gang

1. **Start serveren**:
   ```bash
   python -m http.server 8000
   ```

2. **Åpne applikasjonen**:
   Gå til `http://localhost:8000` i nettleseren

3. **Test mobile optimalisering**:
   Åpne på mobile enheter for touch-optimalisert opplevelse

## 🎯 Funksjoner

### ✅ Ferdig implementert
- **1000 Taktiske Problemer**: Komplett database med norsk lokalisering
- **10 Tema Kategorier**: fork, pin, skewer, mate, mateIn1, mateIn2, sacrifice, deflection, decoy, discoveredAttack
- **Mobile Optimalisering**: Full touch support uten page scrolling
- **3 Vanskelighetsgrader**: Begynner (1000-1200), Mellom (1400-1600), Avansert (1800+)
- **Interaktivt Brett**: Dra-og-slipp med validering av lovlige trekk
- **Hint System**: Kontekstuelle tips for hver oppgave
- **Poeng System**: Rating-basert poenggivning

### 🎮 Spillopplevelse
- Visuell fremheving av mulige trekk
- Sjakk, sjakkmatt og remis deteksjon
- Responsivt design for alle enheter
- Norsk brukergrensesnitt

## 📁 Prosjektstruktur

```
chess-hawk/
├── index.html                    # Hovedapplikasjon
├── README.md                     # Dokumentasjon
├── docs/                         # Dokumentasjon og rapporter
│   ├── FINAL_REPORT.md
│   ├── MOBILE_FIX_COMPLETE.md
│   └── ...
├── scripts/                      # Utility scripts
│   ├── generate-full-database.js
│   ├── verify-database.js
│   └── ...
├── tests/                        # Test filer
│   ├── test-complete.html
│   ├── test-json.html
│   └── ...
└── src/                          # Kildekode
    ├── css/
    │   └── styles.css           # Hovedstiler + mobile fixes
    ├── js/
    │   ├── chesshawk.js         # Hovedlogikk
    │   └── puzzle-importer.js   # Puzzle import logikk
    ├── data/
    │   └── problems.json        # 1000 taktiske problemer
    ├── lib/                     # JavaScript-biblioteker
    │   ├── chess.min.js
    │   ├── chessboard.min.js
    │   └── ...
    └── img/                     # Bilder
        └── chesspieces/
```

## 🧪 Testing

### Kjør tester
- **Komplett test**: `http://localhost:8000/tests/test-complete.html`
- **JSON loading**: `http://localhost:8000/tests/test-json.html`

### Test komponenter
1. **Database loading**: Validerer problems.json struktur
2. **Mobile touch**: Sjekker touch capabilities
3. **Application**: Verifiserer alle komponenter
4. **Theme distribution**: Analyserer puzzle distribusjon

## 🛠️ Utility Scripts

### Database Management
```bash
# Generer ny database (kjør fra scripts/)
node generate-full-database.js

# Valider database
node verify-database.js

# Batch import fra Lichess
node batch-import.js
```

### Puzzle Import
```bash
# Import fra Lichess API
node import-puzzles-fixed.js
```

## 🔧 Teknisk Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Sjakk Engine**: chess.js for spillogikk
- **UI**: chessboard.js for interaktivt brett
- **Mobile**: Touch event håndtering og CSS optimalisering
- **Database**: JSON-basert puzzle database
- **Server**: Python HTTP server (development)

## 📱 Mobile Support

Chess Hawk er fullstendig optimalisert for mobile enheter:

- **Touch Events**: Proper touch event handling
- **No Page Scroll**: Forhindrer page scrolling under piece dragging
- **Touch Action**: CSS `touch-action: none` på brett og brikker
- **Viewport**: Optimalisert mobile viewport konfigurering

## 🎓 Database Detaljer

### Puzzle Struktur
```json
{
  "id": "fork_1",
  "type": "tactical", 
  "title": "Gaffel-taktikk",
  "description": "Hvit å spille. fork taktikk. (Rating: 1156)",
  "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
  "toMove": "w",
  "solution": [
    {
      "move": "Nd5",
      "explanation": "Springer gaffel - angriper både dame og tårn"
    }
  ],
  "hints": ["Se etter gaffel-muligheter", "..."],
  "difficulty": "beginner",
  "category": "fork",
  "points": 10,
  "rating": 1156
}
```

### Statistikk
- **Totalt**: 1000 problemer
- **Per tema**: 100 problemer
- **Språk**: Norsk lokalisering
- **Rating span**: 1000-2500+ (Lichess ratings)

## 📖 Dokumentasjon

Se `docs/` mappen for omfattende dokumentasjon:
- `FINAL_REPORT.md` - Komplett prosjektrapport
- `MOBILE_FIX_COMPLETE.md` - Mobile optimalisering detaljer
- `IMPORT_COMPLETE_REPORT.md` - Puzzle import rapport

## 🤝 Bidrag

Alle bidrag er velkomne! Prosjektet er strukturert for enkel utvidelse.

## 📄 Lisens

MIT License - se LICENSE fil for detaljer.

---

**Chess Hawk er klar for produksjon!** 🎉♟️
