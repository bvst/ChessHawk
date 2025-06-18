/**
 * ChessHawk - Core Manager (Main Entry Point)
 * 
 * Håndterer grunnleggende initialisering og orchestrerer alle moduler
 * Modernized with TypeScript and ES6 modules
 */

// Import Chess.js with proper types
import { Chess } from './chess-global.ts';
import type { ChessInstance, ChessPuzzle, GameState, ModuleManager } from '../types/chess-hawk';

// Import all modules
import BoardManager from './board-manager.ts';
import ProblemManager from './problem-manager.ts';
import GameLogic from './game-logic.ts';
import UIManager from './ui-manager.ts';
import DebugTools from './debug-tools.ts';

/**
 * CoreManager klasse - hovedorchestrator for Chess Hawk applikasjonen
 */
class CoreManager implements ModuleManager {
    // Private fields with TypeScript types
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
    
    // Core game instances - centralized
    #game: ChessInstance | null = null;
    #board: any = null;
    
    // Public properties for interface compliance
    initialized: boolean = false;
    modules: Map<string, any> = new Map();

    constructor() {
        console.log('🚀 CoreManager initialized');
        
        this.#initializeModules();
        this.#loadPersistedState();
        
        // Wait for Chess.js to load, then start initialization
        this.#waitForChessAndInit();
    }
    
    /**
     * Wait for Chess.js to load before starting initialization
     */
    async #waitForChessAndInit(): Promise<void> {
        try {
            console.log('♟️ Chess.js module imported successfully');
            
            // Ensure Chess is available globally
            (window as any).Chess = Chess;
            
            // Start initialization when DOM is ready
            this.#ensureDOMReady();
        } catch (error) {
            console.error('❌ Failed to load Chess.js:', error);
            this.handleError(error, 'Chess.js Loading');
        }
    }

    /**
     * Ensure DOM is ready before initialization
     */
    #ensureDOMReady(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📄 DOM content loaded, starting initialization...');
                setTimeout(() => this.init(), 100); // Small delay to ensure everything is ready
            });
        } else if (document.readyState === 'interactive') {
            console.log('📄 DOM interactive, waiting for complete...');
            setTimeout(() => this.init(), 200);
        } else {
            console.log('📄 DOM already complete, starting initialization...');
            setTimeout(() => this.init(), 50);
        }
    }

    /**
     * Privat metode for å initialisere alle moduler
     */
    #initializeModules(): void {
        // Initialize all module instances
        this.#modules.set('board', new BoardManager());
        this.#modules.set('problems', new ProblemManager());
        this.#modules.set('gameLogic', new GameLogic());
        this.#modules.set('ui', new UIManager());
        this.#modules.set('debug', new DebugTools());
        
        // Update public interface property
        this.modules = this.#modules;
        
        console.log('📦 All modules initialized');
    }

    /**
     * Hovedinitialiseringsmetode
     */
    async init(): Promise<void> {
        if (this.#initialized) {
            console.warn('⚠️ CoreManager already initialized');
            return;
        }

        console.log('🚀 === ChessHawk INITIALIZATION START ===');
        
        try {
            // Sjekk om nødvendige biblioteker er lastet
            console.log('   📚 Checking required libraries...');
            if (!this.#checkLibraries()) {
                throw new Error('Required libraries not loaded');
            }
            
            // Initialize Chess.js game
            console.log('   ♟️ Initializing Chess.js game...');
            this.#game = new Chess() as unknown as ChessInstance;
            
            // Check if required DOM elements exist
            console.log('   🔍 Checking required DOM elements...');
            if (!this.#checkRequiredElements()) {
                if (this.#initRetries < this.#maxRetries) {
                    this.#initRetries++;
                    console.log(`   ⏳ DOM elements not ready, retrying ${this.#initRetries}/${this.#maxRetries} in 500ms...`);
                    setTimeout(() => this.init(), 500);
                    return;
                } else {
                    this.handleWarning('Max retries reached, proceeding with initialization anyway', 'DOM Check');
                }
            }
            
            // Initialize board
            console.log('   🏁 Initializing chessboard...');
            const boardManager = this.#modules.get('board');
            this.#board = boardManager.initializeBoard();
            
            // Expose modules globally for backward compatibility
            this.#exposeGlobals();
            
            // Initialize UI event handlers
            console.log('   🎮 Setting up UI event handlers...');
            await this.#setupEventHandlers();
            
            // Load problems
            console.log('   📂 Loading problems database...');
            const problemManager = this.#modules.get('problems');
            try {
                await problemManager.loadProblems();
            } catch (error) {
                console.warn('⚠️ Problems database could not be loaded, but continuing with fallback');
                
                // Show user guidance if it's a CORS/file protocol issue
                if (window.location.protocol === 'file:') {
                    console.log('💡 Tip: Start a web server to avoid file:// protocol issues');
                    console.log('   Command: python3 -m http.server 8000');
                    console.log('   Then visit: http://localhost:8000/');
                }
            }
            
            // Load first random problem
            console.log('   🎲 Loading first problem...');
            this.loadRandomProblem();
            
            this.#initialized = true;
            this.initialized = true;
            this.#gameState.initialized = true;
            console.log('✅ === ChessHawk INITIALIZATION COMPLETE ===');
            
            // Optional: Show welcome message
            this.#showWelcomeMessage();
            
        } catch (error) {
            this.handleError(error, 'ChessHawk Initialization');
        }
    }

    /**
     * Sjekk om nødvendige DOM elementer finnes
     */
    #checkRequiredElements(): boolean {
        // Only check the most critical element for board initialization
        const boardElement = document.getElementById('myBoard');
        
        console.log('   📋 Critical element check:');
        console.log(`     myBoard: ${boardElement ? '✅' : '❌'} Chess board container`);
        console.log(`     Document body children: ${document.body?.children?.length || 0}`);
        console.log(`     Document readyState: ${document.readyState}`);
        
        if (!boardElement) {
            this.handleWarning('Board element not found, will retry after delay', 'DOM Check');
            return false;
        }
        
        console.log('   ✅ Critical DOM elements found');
        return true;
    }

    /**
     * Sjekk om nødvendige biblioteker er tilgjengelige
     */
    #checkLibraries(): boolean {
        const requiredLibs: Record<string, boolean> = {
            'jQuery': typeof $ !== 'undefined',
            'Chess.js': typeof Chess !== 'undefined', 
            'Chessboard.js': typeof window.Chessboard !== 'undefined'
        };
        
        console.log('   📋 Library status:', requiredLibs);
        
        const missingLibs = Object.entries(requiredLibs)
            .filter(([_name, loaded]) => !loaded)
            .map(([name]) => name);
            
        if (missingLibs.length > 0) {
            this.handleError(`Missing required libraries: ${missingLibs.join(', ')}`, 'Library Check');
            return false;
        }
        
        console.log('   ✅ All required libraries loaded');
        return true;
    }

    /**
     * Sett opp event handlers
     */
    async #setupEventHandlers(): Promise<void> {
        // const _uiManager = this.#modules.get('ui');
        
        // Modern event listeners with AbortController for cleanup
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;
        
        // Button event listeners
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
        
        // Keyboard shortcuts with modern event handling
        document.addEventListener('keydown', this.#handleKeyboardShortcuts.bind(this), { signal });
        
        console.log('   ✅ Event handlers configured');
    }

    /**
     * Håndter keyboard shortcuts
     */
    #handleKeyboardShortcuts(event: KeyboardEvent): void {
        // Use modern switch with optional chaining
        const key = event.key?.toLowerCase();
        
        if (event.ctrlKey || event.altKey) return; // Skip if modifier keys are pressed
        
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
            case 'arrowright':
                event.preventDefault();
                this.loadNextProblem();
                break;
            case 'arrowleft':
                event.preventDefault();
                this.loadPreviousProblem();
                break;
        }
    }

    /**
     * Last tilfeldig problem
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
     * Last neste problem
     */
    loadNextProblem(): void {
        const problemManager = this.#modules.get('problems');
        const problem = problemManager.getNextProblem();
        
        if (problem) {
            this.#loadProblem(problem);
        }
    }

    /**
     * Last forrige problem
     */
    loadPreviousProblem(): void {
        const problemManager = this.#modules.get('problems');
        const problem = problemManager.getPreviousProblem();
        
        if (problem) {
            this.#loadProblem(problem);
        }
    }

    /**
     * Privat metode for å laste et problem
     */
    #loadProblem(problem: ChessPuzzle): void {
        try {
            // Reset game state
            this.#gameState.currentProblem = problem;
            
            // Load position
            this.#game?.load(problem.fen);
            
            // Update board
            const boardManager = this.#modules.get('board');
            boardManager.updatePosition(problem.fen);
            boardManager.setBoardOrientation(this.#game?.turn() || 'w');
            
            // Display problem
            const problemManager = this.#modules.get('problems');
            problemManager.displayProblem(problem);
            
            // Update UI
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
     * Vis hint
     */
    showHint(): void {
        const gameLogic = this.#modules.get('gameLogic');
        gameLogic.showHint();
    }

    /**
     * Vis løsning
     */
    showSolution(): void {
        const gameLogic = this.#modules.get('gameLogic');
        gameLogic.showSolution();
    }

    /**
     * Sjekk løsning
     */
    checkSolution(): void {
        const gameLogic = this.#modules.get('gameLogic');
        gameLogic.checkSolution();
    }

    /**
     * Reset posisjon
     */
    resetPosition(): void {
        const currentProblem = this.#gameState.currentProblem;
        
        if (currentProblem && this.#game) {
            // Reset game to original position
            this.#game.load(currentProblem.fen);
            
            // Update board
            const boardManager = this.#modules.get('board');
            boardManager.updatePosition(currentProblem.fen);
            
            // Clear feedback
            const uiManager = this.#modules.get('ui');
            uiManager.clearFeedback();
            uiManager.updateGameStatus('Posisjon tilbakestilt');
            
            console.log('🔄 Position reset');
        }
    }

    /**
     * Analyser problemer (debug funksjon)
     */
    analyzeProblems(): void {
        const debugTools = this.#modules.get('debug');
        debugTools.analyzeProblems();
    }

    /**
     * Eksponer moduler til global scope for bakoverkompatibilitet
     */
    #exposeGlobals(): void {
        // Expose managers globally
        window.coreManager = this;
        window.boardManager = this.#modules.get('board');
        window.problemManager = this.#modules.get('problems');
        window.gameLogic = this.#modules.get('gameLogic');
        window.uiManager = this.#modules.get('ui');
        window.debugTools = this.#modules.get('debug');
        
        // Expose centralized game instances for backward compatibility
        (window as any).game = this.#game;
        (window as any).board = this.#board;
        
        // Expose state properties with getters/setters for centralized management
        Object.defineProperty(window, 'currentProblem', {
            get: () => this.#gameState.currentProblem,
            set: (value) => { this.#gameState.currentProblem = value; }
        });
        
        Object.defineProperty(window, 'playerScore', {
            get: () => this.#gameState.score,
            set: (value) => { this.#gameState.score = value; }
        });
        
        Object.defineProperty(window, 'solvedProblems', {
            get: () => this.#gameState.solvedProblems,
            set: (value) => { this.#gameState.solvedProblems = value; }
        });
        
        // Expose legacy functions for backward compatibility
        (window as any).initChessHawk = () => this.init();
        (window as any).loadRandomProblem = () => this.loadRandomProblem();
        (window as any).showHint = () => this.showHint();
        (window as any).showSolution = () => this.showSolution();
        
        // Expose standardized error handling
        (window as any).handleError = (error: any, context: any, showToUser: any) => this.handleError(error, context, showToUser);
        (window as any).handleWarning = (message: any, context: any, showToUser: any) => this.handleWarning(message, context, showToUser);
        
        console.log('🌐 Globals exposed for backward compatibility');
    }

    /**
     * Vis velkomstmelding
     */
    #showWelcomeMessage(): void {
        const uiManager = this.#modules.get('ui');
        uiManager.showFeedback('Velkommen til Chess Hawk! 🦅 Løs taktiske problemer for å forbedre sjakken din.', 'info');
    }

    /**
     * Vis feilmelding
     */
    // #showErrorMessage(message: string): void {
    //     const uiManager = this.#modules.get('ui');
    //     uiManager?.showFeedback(`❌ ${message}`, 'error');
    // }

    /**
     * Standardisert feilhåndtering
     */
    handleError(error: any, context: string = 'Unknown', showToUser: boolean = true): any {
        const errorMessage = error?.message || error || 'Unknown error';
        const fullMessage = `${context}: ${errorMessage}`;
        
        // Always log to console
        console.error(`❌ ${fullMessage}`, error);
        
        // Optionally show to user
        if (showToUser) {
            const uiManager = this.#modules.get('ui');
            uiManager?.showFeedback(`❌ ${errorMessage}`, 'error');
        }
        
        // Track error statistics
        this.updateStatistics({
            errorOccurred: true,
            errorType: context,
            errorMessage: errorMessage
        });
        
        return {
            context,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            handled: true
        };
    }

    /**
     * Standardisert varsel/advarsel
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
     * Få nåværende spilltilstand
     */
    get gameState(): GameState {
        return { ...this.#gameState };
    }

    /**
     * Få modul ved navn
     */
    getModule(name: string): any {
        return this.#modules.get(name);
    }

    /**
     * Få Chess.js game instance
     */
    get game(): ChessInstance | null {
        return this.#game;
    }

    /**
     * Få chessboard instance
     */
    get board(): any {
        return this.#board;
    }

    /**
     * Få nåværende problem
     */
    get currentProblem(): ChessPuzzle | null {
        return this.#gameState.currentProblem;
    }

    /**
     * Sett nåværende problem
     */
    set currentProblem(problem: ChessPuzzle | null) {
        this.#gameState.currentProblem = problem;
    }

    /**
     * Få spillerscore
     */
    get playerScore(): number {
        return this.#gameState.score;
    }

    /**
     * Sett spillerscore
     */
    set playerScore(score: number) {
        this.#gameState.score = score;
        this.#persistState();
    }

    /**
     * Få løste problemer
     */
    get solvedProblems(): number {
        return this.#gameState.solvedProblems;
    }

    /**
     * Legg til løst problem
     */
    addSolvedProblem(_problemId: string): void {
        this.#gameState.solvedProblems++;
        this.#persistState();
    }

    /**
     * Last inn persistent tilstand fra localStorage
     */
    #loadPersistedState(): void {
        try {
            const savedState = localStorage.getItem('chesshawk-state');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                // Merge saved state with default state
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
     * Lagre tilstand til localStorage
     */
    #persistState(): void {
        try {
            const stateToSave = {
                playerScore: this.#gameState.score,
                solvedProblems: this.#gameState.solvedProblems,
                totalProblems: this.#gameState.totalProblems,
                version: '1.0.0',
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('chesshawk-state', JSON.stringify(stateToSave));
            console.log('💾 State persisted to localStorage');
        } catch (error) {
            console.warn('⚠️ Could not persist state:', error);
        }
    }

    /**
     * Oppdater spillerstatistikk
     */
    updateStatistics(data: any): void {
        // Simple statistics tracking
        if (data.problemSolved) {
            this.#gameState.solvedProblems++;
        }
        if (data.gameCompleted) {
            this.#gameState.totalProblems++;
        }
        
        this.#persistState();
        console.log('📊 Statistics updated');
    }

    /**
     * Få spillerstatistikk
     */
    getStatistics(): any {
        return {
            totalProblems: this.#gameState.totalProblems,
            solvedProblems: this.#gameState.solvedProblems,
            score: this.#gameState.score
        };
    }

    /**
     * Tøm all persistent data
     */
    clearPersistedData(): boolean {
        try {
            localStorage.removeItem('chesshawk-state');
            
            // Reset game state
            this.#gameState = {
                initialized: false,
                currentProblem: null,
                score: 0,
                totalProblems: 0,
                solvedProblems: 0
            };
            
            console.log('🗑️ All persisted data cleared');
            return true;
        } catch (error) {
            console.error('❌ Could not clear persisted data:', error);
            return false;
        }
    }

    /**
     * Cleanup metode
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

// Create and export singleton instance
const coreManager = new CoreManager();

export default coreManager;