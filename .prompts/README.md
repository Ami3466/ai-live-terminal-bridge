# Prompt Files for AI Terminal Bridge

This folder contains configuration files to help your AI coding assistant automatically use the `ai` wrapper.

## Files

### `ai-wrapper.md` (Required)
**Purpose:** Instructs your AI to always use the `ai` wrapper for terminal commands.

**Compatible with:** Claude Code, Cursor, Windsurf, Cline, Continue, and any LLM that supports prompt files.

**How to use:**
1. Copy this file to your project root as `.prompts/ai-wrapper.md`
2. Or copy the content to `.cursorrules`, `.windsurfrules`, etc.
3. Your AI will now automatically wrap all commands with `ai`

**Safe?** ✅ Yes - This is just a text prompt that guides the AI's behavior.

---

### `settings.local.json` (Optional - Advanced Users Only)
**Purpose:** Auto-approves `ai` commands in Claude Code so you don't get permission prompts.

**Compatible with:** Claude Code only (uses Claude Code's permission system).

**How to use:**
1. Copy this file to your project root as `.prompts/settings.local.json`
2. Claude Code will automatically detect and use it
3. Commands matching the patterns will run without asking permission

**Safe?** ⚠️ **Use with caution** - This auto-approves ANY command run with `ai`, including potentially dangerous ones like `ai rm -rf /`.

**Recommendation:**
- Only use in **trusted projects** where you review what Claude Code is doing
- Consider **not using this** if you prefer manual approval for safety
- You can always approve commands individually without this file

---

## Quick Setup

### Option 1: Manual Copy (Safest)
```bash
# In your project root
mkdir -p .prompts
cp /path/to/ai-live-terminal-bridge/.prompts/ai-wrapper.md .prompts/
```

### Option 2: Use Cursor/Windsurf Rules Files
```bash
# Copy the content from ai-wrapper.md to:
.cursorrules          # For Cursor
.windsurfrules        # For Windsurf
```

### Option 3: Add Auto-Approval (Advanced)
```bash
# Only if you understand the security implications
cp /path/to/ai-live-terminal-bridge/.prompts/settings.local.json .prompts/
```

---

## Security Best Practices

1. **Always review what your AI is doing** - Even with prompts, monitor the commands being executed
2. **Start without auto-approval** - Try using just `ai-wrapper.md` first
3. **Add auto-approval only if needed** - Some users prefer the control of manual approval
4. **Use in trusted projects** - Don't blindly copy these files to untrusted repositories

---

## Troubleshooting

**Q: My AI isn't using `ai` wrapper**
- Make sure the prompt file is in the correct location for your AI tool
- Check that the file is named correctly (`.cursorrules` for Cursor, etc.)
- Try restarting your AI tool after adding the file

**Q: Claude Code keeps asking for permission**
- This is normal and safe behavior
- You can approve individually, or add `settings.local.json` if you prefer
- Make sure `settings.local.json` is in `.prompts/` folder

**Q: Are these files included when I install the npm package?**
- No, you need to manually copy them from this repository
- They're project-specific configuration, not part of the global CLI tool
