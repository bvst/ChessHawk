---
applyTo: '**/*.html'
---

# Chess Hawk HTML Structure Standards

## File Organization
- **Main Page**: `index.html` - primary application entry point
- **Tests**: `tests/*.html` - testing and validation pages

## HTML5 Standards
- Use semantic HTML5 elements
- Ensure proper document structure
- Include appropriate meta tags
- Maintain accessibility standards

## Document Structure
```html
<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chess Hawk - Taktiske Sjakk-oppgaver</title>
    <meta name="description" content="1000 taktiske sjakk-problemer for alle nivåer">
    
    <!-- Styles -->
    <link rel="stylesheet" href="src/lib/chessboard.min.css">
    <link rel="stylesheet" href="src/css/styles.css">
</head>
<body>
    <!-- Semantic structure -->
    <header class="app-header">
        <h1>Chess Hawk</h1>
    </header>
    
    <main class="app-main">
        <!-- Main content -->
    </main>
    
    <footer class="app-footer">
        <!-- Footer content -->
    </footer>
    
    <!-- Scripts at bottom -->
    <script src="src/lib/jquery.min.js"></script>
    <script src="src/lib/chess.min.js"></script>
    <script src="src/lib/chessboard.min.js"></script>
    <script src="src/js/chesshawk.js"></script>
</body>
</html>
```

## Semantic Elements
Use appropriate semantic tags:
```html
<!-- Navigation -->
<nav class="problem-navigation">
    <button type="button" class="btn btn--secondary">Forrige</button>
    <span class="problem-counter">Problem 1 av 1000</span>
    <button type="button" class="btn btn--secondary">Neste</button>
</nav>

<!-- Main content sections -->
<section class="chess-board-section">
    <div id="board" class="chess-board"></div>
</section>

<aside class="problem-info">
    <h2>Probleminfo</h2>
    <p class="problem-description">Finn beste trekk</p>
</aside>
```

## Accessibility Standards
- Use proper heading hierarchy (h1, h2, h3...)
- Include alt text for images
- Use aria-labels for complex controls
- Ensure keyboard navigation works
- Provide proper form labels

## Meta Tags for Chess Hawk
```html
<meta name="description" content="1000 taktiske sjakk-problemer fordelt på 10 temaer">
<meta name="keywords" content="sjakk, taktikk, problemer, matt, gaffel, binding">
<meta name="author" content="Chess Hawk">
<meta name="robots" content="index, follow">

<!-- Open Graph for social sharing -->
<meta property="og:title" content="Chess Hawk - Taktiske Sjakk-oppgaver">
<meta property="og:description" content="Løs 1000 taktiske sjakk-problemer">
<meta property="og:type" content="website">
```

## Form Structure
```html
<form class="problem-solution" method="post">
    <fieldset>
        <legend>Løsning</legend>
        <label for="move-input">Ditt trekk:</label>
        <input type="text" id="move-input" name="move" 
               placeholder="f.eks. Nxf7" required>
        <button type="submit" class="btn btn--primary">Sjekk trekk</button>
    </fieldset>
</form>
```

## Chess Board Container
```html
<div class="chess-container">
    <div id="board" class="chess-board" 
         role="img" 
         aria-label="Sjakk-brett med taktisk problem">
    </div>
    <div class="board-controls">
        <button type="button" class="btn btn--outline" 
                aria-label="Vis løsning">
            Vis løsning
        </button>
    </div>
</div>
```

## Loading States
```html
<div class="loading-state" aria-live="polite">
    <p>Laster sjakk-problemer...</p>
    <div class="spinner" aria-hidden="true"></div>
</div>
```

## Error Handling
```html
<div class="error-message" role="alert" style="display: none;">
    <h3>Feil oppstod</h3>
    <p class="error-text">Kunne ikke laste sjakk-problemer</p>
    <button type="button" class="btn btn--secondary">Prøv igjen</button>
</div>
```

## Script Loading
- Place scripts at end of body
- Use appropriate loading strategies
- Handle script loading errors

```html
<!-- Essential libraries first -->
<script src="src/lib/jquery.min.js"></script>
<script src="src/lib/chess.min.js"></script>
<script src="src/lib/chessboard.min.js"></script>

<!-- Application code last -->
<script src="src/js/chesshawk.js"></script>
```
