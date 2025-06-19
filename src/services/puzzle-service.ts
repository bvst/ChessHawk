/**
 * Chess Hawk Puzzle Service
 * Abstracted service layer for puzzle data management
 * Supports both local JSON and future API implementations
 */

import type { Puzzle, PuzzleDifficulty, TacticalTheme } from '../types/puzzle.types';

export interface PuzzleFilter {
  theme?: TacticalTheme;
  difficulty?: PuzzleDifficulty;
  rating?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface UserProgress {
  userId: string;
  puzzlesSolved: string[];
  totalTime: number;
  averageRating: number;
  streaks: {
    current: number;
    best: number;
  };
  themeProgress: Record<string, {
    solved: number;
    total: number;
    averageRating: number;
  }>;
}

export interface SolutionResult {
  success: boolean;
  timeSpent: number;
  attempts: number;
  score: number;
  nextPuzzleId?: string;
}

export interface IPuzzleService {
  // Puzzle retrieval
  getPuzzle(id: string): Promise<Puzzle | null>;
  getPuzzles(filter?: PuzzleFilter): Promise<Puzzle[]>;
  getRandomPuzzle(filter?: PuzzleFilter): Promise<Puzzle | null>;
  
  // User progress
  getUserProgress(userId: string): Promise<UserProgress | null>;
  submitSolution(userId: string, puzzleId: string, solution: string[], timeSpent: number, attempts: number): Promise<SolutionResult>;
  
  // Statistics
  getPuzzleStats(puzzleId: string): Promise<{
    solveRate: number;
    averageTime: number;
    averageAttempts: number;
  } | null>;
  
  // Data management
  validatePuzzleDatabase(): Promise<boolean>;
  exportUserData(userId: string): Promise<any>;
  importUserData(userId: string, data: any): Promise<void>;
}

/**
 * Local JSON-based implementation (current)
 */
export class LocalPuzzleService implements IPuzzleService {
  private puzzles: Map<string, Puzzle> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  private isInitialized = false;

  constructor() {
    // Don't auto-initialize - let callers control when to initialize
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const response = await fetch('/src/data/problems.json');
      if (!response || !response.ok) {
        throw new Error(`Failed to fetch puzzle data: ${response?.status || 'Unknown error'}`);
      }
      const data = await response.json();
      
      if (data.puzzles && Array.isArray(data.puzzles)) {
        data.puzzles.forEach((puzzle: Puzzle) => {
          this.puzzles.set(puzzle.id, puzzle);
        });
        
        console.log(`✅ Loaded ${this.puzzles.size} puzzles from local database`);
        this.isInitialized = true;
      } else {
        throw new Error('Invalid puzzle database format');
      }
    } catch (error) {
      console.error('❌ Failed to initialize puzzle service:', error);
      throw error;
    }
  }

  async getPuzzle(id: string): Promise<Puzzle | null> {
    await this.initialize();
    return this.puzzles.get(id) || null;
  }

  async getPuzzles(filter?: PuzzleFilter): Promise<Puzzle[]> {
    await this.initialize();
    
    let puzzles = Array.from(this.puzzles.values());
    
    if (filter) {
      if (filter.theme) {
        puzzles = puzzles.filter(p => p.theme === filter.theme);
      }
      
      if (filter.difficulty) {
        puzzles = puzzles.filter(p => p.difficulty === filter.difficulty);
      }
      
      if (filter.rating) {
        if (filter.rating.min) {
          puzzles = puzzles.filter(p => p.rating >= filter.rating!.min!);
        }
        if (filter.rating.max) {
          puzzles = puzzles.filter(p => p.rating <= filter.rating!.max!);
        }
      }
      
      if (filter.tags && filter.tags.length > 0) {
        puzzles = puzzles.filter(p => 
          filter.tags!.some(tag => p.tags.includes(tag))
        );
      }
      
      if (filter.offset) {
        puzzles = puzzles.slice(filter.offset);
      }
      
      if (filter.limit) {
        puzzles = puzzles.slice(0, filter.limit);
      }
    }
    
    return puzzles;
  }

  async getRandomPuzzle(filter?: PuzzleFilter): Promise<Puzzle | null> {
    const puzzles = await this.getPuzzles(filter);
    
    if (puzzles.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * puzzles.length);
    return puzzles[randomIndex] || null;
  }

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    // In local implementation, load from localStorage
    try {
      const stored = localStorage.getItem(`chess-hawk-progress-${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load user progress from localStorage:', error);
    }
    
    return null;
  }

  async submitSolution(
    userId: string, 
    puzzleId: string, 
    solution: string[], 
    timeSpent: number, 
    attempts: number
  ): Promise<SolutionResult> {
    const puzzle = await this.getPuzzle(puzzleId);
    
    if (!puzzle) {
      throw new Error(`Puzzle ${puzzleId} not found`);
    }

    // Check if solution is correct
    const isCorrect = this.validateSolution(puzzle, solution);
    
    // Calculate score based on difficulty, time, and attempts
    const score = this.calculateScore(puzzle, timeSpent, attempts, isCorrect);
    
    // Update user progress
    await this.updateUserProgress(userId, puzzleId, isCorrect, timeSpent, score);
    
    // Get next puzzle suggestion
    const nextPuzzleId = await this.getNextPuzzleSuggestion(userId, puzzle);
    
    return {
      success: isCorrect,
      timeSpent,
      attempts,
      score,
      nextPuzzleId
    };
  }

  private validateSolution(puzzle: Puzzle, userSolution: string[]): boolean {
    if (userSolution.length !== puzzle.solution.length) {
      return false;
    }
    
    return userSolution.every((move, index) => 
      move === puzzle.solution[index]
    );
  }

  private calculateScore(puzzle: Puzzle, timeSpent: number, attempts: number, isCorrect: boolean): number {
    if (!isCorrect) return 0;
    
    let baseScore = puzzle.points;
    
    // Time bonus (faster = higher score)
    const timeBonus = Math.max(0, 100 - timeSpent);
    
    // Attempt penalty (fewer attempts = higher score)
    const attemptPenalty = Math.max(0, (attempts - 1) * 10);
    
    // Difficulty bonus
    const difficultyBonus = {
      'beginner': 0,
      'intermediate': 50,
      'advanced': 100
    }[puzzle.difficulty] || 0;
    
    return Math.max(1, baseScore + timeBonus + difficultyBonus - attemptPenalty);
  }

  private async updateUserProgress(
    userId: string, 
    puzzleId: string, 
    solved: boolean, 
    timeSpent: number, 
    _score: number
  ): Promise<void> {
    let progress = await this.getUserProgress(userId);
    
    if (!progress) {
      progress = {
        userId,
        puzzlesSolved: [],
        totalTime: 0,
        averageRating: 0,
        streaks: { current: 0, best: 0 },
        themeProgress: {}
      };
    }
    
    if (solved && !progress.puzzlesSolved.includes(puzzleId)) {
      progress.puzzlesSolved.push(puzzleId);
      progress.streaks.current += 1;
      progress.streaks.best = Math.max(progress.streaks.best, progress.streaks.current);
    } else if (!solved) {
      progress.streaks.current = 0;
    }
    
    progress.totalTime += timeSpent;
    
    // Update theme progress
    const puzzle = await this.getPuzzle(puzzleId);
    if (puzzle) {
      if (!progress.themeProgress[puzzle.theme]) {
        progress.themeProgress[puzzle.theme] = {
          solved: 0,
          total: 0,
          averageRating: 0
        };
      }
      
      const themeProgress = progress.themeProgress[puzzle.theme];
      if (themeProgress) {
        themeProgress.total += 1;
        if (solved) {
          themeProgress.solved += 1;
        }
        
        // Update average rating
        themeProgress.averageRating = 
          (themeProgress.averageRating * (themeProgress.total - 1) + puzzle.rating) / themeProgress.total;
      }
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(`chess-hawk-progress-${userId}`, JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to save user progress to localStorage:', error);
    }
    
    this.userProgress.set(userId, progress);
  }

  private async getNextPuzzleSuggestion(userId: string, currentPuzzle: Puzzle): Promise<string | undefined> {
    const progress = await this.getUserProgress(userId);
    
    if (!progress) {
      // For new users, suggest similar difficulty
      const similarPuzzles = await this.getPuzzles({
        difficulty: currentPuzzle.difficulty,
        limit: 10
      });
      
      const unsolved = similarPuzzles.filter(p => 
        p.id !== currentPuzzle.id
      );
      
      return unsolved.length > 0 ? unsolved[0]?.id : undefined;
    }
    
    // For experienced users, suggest based on weak themes or progressive difficulty
    const weakestTheme = this.findWeakestTheme(progress);
    
    if (weakestTheme) {
      const themePuzzles = await this.getPuzzles({
        theme: weakestTheme,
        limit: 5
      });
      
      const unsolved = themePuzzles.filter(p => 
        !progress.puzzlesSolved.includes(p.id)
      );
      
      if (unsolved.length > 0) {
        return unsolved[Math.floor(Math.random() * unsolved.length)]?.id;
      }
    }
    
    return undefined;
  }

  private findWeakestTheme(progress: UserProgress): string | null {
    let lowestSuccessRate = 1.0;
    let weakestTheme: string | null = null;
    
    for (const [theme, stats] of Object.entries(progress.themeProgress)) {
      const successRate = stats.solved / stats.total;
      if (successRate < lowestSuccessRate && stats.total >= 3) {
        lowestSuccessRate = successRate;
        weakestTheme = theme;
      }
    }
    
    return weakestTheme;
  }

  async getPuzzleStats(_puzzleId: string): Promise<{
    solveRate: number;
    averageTime: number;
    averageAttempts: number;
  } | null> {
    // In local implementation, return mock data
    // In API implementation, this would fetch real statistics
    return {
      solveRate: 0.65, // 65% solve rate
      averageTime: 45, // 45 seconds average
      averageAttempts: 2.3 // 2.3 attempts average
    };
  }

  async validatePuzzleDatabase(): Promise<boolean> {
    try {
      await this.initialize();
      
      // Basic validation checks
      if (this.puzzles.size === 0) {
        console.error('❌ No puzzles found in database');
        return false;
      }
      
      // Check for required fields
      for (const puzzle of this.puzzles.values()) {
        if (!puzzle.id || !puzzle.fen || !puzzle.solution || puzzle.solution.length === 0) {
          console.error(`❌ Invalid puzzle: ${puzzle.id}`);
          return false;
        }
      }
      
      console.log(`✅ Database validation passed: ${this.puzzles.size} puzzles`);
      return true;
    } catch (error) {
      console.error('❌ Database validation failed:', error);
      return false;
    }
  }

  async exportUserData(userId: string): Promise<any> {
    const progress = await this.getUserProgress(userId);
    const settings = localStorage.getItem(`chess-hawk-settings-${userId}`);
    
    return {
      progress,
      settings: settings ? JSON.parse(settings) : null,
      exportedAt: new Date().toISOString()
    };
  }

  async importUserData(userId: string, data: any): Promise<void> {
    if (data.progress) {
      this.userProgress.set(userId, data.progress);
      localStorage.setItem(`chess-hawk-progress-${userId}`, JSON.stringify(data.progress));
    }
    
    if (data.settings) {
      localStorage.setItem(`chess-hawk-settings-${userId}`, JSON.stringify(data.settings));
    }
  }
}

/**
 * Future API-based implementation
 */
export class ApiPuzzleService implements IPuzzleService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  async getPuzzle(id: string): Promise<Puzzle | null> {
    try {
      const response = await fetch(`${this.baseUrl}/puzzles/${id}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch puzzle:', error);
      return null;
    }
  }

  async getPuzzles(filter?: PuzzleFilter): Promise<Puzzle[]> {
    try {
      const params = new URLSearchParams();
      
      if (filter) {
        if (filter.theme) params.append('theme', filter.theme);
        if (filter.difficulty) params.append('difficulty', filter.difficulty);
        if (filter.rating?.min) params.append('minRating', filter.rating.min.toString());
        if (filter.rating?.max) params.append('maxRating', filter.rating.max.toString());
        if (filter.limit) params.append('limit', filter.limit.toString());
        if (filter.offset) params.append('offset', filter.offset.toString());
        if (filter.tags) filter.tags.forEach(tag => params.append('tags', tag));
      }
      
      const response = await fetch(`${this.baseUrl}/puzzles?${params}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.puzzles || [];
    } catch (error) {
      console.error('Failed to fetch puzzles:', error);
      return [];
    }
  }

  async getRandomPuzzle(filter?: PuzzleFilter): Promise<Puzzle | null> {
    try {
      const params = new URLSearchParams();
      
      if (filter) {
        if (filter.theme) params.append('theme', filter.theme);
        if (filter.difficulty) params.append('difficulty', filter.difficulty);
        if (filter.rating?.min) params.append('minRating', filter.rating.min.toString());
        if (filter.rating?.max) params.append('maxRating', filter.rating.max.toString());
      }
      
      const response = await fetch(`${this.baseUrl}/puzzles/random?${params}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch random puzzle:', error);
      return null;
    }
  }

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/progress`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
      return null;
    }
  }

  async submitSolution(
    userId: string, 
    puzzleId: string, 
    solution: string[], 
    timeSpent: number, 
    attempts: number
  ): Promise<SolutionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/solutions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          puzzleId,
          solution,
          timeSpent,
          attempts
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to submit solution:', error);
      throw error;
    }
  }

  async getPuzzleStats(puzzleId: string): Promise<{
    solveRate: number;
    averageTime: number;
    averageAttempts: number;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/puzzles/${puzzleId}/stats`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch puzzle stats:', error);
      return null;
    }
  }

  async validatePuzzleDatabase(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/validate`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Failed to validate database:', error);
      return false;
    }
  }

  async exportUserData(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/export`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  async importUserData(userId: string, data: any): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/import`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to import user data:', error);
      throw error;
    }
  }
}

// Service factory for easy switching between implementations
export class PuzzleServiceFactory {
  static createLocalService(): IPuzzleService {
    return new LocalPuzzleService();
  }
  
  static createApiService(baseUrl: string, apiKey?: string): IPuzzleService {
    return new ApiPuzzleService(baseUrl, apiKey);
  }
  
  static createService(config: {
    type: 'local' | 'api';
    baseUrl?: string;
    apiKey?: string;
  }): IPuzzleService {
    switch (config.type) {
      case 'local':
        return new LocalPuzzleService();
      case 'api':
        if (!config.baseUrl) {
          throw new Error('API base URL is required for API service');
        }
        return new ApiPuzzleService(config.baseUrl, config.apiKey);
      default:
        throw new Error(`Unknown service type: ${config.type}`);
    }
  }
}

// Default service instance
export const puzzleService = PuzzleServiceFactory.createLocalService();

// Export configuration types
export interface PuzzleServiceConfig {
  type: 'local' | 'api';
  baseUrl?: string;
  apiKey?: string;
}

export interface UserProgressData {
  puzzlesSolved: string[];
  totalTime: number;
  averageRating: number;
  streaks: {
    current: number;
    best: number;
  };
  themeProgress: Record<string, {
    solved: number;
    total: number;
    averageRating: number;
  }>;
}

export interface ExportedUserData {
  progress?: UserProgress;
  settings?: Record<string, unknown>;
  exportedAt?: string;
}