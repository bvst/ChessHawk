---
applyTo: '**/*.css'
---

# Chess Hawk CSS Styling Standards

## File Organization
- **Main Styles**: `src/css/styles.css` - all application styling
- **Library Styles**: `src/lib/chessboard.min.css` - chessboard styling

## CSS Standards
- Mobile-first responsive design
- Use CSS Grid and Flexbox for layouts
- Maintain existing color scheme and branding
- Ensure accessibility (contrast, focus states)
- Keep styles modular and well-commented

## Color Scheme
```css
/* Chess Hawk brand colors */
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --accent-color: #e74c3c;
    --background-color: #ecf0f1;
    --text-color: #2c3e50;
    --board-light: #f0d9b5;
    --board-dark: #b58863;
}
```

## Responsive Design
```css
/* Mobile first approach */
.container {
    width: 100%;
    padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .chess-board {
        max-width: 400px;
    }
}
```

## Component Naming
Use BEM methodology for consistent naming:
```css
/* Block */
.chess-app { }

/* Element */
.chess-app__board { }
.chess-app__controls { }
.chess-app__problem-info { }

/* Modifier */
.chess-app__board--mobile { }
.chess-app__button--primary { }
.chess-app__button--disabled { }
```

## Accessibility Requirements
- Minimum contrast ratio 4.5:1 for text
- Focus indicators for all interactive elements
- Sufficient touch targets (minimum 44px)
- Screen reader friendly markup

## Performance Optimization
- Use efficient selectors
- Minimize specificity conflicts
- Avoid unnecessary reflows
- Optimize for mobile performance

## Chess Board Styling
- Maintain proper aspect ratio
- Ensure pieces are clearly visible
- Support both light and dark themes
- Handle different screen sizes gracefully

## Layout Guidelines
```css
/* Flexbox for navigation */
.nav-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

/* Grid for main layout */
.main-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
}

@media (min-width: 768px) {
    .main-layout {
        grid-template-columns: 1fr 300px;
    }
}
```

## Button Styling
```css
.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn--primary {
    background-color: var(--primary-color);
    color: white;
}

.btn--primary:hover {
    background-color: var(--secondary-color);
}

.btn--primary:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
}
```
