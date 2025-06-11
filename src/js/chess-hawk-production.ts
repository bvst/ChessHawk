/**
 * ChessHawk - Production Entry Point
 * 
 * Single entry point that initializes the application in production mode
 * where dependencies are loaded via script tags instead of ES modules
 */

// Import all modules for bundling
import BoardManager from './board-manager';
import ProblemManager from './problem-manager';
import GameLogic from './game-logic';
import UIManager from './ui-manager';
import DebugTools from './debug-tools';

// Production chess integration
import './chess-global-production';

import type { ChessInstance, ChessPuzzle, GameState, ModuleManager } from '../types/chess-hawk';

/**
 * Production-compatible CoreManager
 */
class ProductionCoreManager implements ModuleManager {
    // Private fields
    #initialized: boolean = false;
    #modules: Map<string, any> = new Map();
    #abortController: AbortController | null = null;
    #initRetries: number = 0;
    #maxRetries: number = 5;
    #gameState: GameState = {
        initialized: false,
        currentProblem: null,
        score: 0,
        totalProblems: 0,
        solvedProblems: 0
    };
    
    // Core game instances
    #game: ChessInstance | null = null;
    #board: any = null;
    
    // Public properties for interface compliance
    initialized: boolean = false;
    modules: Map<string, any> = new Map();

    constructor() {
        console.log('🚀 ChessHawk Production Mode - CoreManager initialized');
        
        this.#initializeModules();
        this.#loadPersistedState();
        
        // Wait for DOM and Chess.js to be ready
        this.#waitForEnvironmentAndInit();
    }
    
    /**
     * Wait for production environment to be ready
     */
    async #waitForEnvironmentAndInit(): Promise<void> {
        try {
            // Check if Chess.js is available globally
            if (typeof window.Chess === 'undefined' && typeof Chess === 'undefined') {
                console.warn('⚠️ Chess.js not yet loaded, waiting...');
                setTimeout(() => this.#waitForEnvironmentAndInit(), 100);
                return;
            }
            
            console.log('♟️ Chess.js available in production mode');
            
            // Start initialization when DOM is ready
            this.#ensureDOMReady();
        } catch (error) {
            console.error('❌ Failed to initialize production environment:', error);
            this.handleError(error, 'Production Environment Setup');
        }
    }

    /**
     * Ensure DOM is ready before initialization
     */
    #ensureDOMReady(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📄 DOM content loaded, starting production initialization...');
                setTimeout(() => this.init(), 100);
            });
        } else if (document.readyState === 'interactive') {
            console.log('📄 DOM interactive, waiting for complete...');
            setTimeout(() => this.init(), 200);
        } else {
            console.log('📄 DOM already complete, starting production initialization...');
            setTimeout(() => this.init(), 50);
        }
    }

    /**
     * Initialize all modules
     */
    #initializeModules(): void {
        this.#modules.set('board', new BoardManager());
        this.#modules.set('problems', new ProblemManager());
        this.#modules.set('gameLogic', new GameLogic());
        this.#modules.set('ui', new UIManager());
        this.#modules.set('debug', new DebugTools());
        
        this.modules = this.#modules;
        console.log('📦 All modules initialized for production');
    }

    /**
     * Main initialization method
     */
    async init(): Promise<void> {
        if (this.#initialized) {
            console.warn('⚠️ CoreManager already initialized');
            return;
        }

        console.log('🚀 === ChessHawk PRODUCTION INITIALIZATION START ===');
        
        try {
            // Check required libraries
            console.log('   📚 Checking required libraries...');
            if (!this.#checkLibraries()) {
                throw new Error('Required libraries not loaded');
            }
            
            // Initialize Chess.js game using global Chess
            console.log('   ♟️ Initializing Chess.js game...');
            const ChessConstructor = window.Chess || (window as any).Chess || Chess;
            this.#game = new ChessConstructor() as ChessInstance;
            
            // Check DOM elements
            console.log('   🔍 Checking required DOM elements...');
            if (!this.#checkRequiredElements()) {
                if (this.#initRetries < this.#maxRetries) {
                    this.#initRetries++;
                    console.log(`   ⏳ DOM elements not ready, retrying ${this.#initRetries}/${this.#maxRetries} in 500ms...`);
                    setTimeout(() => this.init(), 500);
                    return;
                } else {
                    this.handleWarning('Max retries reached, proceeding anyway', 'DOM Check');
                }
            }
            
            // Initialize board
            console.log('   🏁 Initializing chessboard...');
            const boardManager = this.#modules.get('board');
            this.#board = boardManager.initializeBoard();
            
            // Expose globals
            this.#exposeGlobals();
            
            // Setup event handlers
            console.log('   🎮 Setting up UI event handlers...');
            await this.#setupEventHandlers();
            
            // Load problems
            console.log('   📂 Loading problems database...');
            const problemManager = this.#modules.get('problems');
            try {
                await problemManager.loadProblems();
            } catch (error) {
                console.warn('⚠️ Problems database could not be loaded, using fallback');
                
                if (window.location.protocol === 'file:') {
                    console.log('💡 Tip: Use a web server for better compatibility');
                    console.log('   Command: python3 -m http.server 8000');
                    console.log('   Then visit: http://localhost:8000/');
                }
            }
            
            // Load first problem
            console.log('   🎲 Loading first problem...');
            this.loadRandomProblem();
            
            this.#initialized = true;
            this.initialized = true;
            this.#gameState.initialized = true;
            console.log('✅ === ChessHawk PRODUCTION INITIALIZATION COMPLETE ===');
            
            this.#showWelcomeMessage();
            
        } catch (error) {
            this.handleError(error, 'ChessHawk Production Initialization');
        }
    }

    /**
     * Check required DOM elements
     */
    #checkRequiredElements(): boolean {
        const boardElement = document.getElementById('myBoard');
        
        console.log('   📋 Critical element check:');
        console.log(`     myBoard: ${boardElement ? '✅' : '❌'} Chess board container`);
        
        if (!boardElement) {
            this.handleWarning('Board element not found, will retry', 'DOM Check');
            return false;
        }
        
        console.log('   ✅ Critical DOM elements found');
        return true;
    }

    /**
     * Check required libraries in production mode
     */
    #checkLibraries(): boolean {
        const requiredLibs: Record<string, boolean> = {
            'jQuery': typeof $ !== 'undefined',
            'Chess.js': typeof Chess !== 'undefined' || typeof window.Chess !== 'undefined', 
            'Chessboard.js': typeof window.Chessboard !== 'undefined'
        };
        
        console.log('   📋 Production library status:', requiredLibs);
        
        const missingLibs = Object.entries(requiredLibs)
            .filter(([name, loaded]) => !loaded)
            .map(([name]) => name);
            
        if (missingLibs.length > 0) {
            this.handleError(`Missing required libraries: ${missingLibs.join(', ')}`, 'Library Check');
            return false;
        }
        
        console.log('   ✅ All required libraries loaded');
        return true;
    }

    /**
     * Setup event handlers
     */
    async #setupEventHandlers(): Promise<void> {
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;
        
        const buttons: Array<{ id: string; handler: () => void }> = [
            { id: 'newProblemBtn', handler: () => this.loadRandomProblem() },
            { id: 'checkSolutionBtn', handler: () => this.checkSolution() },
            { id: 'getHintBtn', handler: () => this.showHint() },
            { id: 'resetPositionBtn', handler: () => this.resetPosition() },
            { id: 'debugShowSolution', handler: () => this.showSolution() },
            { id: 'debugAnalyzeProblems', handler: () => this.analyzeProblems() }
        ];
        
        buttons.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler, { signal });
            } else {
                this.handleWarning(`Button element not found: ${id}`, 'UI Setup');
            }
        });
        
        document.addEventListener('keydown', this.#handleKeyboardShortcuts.bind(this), { signal });
        console.log('   ✅ Event handlers configured');
    }

    /**
     * Handle keyboard shortcuts
     */
    #handleKeyboardShortcuts(event: KeyboardEvent): void {
        const key = event.key?.toLowerCase();
        if (event.ctrlKey || event.altKey) return;
        
        switch (key) {
            case 'n':
                event.preventDefault();
                this.loadRandomProblem();
                break;
            case 'h':
                event.preventDefault();
                this.showHint();
                break;
            case 's':
                event.preventDefault();
                this.showSolution();
                break;
        }
    }

    /**
     * Load random problem
     */
    loadRandomProblem(): void {
        console.log('🎲 === LOADING RANDOM PROBLEM ===');
        
        const problemManager = this.#modules.get('problems');
        const problem = problemManager.getRandomProblem();
        
        if (!problem) {
            console.error('❌ Failed to get random problem');
            return;
        }
        
        this.#loadProblem(problem);
    }

    /**
     * Load a specific problem
     */
    #loadProblem(problem: ChessPuzzle): void {
        try {
            this.#gameState.currentProblem = problem;
            
            this.#game?.load(problem.fen);
            
            const boardManager = this.#modules.get('board');
            boardManager.updatePosition(problem.fen);
            boardManager.setBoardOrientation(this.#game?.turn() || 'w');
            
            const problemManager = this.#modules.get('problems');
            problemManager.displayProblem(problem);
            
            const uiManager = this.#modules.get('ui');
            uiManager.updateGameStatus('Hvit sin tur');
            uiManager.clearFeedback();
            uiManager.clearSolution();
            
            console.log('✅ Problem loaded successfully');
            
        } catch (error) {
            this.handleError(error, 'Problem Loading');
        }
    }

    /**
     * Show hint
     */
    showHint(): void {
        const gameLogic = this.#modules.get('gameLogic');
        gameLogic.showHint();
    }

    /**
     * Show solution
     */
    showSolution(): void {
        const gameLogic = this.#modules.get('gameLogic');
        gameLogic.showSolution();
    }

    /**
     * Check solution
     */
    checkSolution(): void {
        const gameLogic = this.#modules.get('gameLogic');
        gameLogic.checkSolution();
    }

    /**
     * Reset position
     */
    resetPosition(): void {
        const currentProblem = this.#gameState.currentProblem;
        
        if (currentProblem && this.#game) {
            this.#game.load(currentProblem.fen);
            
            const boardManager = this.#modules.get('board');
            boardManager.updatePosition(currentProblem.fen);
            
            const uiManager = this.#modules.get('ui');
            uiManager.clearFeedback();
            uiManager.updateGameStatus('Posisjon tilbakestilt');
            
            console.log('🔄 Position reset');
        }
    }

    /**
     * Analyze problems
     */
    analyzeProblems(): void {
        const debugTools = this.#modules.get('debug');
        debugTools.analyzeProblems();
    }

    /**
     * Expose globals for backward compatibility
     */
    #exposeGlobals(): void {
        window.coreManager = this;
        window.boardManager = this.#modules.get('board');
        window.problemManager = this.#modules.get('problems');
        window.gameLogic = this.#modules.get('gameLogic');
        window.uiManager = this.#modules.get('ui');
        window.debugTools = this.#modules.get('debug');
        
        window.game = this.#game;
        window.board = this.#board;
        
        Object.defineProperty(window, 'currentProblem', {
            get: () => this.#gameState.currentProblem,
            set: (value) => { this.#gameState.currentProblem = value; }
        });
        
        window.loadRandomProblem = () => this.loadRandomProblem();
        window.showHint = () => this.showHint();
        window.showSolution = () => this.showSolution();
        
        console.log('🌐 Production globals exposed');
    }

    /**
     * Show welcome message
     */
    #showWelcomeMessage(): void {
        const uiManager = this.#modules.get('ui');
        uiManager.showFeedback('Velkommen til Chess Hawk! 🦅 (Production Mode)', 'info');
    }

    /**
     * Error handling
     */
    handleError(error: any, context: string = 'Unknown', showToUser: boolean = true): any {
        const errorMessage = error?.message || error || 'Unknown error';
        const fullMessage = `${context}: ${errorMessage}`;
        
        console.error(`❌ ${fullMessage}`, error);
        
        if (showToUser) {
            const uiManager = this.#modules.get('ui');
            uiManager?.showFeedback(`❌ ${errorMessage}`, 'error');
        }
        
        return {
            context,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            handled: true
        };
    }

    /**
     * Warning handling
     */
    handleWarning(message: string, context: string = 'Warning', showToUser: boolean = false): any {
        const fullMessage = `${context}: ${message}`;
        console.warn(`⚠️ ${fullMessage}`);
        
        if (showToUser) {
            const uiManager = this.#modules.get('ui');
            uiManager?.showFeedback(`⚠️ ${message}`, 'warning');
        }
        
        return {
            context,
            message,
            timestamp: new Date().toISOString(),
            type: 'warning'
        };
    }

    /**
     * Load persisted state
     */
    #loadPersistedState(): void {
        try {
            const savedState = localStorage.getItem('chesshawk-state');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.#gameState = {
                    ...this.#gameState,
                    score: parsedState.playerScore || 0,
                    solvedProblems: parsedState.solvedProblems || 0,
                    totalProblems: parsedState.totalProblems || 0
                };
                console.log('💾 Loaded persisted state:', this.#gameState);
            }
        } catch (error) {
            console.warn('⚠️ Could not load persisted state:', error);
        }
    }

    /**
     * Get current game state
     */
    get gameState(): GameState {
        return { ...this.#gameState };
    }

    /**
     * Get module by name
     */
    getModule(name: string): any {
        return this.#modules.get(name);
    }

    /**
     * Get Chess.js game instance
     */
    get game(): ChessInstance | null {
        return this.#game;
    }

    /**
     * Get chessboard instance
     */
    get board(): any {
        return this.#board;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.#abortController?.abort();
        this.#modules.forEach(module => {
            if (typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        this.#modules.clear();
        this.#initialized = false;
    }
}

// Initialize the application in production mode
console.log('🚀 ChessHawk Production Bundle Loaded');

// Create global instance
const chessHawk = new ProductionCoreManager();

// Expose for debugging
(window as any).chessHawk = chessHawk;

export default chessHawk;