# 🧪 Tests Directory

Test-filer for Chess Hawk prosjektet.

## 📂 Test Filer

### HTML Test Sider
- `test-complete.html` - Omfattende test suite for alle komponenter
- `test-json.html` - JSON database loading test
- `test.html` - Generell test side

### JavaScript Tests
- `test-json.js` - Node.js JSON test script
- `test-import.js` - Import funksjonalitet test

## 🚀 Kjør Tester

### Fra nettleser (med server kjørende):
```
http://localhost:8000/tests/test-complete.html
http://localhost:8000/tests/test-json.html
```

### Fra kommandolinje:
```bash
node tests/test-json.js
node tests/test-import.js
```

## 🔍 Test Komponenter

### test-complete.html tester:
1. **JSON Database**: Validerer problems.json struktur
2. **Mobile Touch**: Sjekker touch capabilities
3. **Application**: Verifiserer app komponenter  
4. **Theme Distribution**: Analyserer puzzle distribusjon

### Hva testene sjekker:
- ✅ Database loading og struktur
- ✅ JSON parsing og validering
- ✅ Mobile touch support
- ✅ Puzzle tema distribusjon
- ✅ Error handling

## 📊 Test Results

Testene gir detaljert feedback om:
- Antall problemer lastet
- Theme kategorier funnet
- Mobile capabilities
- Eventuelle feil eller advarsler

## ⚙️ Debugging

Åpne browser developer tools (F12) for å se:
- Console logs fra testene
- Network requests til JSON filer
- Eventuelle JavaScript feil
