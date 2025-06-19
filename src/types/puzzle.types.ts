/**
 * Concrete Puzzle Types - Production Ready
 * Strict type definitions for puzzle data with no optionals
 */

// Core puzzle difficulty levels - no room for ambiguity
export type PuzzleDifficulty = 'beginner' | 'intermediate' | 'advanced';

// Tactical themes - exhaustive and concrete
export type TacticalTheme = 
  | 'fork' 
  | 'pin' 
  | 'skewer' 
  | 'mateIn1' 
  | 'mateIn2' 
  | 'mateIn3'
  | 'sacrifice' 
  | 'deflection' 
  | 'decoy' 
  | 'discoveredAttack'
  | 'endgame'
  | 'middlegame'
  | 'opening'
  | 'short'
  | 'long'
  | 'crushing'
  | 'quiet'
  | 'brilliant'
  | 'attraction'
  | 'clearance'
  | 'interference'
  | 'removeDefender'
  | 'doubleCheck'
  | 'exposedKing'
  | 'backRankMate'
  | 'smotheredMate';

// Puzzle source - only trusted sources allowed
export type PuzzleSource = 'Lichess' | 'ChessTempo' | 'Chess.com' | 'Curated';

// FEN validation type - ensures proper chess position format
export type ValidFEN = `${string}/${string}/${string}/${string}/${string}/${string}/${string}/${string} ${('w'|'b')} ${string} ${string} ${number} ${number}`;

// Chess move in algebraic notation - strict format
export type ChessMove = string & { __brand: 'ChessMove' };

// Concrete puzzle interface - ALL fields required
export interface Puzzle {
  readonly id: string;
  readonly theme: TacticalTheme;
  readonly title: string;
  readonly description: string;
  readonly fen: string; // Should be ValidFEN but keeping string for compatibility
  readonly solution: readonly ChessMove[];
  readonly difficulty: PuzzleDifficulty;
  readonly rating: number;
  readonly points: number;
  readonly hint: string;
  readonly tags: readonly string[];
  readonly source: PuzzleSource;
  readonly lichessUrl: string;
  readonly createdAt: string; // ISO date string
}

// Database structure - concrete and validated
export interface PuzzleDatabase {
  readonly version: string;
  readonly generated: string; // ISO date string
  readonly totalPuzzles: number;
  readonly source: string;
  readonly importMethod: string;
  readonly stats: ImportStatistics;
  readonly puzzles: readonly Puzzle[];
}

// Import statistics - all numbers required
export interface ImportStatistics {
  readonly attempted: number;
  readonly successful: number;
  readonly failed: number;
  readonly duplicates: number;
  readonly errors: readonly ImportError[];
}

// Import error structure
export interface ImportError {
  readonly id: string;
  readonly error: string;
}

// Puzzle filter for searching/querying
export interface PuzzleFilter {
  readonly theme?: TacticalTheme;
  readonly difficulty?: PuzzleDifficulty;
  readonly minRating?: number;
  readonly maxRating?: number;
  readonly tags?: readonly string[];
  readonly limit?: number;
  readonly offset?: number;
}

// User progress tracking
export interface UserProgress {
  readonly userId: string;
  readonly puzzlesSolved: number;
  readonly totalAttempts: number;
  readonly averageTime: number;
  readonly bestStreak: number;
  readonly currentStreak: number;
  readonly lastSolved: string; // ISO date string
}

// Solution submission result
export interface SolutionResult {
  readonly isCorrect: boolean;
  readonly timeSpent: number;
  readonly attempts: number;
  readonly score: number;
  readonly nextPuzzleId?: string;
}

// Type guards for runtime validation
export const isPuzzleDifficulty = (value: string): value is PuzzleDifficulty => {
  return ['beginner', 'intermediate', 'advanced'].includes(value);
};

export const isTacticalTheme = (value: string): value is TacticalTheme => {
  const themes: readonly TacticalTheme[] = [
    'fork', 'pin', 'skewer', 'mateIn1', 'mateIn2', 'mateIn3',
    'sacrifice', 'deflection', 'decoy', 'discoveredAttack',
    'endgame', 'middlegame', 'opening', 'short', 'long',
    'crushing', 'quiet', 'brilliant', 'attraction', 'clearance',
    'interference', 'removeDefender', 'doubleCheck', 'exposedKing',
    'backRankMate', 'smotheredMate'
  ] as const;
  return themes.includes(value as TacticalTheme);
};

export const isPuzzleSource = (value: string): value is PuzzleSource => {
  return ['Lichess', 'ChessTempo', 'Chess.com', 'Curated'].includes(value);
};

// Validation functions
export const validatePuzzle = (obj: unknown): obj is Puzzle => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const puzzle = obj as Record<string, unknown>;
  
  // Check all required fields exist and have correct types
  return (
    typeof puzzle.id === 'string' &&
    typeof puzzle.title === 'string' &&
    typeof puzzle.description === 'string' &&
    typeof puzzle.fen === 'string' &&
    typeof puzzle.difficulty === 'string' && isPuzzleDifficulty(puzzle.difficulty) &&
    typeof puzzle.theme === 'string' && isTacticalTheme(puzzle.theme) &&
    typeof puzzle.rating === 'number' &&
    typeof puzzle.points === 'number' &&
    typeof puzzle.hint === 'string' &&
    typeof puzzle.source === 'string' && isPuzzleSource(puzzle.source) &&
    typeof puzzle.lichessUrl === 'string' &&
    typeof puzzle.createdAt === 'string' &&
    Array.isArray(puzzle.solution) && puzzle.solution.every(move => typeof move === 'string') &&
    Array.isArray(puzzle.tags) && puzzle.tags.every(tag => typeof tag === 'string')
  );
};

export const validatePuzzleDatabase = (obj: unknown): obj is PuzzleDatabase => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const db = obj as Record<string, unknown>;
  
  return (
    typeof db.version === 'string' &&
    typeof db.generated === 'string' &&
    typeof db.totalPuzzles === 'number' &&
    typeof db.source === 'string' &&
    typeof db.importMethod === 'string' &&
    typeof db.stats === 'object' && db.stats !== null &&
    Array.isArray(db.puzzles) && db.puzzles.every(validatePuzzle)
  );
};