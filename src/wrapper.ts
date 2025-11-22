import spawn from 'cross-spawn';
import { createWriteStream } from 'fs';
import stripAnsi from 'strip-ansi';
import chalk from 'chalk';
import { LOG_FILE, ensureStorageExists } from './storage.js';

/**
 * Wrapper Mode
 * Spawns a command, preserves colors, pipes to screen, strips ANSI, writes to log
 */
export async function runCommandWrapper(command: string, args: string[]): Promise<void> {
  // Ensure storage directory exists
  ensureStorageExists();

  // Create log file stream (append mode)
  const logStream = createWriteStream(LOG_FILE, { flags: 'a' });

  // Write header to log file
  const timestamp = new Date().toISOString();
  const header = `\n${'='.repeat(80)}\n[${timestamp}] Command: ${command} ${args.join(' ')}\n${'='.repeat(80)}\n`;
  logStream.write(header);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env }
    });

    // Track if we have pending writes
    let hasError = false;
    let streamClosed = false;

    // Handle logStream errors
    logStream.on('error', (err) => {
      console.error(chalk.red(`\n⚠️  Log write error: ${err.message}`));
      hasError = true;
    });

    // Handle stdout
    child.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();

      // Write to console with colors preserved
      process.stdout.write(output);

      // Write to log file without ANSI color codes
      if (!hasError) {
        logStream.write(stripAnsi(output));
      }
    });

    // Handle stderr
    child.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();

      // Write to console with colors preserved
      process.stderr.write(output);

      // Write to log file without ANSI color codes
      if (!hasError) {
        logStream.write(stripAnsi(output));
      }
    });

    // Handle process exit
    child.on('error', (error) => {
      if (!streamClosed) {
        streamClosed = true;
        logStream.write(`\nProcess error: ${error.message}\n`);
        logStream.end(() => {
          reject(error);
        });
      }
    });

    child.on('close', (code) => {
      if (!streamClosed) {
        streamClosed = true;
        const footer = `\n[${new Date().toISOString()}] Process exited with code: ${code}\n`;
        logStream.write(footer);

        // Wait for stream to finish before continuing
        logStream.end(() => {
          if (code === 0) {
            console.log(chalk.green(`\n✅ Command completed successfully`));
            resolve();
          } else {
            console.log(chalk.yellow(`\n⚠️  Command exited with code ${code}`));
            // Exit with the same code to preserve exit status (synchronous, no resolve needed)
            process.exit(code ?? 1);
          }
        });
      }
    });
  });
}
