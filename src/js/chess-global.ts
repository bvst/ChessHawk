/**
 * Chess.js TypeScript Module
 * 
 * This module properly imports the modern chess.js (v1.3.1) as an ES module
 * and provides TypeScript support for Chess Hawk
 */

import { Chess as ChessClass } from 'chess.js';
import type { ChessInstance } from '../types/chess-hawk';

// Export Chess class for ES6 module usage
export const Chess = ChessClass;

// Also expose globally for backward compatibility with chessboard.js and other code
declare global {
  interface Window {
    Chess: typeof ChessClass;
  }
}

// Make Chess available globally
if (typeof window !== 'undefined') {
  window.Chess = ChessClass;
  console.log('✅ Chess.js v1.3.1 loaded as ES module and exposed globally');
} else {
  console.log('✅ Chess.js v1.3.1 loaded as ES module (server-side)');
}

// Helper function to create a new Chess instance
export function createChessGame(fen?: string): ChessInstance {
  return new Chess(fen) as ChessInstance;
}

// Export the Chess constructor type
export type ChessConstructor = typeof Chess;

// Verify Chess.js is working
try {
  const testGame = new Chess();
  console.log('✅ Chess.js functionality verified:', {
    version: '1.3.1',
    fen: testGame.fen(),
    turn: testGame.turn(),
    movesCount: testGame.moves().length
  });
} catch (error) {
  console.error('❌ Chess.js verification failed:', error);
}