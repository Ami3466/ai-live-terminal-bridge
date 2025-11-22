#!/usr/bin/env node

import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { LOG_FILE } from '../storage.js';
import { startMCPServer } from '../server.js';
import { runCommandWrapper } from '../wrapper.js';

async function main() {
  const args = process.argv.slice(2);

  // Mode A: MCP Server (ai --server)
  // Used by Claude Desktop
  if (args.includes('--server')) {
    console.error(chalk.cyan('🚀 Starting MCP Server...'));
    await startMCPServer();
    return;
  }

  // Mode B: Live Log Viewer (ai live)
  // Watch logs in real-time
  if (args[0] === 'live' || args.includes('--live') || args.includes('--watch')) {
    console.log(chalk.cyan('👀 Watching logs in real-time...'));
    console.log(chalk.gray(`📁 Log file: ${LOG_FILE}`));
    console.log(chalk.gray('Press Ctrl+C to exit\n'));
    console.log(chalk.dim('='.repeat(80)) + '\n');

    if (!existsSync(LOG_FILE)) {
      console.log(chalk.yellow('No log file found yet. Waiting for commands...\n'));
    }

    // Dynamic import for tail functionality
    const { spawn } = await import('child_process');
    const tail = spawn('tail', ['-f', '-n', '20', LOG_FILE], {
      stdio: ['ignore', 'pipe', 'inherit']
    });

    tail.stdout?.on('data', (data) => {
      process.stdout.write(data.toString());
    });

    tail.on('error', (error) => {
      console.error(chalk.red('Error watching logs:'), error);
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.cyan('\n\n👋 Stopped watching logs'));
      tail.kill();
      process.exit(0);
    });

    return;
  }

  // Mode C: CLI Reader (ai --last)
  // Used by Claude Code / Cursor Agent
  if (args.includes('--last')) {
    const lastIndex = args.indexOf('--last');
    const linesArg = args[lastIndex + 1];
    let lines = linesArg && !linesArg.startsWith('-') ? parseInt(linesArg, 10) : 100;

    // Validate line count
    if (isNaN(lines) || lines < 1) {
      console.log(chalk.yellow('Invalid line count. Using default: 100'));
      lines = 100;
    }
    if (lines > 10000) {
      console.log(chalk.yellow('Line count too large. Using maximum: 10000'));
      lines = 10000;
    }

    if (!existsSync(LOG_FILE)) {
      console.log(chalk.yellow('No log file found. Run a command with `ai` first.'));
      process.exit(0);
    }

    try {
      const content = readFileSync(LOG_FILE, 'utf-8');
      const allLines = content.split('\n');
      const recentLines = allLines.slice(-lines);

      console.log(recentLines.join('\n'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Error reading log file:'), error);
      process.exit(1);
    }
  }

  // Mode D: Wrapper (Default)
  // Usage: ai <command>
  if (args.length === 0) {
    console.log(chalk.cyan('🤖 AI Live Terminal Bridge'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.white('  ai <command>           ') + chalk.gray('Run command with logging'));
    console.log(chalk.white('  ai live                ') + chalk.gray('Watch logs in real-time (Ctrl+C to exit)'));
    console.log(chalk.white('  ai --last [lines]      ') + chalk.gray('Read last N lines (default: 100)'));
    console.log(chalk.white('  ai --server            ') + chalk.gray('Start MCP server (for Claude Desktop)'));
    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.white('  ai npm start           ') + chalk.gray('# Run with logging'));
    console.log(chalk.white('  ai live                ') + chalk.gray('# Watch logs live'));
    console.log(chalk.white('  ai --last 50           ') + chalk.gray('# Read last 50 lines'));
    console.log(chalk.gray('\nLog file: ') + chalk.white(LOG_FILE));
    process.exit(0);
  }

  // Run command with wrapper
  const command = args[0];
  const commandArgs = args.slice(1);

  console.log(chalk.cyan(`🤖 Starting command`));
  console.log(chalk.gray(`   Command: ${command} ${commandArgs.join(' ')}\n`));

  try {
    await runCommandWrapper(command, commandArgs);
  } catch (error) {
    console.error(chalk.red(`\n❌ Command failed`));
    if (error instanceof Error) {
      console.error(chalk.red(`   Error: ${error.message}`));
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
