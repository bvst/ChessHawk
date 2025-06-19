/**
 * Chess Hawk Core Module
 * Central orchestrator and legacy compatibility layer
 */

export class ChessHawkCore {
  private static instance: ChessHawkCore
  private modules: Map<string, unknown> = new Map()
  private initialized = false

  private constructor() {}

  static getInstance(): ChessHawkCore {
    if (!ChessHawkCore.instance) {
      ChessHawkCore.instance = new ChessHawkCore()
    }
    return ChessHawkCore.instance
  }

  /**
   * Initialize Chess Hawk with configuration
   */
  async initialize(config: ChessHawkConfig = {}): Promise<void> {
    if (this.initialized) {
      console.warn('Chess Hawk already initialized')
      return
    }

    try {
      // Initialize services
      await this.initializeServices(config)
      
      // Initialize UI components (if in browser)
      if (typeof window !== 'undefined') {
        await this.initializeUI(config)
      }

      this.initialized = true
      console.log('✅ Chess Hawk Core initialized successfully')
    } catch (error) {
      console.error('❌ Chess Hawk initialization failed:', error)
      throw error
    }
  }

  /**
   * Get a module by name
   */
  getModule<T = any>(name: string): T | undefined {
    return this.modules.get(name) as T | undefined
  }

  /**
   * Register a module
   */
  registerModule(name: string, module: any): void {
    this.modules.set(name, module)
  }

  /**
   * Check if core is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  private async initializeServices(config: ChessHawkConfig): Promise<void> {
    // Import and initialize services
    const { PuzzleServiceFactory } = await import('../services/puzzle-service')
    const { useGameStore } = await import('../stores/game-store')

    // Setup puzzle service
    const puzzleService = config.puzzleService 
      ? PuzzleServiceFactory.createService(config.puzzleService)
      : PuzzleServiceFactory.createLocalService()

    this.registerModule('puzzleService', puzzleService)
    this.registerModule('gameStore', useGameStore)
  }

  private async initializeUI(config: ChessHawkConfig): Promise<void> {
    // Legacy UI initialization for web
    if (config.enableLegacyUI !== false) {
      try {
        // Import legacy modules if available
        const legacyModules = await this.loadLegacyModules()
        Object.entries(legacyModules).forEach(([name, module]) => {
          this.registerModule(name, module)
        })
      } catch (error) {
        console.warn('Legacy UI modules not available:', error)
      }
    }
  }

  private async loadLegacyModules(): Promise<Record<string, any>> {
    // Try to load legacy modules if they exist
    try {
      const modules: Record<string, any> = {}
      
      // These imports will fail gracefully if files don't exist
      const moduleNames = ['core-manager', 'board-manager', 'problem-manager', 'game-logic', 'ui-manager']
      
      for (const moduleName of moduleNames) {
        try {
          const module = await import(`../js/${moduleName}.js`)
          modules[moduleName.replace('-', '')] = module.default || module
        } catch {
          // Module not available, skip
        }
      }
      
      return modules
    } catch {
      return {}
    }
  }
}

export interface ChessHawkConfig {
  puzzleService?: {
    type: 'local' | 'api'
    baseUrl?: string
    apiKey?: string
  }
  enableLegacyUI?: boolean
  theme?: 'light' | 'dark' | 'auto'
  language?: 'en' | 'no'
}

// Export singleton instance
export const chessHawk = ChessHawkCore.getInstance()

// Convenience functions
export const initializeChessHawk = (config?: ChessHawkConfig) => chessHawk.initialize(config)
export const getChessHawkModule = <T = any>(name: string): T | undefined => chessHawk.getModule<T>(name)