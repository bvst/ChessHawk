/**
 * ChessBoard Component
 * Cross-platform chess board abstraction
 */

import type { ChessMove, Platform } from '../types'

export interface ChessBoardConfig {
  position?: string // FEN string or 'start'
  orientation?: 'white' | 'black'
  showNotation?: boolean
  pieceTheme?: string
  onMove?: (move: ChessMove) => boolean | 'snapback'
  onPositionChange?: (fen: string) => void
  onDragStart?: (source: string, piece: string) => boolean
  interactive?: boolean
  highlights?: Array<{ square: string; color: string }>
  elementId?: string
}

export interface ChessBoardInstance {
  position(): string
  position(fen: string): void
  orientation(): 'white' | 'black'
  orientation(color: 'white' | 'black'): void
  move(move: string): boolean
  clear(): void
  destroy(): void
  resize(): void
  flip(): void
  fen(): string
}

export abstract class ChessBoardAdapter {
  protected config: ChessBoardConfig
  protected element: HTMLElement | null = null

  constructor(config: ChessBoardConfig) {
    this.config = config
  }

  abstract initialize(): Promise<ChessBoardInstance | null>
  abstract destroy(): void
  abstract updatePosition(fen: string): void
  abstract getPosition(): string
  abstract setOrientation(orientation: 'white' | 'black'): void
  abstract highlightSquares(squares: Array<{ square: string; color: string }>): void
  abstract clearHighlights(): void
  abstract makeMove(move: ChessMove): boolean
  abstract resize(): void
}

export class WebChessBoardAdapter extends ChessBoardAdapter {
  private board: any = null
  private highlights: HTMLElement[] = []

  async initialize(): Promise<ChessBoardInstance | null> {
    if (typeof window === 'undefined') {
      throw new Error('WebChessBoardAdapter can only be used in browser environment')
    }

    try {
      // Wait for chessboard.js to be available
      await this.waitForChessboard()

      const ChessBoardJS = (window as any).Chessboard
      if (!ChessBoardJS) {
        throw new Error('Chessboard.js not loaded')
      }

      const elementId = this.config.elementId || 'chess-board'
      this.element = document.getElementById(elementId)
      
      if (!this.element) {
        throw new Error(`Element with id '${elementId}' not found`)
      }

      // Configure the board
      const boardConfig: any = {
        position: this.config.position || 'start',
        orientation: this.config.orientation || 'white',
        showNotation: this.config.showNotation !== false,
        pieceTheme: this.config.pieceTheme || '/img/chesspieces/wikipedia/{piece}.png',
        moveSpeed: 'fast',
        snapbackSpeed: 500,
        snapSpeed: 100
      }

      // Add event handlers if provided
      if (this.config.onMove) {
        boardConfig.onDrop = (source: string, target: string, _piece: string) => {
          const move: ChessMove = { from: source, to: target }
          const result = this.config.onMove!(move)
          return result === true ? undefined : 'snapback'
        }
      }

      if (this.config.onDragStart) {
        boardConfig.onDragStart = (source: string, piece: string) => {
          return this.config.onDragStart!(source, piece)
        }
      }

      // Create the board
      this.board = ChessBoardJS(elementId, boardConfig)

      // Apply initial highlights if any
      if (this.config.highlights && this.config.highlights.length > 0) {
        this.highlightSquares(this.config.highlights)
      }

      return this.createInstance()
    } catch (error) {
      console.error('Failed to initialize WebChessBoardAdapter:', error)
      return null
    }
  }

  private async waitForChessboard(timeout = 5000): Promise<void> {
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      if ((window as any).Chessboard) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    throw new Error('Chessboard.js not available after timeout')
  }

  private createInstance(): ChessBoardInstance {
    return {
      position: (fen?: string) => {
        if (fen !== undefined) {
          this.board.position(fen)
        } else {
          return this.board.position()
        }
      },
      orientation: (color?: 'white' | 'black') => {
        if (color !== undefined) {
          this.board.orientation(color)
        } else {
          return this.board.orientation()
        }
      },
      move: (move: string) => {
        try {
          this.board.move(move)
          return true
        } catch {
          return false
        }
      },
      clear: () => {
        this.board.clear()
      },
      destroy: () => {
        this.destroy()
      },
      resize: () => {
        this.board.resize()
      },
      flip: () => {
        this.board.flip()
      },
      fen: () => {
        return this.board.fen()
      }
    }
  }

  destroy(): void {
    this.clearHighlights()
    if (this.board && this.board.destroy) {
      this.board.destroy()
    }
    this.board = null
    this.element = null
  }

  updatePosition(fen: string): void {
    if (this.board) {
      this.board.position(fen)
    }
  }

  getPosition(): string {
    return this.board ? this.board.position() : 'start'
  }

  setOrientation(orientation: 'white' | 'black'): void {
    if (this.board) {
      this.board.orientation(orientation)
    }
  }

  highlightSquares(squares: Array<{ square: string; color: string }>): void {
    this.clearHighlights()
    
    squares.forEach(({ square, color }) => {
      const squareEl = this.element?.querySelector(`[data-square="${square}"]`) as HTMLElement
      if (squareEl) {
        const highlight = document.createElement('div')
        highlight.className = 'chess-highlight'
        highlight.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: ${color};
          opacity: 0.4;
          pointer-events: none;
          z-index: 2;
        `
        
        squareEl.style.position = 'relative'
        squareEl.appendChild(highlight)
        this.highlights.push(highlight)
      }
    })
  }

  clearHighlights(): void {
    this.highlights.forEach(highlight => {
      highlight.remove()
    })
    this.highlights = []
  }

  makeMove(move: ChessMove): boolean {
    const moveStr = `${move.from}-${move.to}`
    try {
      this.board.move(moveStr)
      return true
    } catch {
      return false
    }
  }

  resize(): void {
    if (this.board && this.board.resize) {
      this.board.resize()
    }
  }
}

// Factory function for creating appropriate board adapter
export function createChessBoardAdapter(
  config: ChessBoardConfig,
  platform?: Platform
): ChessBoardAdapter {
  const targetPlatform = platform || detectPlatform()
  
  switch (targetPlatform) {
    case 'web':
    case 'electron':
      return new WebChessBoardAdapter(config)
    case 'react-native':
      throw new Error('React Native chess board adapter not yet implemented')
    default:
      throw new Error(`Unsupported platform: ${targetPlatform}`)
  }
}

function detectPlatform(): Platform {
  if (typeof window !== 'undefined') {
    if ((window as any).require && (window as any).process?.versions?.electron) {
      return 'electron'
    }
    return 'web'
  } else if (typeof global !== 'undefined' && (global as any).__DEV__ !== undefined) {
    return 'react-native'
  } else {
    return 'web'
  }
}