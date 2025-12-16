/**
 * @file tests.js
 * @description Script to execute the test suite and generate coverage reports.
 * Used to standardize test execution in CI/CD and local development.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting VECTRA UI Test Suite...');
console.log('📊 Generating coverage reports and JUnit results...');

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

// Command to runs
// We use 'npm' (or pnpm if strictly enforced, but npm is safer default for scripts)
// But since we are migrated to pnpm, let's try to detect or just use 'pnpm' if we know it's there.
// The user has been using pnpm. Let's use `pnpm run test:coverage`.
const command = 'pnpm';
const args = ['run', 'test:coverage'];

console.log(`> ${command} ${args.join(' ')}`);

const testProcess = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit', // Pipe output directly to console
    shell: true       // Use shell to resolve command (helpful for Windows/Env vars)
});

testProcess.on('error', (err) => {
    console.error('❌ Failed to start test process:', err);
    process.exit(1);
});

testProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Test suite completed successfully!');
        console.log('📝 Reports generated in /coverage and junit.xml');
    } else {
        console.error(`\n❌ Tests failed with exit code ${code}`);
        process.exit(code);
    }
});
