import { randomBytes } from 'crypto';
import { writeFileSync, readFileSync, existsSync, unlinkSync, renameSync } from 'fs';
import { join } from 'path';
import { BROWSER_MCP_DIR, BROWSER_ACTIVE_DIR, BROWSER_INACTIVE_DIR } from './browser-storage.js';

/**
 * Browser Session Management
 * Manages unique session IDs for each browser monitoring session
 * Mirrors the pattern from src/session.ts but for browser connections
 */

/**
 * Generate a short, readable browser session ID
 * Format: browser-<timestamp>-<random-hex>
 * Example: browser-20250122143022-a3f2
 */
export function generateBrowserSessionId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14); // YYYYMMDDHHmmss
  const random = randomBytes(2).toString('hex'); // 4 chars
  return `browser-${timestamp}-${random}`;
}

/**
 * Get the browser session log file path for a given session ID
 * @param sessionId The browser session ID
 * @param active If true, return path in active directory, otherwise inactive (default: true)
 */
export function getBrowserSessionLogPath(sessionId: string, active: boolean = true): string {
  const dir = active ? BROWSER_ACTIVE_DIR : BROWSER_INACTIVE_DIR;
  return join(dir, `${sessionId}.log`);
}

/**
 * Get the browser master index file path
 * This file tracks all browser session IDs in chronological order
 */
export function getBrowserMasterIndexPath(): string {
  return join(BROWSER_MCP_DIR, 'master-browser-index.log');
}

/**
 * Register a new browser session in the master index
 * @param sessionId The browser session ID to register
 * @param projectDir The working directory where the browser monitoring was started
 * @param url The URL being monitored (optional)
 */
export function registerBrowserSession(sessionId: string, projectDir: string, url?: string): void {
  const timestamp = new Date().toISOString();
  const urlPart = url ? ` [URL: ${url}]` : '';
  const entry = `[${timestamp}] [${sessionId}] [${projectDir}]${urlPart}\n`;

  const masterPath = getBrowserMasterIndexPath();

  // Append to master index (create if doesn't exist)
  if (existsSync(masterPath)) {
    const content = readFileSync(masterPath, 'utf-8');
    writeFileSync(masterPath, content + entry, 'utf-8');
  } else {
    writeFileSync(masterPath, entry, 'utf-8');
  }
}

/**
 * Get all browser session IDs from the master index
 * @returns Array of session IDs in chronological order
 */
export function getAllBrowserSessionIds(): string[] {
  const masterPath = getBrowserMasterIndexPath();

  if (!existsSync(masterPath)) {
    return [];
  }

  const content = readFileSync(masterPath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.length > 0);

  // Extract session IDs using regex
  const sessionIds: string[] = [];
  const sessionIdPattern = /\[(browser-[\d-]+)\]/;

  for (const line of lines) {
    const match = line.match(sessionIdPattern);
    if (match) {
      sessionIds.push(match[1]);
    }
  }

  return sessionIds;
}

/**
 * Get the active browser sessions file path
 * This file tracks currently running browser sessions
 */
export function getActiveBrowserSessionsPath(): string {
  return join(BROWSER_MCP_DIR, 'active-browser-sessions.json');
}

/**
 * Mark a browser session as active (running)
 * @param sessionId The browser session ID
 * @param projectDir The project directory
 * @param url The URL being monitored (optional)
 */
export function markBrowserSessionActive(sessionId: string, projectDir: string, url?: string): void {
  const activePath = getActiveBrowserSessionsPath();
  let active: Record<string, { projectDir: string; startTime: string; url?: string }> = {};

  if (existsSync(activePath)) {
    const content = readFileSync(activePath, 'utf-8');
    active = JSON.parse(content);
  }

  active[sessionId] = {
    projectDir,
    startTime: new Date().toISOString(),
    ...(url && { url })
  };

  writeFileSync(activePath, JSON.stringify(active, null, 2), 'utf-8');
}

/**
 * Mark a browser session as completed and move its log to inactive directory
 * @param sessionId The browser session ID
 * @param archiveLog Whether to archive the log file to inactive directory (default: true)
 */
export function markBrowserSessionCompleted(sessionId: string, archiveLog: boolean = true): void {
  const activePath = getActiveBrowserSessionsPath();

  if (existsSync(activePath)) {
    const content = readFileSync(activePath, 'utf-8');
    const active = JSON.parse(content);
    delete active[sessionId];
    writeFileSync(activePath, JSON.stringify(active, null, 2), 'utf-8');
  }

  // Move the log file to inactive directory if requested
  if (archiveLog) {
    const activeLogPath = getBrowserSessionLogPath(sessionId, true);
    const inactiveLogPath = getBrowserSessionLogPath(sessionId, false);

    if (existsSync(activeLogPath)) {
      renameSync(activeLogPath, inactiveLogPath);
    }
  } else {
    // Delete if not archiving
    const activeLogPath = getBrowserSessionLogPath(sessionId, true);
    if (existsSync(activeLogPath)) {
      unlinkSync(activeLogPath);
    }
  }
}

/**
 * Get all active browser session IDs for a specific project
 * @param projectDir The project directory (optional - returns all if not specified)
 * @returns Array of active browser session IDs
 */
export function getActiveBrowserSessions(projectDir?: string): string[] {
  const activePath = getActiveBrowserSessionsPath();

  if (!existsSync(activePath)) {
    return [];
  }

  const content = readFileSync(activePath, 'utf-8');
  const active: Record<string, { projectDir: string; startTime: string; url?: string }> = JSON.parse(content);

  if (projectDir) {
    return Object.keys(active).filter(id => active[id].projectDir === projectDir);
  }

  return Object.keys(active);
}

/**
 * Clean up stale browser sessions (sessions older than maxAgeMinutes)
 * @param maxAgeMinutes Maximum age of active sessions in minutes (default: 60)
 * @returns Number of stale sessions cleaned up
 */
export function cleanupStaleBrowserSessions(maxAgeMinutes: number = 60): number {
  const activePath = getActiveBrowserSessionsPath();

  if (!existsSync(activePath)) {
    return 0;
  }

  const content = readFileSync(activePath, 'utf-8');
  const active: Record<string, { projectDir: string; startTime: string }> = JSON.parse(content);

  const now = new Date().getTime();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  let cleanedCount = 0;

  // Find stale sessions
  const staleSessionIds = Object.keys(active).filter(sessionId => {
    const startTime = new Date(active[sessionId].startTime).getTime();
    const age = now - startTime;
    return age > maxAgeMs;
  });

  // Clean up stale sessions
  for (const sessionId of staleSessionIds) {
    markBrowserSessionCompleted(sessionId, true);
    cleanedCount++;
  }

  return cleanedCount;
}
