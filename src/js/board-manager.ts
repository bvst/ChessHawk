/**
 * ChessHawk - Board Manager
 * 
 * Håndterer sjakkbrett, interaksjon og visuell fremstilling
 * TypeScript version with proper type safety
 */

import type { ChessInstance, ChessboardInstance, ChessboardConfig } from '../types/chess-hawk';

// Color constants for square highlighting
const whiteSquareGrey = '#a9a9a9';
const blackSquareGrey = '#696969';

/**
 * BoardManager klasse for håndtering av sjakkbrett
 */
class BoardManager {
    #board: ChessboardInstance | null = null;
    #config: ChessboardConfig | null = null;
    #mobileHandlers: Map<string, EventListener> = new Map();
    // #isWaitingForOpponentMove: boolean = false; // TODO: Implement multiplayer functionality

    constructor() {
        this.#initializeConfig();
    }

    /**
     * Helper function for Chess.js compatibility across versions
     */
    #isGameOver(game: ChessInstance | null): boolean {
        if (!game) return false;
        
        // Try different method names based on Chess.js version
        if (typeof game.isGameOver === 'function') {
            return game.isGameOver();
        } else if (typeof (game as any).game_over === 'function') {
            return (game as any).game_over();
        } else if (typeof (game as any).gameOver === 'function') {
            return (game as any).gameOver();
        }
        
        // Fallback: check if there are no legal moves
        try {
            const moves = game.moves?.();
            return Array.isArray(moves) && moves.length === 0;
        } catch (error) {
            console.warn('Could not determine game over status:', error);
            return false;
        }
    }

    /**
     * Privat metode for å sette opp brettkonfigurasjon
     */
    #initializeConfig(): void {
        this.#config = {
            draggable: true,
            position: 'start',
            orientation: 'white',
            pieceTheme: 'src/img/chesspieces/wikipedia/{piece}.png',
            onDrop: this.onDrop.bind(this) as (source: string, target: string, piece: string, newPos: any, oldPos: any, orientation: string) => string,
            onSnapEnd: this.onSnapEnd.bind(this),
            onMouseoutSquare: this.onMouseoutSquare.bind(this),
            onMouseoverSquare: this.onMouseoverSquare.bind(this),
            onDragStart: this.onDragStart.bind(this)
        };
    }

    /**
     * Initialiser sjakkbrettet med konfigurasjon
     */
    initializeBoard(): ChessboardInstance {
        const boardElement = document.getElementById('myBoard');
        if (!boardElement) {
            console.error('❌ Board element #myBoard not found in DOM');
            throw new Error('Board container element not found');
        }
        
        console.log('🏁 Initializing chessboard with element:', boardElement);
        this.#board = (window as any).Chessboard('myBoard', this.#config!) as ChessboardInstance;
        
        if (!this.#board) {
            console.error('❌ Failed to create Chessboard instance');
            throw new Error('Failed to create chessboard');
        }
        
        console.log('✅ Chessboard initialized successfully');
        
        this.#initializeMobileTouchHandlers();
        return this.#board;
    }

    /**
     * Mobile touch handlers
     */
    #initializeMobileTouchHandlers(): void {
        console.log('📱 Initializing mobile touch handlers...');
        
        const boardElement = document.getElementById('myBoard');
        if (boardElement && 'ontouchstart' in window) {
            console.log('   📱 Mobile device detected - adding touch handlers');
            
            const touchStartHandler = (_e: Event) => {
                console.log('📱 Touch start on chessboard');
            };
            
            const touchMoveHandler = (e: Event) => {
                console.log('📱 Touch move on chessboard - preventing scroll');
                e.preventDefault();
                e.stopPropagation();
            };
            
            boardElement.addEventListener('touchstart', touchStartHandler, { passive: true });
            boardElement.addEventListener('touchmove', touchMoveHandler, { passive: false });
            
            this.#mobileHandlers.set('touchstart', touchStartHandler);
            this.#mobileHandlers.set('touchmove', touchMoveHandler);
            
            console.log('   ✅ Mobile touch handlers initialized');
        } else {
            console.log('   💻 Desktop device - skipping mobile touch handlers');
        }
    }

    /**
     * Get board instance
     */
    get board(): ChessboardInstance | null {
        return this.#board;
    }

    /**
     * Set board orientation
     */
    setBoardOrientation(toMove: 'w' | 'b'): void {
        console.log(`🔄 === setBoardOrientation() START ===`);
        console.log(`   🎯 Problem ID: ${(window as any).currentProblem?.id || 'UNKNOWN'}`);
        console.log(`   🔍 toMove parameter: ${toMove}`);
        
        if (!this.#board) {
            console.error('❌ ERROR - Board not initialized');
            return;
        }
        
        const orientation: 'white' | 'black' = toMove === 'b' ? 'black' : 'white';
        
        console.log(`   🎨 Setting board orientation: ${orientation}`);
        
        try {
            (this.#board as any).orientation(orientation);
            console.log(`   ✅ Board orientation updated successfully to: ${orientation}`);
        } catch (error) {
            console.error(`   ❌ ERROR setting board orientation:`, error);
        }
        
        console.log(`🔄 === setBoardOrientation() END ===`);
    }

    /**
     * Handle piece drop events
     */
    onDrop(source: string, target: string, _piece: string, _newPos: any, _oldPos: any, _orientation: string): string {
        console.log(`🎲 === onDrop() START ===`);
        console.log(`   🎯 Problem ID: ${(window as any).currentProblem?.id || 'NO PROBLEM'}`);
        console.log(`   🎲 Move attempt: ${source} → ${target}`);
        
        // Clean up dragging state
        document.body.classList.remove('dragging');
        
        // Attempt to make the move
        const game = (window as any).game as ChessInstance;
        const move = game?.move({
            from: source,
            to: target,
            promotion: 'q'
        });
        
        if (move === null) {
            console.log(`❌ === ILLEGAL MOVE ===`);
            return 'snapback';
        }
        
        console.log(`✅ === LEGAL MOVE made ===`);
        console.log(`   🎲 Move: ${move.san} (${source} → ${target})`);
        
        // Update status and check solution
        if ((window as any).updateStatus) {
            (window as any).updateStatus();
        }
        
        if ((window as any).currentProblem && Array.isArray((window as any).currentProblem.solution)) {
            setTimeout(() => {
                if ((window as any).checkSolution) {
                    (window as any).checkSolution();
                }
            }, 100);
        }
        
        console.log(`🎲 === onDrop() END ===`);
        return '';
    }

    /**
     * Handle snap end events
     */
    onSnapEnd(): void {
        const game = (window as any).game as ChessInstance;
        this.#board?.position(game?.fen() || 'start');
        document.body.classList.remove('dragging');
    }

    /**
     * Handle mouse over square events
     */
    onMouseoverSquare(square: string, _piece: string): void {
        const game = (window as any).game as ChessInstance;
        const moves = game?.moves({
            square: square,
            verbose: true
        });
        
        if (!moves || moves.length === 0) return;
        
        this.#greySquare(square);
        
        for (let i = 0; i < moves.length; i++) {
            this.#greySquare((moves[i] as any).to);
        }
    }

    /**
     * Handle mouse out square events
     */
    onMouseoutSquare(_square: string, _piece: string): void {
        this.#removeGreySquares();
    }

    /**
     * Remove grey square highlighting
     */
    #removeGreySquares(): void {
        const $ = (window as any).$;
        if ($) {
            $('#myBoard .square-55d63').css('background', '');
        }
    }

    /**
     * Add grey highlighting to a square
     */
    #greySquare(square: string): void {
        const $ = (window as any).$;
        if (!$) return;
        
        const $square = $(`#myBoard .square-${square}`);
        
        let background = whiteSquareGrey;
        if ($square.hasClass('black-3c85d')) {
            background = blackSquareGrey;
        }
        
        $square.css('background', background);
    }

    /**
     * Load position from FEN
     */
    loadPosition(fen: string): void {
        console.log(`🔄 Loading position: ${fen}`);
        
        if (!this.#board) {
            console.error('❌ Board not initialized');
            return;
        }
        
        try {
            this.#board.position(fen);
            console.log('✅ Board position updated');
        } catch (error) {
            console.error('❌ Error updating board position:', error);
        }
    }

    /**
     * Alias for loadPosition
     */
    updatePosition(fen: string): void {
        this.loadPosition(fen);
    }

    /**
     * Handle drag start events
     */
    onDragStart(source: string, piece: string, _position: Record<string, string>, _orientation: string): boolean {
        console.log(`🎯 Drag start: ${piece} from ${source}`);
        
        document.body.classList.add('dragging');
        
        const game = (window as any).game as ChessInstance;
        
        if (this.#isGameOver(game)) {
            console.log('Game is over - preventing drag');
            return false;
        }
        
        // Only allow dragging own pieces
        if ((game?.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game?.turn() === 'b' && piece.search(/^w/) !== -1)) {
            console.log('Wrong turn - preventing drag');
            return false;
        }
        
        return true;
    }

    /**
     * Cleanup method
     */
    destroy(): void {
        this.#mobileHandlers.forEach((handler, event) => {
            const boardElement = document.getElementById('myBoard');
            if (boardElement) {
                boardElement.removeEventListener(event, handler);
            }
        });
        this.#mobileHandlers.clear();
    }
}

export default BoardManager;

// Expose to global scope for compatibility
(window as any).BoardManager = BoardManager;