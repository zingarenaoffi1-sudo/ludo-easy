const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');
const androidPublicDir = path.join(__dirname, 'android/app/src/main/assets/public');

const ignoredFiles = [
    'server.js',
    'build.js',
    'prepare-android.py',
    'package.json',
    'package-lock.json',
    'bun.lock',
    'capacitor.config.json',
    'release.keystore',
    'debug.keystore',
    'release_keystore_base64.txt'
];

const staleFilesToRemove = [
    'competition.html',
    'competition.js',
    'competition-style.css',
    'online.html',
    'script.js',
    'socket.io.min.js',
    'unity-ads-config.js',
    'game-features.js',
    'package.json',
    'package-lock.json',
    'bun.lock'
];

function cleanAndSync(targetDir) {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Remove stale files in targetDir
    const targetFiles = fs.readdirSync(targetDir);
    for (const tf of targetFiles) {
        if (staleFilesToRemove.includes(tf)) {
            const p = path.join(targetDir, tf);
            try {
                if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true, force: true });
                else fs.unlinkSync(p);
            } catch (e) {}
        }
    }

    const files = fs.readdirSync(srcDir);
    for (const file of files) {
        if (file === 'www' || file === 'android' || file === 'node_modules' || file === '.git' || file === '.github' || file === 'app') continue;
        
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(targetDir, file);
        
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            if (file === 'assets' || file === 'sounds' || file === 'screenshots') {
                fs.cpSync(srcPath, destPath, { recursive: true });
            }
        } else {
            const ext = path.extname(file);
            if (['.html', '.css', '.js', '.png', '.json', '.jpg', '.jpeg', '.svg'].includes(ext)) {
                if (!ignoredFiles.includes(file) && !file.startsWith('patch_') && !file.startsWith('test_')) {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        }
    }
}

try {
    cleanAndSync(destDir);
    if (fs.existsSync(androidPublicDir)) {
        cleanAndSync(androidPublicDir);
    }
    console.log("Build completed successfully. Files synced to www/ and android assets.");
    process.exit(0);
} catch(e) {
    console.error("Build failed:", e);
    process.exit(1);
}
