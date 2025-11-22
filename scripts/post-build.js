#!/usr/bin/env node

/**
 * Post-Build Script
 * Creates the native host wrapper script after TypeScript compilation
 */

import { writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const wrapperPath = join(projectRoot, 'dist', 'browser', 'native-host');

const wrapperContent = `#!/usr/bin/env node

/**
 * Native Messaging Host Wrapper
 * This wrapper is executed by Chrome's native messaging system.
 */

import { NativeHost } from './native-host.js';

const host = new NativeHost();
host.start().catch(err => {
  console.error('Native host failed to start:', err);
  process.exit(1);
});
`;

console.log('📝 Creating native host wrapper...');
writeFileSync(wrapperPath, wrapperContent, 'utf-8');
chmodSync(wrapperPath, 0o755); // Make executable
console.log(`✅ Wrapper created at: ${wrapperPath}`);
