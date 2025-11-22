import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

/**
 * Shared storage configuration for all modes
 */
export const MCP_DIR = join(homedir(), '.mcp-logs');
export const LOG_FILE = join(MCP_DIR, 'session.log');

/**
 * Ensure the storage directory exists
 */
export function ensureStorageExists(): void {
  if (!existsSync(MCP_DIR)) {
    mkdirSync(MCP_DIR, { recursive: true });
  }
}
