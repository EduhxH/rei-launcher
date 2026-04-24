const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function detectJava() {
    const commonPaths = [
        'java', // Tenta o PATH primeiro
        path.join(process.env.ProgramFiles, 'Java', 'jdk-17', 'bin', 'java.exe'),
        path.join(process.env.ProgramFiles, 'Java', 'jdk-21', 'bin', 'java.exe'),
        path.join(process.env.ProgramFiles, 'Eclipse Foundation', 'jdk-17.0.8.7-hotspot', 'bin', 'java.exe')
    ];

    for (const jPath of commonPaths) {
        if (fs.existsSync(jPath) || jPath === 'java') {
            return { installed: true, path: jPath };
        }
    }
    return { installed: false };
}

module.exports = { detectJava };