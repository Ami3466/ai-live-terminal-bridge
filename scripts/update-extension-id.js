#!/usr/bin/env node

/**
 * Update Extension ID in Native Messaging Host Manifest
 * Usage: npm run update-extension-id <EXTENSION_ID>
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOST_NAME = 'com.ai_live_log_bridge.browser_monitor';

function getManifestPath() {
  const platform = process.platform;

  if (platform === 'darwin') {
    return join(
      homedir(),
      'Library',
      'Application Support',
      'Google',
      'Chrome',
      'NativeMessagingHosts',
      `${HOST_NAME}.json`
    );
  } else if (platform === 'linux') {
    return join(
      homedir(),
      '.config',
      'google-chrome',
      'NativeMessagingHosts',
      `${HOST_NAME}.json`
    );
  } else {
    console.error('Windows not supported by this script. Please edit manifest manually.');
    process.exit(1);
  }
}

function updateExtensionId(extensionId) {
  console.log('🔧 Updating Extension ID in Native Messaging Host Manifest...\n');

  // Validate extension ID format
  // Chrome extension IDs are exactly 32 characters, lowercase letters a-p only (hex using a-p)
  const extensionIdPattern = /^[a-p]{32}$/;

  if (!extensionId || !extensionIdPattern.test(extensionId)) {
    console.error('❌ Invalid extension ID format.');
    console.error('\nExtension IDs must be:');
    console.error('  - Exactly 32 characters long');
    console.error('  - Contain only lowercase letters a-p (no numbers)');
    console.error('\nUsage: npm run update-extension-id <EXTENSION_ID>');
    console.error('Example: npm run update-extension-id abcdefghijklmnopqrstuvwxyzabcdef\n');
    console.error('Current input:', extensionId);
    console.error('Length:', extensionId?.length || 0);
    process.exit(1);
  }

  const manifestPath = getManifestPath();
  console.log(`📁 Manifest path: ${manifestPath}\n`);

  // Read manifest
  let manifest;
  try {
    const content = readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(content);
  } catch (err) {
    console.error('❌ Failed to read manifest file:', err.message);
    console.error('\nMake sure you ran: npm run install-native-host\n');
    process.exit(1);
  }

  // Update extension ID
  manifest.allowed_origins = [`chrome-extension://${extensionId}/`];

  // Write manifest
  try {
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log('✅ Extension ID updated successfully!\n');
    console.log(`📝 Updated manifest:`);
    console.log(JSON.stringify(manifest, null, 2));
    console.log('\n🎉 Setup complete! Refresh your localhost page in Chrome to test the connection.\n');
  } catch (err) {
    console.error('❌ Failed to write manifest file:', err.message);
    process.exit(1);
  }
}

// Get extension ID from command line
const extensionId = process.argv[2];

if (!extensionId) {
  console.error('❌ Extension ID required!\n');
  console.error('Usage: npm run update-extension-id <EXTENSION_ID>');
  console.error('\nSteps:');
  console.error('1. Open chrome://extensions/ in Chrome');
  console.error('2. Find "AI Live Log Bridge - Browser Monitor"');
  console.error('3. Copy the Extension ID (32 characters)');
  console.error('4. Run: npm run update-extension-id <EXTENSION_ID>\n');
  process.exit(1);
}

updateExtensionId(extensionId);
