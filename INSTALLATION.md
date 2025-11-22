# Installation Guide

## Quick Install

```bash
npm install -g ai-live-terminal-bridge
```

Verify installation:
```bash
ai
```

You should see the help menu.

## From Source

```bash
# Clone repository
git clone https://github.com/Ami3466/ai-live-terminal-bridge.git
cd ai-live-terminal-bridge

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link
```

## Environment-Specific Setup

### Claude Code (CLI)

No additional setup needed! Just use:
```bash
ai npm start
ai --last
```

### Cursor

No additional setup needed! Ask the AI agent to run:
```bash
ai --last
```

### Claude Desktop

1. Find your config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

2. Add this configuration:
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

3. Restart Claude Desktop

4. Test by asking: "Check my session logs"

## Verifying Installation

### Test Mode 1: Wrapper
```bash
ai echo "Hello World"
```

Should display output and create `~/.mcp-logs/session.log`

### Test Mode 2: CLI Reader
```bash
ai --last
```

Should display recent log content

### Test Mode 3: MCP Server (Claude Desktop only)
Ask Claude: "Use the get_crash_context tool"

Claude should be able to read your session logs.

## Troubleshooting

### `ai: command not found`

Restart terminal or run:
```bash
hash -r  # Bash/Zsh
```

### Permission Denied

```bash
sudo npm install -g ai-live-terminal-bridge
```

### Build Errors

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Claude Desktop Not Seeing Tool

1. Check config JSON syntax is valid
2. Verify `ai --server` runs without error
3. Restart Claude Desktop completely
4. Check Developer Tools Console for errors

## Uninstall

```bash
npm uninstall -g ai-live-terminal-bridge
rm -rf ~/.mcp-logs
```
