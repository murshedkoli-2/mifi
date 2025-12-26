const fs = require('fs');
const path = require('path');

function searchDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        if (file === 'node_modules' || file === '.git' || file === '.expo') return;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            searchDir(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Look for import { ... SafeAreaView ... } from 'react-native'
            if (/import\s*\{[^}]*SafeAreaView[^}]*\}\s*from\s*['"]react-native['"]/.test(content)) {
                console.log(`FOUND: ${fullPath}`);
            }
        }
    });
}

searchDir('e:\\expofinance');
