# @scotthuang/tool-logger

OpenClaw plugin for logging all tool inputs and outputs.

## Installation

```bash
openclaw plugins install @scotthuang/tool-logger
```

Then restart the Gateway:

```bash
openclaw gateway restart
```

## Features

Logs tool calls with:

- **Input (IN)** - Tool name, session key, agent ID, timeout, parameters
- **Output (OUT)** - Tool name, duration, result size, result preview

Log format:
```
[timestamp] IN  | tool-name | session-key | agent-id | timeout | params
[timestamp] OUT | tool-name | duration | result-size | result-preview
```

## Log Location

Logs are saved to: `~/.openclaw/workspace/logs/tool-logger/`

## Log Rotation

Keeps logs for the last 3 days. Older logs are automatically cleaned up.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## License

MIT
