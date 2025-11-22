import { createWriteStream, WriteStream } from 'fs';
import { redactSecrets } from '../redact-secrets.js';
import { ensureBrowserStorageExists } from './browser-storage.js';
import {
  generateBrowserSessionId,
  getBrowserSessionLogPath,
  registerBrowserSession,
  markBrowserSessionActive,
  markBrowserSessionCompleted,
  cleanupStaleBrowserSessions
} from './browser-session.js';

/**
 * Native Messaging Host
 * Receives JSON messages from the Chrome extension via stdin
 * Writes browser console logs and network activity to session files
 * Mirrors the pattern from wrapper.ts but for browser events
 */

interface BrowserMessage {
  type: 'console' | 'network' | 'error' | 'performance' | 'session-start' | 'session-end';
  timestamp?: number;
  url?: string;
  tabId?: number;

  // Console message fields
  level?: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text?: string;
  stackTrace?: any;

  // Network message fields
  method?: string;
  status?: number;
  duration?: number;
  headers?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;

  // Performance fields
  metric?: string;
  value?: number;

  // Session fields
  projectDir?: string;
}

export class NativeHost {
  private sessionId: string | null = null;
  private logStream: WriteStream | null = null;

  /**
   * Start the native messaging host
   * Reads JSON messages from stdin (sent by Chrome extension)
   */
  async start(): Promise<void> {
    // Ensure browser storage directory exists
    ensureBrowserStorageExists();

    // Clean up stale sessions (older than 1 day by default)
    const keepDays = parseInt(process.env.AI_KEEP_LOGS || '1', 10);
    const maxAgeMinutes = keepDays * 24 * 60;
    cleanupStaleBrowserSessions(maxAgeMinutes);

    // Log to stderr (stdout is reserved for native messaging protocol)
    console.error('[Native Host] Browser monitoring started');

    // Chrome sends length-prefixed messages, but for simplicity we'll use line-delimited JSON
    // Each message is a complete JSON object on a single line
    let buffer = '';

    process.stdin.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();

      // Process complete lines (messages)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const message: BrowserMessage = JSON.parse(line);
            this.handleMessage(message);
          } catch (err) {
            console.error('[Native Host] Failed to parse message:', err);
          }
        }
      }
    });

    process.stdin.on('end', () => {
      this.endSession();
      console.error('[Native Host] Input stream ended');
    });

    // Handle process termination
    process.on('SIGINT', () => this.endSession());
    process.on('SIGTERM', () => this.endSession());
  }

  /**
   * Handle a message from the Chrome extension
   */
  private handleMessage(message: BrowserMessage): void {
    if (message.type === 'session-start') {
      this.startSession(message.projectDir || process.cwd(), message.url);
      return;
    }

    if (message.type === 'session-end') {
      this.endSession();
      return;
    }

    // Ensure session is started
    if (!this.sessionId || !this.logStream) {
      // Auto-start session if not already started
      this.startSession(message.projectDir || process.cwd(), message.url);
    }

    // Route message to appropriate handler
    switch (message.type) {
      case 'console':
        this.logConsole(message);
        break;
      case 'network':
        this.logNetwork(message);
        break;
      case 'error':
        this.logError(message);
        break;
      case 'performance':
        this.logPerformance(message);
        break;
      default:
        console.error('[Native Host] Unknown message type:', message.type);
    }
  }

  /**
   * Start a new browser monitoring session
   */
  private startSession(projectDir: string, url?: string): void {
    if (this.sessionId) {
      console.error('[Native Host] Session already started:', this.sessionId);
      return;
    }

    this.sessionId = generateBrowserSessionId();
    const logFilePath = getBrowserSessionLogPath(this.sessionId);

    // Register this session in the master index
    registerBrowserSession(this.sessionId, projectDir, url);

    // Mark this session as active
    markBrowserSessionActive(this.sessionId, projectDir, url);

    // Create log file stream
    this.logStream = createWriteStream(logFilePath, { flags: 'w' });

    // Write header
    const timestamp = new Date().toISOString();
    const urlPart = url ? `\n[${timestamp}] URL: ${url}` : '';
    const header = `${'='.repeat(80)}\n[${timestamp}] Browser Session: ${this.sessionId}\n[${timestamp}] Project: ${projectDir}${urlPart}\n${'='.repeat(80)}\n`;
    this.logStream.write(header);

    console.error(`[Native Host] Started session: ${this.sessionId}`);

    // Send response back to extension (optional)
    this.sendResponse({ success: true, sessionId: this.sessionId });
  }

  /**
   * End the current browser monitoring session
   */
  private endSession(): void {
    if (!this.sessionId || !this.logStream) {
      return;
    }

    const footer = `\n[${new Date().toISOString()}] Browser session ended\n`;
    this.logStream.write(footer);
    this.logStream.end();

    // Mark session as completed
    const keepDays = parseInt(process.env.AI_KEEP_LOGS || '1', 10);
    const archiveLog = keepDays > 0;
    markBrowserSessionCompleted(this.sessionId, archiveLog);

    console.error(`[Native Host] Ended session: ${this.sessionId}`);
    this.sessionId = null;
    this.logStream = null;
  }

  /**
   * Log a console message
   */
  private logConsole(message: BrowserMessage): void {
    if (!this.logStream) return;

    const timestamp = message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString();
    const level = message.level || 'log';
    const text = message.text || '';
    const url = message.url || '';

    // Redact secrets from console text
    const redactedText = redactSecrets(text);

    let logEntry = `[${timestamp}] [Console ${level}] ${redactedText}`;

    if (url) {
      logEntry += ` (${url})`;
    }

    if (message.stackTrace) {
      logEntry += `\nStack Trace: ${JSON.stringify(message.stackTrace, null, 2)}`;
    }

    logEntry += '\n';
    this.logStream.write(logEntry);
  }

  /**
   * Log a network request/response
   */
  private logNetwork(message: BrowserMessage): void {
    if (!this.logStream) return;

    const timestamp = message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString();
    const method = message.method || 'GET';
    const url = message.url || '';
    const status = message.status || 0;
    const duration = message.duration ? `${message.duration}ms` : '';

    let logEntry = `[${timestamp}] [Network] ${method} ${url}`;

    if (status) {
      logEntry += ` → ${status}`;
    }

    if (duration) {
      logEntry += ` (${duration})`;
    }

    // Log headers if present (redact sensitive values)
    if (message.headers) {
      const redactedHeaders = redactSecrets(JSON.stringify(message.headers, null, 2));
      logEntry += `\nHeaders: ${redactedHeaders}`;
    }

    // Log request/response bodies if present (redact sensitive values)
    if (message.requestBody) {
      const redactedBody = redactSecrets(message.requestBody);
      logEntry += `\nRequest Body: ${redactedBody}`;
    }

    if (message.responseBody) {
      const redactedBody = redactSecrets(message.responseBody);
      logEntry += `\nResponse Body: ${redactedBody}`;
    }

    logEntry += '\n';
    this.logStream.write(logEntry);
  }

  /**
   * Log a JavaScript error
   */
  private logError(message: BrowserMessage): void {
    if (!this.logStream) return;

    const timestamp = message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString();
    const text = message.text || 'Unknown error';
    const url = message.url || '';

    // Redact any sensitive info from error messages
    const redactedText = redactSecrets(text);

    let logEntry = `[${timestamp}] [Error] ${redactedText}`;

    if (url) {
      logEntry += ` (${url})`;
    }

    if (message.stackTrace) {
      logEntry += `\nStack Trace: ${JSON.stringify(message.stackTrace, null, 2)}`;
    }

    logEntry += '\n';
    this.logStream.write(logEntry);
  }

  /**
   * Log a performance metric
   */
  private logPerformance(message: BrowserMessage): void {
    if (!this.logStream) return;

    const timestamp = message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString();
    const metric = message.metric || 'unknown';
    const value = message.value || 0;

    const logEntry = `[${timestamp}] [Performance] ${metric}: ${value}\n`;
    this.logStream.write(logEntry);
  }

  /**
   * Send a response back to the Chrome extension (optional)
   * Chrome native messaging uses length-prefixed messages
   */
  private sendResponse(response: any): void {
    const message = JSON.stringify(response);
    const length = Buffer.byteLength(message);
    const lengthBuffer = Buffer.allocUnsafe(4);
    lengthBuffer.writeUInt32LE(length, 0);

    process.stdout.write(lengthBuffer);
    process.stdout.write(message);
  }
}

/**
 * Start the native host if this file is run directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const host = new NativeHost();
  host.start().catch(err => {
    console.error('[Native Host] Fatal error:', err);
    process.exit(1);
  });
}
