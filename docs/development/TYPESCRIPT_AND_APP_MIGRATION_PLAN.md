# TypeScript Migration & App-Ready Architecture Plan

## Current State Analysis

### Existing TypeScript Files (✅ Already Done)
- Core modules: `core-manager.ts`, `board-manager.ts`, `game-logic.ts`, etc.
- Test files: All test files are already `.ts`
- Type definitions: `src/types/chess-hawk.d.ts`

### JavaScript Files Requiring Migration
- **Scripts**: 8 Node.js scripts in `/scripts/` (`.js` and `.cjs`)
- **Importers**: `lichess-importer.js`, `puzzle-converter.js`, etc.
- **Validators**: `puzzle-validator.js`, `puzzle-exporter.js`

### App-Ready Architecture Considerations
Planning for future mobile/desktop app development with frameworks like:
- **React Native** (iOS/Android)
- **Electron** (Desktop)
- **Tauri** (Rust-based desktop)
- **Capacitor** (Web-to-mobile)

## Phase 1: Complete TypeScript Migration

### 1.1 Migrate Node.js Scripts
Convert all JavaScript files to TypeScript with proper typing:

```typescript
// Example: scripts/analyze-puzzles.ts
import { readFileSync } from 'fs';
import { join } from 'path';

interface PuzzleDatabase {
  version: string;
  puzzles: Puzzle[];
  // ... proper typing
}

class PuzzleAnalyzer {
  private puzzles: Puzzle[];
  
  constructor(dataPath: string) {
    const content = readFileSync(dataPath, 'utf-8');
    const data: PuzzleDatabase = JSON.parse(content);
    this.puzzles = data.puzzles;
  }
  
  // Strongly typed methods
  public analyzeQuality(): AnalysisResult {
    // Implementation with proper typing
  }
}
```

### 1.2 Enhance Type System
```typescript
// src/types/chess-hawk.d.ts - Enhanced types
export interface ChessPosition {
  fen: string;
  turn: 'w' | 'b';
  castling: string;
  enPassant: string | null;
  halfMove: number;
  fullMove: number;
}

export interface PuzzleSolution {
  moves: string[];
  evaluation: number;
  explanation: string;
}

export interface GameState {
  position: ChessPosition;
  history: Move[];
  status: 'playing' | 'solved' | 'failed';
  timeSpent: number;
}
```

### 1.3 Script Migration Priority
1. **High Priority**: `quality-lichess-import.cjs` → `quality-lichess-import.ts`
2. **Medium Priority**: Import/export utilities
3. **Low Priority**: One-time database generation scripts

## Phase 2: App-Ready Architecture

### 2.1 State Management System
Implement a modern state management pattern compatible with app frameworks:

```typescript
// src/stores/GameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface GameState {
  currentPuzzle: Puzzle | null;
  gameStatus: GameStatus;
  userStats: UserStatistics;
  settings: UserSettings;
}

interface GameActions {
  loadPuzzle: (puzzleId: string) => Promise<void>;
  makeMove: (move: string) => void;
  resetGame: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector((set, get) => ({
    // State
    currentPuzzle: null,
    gameStatus: 'menu',
    userStats: defaultStats,
    settings: defaultSettings,
    
    // Actions
    loadPuzzle: async (puzzleId: string) => {
      const puzzle = await PuzzleService.getPuzzle(puzzleId);
      set({ currentPuzzle: puzzle, gameStatus: 'playing' });
    },
    
    makeMove: (move: string) => {
      const { currentPuzzle } = get();
      // Game logic with proper state updates
    },
    
    // ... other actions
  }))
);
```

### 2.2 Service Layer Architecture
Create abstracted services for future API integration:

```typescript
// src/services/PuzzleService.ts
export interface IPuzzleService {
  getPuzzle(id: string): Promise<Puzzle>;
  getPuzzlesByTheme(theme: string): Promise<Puzzle[]>;
  getUserProgress(): Promise<UserProgress>;
  submitSolution(puzzleId: string, solution: string[]): Promise<SolutionResult>;
}

// Local implementation (current)
export class LocalPuzzleService implements IPuzzleService {
  private puzzles: Map<string, Puzzle> = new Map();
  
  async getPuzzle(id: string): Promise<Puzzle> {
    // Current JSON-based logic
  }
}

// Future API implementation
export class ApiPuzzleService implements IPuzzleService {
  private baseUrl: string;
  
  async getPuzzle(id: string): Promise<Puzzle> {
    const response = await fetch(`${this.baseUrl}/puzzles/${id}`);
    return response.json();
  }
}
```

### 2.3 Component Architecture
Design modular components compatible with multiple frameworks:

```typescript
// src/components/ChessBoard/ChessBoard.ts
export interface ChessBoardProps {
  position: string;
  orientation: 'white' | 'black';
  onMove: (move: Move) => void;
  highlightSquares?: string[];
  disabled?: boolean;
}

export abstract class ChessBoardComponent {
  protected props: ChessBoardProps;
  protected element: HTMLElement;
  
  constructor(container: HTMLElement, props: ChessBoardProps) {
    this.props = props;
    this.element = container;
    this.init();
  }
  
  abstract render(): void;
  abstract updatePosition(fen: string): void;
  abstract highlightSquares(squares: string[]): void;
  
  protected onPieceMove(from: string, to: string): void {
    const move = { from, to, piece: this.getPiece(from) };
    this.props.onMove(move);
  }
}

// React Native adapter
export class ReactNativeChessBoard extends ChessBoardComponent {
  render() {
    // React Native specific rendering
  }
}

// Web adapter  
export class WebChessBoard extends ChessBoardComponent {
  render() {
    // Current chessboard.js integration
  }
}
```

## Phase 3: Modern Tech Stack Integration

### 3.1 Build System Enhancement
```typescript
// vite.config.ts - Enhanced for app development
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChessHawk',
      formats: ['es', 'umd', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-native'],
      output: {
        globals: {
          'react': 'React',
          'react-native': 'ReactNative',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@stores': resolve(__dirname, 'src/stores'),
    },
  },
});
```

### 3.2 Package.json Enhancements
```json
{
  "name": "chess-hawk",
  "version": "3.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/chess-hawk.es.js",
      "require": "./dist/chess-hawk.umd.js"
    },
    "./components": "./dist/components/index.js",
    "./services": "./dist/services/index.js"
  },
  "files": ["dist", "src/types"],
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "zustand": "^4.4.7",
    "chess.js": "^1.0.0-alpha.0",
    "@chrisoakman/chessboardjs": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "tsx": "^4.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:lib": "vite build --mode lib",
    "test": "vitest",
    "analyze": "tsx scripts/analyze-puzzles.ts",
    "import:lichess": "tsx scripts/quality-lichess-import.ts"
  }
}
```

### 3.3 App Framework Compatibility

#### React Native Integration
```typescript
// src/platforms/react-native/ChessHawkApp.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChessHawkCore } from '../../core';
import { useGameStore } from '../../stores/GameStore';

export const ChessHawkApp: React.FC = () => {
  const { currentPuzzle, gameStatus } = useGameStore();
  
  return (
    <View style={styles.container}>
      {/* React Native UI components */}
    </View>
  );
};
```

#### Electron Integration
```typescript
// src/platforms/electron/main.ts
import { app, BrowserWindow } from 'electron';
import { join } from 'path';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('dist/index.html');
}
```

## Phase 4: Advanced App Features

### 4.1 Offline-First Architecture
```typescript
// src/services/OfflineService.ts
export class OfflineService {
  private db: IDBDatabase;
  
  async cachePuzzles(puzzles: Puzzle[]): Promise<void> {
    // IndexedDB storage for offline play
  }
  
  async syncWithServer(): Promise<void> {
    // Background sync when online
  }
}
```

### 4.2 Real-time Features
```typescript
// src/services/RealtimeService.ts
export class RealtimeService {
  private socket: WebSocket;
  
  async joinMultiplayerGame(gameId: string): Promise<void> {
    // WebSocket connection for multiplayer
  }
  
  async broadcastMove(move: Move): Promise<void> {
    // Real-time move sharing
  }
}
```

### 4.3 Analytics Integration
```typescript
// src/services/AnalyticsService.ts
export class AnalyticsService {
  trackPuzzleSolved(puzzleId: string, timeSpent: number, attempts: number): void {
    // Track user performance
  }
  
  trackUserProgress(stats: UserStatistics): void {
    // Progress analytics
  }
}
```

## Implementation Timeline

### Phase 1: TypeScript Migration (1-2 weeks)
- [ ] Migrate scripts to TypeScript
- [ ] Enhance type definitions
- [ ] Update build system for TypeScript

### Phase 2: Architecture Modernization (2-3 weeks)
- [ ] Implement state management
- [ ] Create service layer abstraction
- [ ] Design component architecture
- [ ] Add platform adapters

### Phase 3: App Framework Setup (2-3 weeks)
- [ ] React Native project setup
- [ ] Electron project setup
- [ ] Shared core library configuration
- [ ] Cross-platform testing

### Phase 4: Advanced Features (3-4 weeks)
- [ ] Offline functionality
- [ ] Real-time features
- [ ] Analytics integration
- [ ] Performance optimization

## Technology Recommendations

### Immediate Adoption
1. **TypeScript 5.3+** - Complete migration
2. **Zustand** - Lightweight state management
3. **Vite** - Modern build tool (already using)
4. **Vitest** - Testing framework (already using)

### Future App Development
1. **React Native** - Cross-platform mobile
2. **Expo** - Simplified React Native development
3. **Electron** - Desktop applications
4. **Tauri** - Alternative Rust-based desktop
5. **tRPC** - Type-safe API layer
6. **Prisma** - Database ORM for future backend

### Infrastructure
1. **Supabase** - Backend-as-a-service
2. **Vercel** - Edge deployment
3. **Railway** - Container hosting
4. **WebSocket** - Real-time features

## Benefits of This Architecture

### Development Benefits
- **Type Safety**: Catch errors at compile time
- **Code Reuse**: Shared logic across platforms
- **Maintainability**: Clear separation of concerns
- **Testability**: Modular, injectable dependencies

### Future App Benefits
- **Cross-Platform**: Write once, deploy everywhere
- **Offline-First**: Works without internet
- **Real-time**: Multiplayer capabilities
- **Scalable**: Ready for user growth
- **Modern UX**: Native app performance

### Business Benefits
- **Faster Development**: Shared codebase
- **Lower Costs**: One team, multiple platforms
- **Better UX**: Native app experiences
- **Market Reach**: iOS, Android, Desktop, Web

This architecture positions Chess Hawk for future growth while maintaining current web functionality and improving code quality through TypeScript adoption.