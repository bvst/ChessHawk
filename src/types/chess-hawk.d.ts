/**
 * Chess Hawk Type Definitions
 */

// Chess.js types (if not available from @types/chess.js)
export interface ChessMove {
  color: 'w' | 'b';
  from: string;
  to: string;
  piece: string;
  captured?: string;
  promotion?: string;
  flags: string;
  san: string;
  lan: string;
  before: string;
  after: string;
}

export interface ChessInstance {
  load(fen: string): boolean;
  reset(): void;
  moves(options?: { verbose?: boolean; square?: string }): string[] | ChessMove[];
  move(move: string | { from: string; to: string; promotion?: string }): ChessMove | null;
  undo(): ChessMove | null;
  fen(): string;
  turn(): 'w' | 'b';
  isCheck(): boolean;
  isCheckmate(): boolean;
  isStalemate(): boolean;
  isDraw(): boolean;
  isGameOver(): boolean;
  get(square: string): { type: string; color: string } | null;
  put(piece: { type: string; color: string }, square: string): boolean;
  remove(square: string): { type: string; color: string } | null;
  ascii(): string;
  history(options?: { verbose?: boolean }): string[] | ChessMove[];
  pgn(): string;
  header(): Record<string, string>;
}

// Chessboard.js types
export interface ChessboardConfig {
  position?: string | 'start';
  orientation?: 'white' | 'black';
  draggable?: boolean;
  dropOffBoard?: 'snapback' | 'trash';
  onDragStart?: (source: string, piece: string, position: any, orientation: string) => boolean;
  onDrop?: (source: string, target: string, piece: string, newPos: any, oldPos: any, orientation: string) => string;
  onMoveEnd?: (oldPos: any, newPos: any) => void;
  onSnapEnd?: () => void;
  onMouseoverSquare?: (square: string, piece: string) => void;
  onMouseoutSquare?: (square: string, piece: string) => void;
  pieceTheme?: string;
  showNotation?: boolean;
  sparePieces?: boolean;
}

export interface ChessboardInstance {
  clear(): void;
  destroy(): void;
  fen(): string;
  flip(): void;
  move(moves: string | string[]): void;
  position(): any;
  position(fen: string): void;
  position(fen: string, useAnimation: boolean): void;
  resize(): void;
  start(): void;
}

// Chess Hawk specific types
export interface ChessPuzzle {
  id: string;
  type: string;
  title: string;
  description: string;
  fen: string;
  solution: string[];
  hints?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  theme?: string;
  points: number;
  rating: number;
  source?: string;
  tags?: string[];
  createdAt?: string;
}

export interface GameState {
  initialized: boolean;
  currentProblem: ChessPuzzle | null;
  score: number;
  totalProblems: number;
  solvedProblems: number;
}

export interface ModuleManager {
  initialized: boolean;
  modules: Map<string, any>;
}

// UI Manager types
export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type?: FeedbackType;
  duration?: number;
  persistent?: boolean;
}

// Manager interfaces
export interface IBoardManager {
  initialized: boolean;
  initializeBoard(): Promise<void>;
  updatePosition(fen: string): void;
  resetBoard(): void;
  flipBoard(): void;
}

export interface IProblemManager {
  problems: ChessPuzzle[];
  currentProblem: ChessPuzzle | null;
  loadProblems(): Promise<ChessPuzzle[]>;
  getRandomProblem(): ChessPuzzle | null;
  displayProblem(problem: ChessPuzzle): void;
}

export interface IGameLogic {
  game: ChessInstance | null;
  initialized: boolean;
  initializeGame(): void;
  makeMove(move: string): ChessMove | null;
  isValidMove(move: string): boolean;
  checkSolution(moves: string[]): boolean;
}

export interface IUIManager {
  showFeedback(message: string, type?: FeedbackType, duration?: number): void;
  clearFeedback(): void;
  showSolution(): void;
  clearSolution(): void;
  updateGameStatus(status: string): void;
  updateProblemDisplay(problem: ChessPuzzle): void;
}

export interface IDebugTools {
  analyzeProblems(): void;
  logGameState(): void;
  exportGameData(): any;
}

// Global declarations
declare global {
  interface Window {
    Chess: new (fen?: string) => ChessInstance;
    Chessboard: new (containerId: string, config: ChessboardConfig) => ChessboardInstance;
    $: typeof import('jquery');
    jQuery: typeof import('jquery');
    
    // Chess Hawk globals
    coreManager?: any;
    boardManager?: IBoardManager;
    problemManager?: IProblemManager;
    gameLogic?: IGameLogic;
    uiManager?: IUIManager;
    debugTools?: IDebugTools;
    currentProblem?: ChessPuzzle | null;
  }
}

export {};