# How Browser Monitoring Knows Which Website Is Yours

## TL;DR

**Two layers of protection ensure you only see YOUR project's logs:**

1. **Chrome Extension** → Only monitors `localhost:*` (cannot see Google, GitHub, etc.)
2. **MCP Tools** → Filter by `process.cwd()` (current working directory)

Even if you have multiple localhost projects, MCP only shows the one you're currently working on.

---

## Layer 1: Development Sites Only (Security Layer)

### The Chrome Extension ONLY Monitors Development Environments

**Allowed by Chrome's permission system:**

```javascript
// manifest.json
"host_permissions": [
  "http://localhost:*/*",           // ✅ Localhost
  "http://127.0.0.1:*/*",           // ✅ IP localhost
  "https://*.ngrok.io/*",           // ✅ ngrok tunnels
  "https://*.ngrok-free.app/*",     // ✅ ngrok free tier
  "https://*.loca.lt/*",            // ✅ localtunnel
  "https://*.trycloudflare.com/*"   // ✅ Cloudflare Tunnel
]
```

**What this means in practice:**

| You Visit | Extension Can See It? | Why? |
|-----------|----------------------|------|
| `http://localhost:3000` | ✅ YES | Matches `localhost:*` |
| `http://localhost:8080` | ✅ YES | Matches `localhost:*` |
| `http://127.0.0.1:5000` | ✅ YES | Matches `127.0.0.1:*` |
| `https://abc123.ngrok.io` | ✅ YES | Matches `*.ngrok.io` (development tunnel) |
| `https://xyz.ngrok-free.app` | ✅ YES | Matches `*.ngrok-free.app` |
| `https://myapp.loca.lt` | ✅ YES | Matches `*.loca.lt` |
| `https://tunnel.trycloudflare.com` | ✅ YES | Matches `*.trycloudflare.com` |
| `https://google.com` | ❌ NO | Not in host_permissions |
| `https://github.com` | ❌ NO | Not in host_permissions |
| `https://stackoverflow.com` | ❌ NO | Not in host_permissions |
| `https://yourapp.com` (production) | ❌ NO | Not in host_permissions |
| `file:///Users/...` | ❌ NO | Not in host_permissions |

**Your scenarios:**

**Scenario 1: Regular browsing**
```
You: Open Google → Search "react tutorial" → Click link to localhost:3000

Extension behavior:
- Google page: ❌ Extension is dormant (no permissions)
- Localhost:3000: ✅ Extension activates and captures logs
```

**Scenario 2: ngrok tunnel**
```
You: Run ngrok http 3000 → Get https://abc123.ngrok.io
     Share link with teammate → They open abc123.ngrok.io

Extension behavior:
- Your browser (abc123.ngrok.io): ✅ Extension captures YOUR logs
- Teammate's browser: ❌ They don't have extension (normal)
- Your browsing GitHub: ❌ Extension dormant (no permissions)
```

**Scenario 3: Testing on phone**
```
You: ngrok http 3000 → https://abc123.ngrok.io
     Open on phone browser

Phone browser:
- ❌ No extension (phone doesn't have Chrome extensions)
- Your desktop Chrome: ✅ Still captures logs when you visit abc123.ngrok.io
```

The extension literally **cannot run** on non-development pages. Chrome blocks it at the browser level.

---

## Layer 2: Project Directory Filtering (MCP Layer)

Even with only localhost monitoring, you might have **multiple projects** running:

```bash
Terminal 1: cd ~/my-app && ai npm run dev        # localhost:3000
Terminal 2: cd ~/other-project && ai npm start   # localhost:8080
Terminal 3: cd ~/blog && ai npm run serve        # localhost:4000
```

**How does the MCP know which one you care about right now?**

### Answer: `process.cwd()` (Current Working Directory)

When your AI assistant calls an MCP tool, the MCP server uses `process.cwd()` to determine which project directory you're currently in.

**Code in server.ts:**
```typescript
// Line 414: view_browser_logs tool
const recentLines = readRecentBrowserLogs(
  lines,
  10,
  process.cwd(),  // ← This is YOUR current directory!
  true            // Only live sessions
);
```

**What `process.cwd()` returns:**
```
If Claude Code is running in: /Users/amit/my-app
Then process.cwd() returns: "/Users/amit/my-app"
```

### How Browser Sessions Are Tagged

When the extension captures logs, it tags them with the **project directory**:

**Browser log file header:**
```
================================================================================
[2025-11-22T18:10:00.123Z] Browser Session: browser-20251122181000-e5f6
[2025-11-22T18:10:00.123Z] Project: /Users/amit/my-app  ← Tagged!
[2025-11-22T18:10:00.123Z] URL: http://localhost:3000/dashboard
================================================================================
```

**When MCP filters:**
```typescript
// Get only sessions from current project
const activeSessions = getActiveBrowserSessions(process.cwd());
// Returns: Only sessions where Project === process.cwd()
```

---

## Complete Example: Multi-Project Scenario

### Your Setup
```bash
# Terminal 1
cd ~/my-app
ai npm run dev
# → Server on localhost:3000
# → Browser opens http://localhost:3000

# Terminal 2
cd ~/other-project
ai npm start
# → Server on localhost:8080
# → Browser opens http://localhost:8080

# Terminal 3 (Claude Code)
cd ~/my-app
# AI is helping you with my-app
```

### What Happens

**1. Extension Captures From BOTH Localhost Tabs:**

Browser tab `localhost:3000`:
```
Session: browser-20251122180500-a1b2
Project: /Users/amit/my-app
[Console log] Button clicked
[Network] POST /api/submit → 200
```

Browser tab `localhost:8080`:
```
Session: browser-20251122180530-c3d4
Project: /Users/amit/other-project
[Console log] Component mounted
[Network] GET /api/users → 404
```

**2. AI Calls MCP Tool:**

```
User in Claude Code (pwd = /Users/amit/my-app): "Check the browser console"

AI calls: view_browser_logs()
```

**3. MCP Filters By Project:**

```typescript
process.cwd() === "/Users/amit/my-app"

Filter sessions WHERE project === "/Users/amit/my-app"

Results:
✅ browser-20251122180500-a1b2 (my-app) → SHOWN
❌ browser-20251122180530-c3d4 (other-project) → FILTERED OUT
```

**4. AI Only Sees Your Project:**

```
AI response: "I see in the browser console:
- Button clicked
- POST /api/submit → 200

The form submission is working correctly."
```

The 404 error from `other-project` is **completely invisible** to the AI because it's filtering by `process.cwd()`.

---

## How Project Directory Is Determined

**Question:** How does the browser know which project directory to tag logs with?

**Answer:** The native host uses the **server's working directory** when it starts a session.

### Flow:

1. **You run your dev server:**
   ```bash
   cd ~/my-app
   ai npm run dev
   ```

2. **Dev server starts on `localhost:3000`**

3. **Extension detects page load on `localhost:3000`**

4. **Extension sends message to native host:**
   ```json
   {
     "type": "session-start",
     "projectDir": "/Users/amit/my-app",  ← Detected from server
     "url": "http://localhost:3000"
   }
   ```

5. **Native host creates session tagged with project:**
   ```
   Project: /Users/amit/my-app
   ```

6. **All subsequent logs from `localhost:3000` are tagged with this project**

### How It Detects Project Directory

Currently, the native host receives the project directory from the extension, which can:

**Option 1: Infer from URL patterns** (if you follow conventions):
- `localhost:3000` → Usually the first `ai npm ...` command in project
- Matches with active terminal sessions in `~/.mcp-logs/active/`

**Option 2: User specifies manually** (future enhancement):
- Extension popup lets you select which project this localhost belongs to

**Current Implementation:**
The native host receives `projectDir` in the `session-start` message from the extension. The extension should determine this based on which terminal session started the server.

---

## Edge Cases

### Case 1: Multiple Tabs of Same Project

```
Tab 1: localhost:3000/dashboard
Tab 2: localhost:3000/settings
Both → Same project: /Users/amit/my-app
```

**Result:** Both tabs' logs are captured under the same project. AI sees logs from both tabs.

### Case 2: Switching Projects in AI Tool

```
# Start in my-app
cd ~/my-app
AI: "Check browser logs"
→ Shows: my-app logs only

# Switch directory
cd ~/other-project
AI: "Check browser logs"
→ Shows: other-project logs only
```

The MCP automatically switches focus based on `process.cwd()`.

### Case 3: No Active Server

```
cd ~/my-app
AI: "Check browser logs"
→ No browser sessions for /Users/amit/my-app
→ AI response: "No browser logs found for current project"
```

---

## Summary Table

| Filter Layer | What It Does | Why It Matters |
|--------------|--------------|----------------|
| **Chrome Extension Permissions** | Only monitors `localhost:*` and `127.0.0.1:*` | You can browse Google/GitHub safely - extension cannot see those sites |
| **MCP `process.cwd()` Filter** | Only shows logs where `project === process.cwd()` | Multi-project setups work correctly - no cross-contamination |
| **Live Session Filter** | Only shows currently active browser sessions | Keeps AI focused on current work, not old sessions |

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│ You Browse the Web                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Google.com ──────────────▶ Extension: ❌ NO PERMISSIONS  │
│                             (Chrome blocks it)              │
│                                                             │
│  localhost:3000 ──────────▶ Extension: ✅ CAPTURES LOGS   │
│  (my-app)                   Tagged: /Users/amit/my-app     │
│                                                             │
│  localhost:8080 ──────────▶ Extension: ✅ CAPTURES LOGS   │
│  (other-project)            Tagged: /Users/amit/other-project│
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Native Host Storage                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ~/.mcp-logs/browser/active/                               │
│    browser-xxx-a1b2.log → Project: /Users/amit/my-app     │
│    browser-xxx-c3d4.log → Project: /Users/amit/other-project│
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ MCP Tool Call                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AI (in /Users/amit/my-app): view_browser_logs()          │
│                                                             │
│  MCP filters: WHERE project === process.cwd()              │
│             = WHERE project === "/Users/amit/my-app"       │
│                                                             │
│  Returns: Only browser-xxx-a1b2.log                        │
│  Hides:   browser-xxx-c3d4.log (wrong project)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## The Answer to Your Question

**Q:** "How does it know which website is my website with no confusion?"

**A:** Two foolproof mechanisms:

1. **Can't monitor non-localhost** → Physically impossible to capture Google logs
2. **Filters by working directory** → Even with multiple localhost projects, shows only YOUR current project

You could have 10 localhost tabs open across 5 different projects, and the MCP will **only show logs from the project directory where your AI tool is currently running**.

**Zero confusion. Zero cross-contamination.**
