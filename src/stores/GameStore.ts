/**
 * Chess Hawk Game Store
 * Centralized state management using Zustand for app-ready architecture
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UserProgress, SolutionResult, PuzzleFilter } from '../services/PuzzleService';

export interface Puzzle {
  id: string;
  theme: string;
  title: string;
  description: string;
  fen: string;
  solution: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  points: number;
  hint: string;
  tags: string[];
  source: string;
  createdAt: string;
}

export interface Move {
  from: string;
  to: string;
  piece: string;
  san: string;
  lan: string;
  promotion?: string;
}

export interface UserStatistics {
  puzzlesSolved: number;
  totalAttempts: number;
  averageRating: number;
  totalTimeSpent: number; // in seconds
  streakCurrent: number;
  streakBest: number;
  themeStats: Record<string, {
    solved: number;
    attempts: number;
    averageTime: number;
  }>;
  difficultyStats: Record<string, {
    solved: number;
    attempts: number;
    successRate: number;
  }>;
}

export interface UserSettings {
  boardOrientation: 'white' | 'black';
  pieceTheme: 'classic' | 'neo' | 'alpha';
  boardTheme: 'brown' | 'blue' | 'green' | 'purple';
  soundEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  showCoordinates: boolean;
  showHints: boolean;
  autoPromoteQueen: boolean;
  language: 'no' | 'en';
  difficulty: 'auto' | 'beginner' | 'intermediate' | 'advanced';
  preferredThemes: string[];
}

export type GameStatus = 'menu' | 'loading' | 'playing' | 'solved' | 'failed' | 'paused';

export interface GameState {
  // Current game state
  currentPuzzle: Puzzle | null;
  gameStatus: GameStatus;
  position: string; // Current FEN
  moveHistory: Move[];
  timeStarted: number | null;
  timeSpent: number;
  attemptsCount: number;
  hintsUsed: number;
  
  // User data
  userStats: UserStatistics;
  settings: UserSettings;
  
  // UI state
  selectedSquare: string | null;
  highlightedSquares: string[];
  lastMove: Move | null;
  showSolution: boolean;
  errorMessage: string | null;
  
  // Puzzle collection
  availablePuzzles: Puzzle[];
  filteredPuzzles: Puzzle[];
  currentPuzzleIndex: number;
}

export interface GameActions {
  // Puzzle management
  loadPuzzle: (puzzleId?: string) => Promise<void>;
  loadNextPuzzle: () => Promise<void>;
  loadRandomPuzzle: (theme?: string, difficulty?: string) => Promise<void>;
  
  // Game actions
  makeMove: (move: Move) => void;
  undoMove: () => void;
  resetPuzzle: () => void;
  showHint: () => void;
  solvePuzzle: () => void;
  
  // Game control
  pauseGame: () => void;
  resumeGame: () => void;
  startNewGame: () => void;
  
  // Settings
  updateSettings: (settings: Partial<UserSettings>) => void;
  
  // Statistics
  updateStats: (puzzleId: string, solved: boolean, timeSpent: number, attempts: number) => void;
  resetStats: () => void;
  
  // UI actions
  setSelectedSquare: (square: string | null) => void;
  setHighlightedSquares: (squares: string[]) => void;
  setErrorMessage: (message: string | null) => void;
  
  // Puzzle collection
  loadPuzzleDatabase: () => Promise<void>;
  filterPuzzles: (theme?: string, difficulty?: string) => void;
}

const defaultSettings: UserSettings = {
  boardOrientation: 'white',
  pieceTheme: 'classic',
  boardTheme: 'brown',
  soundEnabled: true,
  animationSpeed: 'normal',
  showCoordinates: true,
  showHints: true,
  autoPromoteQueen: true,
  language: 'no',
  difficulty: 'auto',
  preferredThemes: []
};

const defaultStats: UserStatistics = {
  puzzlesSolved: 0,
  totalAttempts: 0,
  averageRating: 0,
  totalTimeSpent: 0,
  streakCurrent: 0,
  streakBest: 0,
  themeStats: {},
  difficultyStats: {}
};

export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentPuzzle: null,
    gameStatus: 'menu',
    position: '',
    moveHistory: [],
    timeStarted: null,
    timeSpent: 0,
    attemptsCount: 0,
    hintsUsed: 0,
    
    userStats: defaultStats,
    settings: defaultSettings,
    
    selectedSquare: null,
    highlightedSquares: [],
    lastMove: null,
    showSolution: false,
    errorMessage: null,
    
    availablePuzzles: [],
    filteredPuzzles: [],
    currentPuzzleIndex: 0,
    
    // Actions
    loadPuzzle: async (puzzleId?: string) => {
      set({ gameStatus: 'loading' });
      
      try {
        // In a real implementation, this would load from PuzzleService
        const { availablePuzzles, currentPuzzleIndex } = get();
        
        let puzzle: Puzzle | null = null;
        
        if (puzzleId) {
          puzzle = availablePuzzles.find(p => p.id === puzzleId) || null;
        } else if (availablePuzzles.length > 0) {
          puzzle = availablePuzzles[currentPuzzleIndex] || availablePuzzles[0] || null;
        }
        
        if (puzzle) {
          set({
            currentPuzzle: puzzle,
            position: puzzle.fen,
            gameStatus: 'playing',
            moveHistory: [],
            timeStarted: Date.now(),
            timeSpent: 0,
            attemptsCount: 0,
            hintsUsed: 0,
            showSolution: false,
            errorMessage: null,
            selectedSquare: null,
            highlightedSquares: []
          });
        } else {
          set({ 
            gameStatus: 'menu',
            errorMessage: 'No puzzle found'
          });
        }
      } catch (error) {
        set({ 
          gameStatus: 'menu',
          errorMessage: `Failed to load puzzle: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
    
    loadNextPuzzle: async () => {
      const { availablePuzzles, currentPuzzleIndex } = get();
      const nextIndex = (currentPuzzleIndex + 1) % availablePuzzles.length;
      
      set({ currentPuzzleIndex: nextIndex });
      await get().loadPuzzle();
    },
    
    loadRandomPuzzle: async (theme?: string, difficulty?: string) => {
      const { availablePuzzles } = get();
      
      let candidates = availablePuzzles;
      
      if (theme) {
        candidates = candidates.filter(p => p.theme === theme);
      }
      
      if (difficulty) {
        candidates = candidates.filter(p => p.difficulty === difficulty);
      }
      
      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const randomPuzzle = candidates[randomIndex];
        if (randomPuzzle) {
          await get().loadPuzzle(randomPuzzle.id);
        }
      }
    },
    
    makeMove: (move: Move) => {
      const { currentPuzzle, gameStatus, moveHistory, timeStarted } = get();
      
      if (gameStatus !== 'playing' || !currentPuzzle) return;
      
      const newHistory = [...moveHistory, move];
      const solutionMove = currentPuzzle.solution[moveHistory.length];
      
      // Check if the move matches the solution
      if (move.san === solutionMove || move.lan === solutionMove) {
        // Correct move
        set({
          moveHistory: newHistory,
          lastMove: move,
          attemptsCount: get().attemptsCount + 1
        });
        
        // Check if puzzle is solved
        if (newHistory.length >= currentPuzzle.solution.length) {
          const timeSpent = timeStarted ? Math.floor((Date.now() - timeStarted) / 1000) : 0;
          
          set({ 
            gameStatus: 'solved',
            timeSpent
          });
          
          // Update statistics
          get().updateStats(currentPuzzle.id, true, timeSpent, get().attemptsCount);
        }
      } else {
        // Incorrect move
        set({
          attemptsCount: get().attemptsCount + 1,
          errorMessage: 'Ikke riktig trekk. Prøv igjen!'
        });
        
        // Clear error after 2 seconds
        setTimeout(() => {
          set({ errorMessage: null });
        }, 2000);
      }
    },
    
    undoMove: () => {
      const { moveHistory } = get();
      if (moveHistory.length > 0) {
        const newHistory = moveHistory.slice(0, -1);
        set({
          moveHistory: newHistory,
          lastMove: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null
        });
      }
    },
    
    resetPuzzle: () => {
      const { currentPuzzle } = get();
      if (currentPuzzle) {
        set({
          position: currentPuzzle.fen,
          moveHistory: [],
          gameStatus: 'playing',
          timeStarted: Date.now(),
          timeSpent: 0,
          attemptsCount: 0,
          hintsUsed: 0,
          showSolution: false,
          errorMessage: null,
          selectedSquare: null,
          highlightedSquares: [],
          lastMove: null
        });
      }
    },
    
    showHint: () => {
      const { currentPuzzle, moveHistory, hintsUsed } = get();
      if (currentPuzzle && moveHistory.length < currentPuzzle.solution.length) {
        const nextMove = currentPuzzle.solution[moveHistory.length];
        
        set({
          hintsUsed: hintsUsed + 1,
          errorMessage: `Hint: Prøv ${nextMove}`
        });
        
        // Clear hint after 3 seconds
        setTimeout(() => {
          set({ errorMessage: null });
        }, 3000);
      }
    },
    
    solvePuzzle: () => {
      const { currentPuzzle, timeStarted } = get();
      if (currentPuzzle) {
        const timeSpent = timeStarted ? Math.floor((Date.now() - timeStarted) / 1000) : 0;
        
        set({
          gameStatus: 'solved',
          showSolution: true,
          timeSpent
        });
        
        // Update statistics (marked as failed since user gave up)
        get().updateStats(currentPuzzle.id, false, timeSpent, get().attemptsCount);
      }
    },
    
    pauseGame: () => {
      const { gameStatus } = get();
      if (gameStatus === 'playing') {
        set({ gameStatus: 'paused' });
      }
    },
    
    resumeGame: () => {
      const { gameStatus } = get();
      if (gameStatus === 'paused') {
        set({ gameStatus: 'playing' });
      }
    },
    
    startNewGame: () => {
      set({
        currentPuzzle: null,
        gameStatus: 'menu',
        position: '',
        moveHistory: [],
        timeStarted: null,
        timeSpent: 0,
        attemptsCount: 0,
        hintsUsed: 0,
        showSolution: false,
        errorMessage: null,
        selectedSquare: null,
        highlightedSquares: [],
        lastMove: null
      });
    },
    
    updateSettings: (newSettings: Partial<UserSettings>) => {
      set(state => ({
        settings: { ...state.settings, ...newSettings }
      }));
    },
    
    updateStats: (_puzzleId: string, solved: boolean, timeSpent: number, attempts: number) => {
      const { currentPuzzle, userStats: _userStats } = get();
      if (!currentPuzzle) return;
      
      const theme = currentPuzzle.theme;
      const difficulty = currentPuzzle.difficulty;
      
      set(state => ({
        userStats: {
          ...state.userStats,
          puzzlesSolved: solved ? state.userStats.puzzlesSolved + 1 : state.userStats.puzzlesSolved,
          totalAttempts: state.userStats.totalAttempts + attempts,
          totalTimeSpent: state.userStats.totalTimeSpent + timeSpent,
          streakCurrent: solved ? state.userStats.streakCurrent + 1 : 0,
          streakBest: solved && (state.userStats.streakCurrent + 1) > state.userStats.streakBest 
            ? state.userStats.streakCurrent + 1 
            : state.userStats.streakBest,
          themeStats: {
            ...state.userStats.themeStats,
            [theme]: {
              solved: (state.userStats.themeStats[theme]?.solved || 0) + (solved ? 1 : 0),
              attempts: (state.userStats.themeStats[theme]?.attempts || 0) + attempts,
              averageTime: state.userStats.themeStats[theme] 
                ? (state.userStats.themeStats[theme].averageTime + timeSpent) / 2
                : timeSpent
            }
          },
          difficultyStats: {
            ...state.userStats.difficultyStats,
            [difficulty]: {
              solved: (state.userStats.difficultyStats[difficulty]?.solved || 0) + (solved ? 1 : 0),
              attempts: (state.userStats.difficultyStats[difficulty]?.attempts || 0) + attempts,
              successRate: state.userStats.difficultyStats[difficulty]
                ? ((state.userStats.difficultyStats[difficulty].solved + (solved ? 1 : 0)) / 
                   (state.userStats.difficultyStats[difficulty].attempts + attempts)) * 100
                : solved ? 100 : 0
            }
          }
        }
      }));
    },
    
    resetStats: () => {
      set({ userStats: defaultStats });
    },
    
    setSelectedSquare: (square: string | null) => {
      set({ selectedSquare: square });
    },
    
    setHighlightedSquares: (squares: string[]) => {
      set({ highlightedSquares: squares });
    },
    
    setErrorMessage: (message: string | null) => {
      set({ errorMessage: message });
    },
    
    loadPuzzleDatabase: async () => {
      try {
        // In a real implementation, this would use PuzzleService
        const response = await fetch('/src/data/problems.json');
        const data = await response.json();
        
        set({
          availablePuzzles: data.puzzles || [],
          filteredPuzzles: data.puzzles || []
        });
      } catch (error) {
        console.error('Failed to load puzzle database:', error);
        set({
          errorMessage: 'Failed to load puzzles'
        });
      }
    },
    
    filterPuzzles: (theme?: string, difficulty?: string) => {
      const { availablePuzzles } = get();
      
      let filtered = availablePuzzles;
      
      if (theme) {
        filtered = filtered.filter(p => p.theme === theme);
      }
      
      if (difficulty) {
        filtered = filtered.filter(p => p.difficulty === difficulty);
      }
      
      set({ filteredPuzzles: filtered });
    }
  }))
);

// Selectors for common state combinations
export const useCurrentGame = () => {
  return useGameStore(state => ({
    puzzle: state.currentPuzzle,
    status: state.gameStatus,
    position: state.position,
    timeSpent: state.timeSpent,
    attempts: state.attemptsCount
  }));
};

export const useUserProgress = () => {
  return useGameStore(state => ({
    stats: state.userStats,
    settings: state.settings
  }));
};

export const useBoardState = () => {
  return useGameStore(state => ({
    position: state.position,
    selectedSquare: state.selectedSquare,
    highlightedSquares: state.highlightedSquares,
    lastMove: state.lastMove,
    orientation: state.settings.boardOrientation
  }));
};

// Additional types
export interface UserStats {
  totalSolved: number;
  totalAttempts: number;
  averageTime: number;
  averageScore: number;
  streakCurrent: number;
  streakBest: number;
}

export interface ThemeProgress {
  solved: number;
  total: number;
  averageRating: number;
}

// Re-export types for external use
export type { UserProgress, SolutionResult, PuzzleFilter };