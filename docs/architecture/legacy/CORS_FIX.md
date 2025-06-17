# 🔧 CORS Fix for Test Files - Chess Hawk

## Problem Beskrivelse
Når testfiler kjøres direkte fra `file://` protokollen, oppstår CORS-feil ved lasting av JSON-data:

```
Access to fetch at 'file:///C:/git/chess-hawk/tests/src/data/problems.json' from origin 'null' has been blocked by CORS policy
```

## Root Cause Analysis
1. **CORS Restriction**: Moderne nettlesere blokkerer Cross-Origin requests fra `file://` protokollen
2. **Path Confusion**: Testfiler i `tests/` mappen prøver å laste `src/data/problems.json` men det blir tolket som `tests/src/data/problems.json`
3. **Security Feature**: Dette er en sikkerhetsfunksjon i nettlesere for å forhindre lokale filattakk

## Implementert Løsning

### 1. Smart Path Detection i chesshawk.js
**Endret i `src/js/chesshawk.js` (linje 176-193):**

```javascript
// Determine correct path based on current location
const currentPath = window.location.pathname;
const isInTestsFolder = currentPath.includes('/tests/');
let jsonPath = isInTestsFolder ? '../src/data/problems.json' : 'src/data/problems.json';

console.log(`📍 Current path: ${currentPath}`);
console.log(`📂 Trying JSON path: ${jsonPath}`);

let response;
try {
    response = await fetch(jsonPath);
} catch (firstError) {
    console.log(`⚠️  First attempt failed, trying alternative path...`);
    // Try alternative path if the first one fails
    jsonPath = isInTestsFolder ? 'src/data/problems.json' : '../src/data/problems.json';
    console.log(`📂 Trying alternative path: ${jsonPath}`);
    response = await fetch(jsonPath);
}
```

**Fordeler:**
- ✅ Automatisk deteksjon av test vs. main kontekst
- ✅ Fallback-mekanisme hvis første sti feiler
- ✅ Detaljert logging for debugging
- ✅ Ingen hardkodede stier

### 2. HTTP Server Løsning for Testing
**For fullstendig CORS-fri testing:**

#### VS Code Live Server (Anbefalt)
1. Installer Live Server extension i VS Code
2. Høyreklikk på `index.html` eller testfil
3. Velg "Open with Live Server"
4. Applikasjonen kjører på `http://localhost:5500`

#### Python HTTP Server
```bash
# Fra chess-hawk root directory
python -m http.server 8000

# Åpne i nettleser:
# http://localhost:8000/index.html
# http://localhost:8000/tests/test-solution-validation.html
```

#### Node.js HTTP Server
```bash
# Installer globalt
npm install -g http-server

# Fra chess-hawk root directory
http-server

# Åpne i nettleser:
# http://localhost:8080/index.html
# http://localhost:8080/tests/test-solution-validation.html
```

## Oppdaterte Testfiler

### test-solution-validation.html
- ✅ Lagt til CORS-instruksjoner i UI
- ✅ Forklaring av HTTP-server løsninger
- ✅ Beholder original funksjonalitet

### Verifikasjon
**Test-scenarios som nå fungerer:**
1. **Fra root via HTTP-server**: `http://localhost:8000/index.html` ✅
2. **Test via HTTP-server**: `http://localhost:8000/tests/test-solution-validation.html` ✅
3. **Fallback path detection**: Automatisk sti-korreksjon ✅

## Best Practices for Lokale Filer

### For Utviklere
- **Alltid bruk HTTP-server** for testing av applikasjoner med fetch()
- **Aldri stol på file://** protokollen for AJAX/fetch operasjoner
- **Test både fra root og sub-directories** for å sikre sti-kompatibilitet

### For Brukere
- **Bruk Live Server** i VS Code for enkel testing
- **Download**: Last ned og kjør via HTTP-server
- **GitHub Pages**: Applikasjonen kan deployes til GitHub Pages for web-tilgang

## Tekniske Detaljer

### CORS Policy Forklaring
```
Access-Control-Allow-Origin: *
```
HTTP-servere setter denne headeren automatisk, mens `file://` protokollen ikke har denne muligheten.

### Path Resolution Logic
```javascript
// Detection logic
const isInTestsFolder = window.location.pathname.includes('/tests/');

// Primary path
const primaryPath = isInTestsFolder ? '../src/data/problems.json' : 'src/data/problems.json';

// Fallback path
const fallbackPath = isInTestsFolder ? 'src/data/problems.json' : '../src/data/problems.json';
```

## Commit
```bash
git add src/js/chesshawk.js tests/test-solution-validation.html docs/CORS_FIX.md
git commit -m "🔧 Fix: Resolve CORS issues for test files with smart path detection

- Added automatic path detection for tests vs main context
- Implemented fallback mechanism for path resolution
- Updated test files with HTTP server instructions
- All test files now work properly via HTTP server
- Maintains compatibility with both root and test directory execution"
```
