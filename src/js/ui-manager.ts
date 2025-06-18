/**
 * ChessHawk - UI Manager
 * 
 * Håndterer brukergrensesnitt, tilbakemeldinger og visuelle elementer
 * TypeScript version with proper type safety
 */

import type { ChessPuzzle, IUIManager, FeedbackType, NotificationOptions } from '../types/chess-hawk';

/**
 * UIManager klasse for håndtering av brukergrensesnitt
 */
class UIManager implements IUIManager {
    #feedbackTimer: NodeJS.Timeout | null = null;
    // #notificationQueue: Array<{ message: string; type: FeedbackType; duration: number }> = [];

    constructor() {
        console.log('🎨 UIManager initialized');
    }

    /**
     * Show feedback to user
     */
    showFeedback(message: string, type: FeedbackType = 'info', duration: number = 3000): void {
        console.log(`💬 === showFeedback() ===`);
        console.log(`   📝 Message: ${message}`);
        console.log(`   🎨 Type: ${type}`);
        
        const feedbackElement = document.getElementById('feedback');
        if (!feedbackElement) {
            console.error('❌ Feedback element not found');
            return;
        }
        
        // Clear previous timer
        if (this.#feedbackTimer) {
            clearTimeout(this.#feedbackTimer);
        }
        
        // Update content and styling
        feedbackElement.innerHTML = `
            <div class="feedback-content ${type}">
                <span class="feedback-icon">${this.#getIconForType(type)}</span>
                <span class="feedback-text">${message}</span>
            </div>
        `;
        
        feedbackElement.className = `feedback ${type} show`;
        feedbackElement.style.display = 'block';
        
        // Auto-hide after duration
        if (duration > 0) {
            this.#feedbackTimer = setTimeout(() => {
                this.clearFeedback();
            }, duration);
        }
        
        console.log(`   ✅ Feedback displayed successfully`);
    }

    /**
     * Clear feedback area
     */
    clearFeedback(): void {
        const feedbackElement = document.getElementById('feedback');
        if (feedbackElement) {
            feedbackElement.classList.add('fade-out');
            
            setTimeout(() => {
                feedbackElement.style.display = 'none';
                feedbackElement.className = 'feedback';
                feedbackElement.innerHTML = '';
            }, 300);
        }
        
        if (this.#feedbackTimer) {
            clearTimeout(this.#feedbackTimer);
            this.#feedbackTimer = null;
        }
    }

    /**
     * Show solution
     */
    showSolution(): void {
        const currentProblem = (window as any).currentProblem as ChessPuzzle;
        
        if (!currentProblem) {
            this.showFeedback('Ingen problem lastet!', 'error');
            return;
        }
        
        const solutionElement = document.getElementById('solution');
        if (!solutionElement) {
            console.error('❌ Solution element not found');
            return;
        }
        
        console.log(`📖 Displaying solution for problem: ${currentProblem.id}`);
        console.log(`   🎯 Solution moves:`, currentProblem.solution);
        
        const solutionMoves = currentProblem.solution || [];
        const movesHtml = solutionMoves.map((move, index) => 
            `<span class="move-item">
                <span class="move-number">${index + 1}.</span>
                <span class="move-notation">${move}</span>
            </span>`
        ).join('');
        
        solutionElement.innerHTML = `
            <div class="solution-content">
                <h4 class="solution-title">📖 Løsning:</h4>
                <div class="solution-moves">${movesHtml}</div>
                <div class="solution-meta">
                    <span class="category">${currentProblem.category || currentProblem.theme || 'Ukjent'}</span>
                    <span class="difficulty">${currentProblem.difficulty}</span>
                    <span class="rating">Rating: ${currentProblem.rating}</span>
                </div>
            </div>
        `;
        
        solutionElement.style.display = 'block';
        solutionElement.classList.add('visible');
        
        console.log('   ✅ Solution displayed successfully');
    }

    /**
     * Clear solution display
     */
    clearSolution(): void {
        const solutionElement = document.getElementById('solution');
        if (solutionElement) {
            solutionElement.style.display = 'none';
            solutionElement.classList.remove('visible');
            solutionElement.innerHTML = '';
        }
    }

    /**
     * Update game status
     */
    updateGameStatus(status: string): void {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = status;
            console.log(`🎮 Game status updated: ${status}`);
        }
    }

    /**
     * Update problem display
     */
    updateProblemDisplay(problem: ChessPuzzle): void {
        console.log('🖥️ Updating problem display:', problem.title);
        
        const elements = {
            title: document.getElementById('problem-title'),
            description: document.getElementById('problem-description'),
            category: document.getElementById('category'),
            difficulty: document.getElementById('difficulty'),
            rating: document.getElementById('rating'),
            points: document.getElementById('points')
        };
        
        if (elements.title) elements.title.textContent = problem.title;
        if (elements.description) elements.description.textContent = problem.description || '';
        if (elements.category) elements.category.textContent = problem.category || problem.theme || 'Ukjent';
        if (elements.difficulty) elements.difficulty.textContent = problem.difficulty;
        if (elements.rating) elements.rating.textContent = problem.rating.toString();
        if (elements.points) elements.points.textContent = problem.points.toString();
        
        console.log('✅ Problem display updated successfully');
    }

    /**
     * Get icon for feedback type
     */
    #getIconForType(type: FeedbackType): string {
        const icons: Record<FeedbackType, string> = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    /**
     * Show notification with options
     */
    showNotification(message: string, options: NotificationOptions = {}): void {
        const {
            type = 'info',
            duration = 3000,
            persistent = false
        } = options;
        
        this.showFeedback(message, type, persistent ? 0 : duration);
    }

    /**
     * Update score display
     */
    updateScore(score: number): void {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = score.toString();
        }
    }

    /**
     * Update problems solved display
     */
    updateProblemsSolved(solved: number, total: number): void {
        const solvedElement = document.getElementById('problems-solved');
        if (solvedElement) {
            solvedElement.textContent = `${solved}/${total}`;
        }
    }

    /**
     * Cleanup method
     */
    destroy(): void {
        if (this.#feedbackTimer) {
            clearTimeout(this.#feedbackTimer);
        }
        // this.#notificationQueue = [];
        this.clearFeedback();
        this.clearSolution();
    }
}

export default UIManager;

// Expose to global scope for compatibility
(window as any).UIManager = UIManager;