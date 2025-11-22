# Quick Start Guide

## Installation

```bash
npm install -g ai-live-terminal-bridge
```

---

## Setup (2 Minutes)

### Step 1: Create Prompt File

Create `.prompts/ai-wrapper.md` in your project (or `.cursorrules`, `.windsurfrules`):

```markdown
# Terminal Command Rules

Always run terminal commands using the `ai` wrapper.

✅ ai npm test
✅ ai npm start

Logs go to ~/.mcp-logs/session.log
Read with: ai --last [N]
```

**Alternative file locations:**
- Universal: `.prompts/ai-wrapper.md` (works with all AI tools)
- Cursor: `.cursorrules`
- Windsurf: `.windsurfrules`

### Step 2: Watch Your AI Work (Optional)

Open a second terminal:
```bash
ai live
```

Now see every command in real-time!

### Step 3: For AI Tools with MCP - Enable Auto-Fix

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ai-live-terminal-bridge": {
      "command": "ai",
      "args": ["--server"]
    }
  }
}
```

Restart your AI tool. Now just say **"Auto fix this"** when things break!

---

## Four Ways to Use It

### 1. Wrapper Mode (Default)
Run any command with `ai`:

```bash
ai npm run dev
ai python server.py
ai docker-compose up
```

Output appears in terminal + logs to `~/.mcp-logs/session.log`

### 2. Live Monitor Mode
Watch logs in real-time:

```bash
ai live
```

Perfect for monitoring what your AI is doing! Keep this open in a split terminal.

### 3. CLI Reader Mode
Read recent logs:

```bash
ai --last          # Last 100 lines
ai --last 50       # Last 50 lines
```

Perfect for Claude Code/Cursor agents!

### 4. MCP Server Mode
For Claude Desktop with auto-fix capabilities:

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ai-live-terminal-bridge": {
      "command": "ai",
      "args": ["--server"]
    }
  }
}
```

Restart Claude Desktop and say **"Auto fix this"** when errors occur!

## Example Workflows

### For Claude Code/Cursor Users

```bash
# Run your app
ai npm start

# Ask AI to check logs
# AI runs: ai --last
# AI gets the output and helps debug
```

### For Claude Desktop Users

1. Configure MCP server (see above)
2. Run your app: `ai npm start`
3. Ask Claude: "Check my session logs"
4. Claude uses `get_crash_context` tool automatically

### Auto-Fix Errors (Claude Desktop)

When things break, just ask: **"Auto fix this"**

```bash
# Run your tests
ai npm test

# Tests fail? Just say:
# "Auto fix this"
```

Claude will:
- Call `auto_fix_errors` tool automatically
- Find ALL errors in your logs (not just the first one)
- Detect TypeErrors, SyntaxErrors, build failures, test failures
- Group duplicate stack traces
- Provide specific fixes for each error

**No scrolling. No copy-pasting. AI finds everything.**

---

## Reference: Full Rules File Template

**Complete `.prompts/ai-wrapper.md` template:**

```markdown
# Terminal Command Rules

Always run terminal commands using the `ai` wrapper.

## Required Format
✅ ai npm test
✅ ai npm start
✅ ai python script.py
✅ ai docker-compose up

## Why This Matters
- All output logged to ~/.mcp-logs/session.log
- You can read logs with `ai --last [N]`
- User can monitor live with `ai live`
- Enables better debugging and error analysis

## When Debugging
When you encounter errors or test failures:
1. Run `ai --last 200` to see recent output
2. Analyze the full error context
3. Provide fixes based on complete information
```

**Monitoring in real-time:**

1. User opens split terminal
2. User runs: `ai live`
3. Watch every command execute
4. See output appear instantly

## Test It

```bash
# Test wrapper mode
ai echo "Hello World"

# Test live monitoring (open in a second terminal)
ai live

# Test CLI reader mode
ai --last

# Check log file directly
tail ~/.mcp-logs/session.log
```

## What Gets Logged?

Everything:
- Command output (stdout)
- Errors (stderr)
- Exit codes
- Timestamps

Colors preserved in terminal, stripped in log file for clean AI reading.

## Log Location

```
~/.mcp-logs/session.log
```

All three modes read/write this single file.

---

For full documentation, see [README.md](README.md)
