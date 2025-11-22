# AI Live Terminal Bridge

**Give your AI complete visibility into your development environment - terminal AND browser.**

A bridge between AI coding assistants and your entire development workflow. Monitor terminal commands, browser console logs, and network requests automatically.

---

## The Problem

When building web applications with AI assistants, you're stuck in a constant copy-paste loop:

### Terminal Blindness
```
You: "Run the tests"
AI: [Runs npm test in hidden terminal]
You: "What happened?"
AI: "Can you check the terminal output?"
You: [Scrolls up, copies 50 lines, pastes]
AI: "I see the issue now..."
```

### Browser Blindness
```
You: "Login button doesn't work"
AI: "Can you check the browser console?"
You: [Opens F12, copies console.error]
AI: "What about the network tab?"
You: [Switches to Network, copies failed request]
AI: "And the server logs?"
You: [Switches to terminal, scrolls, copies]
```

**The Pain:** You become a manual copy-paste bridge between AI and your dev environment.

---

## The Solution

**AI Live Terminal Bridge** creates automatic visibility into BOTH your terminal AND browser:

### 🖥️ Terminal Monitoring
- Wrap commands with `ai npm test` - everything gets logged
- AI reads logs automatically via MCP tools
- No more copy-pasting terminal output

### 🌐 Browser Monitoring
- Chrome extension captures console logs automatically
- Network requests monitored in real-time
- AI reads browser errors directly
- **No more copy-pasting from F12 DevTools**

### 🤖 Unified AI Debugging
```
You: "Login button doesn't work"

AI: [Calls view_browser_logs]
    [Calls view_logs]

AI: "I see three issues:
1. Frontend: TypeError at UserProfile.jsx:42
2. Network: POST /api/login → 401
3. Backend: Authentication token expired

Here's the complete fix..."
```

**No scrolling. No copy-pasting. AI sees everything.**

---

## Quick Start

### Install the Tool

```bash
npm install -g ai-live-terminal-bridge
```

### Setup Terminal Monitoring

**Run commands with `ai` wrapper:**
```bash
ai npm test
ai npm run dev
ai python manage.py runserver
```

**Configure your AI tool** (Claude Desktop, Cursor, Windsurf, etc.) - see [MCP Setup](#mcp-setup) below.

### Setup Browser Monitoring (Optional but Recommended)

**1. Load Chrome Extension:**
```bash
# Extension is at: ~/Desktop/ai-live-terminal-bridge-extension
# Open chrome://extensions/, enable Developer mode
# Click "Load unpacked", select the extension folder
```

**2. Register Native Host:**
```bash
npm run install-native-host
```

**3. Update Extension ID** (see [Browser Setup](#browser-setup) for details)

**Done!** Now AI can see your terminal AND browser.

---

## Seven Powerful MCP Tools

### Terminal Monitoring

**`view_logs`** - View all recent terminal output
- Full command history, output, errors
- Use when: "What's in the logs?" or "What happened?"

**`get_crash_context`** - View only errors and crashes
- Filtered error lines, exceptions, stack traces
- Use when: "What caused the crash?"

**`auto_fix_errors`** - Automatically detect and analyze ALL errors
- Scans all failures, provides specific fixes
- Use when: "Auto fix this"

**`get_usage_instructions`** - Get comprehensive usage guide
- Installation, troubleshooting, best practices
- AI calls automatically when confused

### Browser Monitoring

**`view_browser_logs`** - View browser console logs and network activity
- Console logs (log, warn, error) + network requests
- Use when: "What's happening in the browser?"

**`get_browser_errors`** - View only browser errors and failed requests
- Only console.error, exceptions, HTTP 4xx/5xx errors
- Use when: "Any errors in the browser?"

**`get_browser_instructions`** - Get browser setup and troubleshooting guide
- Extension installation, connection help
- AI calls when browser monitoring isn't working

---

## MCP Setup

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

Restart Claude Desktop. **That's it!**

### Cursor

Open Settings > Features > Model Context Protocol, add:

```json
{
  "ai-live-terminal-bridge": {
    "command": "ai",
    "args": ["--server"]
  }
}
```

Restart Cursor.

### Windsurf

Navigate to MCP configuration in settings, add:

```json
{
  "ai-live-terminal-bridge": {
    "command": "ai",
    "args": ["--server"]
  }
}
```

Restart Windsurf.

### Other AI Tools

Works with any tool that supports MCP (Model Context Protocol).

For tools without MCP support (Aider, Continue, etc.), see [CLI Mode](#cli-mode) below.

---

## Browser Setup

### Step 1: Load Chrome Extension

```bash
# Extension location
cd ~/Desktop/ai-live-terminal-bridge-extension

# Open Chrome
chrome chrome://extensions/
```

1. Enable **Developer mode** (toggle in top right)
2. Click **Load unpacked**
3. Select folder: `~/Desktop/ai-live-terminal-bridge-extension`
4. Extension loads ✅

### Step 2: Register Native Messaging Host

```bash
cd ~/Desktop/ai-live-terminal-bridge
npm run install-native-host
```

### Step 3: Update Extension ID

1. Copy the **Extension ID** from `chrome://extensions/`
   - Looks like: `abcdefghijklmnopqrstuvwxyz123456`

2. Open native messaging manifest:
   - **macOS**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.ai_live_terminal_bridge.browser_monitor.json`
   - **Linux**: `~/.config/google-chrome/NativeMessagingHosts/com.ai_live_terminal_bridge.browser_monitor.json`

3. Replace `YOUR_EXTENSION_ID` with actual ID

Example:
```json
{
  "name": "com.ai_live_terminal_bridge.browser_monitor",
  "path": "/path/to/project/dist/browser/native-host.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://abcdefghijklmnopqrstuvwxyz123456/"
  ]
}
```

### Step 4: Test It

```bash
# Start dev server
ai npm run dev

# Open localhost:3000 in Chrome
# Open DevTools (F12), run:
console.log('Test message');
console.error('Test error');

# Ask AI:
"Check the browser console for errors"

# AI calls get_browser_errors tool
# AI sees everything - no copy-paste needed!
```

---

## What Gets Monitored?

### Terminal Monitoring

✅ **All Command Output**
- stdout and stderr (colors preserved in terminal)
- Exit codes
- Timestamps
- Full command history

✅ **Secret Redaction**
- API keys → `[REDACTED]`
- Tokens → `[REDACTED]`
- Passwords → `[REDACTED]`
- Database credentials → `[REDACTED]`
- 15+ secret patterns covered

✅ **Session Isolation**
- Each command gets unique session ID
- Parallel commands don't interleave
- Clean, organized logs

### Browser Monitoring

✅ **Console Logs**
- console.log(), console.warn(), console.error(), console.debug()
- JavaScript errors with full stack traces
- Unhandled promise rejections

✅ **Network Activity**
- Fetch and XMLHttpRequest calls
- HTTP methods, URLs, status codes
- Request/response timing
- Failed requests (4xx, 5xx errors)

✅ **Performance Metrics** (Optional)
- Memory usage
- Page load times

✅ **Security**
- **Localhost only** - Only monitors `localhost:*` and `127.0.0.1:*`
- Cannot access regular websites
- Cookies redacted
- Authorization headers redacted
- All data stays on your machine

---

## Real-World Examples

### Example 1: Test Failures

**Before:**
```bash
npm test
# 15 tests fail
# You scroll, copy first error
# AI asks for more context
# You copy more errors
# AI asks about line 47
# Repeat...
```

**After:**
```bash
ai npm test
# 15 tests fail

You: "Auto fix this"
AI: [Calls auto_fix_errors]
AI: "Found 15 test failures:
1. TypeError at user.test.ts:42 - Add null check
2. ReferenceError at api.test.ts:15 - Import mockData
3. Port 3000 EADDRINUSE - Kill existing process
[...and 12 more with specific fixes]

Would you like me to apply these fixes?"
```

No scrolling. No copy-pasting. AI sees ALL errors at once.

### Example 2: Frontend Bug

**Before:**
```
You: "Login button doesn't work"
AI: "Check the browser console"
You: [F12, copies] "TypeError: Cannot read property 'id'"
AI: "Check the network tab"
You: [Network, copies] "POST /api/login → 401"
AI: "Check server logs"
You: [Terminal, scrolls, copies] "Invalid token"
```

**After:**
```
You: "Login button doesn't work"

AI: [Calls view_browser_logs]
    [Calls view_logs]

AI: "I see the complete picture:
- Frontend: TypeError at UserProfile.jsx:42 (missing null check)
- Network: POST /api/login → 401 Unauthorized
- Backend: Authentication token expired

Here's the fix for all three layers..."
```

**AI sees terminal AND browser. Instantly.**

### Example 3: Hidden Terminal Problem

**Before:**
```
# Claude Code runs in hidden terminal
npm run dev

# You try to run your app
npm start
# Error: EADDRINUSE port 3000

# You have no idea what's running
# AI can't see the hidden terminal
```

**After:**
```
# Run with ai wrapper
ai npm run dev

You: "What's on port 3000?"
AI: [Calls view_logs]
AI: "Your dev server is running on port 3000 (started 2 minutes ago)"
```

---

## How It Works

### Terminal Flow
```
You run: ai npm run dev
       ↓
Terminal shows full output (colors preserved)
       ↓
Session isolation: unique session ID
       ↓
Secret redaction: API_KEY=sk-xxx → [REDACTED]
       ↓
Logs written to: ~/.mcp-logs/active/session-<id>.log
       ↓
AI reads via: view_logs / auto_fix_errors / get_crash_context tools
```

### Browser Flow
```
You open: localhost:3000 in Chrome
       ↓
Extension captures: console logs, network requests, errors
       ↓
Sent to: Native messaging host (Node.js)
       ↓
Secret redaction: Cookies/tokens → [REDACTED]
       ↓
Logs written to: ~/.mcp-logs/browser/active/browser-<id>.log
       ↓
AI reads via: view_browser_logs / get_browser_errors tools
```

---

## Configuration

### Log Retention

Control how long logs are kept using `AI_KEEP_LOGS` environment variable (in days):

```bash
# Delete logs immediately when command completes (cleanest)
export AI_KEEP_LOGS=0

# Keep logs for 1 day (default)
export AI_KEEP_LOGS=1

# Keep logs for 7 days
export AI_KEEP_LOGS=7

# Keep logs for 30 days
export AI_KEEP_LOGS=30
```

**Why control retention?**
- `AI_KEEP_LOGS=0`: AI only sees live/running commands (cleanest, recommended for LLMs)
- `AI_KEEP_LOGS=1`: Keep recent logs for debugging (balanced, default)
- `AI_KEEP_LOGS=7+`: Keep logs longer for audit trails

---

## CLI Mode (For Non-MCP Tools)

If your AI tool doesn't support MCP (Aider, Continue, older tools), use CLI mode:

### Setup

Create `.prompts/ai-wrapper.md` (or `.cursorrules`, `.windsurfrules`, etc.):

```markdown
# Terminal Command Rules

Always run terminal commands using the `ai` wrapper.

Format: ai <command>

Examples:
- ai npm test
- ai npm start
- ai python script.py

When debugging, run `ai --last 200` to see recent output.
```

### Usage

```bash
# Run commands with ai wrapper
ai npm test

# AI manually reads logs
ai --last 100

# Watch live in another terminal
ai live
```

**MCP mode is recommended** - automatic, faster, more powerful.

---

## Security Features

### Secret Redaction

**Terminal patterns (15+):**
- API keys: AWS, GitHub, OpenAI, Anthropic, Stripe
- Tokens: Bearer, JWT, session tokens
- Passwords: Database URLs, export statements
- Private keys: PEM, OpenSSH
- Credit cards: Basic validation

**Browser patterns (12+):**
- Cookies: Session IDs, auth cookies
- Headers: Authorization, X-API-Key, Set-Cookie
- Storage: localStorage/sessionStorage tokens
- JSON responses: access_token, refresh_token
- Session IDs: PHPSESSID, JSESSIONID

**How it works:**
- Secrets redacted BEFORE writing to logs
- Your terminal shows real output
- Logs contain `[REDACTED]`
- Secrets never reach AI models

### Session Isolation

- Each terminal command → unique session ID
- Each browser session → unique session ID
- Parallel commands don't interleave
- Clean, organized logs per task

### Project-Based Filtering

- Logs filtered by project directory (`process.cwd()`)
- AI only sees logs from current project
- No cross-project contamination

---

## Troubleshooting

### `ai: command not found`

Restart terminal:
```bash
hash -r   # Bash/Zsh
rehash    # Fish
```

### MCP tools not showing up

1. Check JSON syntax in config
2. Run `which ai` to verify installation
3. Test: `ai --server` should start without errors
4. Restart AI tool completely

### Extension not connecting

1. Verify native host installed: `npm run install-native-host`
2. Check extension ID matches manifest
3. Refresh localhost page
4. Check extension service worker console (chrome://extensions/)

### No browser logs appearing

1. Make sure you're on a **localhost** page
2. Extension only monitors `localhost:*` and `127.0.0.1:*`
3. Check extension enabled in chrome://extensions/
4. Try: `cat ~/.mcp-logs/browser/active/*.log`

---

## FAQ

### Does this slow down my commands?

No. Overhead is less than 1ms. Commands run at full speed.

### Can I see the logs manually?

Yes:
```bash
# Terminal logs
ls ~/.mcp-logs/active/
cat ~/.mcp-logs/active/session-*.log

# Browser logs
ls ~/.mcp-logs/browser/active/
cat ~/.mcp-logs/browser/active/browser-*.log

# View all recent (terminal and browser)
ai --last 100
```

### What if I forget to use `ai`?

Commands still work, just won't be logged. AI won't be able to read output.

### Does browser monitoring work on all sites?

**No - localhost only** (by design, for security):
- ✅ `localhost:3000`, `localhost:8080`, etc.
- ✅ `127.0.0.1:*`
- ❌ Regular websites (google.com, github.com, etc.)

This prevents the extension from tracking your general browsing.

### Does this work with Docker?

Yes. `ai docker-compose up`, `ai docker run`, etc. all work.

### Can other AI tools use this?

Yes!
- **MCP Mode:** Any AI supporting Model Context Protocol
- **CLI Mode:** Any AI with terminal access

Works with: Claude Desktop, Claude Code, Cursor, Windsurf, Aider, Continue, ChatGPT with code interpreter, and more.

### What about CI/CD?

This is designed for local development. In CI, use native logging.

---

## Uninstall

```bash
# Remove tool
npm uninstall -g ai-live-terminal-bridge

# Remove logs
rm -rf ~/.mcp-logs

# Remove Chrome extension
# 1. Go to chrome://extensions/
# 2. Remove "AI Live Terminal Bridge"

# Remove extension folder
rm -rf ~/Desktop/ai-live-terminal-bridge-extension

# Remove native messaging manifest (optional)
# macOS: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.ai_live_terminal_bridge.browser_monitor.json
# Linux: ~/.config/google-chrome/NativeMessagingHosts/com.ai_live_terminal_bridge.browser_monitor.json
```

Remove from your AI tool's MCP config if added.

---

## License

MIT License - See LICENSE for details.

---

## Contributing

Issues and PRs welcome at [GitHub](https://github.com/Ami3466/ai-live-terminal-bridge).

---

**Stop coding blind. Give your AI complete visibility - terminal AND browser.**
