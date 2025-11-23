# Browser Extension Setup (Optional)

Monitor browser console logs and network activity from localhost pages.

---

## Installation

### Step 1: Install MCP Server

```bash
npm install -g ai-live-log-bridge
```

### Step 2: Install Chrome Extension

**Option A - Chrome Web Store (Recommended - Coming Soon):**

Visit Chrome Web Store (link coming soon)
- Click "Add to Chrome"
- Grant localhost permissions when prompted

**Option B - Manual Install (Developer):**

```bash
# Clone the extension repository
git clone https://github.com/Ami3466/ai-live-log-bridge-extension
cd ai-live-log-bridge-extension

# Install in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode" (top right)
# 3. Click "Load unpacked"
# 4. Select the ai-live-log-bridge-extension directory
```

### Step 3: Configure Native Messaging

Follow the setup instructions in the [extension repository](https://github.com/Ami3466/ai-live-log-bridge-extension) to configure native messaging between the extension and the MCP server.

---

## How It Works

1. **Extension captures** console logs and network requests from localhost pages
2. **Forwards data** to the MCP server via native messaging
3. **AI can read** browser logs automatically for debugging

---

## What Gets Monitored?

### Supported Sites (Security-First Design)

The extension ONLY monitors development environments:

✅ **Localhost:**
- `localhost:*`
- `127.0.0.1:*`

✅ **Development Tunnels:**
- `*.ngrok.io` (ngrok)
- `*.ngrok-free.app` (ngrok free tier)
- `*.loca.lt` (localtunnel)
- `*.trycloudflare.com` (Cloudflare Tunnel)

❌ **NOT Monitored:**
- Regular websites (google.com, github.com, etc.)
- Production sites
- Personal browsing

**Want to add custom domains?** See [Custom Domains Guide](guides/custom-domains.md) for instructions on adding staging environments or other tunnel services.

### Captured Data

✅ **Console Logs:**
- `console.log()`, `console.warn()`, `console.error()`, `console.debug()`
- JavaScript errors with stack traces
- Unhandled promise rejections

✅ **Network Activity:**
- Fetch and XMLHttpRequest calls
- HTTP methods, URLs, status codes
- Request/response timing
- Failed requests (4xx, 5xx errors)

✅ **Secret Redaction:**
- Cookies → `[REDACTED]`
- Authorization headers → `[REDACTED]`
- Session tokens → `[REDACTED]`
- All sensitive data stays private

---

## Testing Your Setup

### Test 1: Basic Console Logs

1. Start your dev server:
   ```bash
   ai npm run dev
   ```

2. Open `http://localhost:3000` (or your dev port)

3. Open DevTools (F12) → Console

4. Type:
   ```javascript
   console.log('Test message from browser');
   console.error('Test error');
   ```

5. Ask your AI:
   ```
   Check the browser console for errors
   ```

6. AI should automatically see the logs!

### Test 2: Network Requests

1. On your localhost page, trigger an API call

2. Ask your AI:
   ```
   Show me recent network requests
   ```

3. AI should see the request details (URL, method, status code)

---

## Troubleshooting

For detailed troubleshooting and common issues, see the [extension repository documentation](https://github.com/Ami3466/ai-live-log-bridge-extension).

### Quick Diagnostics

**Extension not connecting?**
- Verify extension is installed in `chrome://extensions/`
- Check that extension is enabled
- See extension repository for native messaging setup

**No logs appearing?**
- Ensure you're on a **localhost** page (not regular websites)
- Extension only monitors `localhost:*` and `127.0.0.1:*`
- Check extension service worker console for errors

**Permission issues?**
- See the extension repository for native messaging host setup
- Restart Chrome completely after configuration changes

---

## Uninstall

To remove the browser extension:

1. Go to `chrome://extensions/`
2. Find "AI Live Log Bridge - Browser Monitor"
3. Click "Remove"

For complete uninstallation instructions, see the [extension repository](https://github.com/Ami3466/ai-live-log-bridge-extension).

---

## Repository

**Full documentation and source code:**
[https://github.com/Ami3466/ai-live-log-bridge-extension](https://github.com/Ami3466/ai-live-log-bridge-extension)

---

## Need Help?

- **Extension Issues:** [Extension Repository Issues](https://github.com/Ami3466/ai-live-log-bridge-extension/issues)
- **MCP Server Issues:** [MCP Server Issues](https://github.com/Ami3466/ai-live-log-bridge/issues)
- **General Documentation:** [Main README](../README.md)
