/**
 * Copy Production Libraries Script
 * 
 * Copies required library files from node_modules to src/lib and dist
 * for production builds that don't use node_modules
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
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

// Copy and rename HTML file for production
console.log('\n📄 Setting up production HTML...');
try {
    const htmlSource = resolve(projectRoot, 'index-production.html');
    const htmlDest = resolve(projectRoot, 'dist/index.html');
    
    if (existsSync(htmlSource)) {
        copyFileSync(htmlSource, htmlDest);
        console.log('✅ HTML: index-production.html → dist/index.html');
    } else {
        console.log('⚠️  index-production.html not found, will be handled by Vite build');
    }
} catch (error) {
    console.log('⚠️  HTML copy failed, will be handled by Vite build:', error.message);
}

// Copy source files that HTML references
console.log('\n📁 Copying source files...');

function copyDirectory(source, destination) {
    if (!existsSync(source)) {
        return false;
    }
    
    mkdirSync(destination, { recursive: true });
    
    const files = readdirSync(source);
    
    for (const file of files) {
        const sourcePath = join(source, file);
        const destPath = join(destination, file);
        
        if (statSync(sourcePath).isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            copyFileSync(sourcePath, destPath);
        }
    }
    
    return true;
}

const sourceDirs = [
    { from: 'src/css', to: 'dist/src/css' },
    { from: 'src/data', to: 'dist/src/data' },
    { from: 'src/img', to: 'dist/src/img' }
];

for (const dir of sourceDirs) {
    const sourceDir = resolve(projectRoot, dir.from);
    const destDir = resolve(projectRoot, dir.to);
    
    if (copyDirectory(sourceDir, destDir)) {
        console.log(`✅ Copied: ${dir.from} → ${dir.to}`);
    } else {
        console.log(`⚠️  Source directory not found: ${dir.from}`);
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
    console.log('   3. Netlify will automatically serve dist/index.html');
} else {
    console.log('\n⚠️  Some libraries failed to copy. Check the errors above.');
    console.log('   Make sure all dependencies are installed: npm install');
}

process.exit(errorCount > 0 ? 1 : 0);