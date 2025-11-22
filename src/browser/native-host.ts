import { createWriteStream, WriteStream } from 'fs';
import { resolve, normalize } from 'path';
import { z } from 'zod';
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

// Zod schema for validating incoming messages
const BrowserMessageSchema = z.object({
  type: z.enum(['console', 'network', 'error', 'performance', 'session-start', 'session-end']),
  timestamp: z.number().optional(),
  url: z.string().max(2048).optional(), // Prevent extremely long URLs
  tabId: z.number().optional(),

  // Console message fields
  level: z.enum(['log', 'info', 'warn', 'error', 'debug']).optional(),
  text: z.string().max(50000).optional(), // Limit message size to prevent DoS
  stackTrace: z.any().optional(),

  // Network message fields
  method: z.string().max(10).optional(),
  status: z.number().min(100).max(599).optional(),
  duration: z.number().min(0).optional(),
  headers: z.record(z.string()).optional(),
  requestBody: z.string().max(100000).optional(), // Limit body size
  responseBody: z.string().max(100000).optional(),

  // Performance fields
  metric: z.string().max(100).optional(),
  value: z.number().optional(),

  // Session fields
  projectDir: z.string().max(1024).optional(), // Limit path length
});

type BrowserMessage = z.infer<typeof BrowserMessageSchema>;

export class NativeHost {
  private sessionId: string | null = null;
  private logStream: WriteStream | null = null;
  private isStartingSession: boolean = false;

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

    /**
     * PROTOCOL NOTE:
     * Chrome's Native Messaging protocol officially uses length-prefixed binary messages:
     * - First 4 bytes: uint32 message length (little-endian)
     * - Following bytes: UTF-8 encoded JSON message
     *
     * However, for development simplicity and compatibility with text-based extensions,
     * this implementation currently uses line-delimited JSON (one JSON object per line).
     *
     * The Chrome extension must be configured to send messages in the same format:
     * - Each message should be a complete JSON object
     * - Messages should be separated by newline characters (\n)
     * - No binary framing is expected
     *
     * To switch to proper Chrome Native Messaging protocol, both the extension and
     * this host would need to be updated to handle binary length-prefixed messages.
     *
     * See: https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
     */
    let buffer = '';

    process.stdin.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();

      // Process complete lines (messages)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);

            // Validate message structure with Zod
            const validationResult = BrowserMessageSchema.safeParse(parsed);

            if (!validationResult.success) {
              console.error('[Native Host] Invalid message format:', validationResult.error.flatten());
              continue;
            }

            this.handleMessage(validationResult.data);
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
   * Validate and sanitize project directory path
   */
  private validateProjectDir(projectDir: string | undefined): string {
    const cwd = process.cwd();

    if (!projectDir) {
      return cwd;
    }

    // Normalize and resolve the path to prevent traversal
    const normalizedPath = normalize(projectDir);
    const resolvedPath = resolve(normalizedPath);

    // Security check: prevent path traversal
    // Only allow absolute paths that don't contain suspicious patterns
    if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
      console.error('[Native Host] Rejected suspicious project path:', projectDir);
      return cwd;
    }

    // Additional validation: path must be absolute and reasonable
    if (!resolvedPath.startsWith('/')) {
      console.error('[Native Host] Rejected non-absolute path:', projectDir);
      return cwd;
    }

    return resolvedPath;
  }

  /**
   * Handle a message from the Chrome extension
   */
  private handleMessage(message: BrowserMessage): void {
    if (message.type === 'session-start') {
      const validatedDir = this.validateProjectDir(message.projectDir);
      this.startSession(validatedDir, message.url);
      return;
    }

    if (message.type === 'session-end') {
      this.endSession();
      return;
    }

    // Ensure session is started (prevent race condition with flag)
    if (!this.sessionId || !this.logStream) {
      if (this.isStartingSession) {
        // Session is already being started, skip this message
        console.error('[Native Host] Session start in progress, skipping message');
        return;
      }
      // Auto-start session if not already started
      const validatedDir = this.validateProjectDir(message.projectDir);
      this.startSession(validatedDir, message.url);
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

    if (this.isStartingSession) {
      console.error('[Native Host] Session start already in progress');
      return;
    }

    this.isStartingSession = true;

    try {
      this.sessionId = generateBrowserSessionId();
      const logFilePath = getBrowserSessionLogPath(this.sessionId);

      // Register this session in the master index
      registerBrowserSession(this.sessionId, projectDir, url);

      // Mark this session as active
      markBrowserSessionActive(this.sessionId, projectDir, url);

      // Create log file stream
      this.logStream = createWriteStream(logFilePath, { flags: 'w' });

      // Handle stream errors to prevent crashes
      this.logStream.on('error', (err) => {
        console.error('[Native Host] Log stream error:', err);
        this.endSession();
      });

      // Write header
      const timestamp = new Date().toISOString();
      const urlPart = url ? `\n[${timestamp}] URL: ${url}` : '';
      const header = `${'='.repeat(80)}\n[${timestamp}] Browser Session: ${this.sessionId}\n[${timestamp}] Project: ${projectDir}${urlPart}\n${'='.repeat(80)}\n`;
      this.logStream.write(header);

      console.error(`[Native Host] Started session: ${this.sessionId}`);

      // Send response back to extension (optional)
      this.sendResponse({ success: true, sessionId: this.sessionId });
    } catch (err) {
      console.error('[Native Host] Failed to start session:', err);
      this.sessionId = null;
      this.logStream = null;
    } finally {
      this.isStartingSession = false;
    }
  }

  /**
   * End the current browser monitoring session
   */
  private endSession(): void {
    if (!this.sessionId && !this.logStream) {
      return;
    }

    try {
      if (this.logStream) {
        const footer = `\n[${new Date().toISOString()}] Browser session ended\n`;
        this.logStream.write(footer);
        this.logStream.end();
      }

      // Mark session as completed
      if (this.sessionId) {
        const keepDays = parseInt(process.env.AI_KEEP_LOGS || '1', 10);
        const archiveLog = keepDays > 0;
        markBrowserSessionCompleted(this.sessionId, archiveLog);
        console.error(`[Native Host] Ended session: ${this.sessionId}`);
      }
    } catch (err) {
      console.error('[Native Host] Error ending session:', err);
    } finally {
      this.sessionId = null;
      this.logStream = null;
      this.isStartingSession = false;
    }
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
