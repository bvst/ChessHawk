# Chess Hawk - Deployment Modes

Chess Hawk supports two deployment modes to accommodate different environments:

## 🛠️ Development Mode (Current)

**Use when**: Developing, testing, or have access to Node.js/npm

**Files**: `index.html` + Vite dev server
```bash
npm install
npm run dev        # Start development server
```

**Libraries loaded from**:
- `node_modules/jquery/`
- `node_modules/chess.js/`  
- `node_modules/@chrisoakman/chessboardjs/`

**Entry point**: `src/js/core-manager.ts` (ES6 modules)

## 🚀 Production Mode (Script Tags)

**Use when**: Deploying to servers without Node.js/npm access

**Files**: `index-production.html` + static files
```bash
npm run build:production  # Build production bundle
```

**Libraries loaded from**:
- `src/lib/jquery.min.js`
- `src/lib/chess.min.js`
- `src/lib/chessboard.min.js`

**Entry point**: `dist/chess-hawk.min.js` (IIFE bundle)

## 🔄 Quick Switch Commands

```bash
# Development (current setup)
npm run dev
# → http://localhost:8000/index.html

# Production build & test
npm run build:production
npm run preview:production  
# → http://localhost:8080/index-production.html

# Or manually test production
python3 -m http.server 8080
# → http://localhost:8080/test-production.html
```

## 📁 File Structure Comparison

### Development Mode
```
chess-hawk/
├── index.html                 # ← Development entry
├── node_modules/              # ← npm dependencies
├── src/js/core-manager.ts     # ← ES6 entry point
└── ...
```

### Production Mode  
```
chess-hawk/
├── index-production.html      # ← Production entry
├── dist/chess-hawk.min.js     # ← Bundled app
├── src/lib/*.min.js           # ← Libraries
└── ...
```

## 🎯 Which Mode Should I Use?

| Scenario | Mode | Why |
|----------|------|-----|
| Local development | Development | Hot reload, debugging, TypeScript |
| Shared hosting | Production | No Node.js required, simple upload |
| VPS/dedicated server | Either | Choose based on deployment preference |
| Static site hosts | Production | GitHub Pages, Netlify, etc. |
| Docker deployment | Either | Include appropriate build step |

## ⚡ Quick Production Deploy

For immediate production deployment:

```bash
# 1. Build everything
npm run build:production

# 2. Upload dist/ folder to your server
rsync -av dist/ user@server:/var/www/chess-hawk/

# 3. Point server to index-production.html
```

That's it! No Node.js needed on the production server.

## 🧪 Test Both Modes

Both modes should work identically. Test files provided:

- **Development**: `http://localhost:8000/index.html`
- **Production**: `http://localhost:8080/test-production.html`

Both should show the same Chess Hawk interface and functionality.

## 🔧 Troubleshooting

**Development issues**: Check npm dependencies, Vite config
**Production issues**: Check browser console, verify library loading order

The production mode is designed to be bulletproof - if the libraries load, the app works!