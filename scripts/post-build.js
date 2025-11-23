#!/usr/bin/env node

/**
 * Post-Build Script
 * Creates the native host wrapper script after TypeScript compilation
 */

import { writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const wrapperPath = join(projectRoot, 'dist', 'browser', 'native-host');

// Detect node path at build time for Chrome's native messaging
// Chrome doesn't resolve PATH properly, so we need an absolute path
let nodePath;
try {
  nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
} catch (err) {
  // Fallback to common paths
  nodePath = '/usr/bin/env node';
}

const wrapperContent = `#!${nodePath}

/**
 * Native Messaging Host Wrapper
 * This wrapper is executed by Chrome's native messaging system.
 * It changes to the project directory before importing to ensure dependencies are found.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change to project root so node_modules can be found
process.chdir(join(__dirname, '..', '..'));

// Now import the actual host
const { NativeHost } = await import('./native-host.js');

const host = new NativeHost();
await host.start();
`;

console.log('📝 Creating native host wrapper...');
writeFileSync(wrapperPath, wrapperContent, 'utf-8');
chmodSync(wrapperPath, 0o755); // Make executable
console.log(`✅ Wrapper created at: ${wrapperPath}`);
