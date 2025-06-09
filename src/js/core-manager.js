/**
 * ChessHawk - Core Manager (Main Entry Point)
 * 
 * Håndterer grunnleggende initialisering og orchestrerer alle moduler
 * Modernized with ES2024+ features and ES6 modules
 */

// Import all modules
import BoardManager from './board-manager.js';
import ProblemManager from './problem-manager.js';
import GameLogic from './game-logic.js';
import UIManager from './ui-manager.js';
import DebugTools from './debug-tools.js';

/**
 * CoreManager klasse - hovedorchestrator for Chess Hawk applikasjonen
 */
class CoreManager {
    // Private fields using ES2024+ syntax
    #initialized = false;
    #modules = new Map();
    #abortController = null;
    #gameState = {
        currentMoveIndex: 0,
        playerScore: 0,
        solvedProblems: [],
        currentHintIndex: 0
    };

    constructor() {
        console.log('🚀 CoreManager initialized');
        this.#initializeModules();
        
        // Start initialization when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Privat metode for å initialisere alle moduler
     */
    #initializeModules() {
        // Initialize all module instances
        this.#modules.set('board', new BoardManager());
        this.#modules.set('problems', new ProblemManager());
        this.#modules.set('gameLogic', new GameLogic());
        this.#modules.set('ui', new UIManager());
        this.#modules.set('debug', new DebugTools());
        
        console.log('📦 All modules initialized');
    }

    /**
     * Hovedinitialiseringsmetode
     */
    async init() {
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
            window.game = new Chess();
            
            // Initialize board
            console.log('   🏁 Initializing chessboard...');
            const boardManager = this.#modules.get('board');
            window.board = boardManager.initializeBoard();
            
            // Expose modules globally for backward compatibility
            this.#exposeGlobals();
            
            // Initialize UI event handlers
            console.log('   🎮 Setting up UI event handlers...');
            await this.#setupEventHandlers();
            
            // Load problems
            console.log('   📂 Loading problems database...');
            const problemManager = this.#modules.get('problems');
            await problemManager.loadProblems();
            
            // Load first random problem
            console.log('   🎲 Loading first problem...');
            this.loadRandomProblem();
            
            this.#initialized = true;
            console.log('✅ === ChessHawk INITIALIZATION COMPLETE ===');
            
            // Optional: Show welcome message
            this.#showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ ChessHawk initialization failed:', error);
            this.#showErrorMessage('Initialization failed: ' + error.message);
        }
    }

    /**
     * Sjekk om nødvendige biblioteker er tilgjengelige
     */
    #checkLibraries() {
        const requiredLibs = {
            'jQuery': typeof $ !== 'undefined',
            'Chess.js': typeof Chess !== 'undefined', 
            'Chessboard.js': typeof Chessboard !== 'undefined'
        };
        
        console.log('   📋 Library status:', requiredLibs);
        
        const missingLibs = Object.entries(requiredLibs)
            .filter(([name, loaded]) => !loaded)
            .map(([name]) => name);
            
        if (missingLibs.length > 0) {
            console.error(`❌ Missing required libraries: ${missingLibs.join(', ')}`);
            return false;
        }
        
        console.log('   ✅ All required libraries loaded');
        return true;
    }

    /**
     * Sett opp event handlers
     */
    async #setupEventHandlers() {
        const uiManager = this.#modules.get('ui');
        
        // Modern event listeners with AbortController for cleanup
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;
        
        // Button event listeners
        const buttons = [
            { id: 'new-problem-btn', handler: () => this.loadRandomProblem() },
            { id: 'hint-btn', handler: () => this.showHint() },
            { id: 'solution-btn', handler: () => this.showSolution() },
            { id: 'next-btn', handler: () => this.loadNextProblem() },
            { id: 'prev-btn', handler: () => this.loadPreviousProblem() }
        ];
        
        buttons.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler, { signal });
            } else {
                console.warn(`⚠️ Button element not found: ${id}`);
            }
        });
        
        // Keyboard shortcuts with modern event handling
        document.addEventListener('keydown', this.#handleKeyboardShortcuts.bind(this), { signal });
        
        console.log('   ✅ Event handlers configured');
    }

    /**
     * Håndter keyboard shortcuts
     */
    #handleKeyboardShortcuts(event) {
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
    loadRandomProblem() {
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
    loadNextProblem() {
        const problemManager = this.#modules.get('problems');
        const problem = problemManager.getNextProblem();
        
        if (problem) {
            this.#loadProblem(problem);
        }
    }

    /**
     * Last forrige problem
     */
    loadPreviousProblem() {
        const problemManager = this.#modules.get('problems');
        const problem = problemManager.getPreviousProblem();
        
        if (problem) {
            this.#loadProblem(problem);
        }
    }

    /**
     * Privat metode for å laste et problem
     */
    #loadProblem(problem) {
        try {
            // Reset game state
            this.#gameState.currentMoveIndex = 0;
            this.#gameState.currentHintIndex = 0;
            
            // Load position
            window.game.load(problem.fen);
            
            // Update board
            const boardManager = this.#modules.get('board');
            boardManager.updatePosition(problem.fen);
            boardManager.setBoardOrientation(window.game.turn());
            
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
            console.error('❌ Error loading problem:', error);
            this.#showErrorMessage('Failed to load problem: ' + error.message);
        }
    }

    /**
     * Vis hint
     */
    showHint() {
        const gameLogic = this.#modules.get('gameLogic');
        gameLogic.showHint();
    }

    /**
     * Vis løsning
     */
    showSolution() {
        const gameLogic = this.#modules.get('gameLogic');
        gameLogic.showSolution();
    }

    /**
     * Eksponer moduler til global scope for bakoverkompatibilitet
     */
    #exposeGlobals() {
        // Expose managers globally
        window.coreManager = this;
        window.boardManager = this.#modules.get('board');
        window.problemManager = this.#modules.get('problems');
        window.gameLogic = this.#modules.get('gameLogic');
        window.uiManager = this.#modules.get('ui');
        window.debugTools = this.#modules.get('debug');
        
        // Expose legacy functions for backward compatibility
        window.initChessHawk = () => this.init();
        window.loadRandomProblem = () => this.loadRandomProblem();
        window.showHint = () => this.showHint();
        window.showSolution = () => this.showSolution();
        
        console.log('🌐 Globals exposed for backward compatibility');
    }

    /**
     * Vis velkomstmelding
     */
    #showWelcomeMessage() {
        const uiManager = this.#modules.get('ui');
        uiManager.showFeedback('Velkommen til Chess Hawk! 🦅 Løs taktiske problemer for å forbedre sjakken din.', 'info');
    }

    /**
     * Vis feilmelding
     */
    #showErrorMessage(message) {
        const uiManager = this.#modules.get('ui');
        uiManager?.showFeedback(`❌ ${message}`, 'error');
    }

    /**
     * Få nåværende spilltilstand
     */
    get gameState() {
        return { ...this.#gameState };
    }

    /**
     * Få modul ved navn
     */
    getModule(name) {
        return this.#modules.get(name);
    }

    /**
     * Cleanup metode
     */
    destroy() {
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
