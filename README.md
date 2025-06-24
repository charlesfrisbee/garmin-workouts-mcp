# Garmin Workouts MCP

Natural language to Garmin Connect workout creation tool, designed as an MCP (Model Context Protocol) server for Claude.

## Installation

### Claude Code (Recommended)

```bash
claude mcp add garmin-workouts-mcp npx garmin-workouts-mcp
```

### Claude Desktop

Add to your configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "garmin-workouts-mcp": {
      "command": "npx",
      "args": ["-y", "garmin-workouts-mcp"]
    }
  }
}
```

Then restart Claude Desktop.

## Usage

1. **Check authentication**: "Check my Garmin authentication status"
2. **Authenticate**: "Authenticate with Garmin Connect" (one-time setup)
3. **Create workouts**: "Create a 10 min warmup, 5x1km threshold intervals with 2 min rest, then 10 min cooldown"

## Example Workouts

- **Easy run**: "30 minute easy run in zone 2"
- **Intervals**: "5x400m at 5k pace with 60 second rest"
- **Threshold**: "10 min warmup, 20 min tempo in zone 4, 10 min cooldown"
- **Sprints**: "Warmup 10 min, then 8x15 second sprints with 3 min recovery"
- **Complex**: "Pyramid workout: 1-2-3-4-3-2-1 minutes hard with equal recovery"

## Features

- 🧠 **Natural language processing** - Describe workouts in plain English
- 🔐 **Secure authentication** - Token-based auth with automatic renewal
- 🏃 **Multi-sport support** - Running, cycling, and swimming workouts
- ⚡ **Direct Garmin integration** - Creates workouts instantly in Garmin Connect
- 💾 **Smart caching** - Remembers your login, no repeated authentication

## How It Works

1. Converts your natural language workout description into structured data
2. Translates to Garmin's workout API format with proper zones and targets
3. Creates the workout directly in your Garmin Connect account
4. Syncs automatically to your Garmin device

Made for Claude Code and Claude Desktop.