#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
import { LOG_FILE } from './storage.js';

/**
 * MCP Server Mode
 * Used by Claude Desktop - speaks MCP protocol over stdio
 */
export async function startMCPServer(): Promise<void> {
  const server = new Server(
    {
      name: 'ai-live-terminal-bridge',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define the tools
  const tools: Tool[] = [
    {
      name: 'get_crash_context',
      description: 'Read the session log file to get crash context and recent command output',
      inputSchema: {
        type: 'object',
        properties: {
          lines: {
            type: 'number',
            description: 'Number of recent lines to read (default: 100)',
          },
        },
      },
    },
    {
      name: 'auto_fix_errors',
      description: 'Automatically detect and analyze errors in the session log. Use this when the user mentions errors, asks for fixes, or says "auto fix". Returns detected errors with context and suggestions.',
      inputSchema: {
        type: 'object',
        properties: {
          lines: {
            type: 'number',
            description: 'Number of recent lines to analyze (default: 200)',
          },
        },
      },
    },
  ];

  // Handle list tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'get_crash_context') {
        const lines = (args?.lines as number) || 100;

        if (!existsSync(LOG_FILE)) {
          return {
            content: [
              {
                type: 'text',
                text: 'No log file found. Run a command with `ai` first.',
              },
            ],
          };
        }

        const content = readFileSync(LOG_FILE, 'utf-8');
        const allLines = content.split('\n');
        const recentLines = allLines.slice(-lines).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: recentLines || 'Log file is empty.',
            },
          ],
        };
      }

      if (name === 'auto_fix_errors') {
        const lines = (args?.lines as number) || 200;

        if (!existsSync(LOG_FILE)) {
          return {
            content: [
              {
                type: 'text',
                text: 'No log file found. Run a command with `ai` first.',
              },
            ],
          };
        }

        const content = readFileSync(LOG_FILE, 'utf-8');
        const allLines = content.split('\n');
        const recentLines = allLines.slice(-lines);

        // Error detection patterns
        const errorPatterns = [
          /\berror:/i,
          /\bError\b/,
          /\bexception:/i,
          /\bException\b/,
          /\bfailed\b/i,
          /\bTypeError\b/,
          /\bSyntaxError\b/,
          /\bReferenceError\b/,
          /Process exited with code: [^0]/,
          /^\s+at\s+/,  // Stack trace lines
        ];

        // Find all error lines
        const errors: Array<{ line: string; index: number; type: string }> = [];
        recentLines.forEach((line, index) => {
          for (const pattern of errorPatterns) {
            if (pattern.test(line)) {
              let errorType = 'Unknown Error';
              if (/\berror:/i.test(line)) errorType = 'Error';
              if (/\bException\b/.test(line)) errorType = 'Exception';
              if (/\bTypeError\b/.test(line)) errorType = 'TypeError';
              if (/\bSyntaxError\b/.test(line)) errorType = 'SyntaxError';
              if (/\bfailed\b/i.test(line)) errorType = 'Failed';
              if (/Process exited with code/.test(line)) errorType = 'Exit Code Error';
              if (/^\s+at\s+/.test(line)) errorType = 'Stack Trace';

              errors.push({ line, index, type: errorType });
              break;
            }
          }
        });

        if (errors.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: '✅ No errors detected in the recent logs.\n\nThe session log looks clean!',
              },
            ],
          };
        }

        // Build error report
        let report = `# 🔴 Auto-Fix Analysis\n\n`;
        report += `Found ${errors.length} error indicator(s) in the last ${lines} lines.\n\n`;
        report += `## Detected Issues:\n\n`;

        // Group consecutive stack traces - keep only first stack trace in a sequence
        const uniqueErrors: typeof errors = [];
        errors.forEach((error, idx) => {
          // Skip consecutive stack traces (keep only the first one)
          if (error.type === 'Stack Trace' && idx > 0 && errors[idx - 1].type === 'Stack Trace') {
            return;
          }
          uniqueErrors.push(error);
        });

        uniqueErrors.slice(0, 10).forEach((error, idx) => {
          report += `${idx + 1}. **${error.type}**\n`;
          report += `   \`\`\`\n   ${error.line.trim()}\n   \`\`\`\n\n`;
        });

        if (uniqueErrors.length > 10) {
          report += `... and ${uniqueErrors.length - 10} more error(s)\n\n`;
        }

        report += `## Full Error Context:\n\n`;
        report += `\`\`\`\n${recentLines.join('\n')}\n\`\`\`\n\n`;
        report += `## Suggested Next Steps:\n\n`;
        report += `1. Analyze the error messages above\n`;
        report += `2. Check the full context for root cause\n`;
        report += `3. Provide specific fixes for each issue\n`;
        report += `4. Ask if you need more context with \`get_crash_context\`\n`;

        return {
          content: [
            {
              type: 'text',
              text: report,
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
