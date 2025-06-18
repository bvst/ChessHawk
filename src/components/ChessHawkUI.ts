/**
 * ChessHawk UI Component
 * High-level UI component that combines board, controls, and game state
 */

import { createChessBoardAdapter, type ChessBoardAdapter, type ChessBoardConfig } from './ChessBoard'
import { useGameStore, type Puzzle } from '../stores/GameStore'
import type { Platform, ChessMove } from '../types'

export interface ChessHawkUIConfig {
  // Container elements
  boardElementId: string
  controlsElementId?: string
  statusElementId?: string
  
  // Board configuration
  boardConfig?: Partial<ChessBoardConfig>
  
  // UI preferences
  theme?: 'light' | 'dark' | 'auto'
  language?: 'en' | 'no'
  showControls?: boolean
  showStatus?: boolean
  
  // Platform
  platform?: Platform
  
  // Event handlers
  onPuzzleComplete?: (puzzle: Puzzle, success: boolean, timeSpent: number) => void
  onMoveAttempt?: (move: ChessMove, isCorrect: boolean) => void
  onError?: (error: Error) => void
}

export class ChessHawkUI {
  private config: ChessHawkUIConfig
  private boardAdapter: ChessBoardAdapter | null = null
  private gameStore: any
  private unsubscribe: (() => void) | null = null
  private startTime: number = 0
  private moveCount: number = 0

  constructor(config: ChessHawkUIConfig) {
    this.config = config
    this.gameStore = useGameStore
  }

  async initialize(): Promise<void> {
    try {
      // Initialize board adapter
      const boardConfig: ChessBoardConfig = {
        elementId: this.config.boardElementId,
        onMove: this.handleMove.bind(this),
        onDragStart: this.handleDragStart.bind(this),
        ...this.config.boardConfig
      }

      this.boardAdapter = createChessBoardAdapter(boardConfig, this.config.platform)
      await this.boardAdapter.initialize()

      // Subscribe to game store changes
      this.unsubscribe = this.gameStore.subscribe(
        (state: any) => state.currentPuzzle,
        (puzzle: Puzzle | null) => this.handlePuzzleChange(puzzle)
      )

      // Initialize UI elements
      await this.initializeUI()

      console.log('✅ ChessHawk UI initialized successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error(String(error))
      console.error('❌ ChessHawk UI initialization failed:', errorMessage)
      this.config.onError?.(errorMessage)
      throw errorMessage
    }
  }

  async loadPuzzle(puzzleId?: string): Promise<void> {
    try {
      this.startTime = Date.now()
      this.moveCount = 0
      
      await this.gameStore.getState().loadPuzzle(puzzleId)
      this.updateStatus('Puzzle loaded. Make your move!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to load puzzle')
      this.config.onError?.(errorMessage)
      throw errorMessage
    }
  }

  async loadRandomPuzzle(): Promise<void> {
    await this.loadPuzzle()
  }

  showHint(): void {
    const state = this.gameStore.getState()
    if (state.currentPuzzle?.hint) {
      this.updateStatus(`💡 Hint: ${state.currentPuzzle.hint}`)
    }
  }

  showSolution(): void {
    const state = this.gameStore.getState()
    if (state.currentPuzzle?.solution) {
      const solution = state.currentPuzzle.solution.join(', ')
      this.updateStatus(`🔍 Solution: ${solution}`)
      
      // Highlight solution moves
      if (this.boardAdapter && state.currentPuzzle.solution.length > 0) {
        // This is a simplified version - a full implementation would
        // step through each move in the solution
        const firstMove = state.currentPuzzle.solution[0]
        if (firstMove.length >= 4) {
          const from = firstMove.substring(0, 2)
          const to = firstMove.substring(2, 4)
          this.boardAdapter.highlightSquares([
            { square: from, color: '#ffeb3b' },
            { square: to, color: '#4caf50' }
          ])
        }
      }
    }
  }

  destroy(): void {
    this.unsubscribe?.()
    this.boardAdapter?.destroy()
    this.boardAdapter = null
    this.unsubscribe = null
  }

  private async initializeUI(): Promise<void> {
    // Initialize controls if enabled
    if (this.config.showControls !== false) {
      this.setupControls()
    }

    // Initialize status display if enabled
    if (this.config.showStatus !== false) {
      this.setupStatus()
    }

    // Apply theme
    this.applyTheme()
  }

  private setupControls(): void {
    const controlsElement = this.config.controlsElementId 
      ? document.getElementById(this.config.controlsElementId)
      : null

    if (!controlsElement) return

    controlsElement.innerHTML = `
      <div class="chess-hawk-controls">
        <button id="new-puzzle-btn" class="chess-hawk-btn chess-hawk-btn-primary">
          New Puzzle
        </button>
        <button id="hint-btn" class="chess-hawk-btn chess-hawk-btn-secondary">
          Show Hint
        </button>
        <button id="solution-btn" class="chess-hawk-btn chess-hawk-btn-secondary">
          Show Solution
        </button>
      </div>
    `

    // Add event listeners
    const newPuzzleBtn = document.getElementById('new-puzzle-btn')
    const hintBtn = document.getElementById('hint-btn')
    const solutionBtn = document.getElementById('solution-btn')

    newPuzzleBtn?.addEventListener('click', () => this.loadRandomPuzzle())
    hintBtn?.addEventListener('click', () => this.showHint())
    solutionBtn?.addEventListener('click', () => this.showSolution())
  }

  private setupStatus(): void {
    const statusElement = this.config.statusElementId 
      ? document.getElementById(this.config.statusElementId)
      : null

    if (!statusElement) return

    statusElement.innerHTML = `
      <div class="chess-hawk-status">
        <div id="puzzle-info" class="puzzle-info"></div>
        <div id="game-status" class="game-status">Ready to play!</div>
      </div>
    `
  }

  private applyTheme(): void {
    const theme = this.config.theme || 'auto'
    const isDark = theme === 'dark' || 
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    // Apply CSS custom properties for theming
    document.documentElement.style.setProperty(
      '--chess-hawk-bg-color', 
      isDark ? '#1a1a1a' : '#ffffff'
    )
    document.documentElement.style.setProperty(
      '--chess-hawk-text-color', 
      isDark ? '#ffffff' : '#000000'
    )
    document.documentElement.style.setProperty(
      '--chess-hawk-primary-color', 
      '#2196f3'
    )
  }

  private handleMove(move: ChessMove): boolean | 'snapback' {
    try {
      const state = this.gameStore.getState()
      const isValid = state.makeMove(move)
      
      this.moveCount++
      this.config.onMoveAttempt?.(move, isValid)

      if (isValid) {
        // Check if puzzle is solved
        if (state.gameStatus === 'solved') {
          const timeSpent = Math.floor((Date.now() - this.startTime) / 1000)
          this.handlePuzzleComplete(true, timeSpent)
        }
        return true
      } else {
        this.updateStatus('❌ Not the correct move. Try again!')
        return 'snapback'
      }
    } catch (error) {
      console.error('Error handling move:', error)
      return 'snapback'
    }
  }

  private handleDragStart(_source: string, _piece: string): boolean {
    const state = this.gameStore.getState()
    
    // Only allow moves when puzzle is active
    if (state.gameStatus !== 'playing') {
      return false
    }

    // Additional validation can be added here
    return true
  }

  private handlePuzzleChange(puzzle: Puzzle | null): void {
    if (!puzzle || !this.boardAdapter) return

    try {
      // Update board position
      this.boardAdapter.updatePosition(puzzle.fen)
      this.boardAdapter.clearHighlights()

      // Update puzzle info
      this.updatePuzzleInfo(puzzle)
      this.updateStatus('Make your move!')
    } catch (error) {
      console.error('Error updating puzzle:', error)
    }
  }

  private updatePuzzleInfo(puzzle: Puzzle): void {
    const infoElement = document.getElementById('puzzle-info')
    if (!infoElement) return

    infoElement.innerHTML = `
      <div class="puzzle-title">${puzzle.title}</div>
      <div class="puzzle-description">${puzzle.description}</div>
      <div class="puzzle-meta">
        <span class="difficulty">${puzzle.difficulty}</span>
        <span class="rating">${puzzle.rating}</span>
        <span class="points">${puzzle.points} pts</span>
      </div>
    `
  }

  private updateStatus(message: string): void {
    const statusElement = document.getElementById('game-status')
    if (statusElement) {
      statusElement.textContent = message
    }
  }

  private handlePuzzleComplete(success: boolean, timeSpent: number): void {
    const state = this.gameStore.getState()
    const puzzle = state.currentPuzzle

    if (puzzle) {
      this.config.onPuzzleComplete?.(puzzle, success, timeSpent)
      
      if (success) {
        this.updateStatus(`🎉 Puzzle solved in ${timeSpent} seconds with ${this.moveCount} moves!`)
      } else {
        this.updateStatus('❌ Puzzle failed. Try another one!')
      }
    }
  }
}

// CSS styles (can be injected or provided separately)
export const defaultStyles = `
.chess-hawk-controls {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.chess-hawk-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.chess-hawk-btn-primary {
  background-color: var(--chess-hawk-primary-color, #2196f3);
  color: white;
}

.chess-hawk-btn-secondary {
  background-color: #6c757d;
  color: white;
}

.chess-hawk-btn:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.chess-hawk-btn:active {
  transform: translateY(0);
}

.chess-hawk-status {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.25rem;
  background-color: var(--chess-hawk-bg-color, #f8f9fa);
  border: 1px solid #dee2e6;
}

.puzzle-info {
  margin-bottom: 0.5rem;
}

.puzzle-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.puzzle-description {
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.puzzle-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.difficulty, .rating, .points {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background-color: #e9ecef;
  color: #495057;
}

.game-status {
  font-weight: 500;
  color: var(--chess-hawk-text-color, #000);
}

.chess-highlight {
  border-radius: 3px;
}
`

// Helper function to inject styles
export function injectChessHawkStyles(): void {
  if (typeof document === 'undefined') return
  
  const existingStyle = document.getElementById('chess-hawk-styles')
  if (existingStyle) return
  
  const style = document.createElement('style')
  style.id = 'chess-hawk-styles'
  style.textContent = defaultStyles
  document.head.appendChild(style)
}