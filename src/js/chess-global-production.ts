/**
 * ChessHawk - Chess Global (Production Mode)
 * 
 * Production-compatible version that uses global Chess from script tag
 * instead of ES module imports
 */

import type { ChessInstance } from '../types/chess-hawk';

// Production mode: Chess is loaded via script tag
declare global {
  interface Window {
    Chess: new (fen?: string) => ChessInstance;
  }
}

/**
 * Get Chess constructor from global scope or throw error
 */
function getChessConstructor(): new (fen?: string) => ChessInstance {
  if (typeof window !== 'undefined' && window.Chess) {
    return window.Chess;
  }
  
  // Fallback: check for global Chess variable
  if (typeof Chess !== 'undefined') {
    return Chess as any;
  }
  
  throw new Error('Chess.js not available. Make sure it is loaded via script tag.');
}

/**
 * Export Chess constructor for consistency with dev mode
 */
export const Chess = getChessConstructor();

/**
 * Helper function to create a new chess game instance
 */
export function createChessGame(fen?: string): ChessInstance {
  const ChessConstructor = getChessConstructor();
  return new ChessConstructor(fen);
}

// Ensure Chess is available globally for backward compatibility
if (typeof window !== 'undefined') {
  window.Chess = Chess;
}

console.log('♟️ Chess.js loaded in production mode');