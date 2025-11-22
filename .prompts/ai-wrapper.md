# Command Execution Protocol

## Mandatory Rule

Prefix every Bash tool invocation with `ai` followed by the actual command.

## Implementation

When executing any command via the Bash tool:

**Required format:**
```bash
ai <command> <arguments>
```

**Examples:**
- `ai npm test`
- `ai npm start`
- `ai npm run build`
- `ai node server.js`
- `ai python script.py`
- `ai docker-compose up`

**Never execute commands without the `ai` prefix.**

## Rationale

The `ai` wrapper enables:
- Command output logging to `~/.mcp-logs/session.log`
- Real-time monitoring via `ai live` in user's terminal
- Complete visibility into command execution
- Prevention of hidden process conflicts

## Reading Command Output

Access logged command output:
```bash
ai --last 100    # Last 100 lines
ai --last 200    # Last 200 lines
```

Use this to analyze failures, review error messages, and understand complete execution context.

## Debugging Procedure

1. Execute command with `ai` prefix
2. If failure occurs, run `ai --last 200`
3. Read complete output, not just final lines
4. Identify all errors in the output
5. Implement fix based on full context

## Scope

This rule applies to all commands that:
- Execute code (node, python, ruby, etc.)
- Run build processes (npm, cargo, make, etc.)
- Start servers or services
- Run tests or linters
- Execute Docker containers
- Perform any operation requiring process monitoring

No exceptions.