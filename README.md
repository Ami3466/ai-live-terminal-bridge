# AI Live Terminal Bridge

**A bridge between LLMs and your terminal.**

---

## The Problem

Your AI assistant can't see your terminal. When commands run, errors happen, or servers crash—your AI is blind to it all.

### Two Major Issues

**1. AI Can't Read Your Terminal (Copy-Paste Hell)**

When you run commands, the output stays trapped in your terminal:
- AI assistants can't see command results, errors, or stack traces
- You manually copy-paste errors back and forth
- AI asks for more context → you scroll → copy → paste → repeat
- No "Auto fix"—just tedious debugging loops

**2. Hidden Terminal Port Conflicts**

AI coding assistants (Claude Code, Cursor, etc.) run commands in hidden embedded terminals:
- You can't see what's running
- Port 3000 gets taken, your dev server fails with `EADDRINUSE`
- You have no idea what process is blocking the port

**This tool solves both problems.**

---

## What This Tool Offers

**This tool provides:**

1. **Terminal-AI Bridge** - Your AI can finally see what's happening in your terminal
2. **Live Monitoring** - Watch AI commands execute in real-time in your terminal
4. **Auto-Fix Errors** - AI sees the errors and auto fix them

### How It Works

Run commands with `ai` (e.g., `ai npm run dev`) and everything gets logged:

- Output appears in **your terminal** (colors preserved, everything works normally)
- Logs clean text to `~/.mcp-logs/session.log` (AI can read this)
- Watch it live with `ai live` in another terminal
- AI reads logs with `ai --last` or MCP tools
- Just say **"Auto fix this"** and AI analyzes all errors at once—no scrolling, no copy-pasting

---

## The Three Modes

This tool gives you 3 ways to use it:

**Basic modes (no setup needed):**
1. **`ai <command>`** - Wrapper mode: Run any command, logs everything so AI can watch it
2. **`ai live`** - Live monitor: Watch commands in real-time in a separate terminal
3. **`ai --last`** - CLI reader: AI reads logs with `ai --last` command (works in Claude Code, Cursor, etc.)

**Advanced mode (optional, for Claude Desktop):**
4. **MCP server** - Enables powerful MCP tools like `auto_fix_errors` and `get_crash_context`
   - Just say **"Auto fix this"** and AI scans ALL errors at once
   - No more copy-pasting individual errors

---

## 🚀 Quick Start

**1. Install:**
```bash
npm install -g ai-live-terminal-bridge
```

**2. Use it:**
```bash
ai npm test
ai npm run dev
ai docker-compose up
ai python manage.py runserver
```

Done! Now your terminal output is logged and AI can read it.


---

## Optional Setup: Auto-Wrap & Live Monitoring

**Make your AI automatically use `ai` for all commands:**

Copy the prompt file from this repo's `.prompts/` folder to your project:
```bash
cp .prompts/ai-wrapper.md .prompts/          # Works with all AI tools
# OR copy to tool-specific files:
cp .prompts/ai-wrapper.md .cursorrules       # For Cursor
cp .prompts/ai-wrapper.md .windsurfrules     # For Windsurf
```

**Watch commands live:** Run `ai live` in a second terminal to see everything in real-time.

**Auto-approve (Claude Code):** Copy `.prompts/settings.local.json` to skip approval prompts. ⚠️ Use only in trusted projects.

---

## If You Want: MCP Setup for "Auto Fix This"

Set up MCP to get the `auto_fix_errors` tool.

**Just say "Auto fix this" and Claude will:**
- Scan ALL errors in your logs
- Group and deduplicate them
- Provide comprehensive fixes with file paths and line numbers
- No scrolling. No copy-pasting. AI finds and analyzes everything.

### MCP Setup Steps

**Step 1:** Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

**Step 2:** Restart your AI tool.

**Step 3:** Create `.prompts/ai-wrapper.md` in your project (see above).

**Now you can just ask:**
- **"Auto fix this"** → Claude calls `auto_fix_errors`, finds ALL errors, suggests fixes
- "Check my session logs" → Claude reads recent output with `get_crash_context`
- "What's in the logs?" → Claude analyzes what happened

The `auto_fix_errors` tool is the killer feature—it scans all logs, groups errors, and provides comprehensive fixes in one go.

---

## How It Works

```
┌─────────────────────────────────┐
│  You: ai npm run dev            │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Terminal Output (colors)       │
│  Server running on port 3000... │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  ~/.mcp-logs/session.log        │
│  [2025-01-15] Command: npm run  │
│  Server running on port 3000... │
│  Process exited with code: 0    │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  AI Access:                     │
│  • Claude Code: ai --last       │
│  • Cursor: ai --last            │
│  • Desktop: get_crash_context   │
└─────────────────────────────────┘
```

### The Four Modes (Technical Details)

#### 1. Wrapper Mode (Default)

```bash
ai <any-command>
```

Wraps your command:
- Runs normally with full output (colors preserved)
- Logs clean text to `~/.mcp-logs/session.log`
- Preserves exit codes

#### 2. Live Monitor Mode

```bash
ai live
```

Watch logs in real-time:
- Shows last 20 lines immediately
- Streams new entries as they happen
- Perfect for monitoring AI commands
- Press Ctrl+C to exit

**Use case:** Open in a split terminal to watch what your AI is doing.

#### 3. CLI Reader Mode

```bash
ai --last [N]
```

Reads last N lines from log (default: 100).

Used by Claude Code, Cursor, Windsurf agents to access your logs.

**Just ask your AI:**
- "Check the logs with `ai --last`"
- "What does `ai --last 50` show?"
- "Run `ai --last` and tell me what failed"

#### 4. MCP Server Mode

```bash
ai --server
```

Starts MCP protocol server for your AI tool.

Provides `get_crash_context` and `auto_fix_errors` tools.

---

## MCP Tools

When configured as an MCP server, your AI tool gets two powerful tools:

### `get_crash_context`

Reads recent terminal output. Default: last 100 lines.

**You ask:** "Check my session logs for errors"

**Claude calls:** `get_crash_context(lines: 100)`

**Claude sees:** Full terminal output with errors, stack traces, everything.

### `auto_fix_errors`

The most powerful debugging tool. Automatically detects and analyzes ALL errors in your logs.

**Detects:**
- JavaScript/TypeScript errors (TypeError, SyntaxError, ReferenceError, etc.)
- Build failures (webpack, vite, tsc, etc.)
- Test failures (jest, mocha, vitest, etc.)
- Non-zero exit codes
- Stack traces (auto-grouped, no duplicates)
- Runtime crashes

**Smart features:**
- Deduplicates repeated errors
- Groups related stack traces
- Prioritizes by severity
- Shows file paths and line numbers
- Extracts relevant code context

**You ask:** "Auto fix this"

**Claude calls:** `auto_fix_errors(lines: 200)`

**Claude responds:**
```
I found 3 errors in your test run:

1. TypeError: Cannot read property 'id' of undefined
   File: src/user.ts:42
   → Fix: Add null check before accessing user.id

2. ReferenceError: 'mockData' is not defined
   File: tests/api.test.ts:15
   → Fix: Import mockData from test fixtures

3. Port 3000 already in use (EADDRINUSE)
   → Fix: Kill the process on port 3000 first

Would you like me to apply these fixes?
```

**No scrolling. No copy-pasting. AI finds and analyzes everything.**

---

## Complete Configuration Guide

This section provides detailed setup instructions for each AI coding assistant.

### Claude Desktop (macOS/Windows)

Claude Desktop supports MCP servers natively for the "Auto fix this" feature.

**Step 1: Locate your config file**

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Step 2: Add the MCP server**

Edit the config file and add:

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

**Step 3: Restart Claude Desktop**

Completely quit and restart Claude Desktop.

**Step 4: Verify it's working**

Ask Claude: "What MCP tools do you have?"

You should see `get_crash_context` and `auto_fix_errors` listed.

**Step 5: Use it**

Run commands with `ai`:
```bash
ai npm test
```

Then ask Claude: **"Auto fix this"**

---

### Claude Code (VSCode Extension)

Claude Code has built-in terminal access, so it works without MCP setup.

**Step 1: Create `.prompts/ai-wrapper.md` in your project**

```markdown
# Terminal Command Rules

CRITICAL: Always run terminal commands using the `ai` wrapper.

## Required Format
✅ CORRECT: ai npm test
✅ CORRECT: ai npm start
✅ CORRECT: ai python script.py
❌ WRONG: npm test
❌ WRONG: npm start

## Why
- Logs all output to ~/.mcp-logs/session.log
- User can watch live with `ai live`
- You can read logs with `ai --last`

## When Debugging
Automatically run `ai --last 200` to see recent output.
```

**Step 2 (Optional): Auto-approve commands**

Copy `.prompts/settings.local.json` from this repo to your project root.

⚠️ **Warning:** This auto-approves all commands. Only use in trusted projects.

**Step 3: Use it**

Ask Claude Code to run commands:
```
"Run the tests"
```

Claude will automatically use:
```bash
ai npm test
```

**Step 4: Check logs**

Ask Claude:
```
"Check the logs with ai --last"
```

Claude will run `ai --last` and show you the output.

**No MCP needed** - Claude Code uses terminal access directly.

---

### Cursor

Cursor works similar to Claude Code with direct terminal access.

**Step 1: Create `.cursorrules` in your project**

```markdown
# Terminal Command Rules

CRITICAL: Always run terminal commands using the `ai` wrapper.

## Required Format
✅ CORRECT: ai npm test
✅ CORRECT: ai npm start
✅ CORRECT: ai python script.py
❌ WRONG: npm test
❌ WRONG: npm start

## Why
- Logs all output to ~/.mcp-logs/session.log
- User can watch live with `ai live`
- You can read logs with `ai --last`

## When Debugging
Automatically run `ai --last 200` to see recent output.
```

**Step 2: Use it**

Ask Cursor:
```
"Run npm test"
```

Cursor will automatically use:
```bash
ai npm test
```

**Step 3: Check logs**

Ask Cursor:
```
"Run ai --last and show me what happened"
```

Cursor reads the logs and analyzes errors.

**Alternative: Use Cursor's MCP Support**

Cursor also supports MCP servers. Follow the same steps as Claude Desktop, but use Cursor's config file location (check Cursor's documentation for the exact path).

---

### Windsurf

Windsurf has built-in terminal access similar to Cursor.

**Step 1: Create `.windsurfrules` in your project**

```markdown
# Terminal Command Rules

CRITICAL: Always run terminal commands using the `ai` wrapper.

## Required Format
✅ CORRECT: ai npm test
✅ CORRECT: ai npm start
✅ CORRECT: ai python script.py
❌ WRONG: npm test
❌ WRONG: npm start

## Why
- Logs all output to ~/.mcp-logs/session.log
- User can watch live with `ai live`
- You can read logs with `ai --last`

## When Debugging
Automatically run `ai --last 200` to see recent output.
```

**Step 2: Use it**

Ask Windsurf to run commands - it will automatically wrap them with `ai`.

**Step 3: Check logs**

Ask:
```
"Check ai --last to see what happened"
```

Windsurf runs the command and analyzes the output.

---

### Cline (VSCode Extension)

Cline works with terminal commands and can be configured similarly.

**Step 1: Create `.prompts/ai-wrapper.md` in your project**

```markdown
# Terminal Command Rules

CRITICAL: Always run terminal commands using the `ai` wrapper.

## Required Format
✅ CORRECT: ai npm test
✅ CORRECT: ai npm start
✅ CORRECT: ai python script.py
❌ WRONG: npm test
❌ WRONG: npm start

## Why
- Logs all output to ~/.mcp-logs/session.log
- User can watch live with `ai live`
- You can read logs with `ai --last`

## When Debugging
Automatically run `ai --last 200` to see recent output.
```

**Step 2: Use it**

Cline will read the rules and automatically wrap commands with `ai`.

**Step 3: Check logs**

Ask Cline:
```
"Run ai --last 100 to see the output"
```

---

### Aider

Aider is a command-line AI coding assistant.

**Step 1: Create `.aider.conf.yml` in your project**

```yaml
# Aider configuration
edit-format: whole

# Add this as a system message
system-prompt: |
  CRITICAL: Always run terminal commands using the `ai` wrapper.

  Examples:
  ✅ CORRECT: ai npm test
  ✅ CORRECT: ai npm start
  ❌ WRONG: npm test

  When debugging, run `ai --last 200` to see recent output.
```

**Step 2: Use it**

Start Aider in your project:
```bash
aider
```

Ask it to run commands - it will use `ai` wrapper.

**Step 3: Check logs**

In Aider chat:
```
Run ai --last to show recent terminal output
```

---

### Continue (VSCode Extension)

Continue supports custom instructions per project.

**Step 1: Create `.continuerules` or add to Continue config**

In your Continue settings, add custom instructions:

```markdown
# Terminal Command Rules

CRITICAL: Always run terminal commands using the `ai` wrapper.

## Required Format
✅ CORRECT: ai npm test
✅ CORRECT: ai npm start
✅ CORRECT: ai python script.py
❌ WRONG: npm test
❌ WRONG: npm start

## Why
- Logs all output to ~/.mcp-logs/session.log
- User can watch live with `ai live`
- You can read logs with `ai --last`

## When Debugging
Automatically run `ai --last 200` to see recent output.
```

**Step 2: Use it**

Continue will automatically wrap terminal commands with `ai`.

**Step 3: Check logs**

Ask Continue:
```
"Check the logs with ai --last"
```

---

### ChatGPT / OpenAI API Tools

For ChatGPT-based coding tools with terminal access:

**Step 1: Add system prompt**

Include this in your system prompt or project instructions:

```markdown
CRITICAL: Always run terminal commands using the `ai` wrapper.

Format: ai <command>

Examples:
- ai npm test
- ai npm run dev
- ai python script.py

To check logs: ai --last [N]
```

**Step 2: Use it**

The AI will wrap all commands with `ai`.

**Step 3: Check logs**

Ask the AI to run `ai --last` to read the logs.

---

### Generic Setup (Any AI Tool)

If your AI tool isn't listed above:

**Step 1: Find the rules/instructions file**

Common locations:
- `.cursorrules` (Cursor)
- `.windsurfrules` (Windsurf)
- `.prompts/` folder (Claude Code)
- `.aider.conf.yml` (Aider)
- `.continuerules` (Continue)
- Custom system prompts (ChatGPT, etc.)

**Step 2: Add these rules**

```markdown
# Terminal Command Rules

CRITICAL: Always run terminal commands using the `ai` wrapper.

## Required Format
✅ CORRECT: ai npm test
✅ CORRECT: ai npm start
✅ CORRECT: ai python script.py
❌ WRONG: npm test
❌ WRONG: npm start

## Why
- Logs all output to ~/.mcp-logs/session.log
- User can watch live with `ai live`
- You can read logs with `ai --last`

## When Debugging
Automatically run `ai --last 200` to see recent output.
```

**Step 3: Test it**

Ask your AI to run a command and verify it uses `ai` wrapper.

**Step 4: Check logs**

Ask your AI to run `ai --last` to verify it can read the logs.

---

## Real-World Examples

### Example 1: Claude Code Hidden Terminal Problem

**Before:**
```bash
# Claude Code runs this in a hidden terminal
npm run dev

# You try to run your app
npm start
# Error: EADDRINUSE port 3000

# You have no idea what's running
# You ask Claude "why is port 3000 taken?"
# Claude can't see the hidden terminal, so it guesses
```

**After:**
```bash
# You run everything through `ai`
ai npm run dev

# Logs show:
# Server running on http://localhost:3000

# You ask: "Run `ai --last` and tell me what's on port 3000"
# Claude reads the log and sees: "Server running on http://localhost:3000"
# Claude answers: "Your dev server is using port 3000"
```

### Example 2: Test Failures

**Before:**
```bash
npm test
# 15 tests fail
# You copy-paste the first error
# AI asks for more context
# You copy-paste more
# AI asks about line 47
# You copy-paste that part
# Repeat...
```

**After:**
```bash
ai npm test
# 15 tests fail

# You: "Auto fix this"
# AI calls auto_fix_errors
# AI sees ALL 15 failures at once
# AI provides comprehensive fixes for all of them

# No copy-pasting. No scrolling through terminal.
# Just one command: "Auto fix this"
```

### Example 3: Build Debugging

**Before:**
```bash
npm run build
# Build fails with cryptic error
# You scroll up in terminal
# Copy the error
# Paste to AI
# AI says "can I see more context?"
# You scroll more, copy more, paste more...
```

**After:**
```bash
ai npm run build
# Build fails

# You: "Check the logs"
# AI: "Running `ai --last`..."
# AI sees full build output + error + context
# AI: "The issue is in webpack config line 42..."
```

---

## Common Workflows

### Debugging Test Failures

```bash
# Run tests
ai npm test

# Tests fail? Just ask:
"Auto fix this"

# Claude will:
# 1. Call auto_fix_errors tool
# 2. Analyze all failures
# 3. Provide specific fixes with line numbers
```

### Debugging Server Crashes

```bash
# Start server
ai npm start

# Crashes? Ask:
"What happened? Check the logs"

# Claude will:
# 1. Read recent logs with get_crash_context
# 2. Identify the crash cause
# 3. Suggest fixes
```

### Build Debugging

```bash
# Run build
ai npm run build

# Build fails? Ask:
"Auto fix this"

# Claude finds:
# - Syntax errors
# - Type errors
# - Missing dependencies
# - Configuration issues
```

---

## FAQ

### Does this slow down my commands?
No. Overhead is <1ms. Commands run at full speed.

### Can I see the logs manually?
Yes:
```bash
cat ~/.mcp-logs/session.log
tail -f ~/.mcp-logs/session.log
ai --last 100
```

### What if I forget to use `ai`?
Those commands won't be logged. Everything still works, you just won't have logs for them.

### Does this work with Docker?
Yes. `ai docker-compose up`, `ai docker run`, etc. all work.

### Can AI assistants other than Claude use this?
Yes! Any AI with terminal access can run `ai --last` to read logs. MCP tools work with any AI coding tool.

### What about CI/CD?
This is designed for local development. In CI, use native logging.

---

## Troubleshooting

### `ai: command not found`

Restart your terminal:
```bash
hash -r   # Bash/Zsh
rehash    # Fish
```

### MCP tools not showing up

1. Check JSON syntax in config file
2. Run `which ai` to verify installation
3. Test: `ai --server` should start without errors
4. Restart your AI tool completely

### Logs not appearing

Make sure you're using `ai`:
```bash
ai npm start   # ✅ Logged
npm start      # ❌ Not logged
```

---

## Uninstall

```bash
npm uninstall -g ai-live-terminal-bridge
rm -rf ~/.mcp-logs
```

Remove from your AI tool's MCP config if added.

---

## License

MIT License - See [LICENSE](LICENSE) for details.

**Use freely. Don't redistribute as a competing product without significant changes.**

---

## Contributing

Issues and PRs welcome at [GitHub](https://github.com/Ami3466/ai-live-terminal-bridge).

---

**Stop coding blind. Give your AI terminal access.**

Built for developers tired of copy-pasting errors.
