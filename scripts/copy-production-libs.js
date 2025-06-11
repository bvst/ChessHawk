/**
 * Copy Production Libraries Script
 * 
 * Copies required library files from node_modules to src/lib and dist
 * for production builds that don't use node_modules
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Define source and destination paths
const libraries = [
    {
        name: 'jQuery',
        source: 'node_modules/jquery/dist/jquery.min.js',
        dest: 'src/lib/jquery.min.js'
    },
    {
        name: 'Chess.js',
        source: 'src/lib/chess.min.js',
        dest: 'src/lib/chess.min.js'
    },
    {
        name: 'Chessboard.js',
        source: 'node_modules/@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.js',
        dest: 'src/lib/chessboard.min.js'
    },
    {
        name: 'Chessboard.js CSS',
        source: 'node_modules/@chrisoakman/chessboardjs/dist/chessboard-1.0.0.min.css',
        dest: 'src/lib/chessboard.min.css'
    }
];

console.log('📦 Copying production libraries...');

// Ensure directories exist
mkdirSync(resolve(projectRoot, 'src/lib'), { recursive: true });
mkdirSync(resolve(projectRoot, 'dist/lib'), { recursive: true });

let copiedCount = 0;
let errorCount = 0;

for (const lib of libraries) {
    const sourcePath = resolve(projectRoot, lib.source);
    const destPath = resolve(projectRoot, lib.dest);
    const distPath = resolve(projectRoot, 'dist/lib', lib.dest.split('/').pop());
    
    try {
        if (existsSync(sourcePath)) {
            // Only copy to src/lib if source is different from dest
            if (sourcePath !== destPath) {
                copyFileSync(sourcePath, destPath);
                console.log(`✅ ${lib.name}: ${lib.source} → ${lib.dest}`);
            } else {
                console.log(`📁 ${lib.name}: Already exists at ${lib.dest}`);
            }
            
            // Always copy to dist/lib for production deployment
            copyFileSync(sourcePath, distPath);
            console.log(`✅ ${lib.name}: ${lib.source} → dist/lib/${lib.dest.split('/').pop()}`);
            
            copiedCount++;
        } else {
            console.error(`❌ ${lib.name}: Source file not found at ${lib.source}`);
            errorCount++;
        }
    } catch (error) {
        console.error(`❌ ${lib.name}: Copy failed - ${error.message}`);
        errorCount++;
    }
}

console.log(`\n📊 Copy Summary:`);
console.log(`   ✅ Successfully copied: ${copiedCount} libraries`);
console.log(`   ❌ Failed to copy: ${errorCount} libraries`);

if (errorCount === 0) {
    console.log('\n🎉 All production libraries copied successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run build:prod-bundle');
    console.log('   2. Deploy the dist/ folder to your production server');
    console.log('   3. Use index-production.html as your production entry point');
} else {
    console.log('\n⚠️  Some libraries failed to copy. Check the errors above.');
    console.log('   Make sure all dependencies are installed: npm install');
}

process.exit(errorCount > 0 ? 1 : 0);