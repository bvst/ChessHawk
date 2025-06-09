/**
 * ChessHawk - UI Manager
 * 
 * Håndterer brukergrensesnitt, tilbakemeldinger og visuelle elementer
 * Modernized with ES2024+ features and ES6 modules
 */

/**
 * UIManager klasse for håndtering av brukergrensesnitt
 */
class UIManager {
    #feedbackTimer = null;
    #notificationQueue = [];
    #animationObserver = null;

    constructor() {
        console.log('🎨 UIManager initialized');
        this.#initializeAnimationObserver();
    }

    /**
     * Vis tilbakemelding til brukeren
     * @param {string} message - Meldingen som skal vises
     * @param {string} type - Type tilbakemelding ('success', 'error', 'info', 'warning')
     * @param {number} duration - Varighet i millisekunder (default: 3000)
     */
    showFeedback(message, type = 'info', duration = 3000) {
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
        
        // Update content and styling using modern template literals
        feedbackElement.innerHTML = `
            <div class="feedback-content ${type}">
                <span class="feedback-icon">${this.#getIconForType(type)}</span>
                <span class="feedback-text">${message}</span>
            </div>
        `;
        
        // Apply modern CSS classes
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
     * Tøm tilbakemeldingsområdet
     */
    clearFeedback() {
        const feedbackElement = document.getElementById('feedback');
        if (feedbackElement) {
            feedbackElement.classList.add('fade-out');
            
            // Use modern animation events
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
     * Vis løsningen for det nåværende problemet
     */
    showSolution() {
        console.log(`📖 === showSolution() START ===`);
        console.log(`   🎯 Problem ID: ${window.currentProblem?.id || 'UNKNOWN'}`);
        
        if (!window.currentProblem) {
            console.warn('⚠️  No current problem - cannot show solution');
            this.showFeedback('Ingen problem lastet!', 'error');
            return;
        }
        
        const solutionElement = document.getElementById('solution');
        if (!solutionElement) {
            console.error('❌ Solution element not found in DOM');
            return;
        }
        
        console.log(`   🔍 Found solution element: ${solutionElement.id}`);
        console.log(`   📝 Processing solution for problem ${window.currentProblem.id}:`);
        console.log(`      Solution type: ${Array.isArray(window.currentProblem.solution) ? 'Array' : typeof window.currentProblem.solution}`);
        console.log(`      Solution content:`, window.currentProblem.solution);
        
        // Build solution HTML using modern template literals and optional chaining
        const solutionHTML = this.#buildSolutionHTML(window.currentProblem);
        
        solutionElement.innerHTML = solutionHTML;
        solutionElement.style.display = 'block';
        solutionElement.classList.add('solution-visible', 'fade-in');
        
        console.log(`📖 === showSolution() END ===`);
    }

    /**
     * Tøm løsningsområdet
     */
    clearSolution() {
        const solutionElement = document.getElementById('solution');
        if (solutionElement) {
            solutionElement.classList.add('fade-out');
            
            setTimeout(() => {
                solutionElement.style.display = 'none';
                solutionElement.innerHTML = '';
                solutionElement.className = 'solution';
            }, 300);
        }
    }

    /**
     * Oppdater spillstatus
     * @param {string} status - Ny status
     */
    updateGameStatus(status) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.classList.add('status-updated');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                statusElement.classList.remove('status-updated');
            }, 500);
        }
        
        console.log(`🎮 Status updated: ${status}`);
    }

    /**
     * Vis notifikasjon med kø-støtte
     * @param {string} message - Melding
     * @param {Object} options - Tilleggsopsjoner
     */
    showNotification(message, options = {}) {
        const notification = {
            id: Date.now(),
            message,
            type: options.type || 'info',
            duration: options.duration || 3000,
            persistent: options.persistent || false
        };
        
        this.#notificationQueue.push(notification);
        this.#processNotificationQueue();
    }

    /**
     * Oppdater UI elementer med problemdata
     * @param {Object} problem - Problemdata
     */
    updateProblemDisplay(problem) {
        if (!problem) return;
        
        // Use modern optional chaining and nullish coalescing
        const updates = {
            'problem-title': problem.title ?? 'Ukjent problem',
            'problem-description': problem.description ?? '',
            'category': problem.category ?? 'Ukjent',
            'difficulty': problem.difficulty ?? 'Ukjent',
            'rating': problem.rating?.toString() ?? 'N/A',
            'points': problem.points?.toString() ?? '0'
        };
        
        // Batch DOM updates
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                element.classList.add('content-updated');
                
                // Remove animation class
                setTimeout(() => {
                    element.classList.remove('content-updated');
                }, 300);
            }
        });
        
        // Update meta information
        this.#updateProblemMeta(problem);
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                this.showFeedback(`Kunne ikke aktivere fullskjerm: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Vis achievement/badge
     * @param {Object} achievement - Achievement data
     */
    showAchievement(achievement) {
        const achievementHTML = `
            <div class="achievement-popup" id="achievement-${achievement.id}">
                <div class="achievement-content">
                    <div class="achievement-icon">${achievement.icon || '🏆'}</div>
                    <div class="achievement-text">
                        <h3>${achievement.title}</h3>
                        <p>${achievement.description}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Inject into page
        document.body.insertAdjacentHTML('beforeend', achievementHTML);
        
        const popup = document.getElementById(`achievement-${achievement.id}`);
        if (popup) {
            popup.classList.add('show');
            
            // Auto-remove after delay
            setTimeout(() => {
                popup.classList.add('fade-out');
                setTimeout(() => popup.remove(), 300);
            }, 3000);
        }
    }

    /**
     * Privat metode for å bygge løsnings-HTML
     */
    #buildSolutionHTML(problem) {
        let solutionHtml = `<h4>Løsning for ${problem.title}:</h4>`;
        
        if (Array.isArray(problem.solution)) {
            console.log(`   📋 Array solution with ${problem.solution.length} moves`);
            
            // Format som nummererte trekk
            const moves = problem.solution.map((move, index) => {
                const moveNumber = Math.floor(index / 2) + 1;
                const isWhiteMove = index % 2 === 0;
                const prefix = isWhiteMove ? `${moveNumber}.` : `${moveNumber}...`;
                return `${prefix} ${move}`;
            }).join(' ');
            
            solutionHtml += `
                <div class="solution-moves">
                    <strong>Trekkrekkefølge:</strong><br>
                    <code class="moves-notation">${moves}</code>
                </div>
            `;
        } else if (typeof problem.solution === 'string') {
            solutionHtml += `
                <div class="solution-text">
                    <strong>Løsning:</strong><br>
                    <code>${problem.solution}</code>
                </div>
            `;
        }
        
        // Legg til problemdetaljer
        solutionHtml += `
            <div class="solution-details">
                <span class="detail-item">📂 ${problem.category}</span>
                <span class="detail-item">⭐ ${problem.difficulty}</span>
                <span class="detail-item">📊 Rating: ${problem.rating}</span>
                <span class="detail-item">💎 ${problem.points} poeng</span>
            </div>
        `;
        
        return solutionHtml;
    }

    /**
     * Privat metode for å få ikon basert på type
     */
    #getIconForType(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    /**
     * Privat metode for å oppdatere problem metadata
     */
    #updateProblemMeta(problem) {
        const metaElement = document.getElementById('problem-meta');
        if (metaElement) {
            metaElement.innerHTML = `
                <span class="category-badge ${problem.category}">${problem.category}</span>
                <span class="difficulty-badge ${problem.difficulty}">${problem.difficulty}</span>
                <span class="rating-badge">Rating: ${problem.rating}</span>
                <span class="points-badge">💎 ${problem.points} poeng</span>
            `;
        }
    }

    /**
     * Privat metode for å initialisere Intersection Observer for animasjoner
     */
    #initializeAnimationObserver() {
        if ('IntersectionObserver' in window) {
            this.#animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, { threshold: 0.1 });
            
            // Observe elements that should animate
            document.querySelectorAll('.problem-card, .control-panel, .game-info').forEach(el => {
                this.#animationObserver.observe(el);
            });
        }
    }

    /**
     * Privat metode for å prosessere notifikasjonskøen
     */
    #processNotificationQueue() {
        if (this.#notificationQueue.length === 0) return;
        
        const notification = this.#notificationQueue.shift();
        
        // Show notification using existing feedback system
        this.showFeedback(notification.message, notification.type, notification.duration);
        
        // Process next notification after delay
        if (this.#notificationQueue.length > 0) {
            setTimeout(() => this.#processNotificationQueue(), 500);
        }
    }

    /**
     * Cleanup metode
     */
    destroy() {
        if (this.#feedbackTimer) {
            clearTimeout(this.#feedbackTimer);
        }
        
        if (this.#animationObserver) {
            this.#animationObserver.disconnect();
        }
        
        this.#notificationQueue = [];
    }
}

// Export the class as default
export default UIManager;

// Expose to global scope for compatibility with existing code
window.UIManager = UIManager;
