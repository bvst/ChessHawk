/**
 * Chess Hawk Components
 * Cross-platform component abstractions
 */

// Base component interfaces
export interface ChessBoardProps {
  position?: string // FEN string
  orientation?: 'white' | 'black'
  showNotation?: boolean
  pieceTheme?: string
  onMove?: (move: { from: string; to: string; promotion?: string }) => void
  onPositionChange?: (fen: string) => void
  interactive?: boolean
  highlights?: Array<{ square: string; color: string }>
}

export interface PuzzleDisplayProps {
  puzzle: Puzzle | null
  showHint?: boolean
  showSolution?: boolean
  onHintRequest?: () => void
  onSolutionRequest?: () => void
}

export interface GameControlsProps {
  onNewPuzzle?: () => void
  onResetPuzzle?: () => void
  onShowHint?: () => void
  onShowSolution?: () => void
  disabled?: boolean
}

// Abstract base classes for cross-platform components
export abstract class ChessBoardComponent {
  protected props: ChessBoardProps

  constructor(props: ChessBoardProps) {
    this.props = props
  }

  abstract render(): any
  abstract updatePosition(fen: string): void
  abstract setOrientation(orientation: 'white' | 'black'): void
  abstract highlightSquares(squares: Array<{ square: string; color: string }>): void
  abstract clearHighlights(): void
  abstract makeMove(move: { from: string; to: string; promotion?: string }): boolean
  abstract destroy(): void
}

export abstract class PuzzleDisplayComponent {
  protected props: PuzzleDisplayProps

  constructor(props: PuzzleDisplayProps) {
    this.props = props
  }

  abstract render(): any
  abstract updatePuzzle(puzzle: Puzzle | null): void
  abstract showHint(hint: string): void
  abstract showSolution(solution: string[]): void
}

export abstract class GameControlsComponent {
  protected props: GameControlsProps

  constructor(props: GameControlsProps) {
    this.props = props
  }

  abstract render(): any
  abstract setDisabled(disabled: boolean): void
  abstract updateState(state: { canReset: boolean; canShowHint: boolean; canShowSolution: boolean }): void
}

// Platform-specific implementations
export class WebChessBoard extends ChessBoardComponent {
  private board: any
  private element: HTMLElement | null = null

  constructor(props: ChessBoardProps & { elementId?: string }) {
    super(props)
  }

  async render(): Promise<HTMLElement | null> {
    if (typeof window === 'undefined') {
      throw new Error('WebChessBoard can only be used in browser environment')
    }

    try {
      // Try to load chessboard.js if available
      const ChessBoardJS = (window as any).Chessboard
      if (!ChessBoardJS) {
        throw new Error('Chessboard.js not available')
      }

      const elementId = (this.props as any).elementId || 'chess-board'
      this.element = document.getElementById(elementId)
      
      if (!this.element) {
        throw new Error(`Element with id '${elementId}' not found`)
      }

      this.board = ChessBoardJS(elementId, {
        position: this.props.position || 'start',
        orientation: this.props.orientation || 'white',
        showNotation: this.props.showNotation !== false,
        pieceTheme: this.props.pieceTheme || '/img/chesspieces/wikipedia/{piece}.png',
        onDrop: this.props.onMove ? (source: string, target: string) => {
          if (this.props.onMove) {
            this.props.onMove({ from: source, to: target })
          }
        } : undefined
      })

      return this.element
    } catch (error) {
      console.error('Failed to initialize WebChessBoard:', error)
      return null
    }
  }

  updatePosition(fen: string): void {
    if (this.board) {
      this.board.position(fen)
    }
  }

  setOrientation(orientation: 'white' | 'black'): void {
    if (this.board) {
      this.board.orientation(orientation)
    }
  }

  highlightSquares(squares: Array<{ square: string; color: string }>): void {
    // Implementation depends on chessboard.js capabilities
    console.log('Highlighting squares:', squares)
  }

  clearHighlights(): void {
    // Implementation depends on chessboard.js capabilities
    console.log('Clearing highlights')
  }

  makeMove(move: { from: string; to: string; promotion?: string }): boolean {
    if (this.board) {
      this.board.move(`${move.from}-${move.to}`)
      return true
    }
    return false
  }

  destroy(): void {
    if (this.board && this.board.destroy) {
      this.board.destroy()
    }
    this.board = null
    this.element = null
  }
}

// Component factory for creating platform-appropriate components
export class ComponentFactory {
  static createChessBoard(props: ChessBoardProps & { platform?: 'web' | 'react-native' | 'auto' }): ChessBoardComponent {
    const platform = props.platform || 'auto'
    
    if (platform === 'auto') {
      // Auto-detect platform
      if (typeof window !== 'undefined') {
        return new WebChessBoard(props)
      } else {
        throw new Error('Platform auto-detection failed. Please specify platform explicitly.')
      }
    }
    
    switch (platform) {
      case 'web':
        return new WebChessBoard(props)
      case 'react-native':
        throw new Error('React Native components not yet implemented')
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }
}

// Re-export types
import type { Puzzle } from '../stores/GameStore'
export type { Puzzle }