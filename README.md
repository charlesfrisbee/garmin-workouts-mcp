# Garmin Workouts MCP

Create Garmin Connect workouts using natural language descriptions. Built as an MCP (Model Context Protocol) server.

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

⚠️ **Important**: Auth tokens expire after ~5 minutes. Plan multiple workouts and create them all in one session.

### Quick Start
Just start creating workouts! The server will prompt for authentication if needed.

**Create a single workout:**
"Create a 10 min warmup, 5x1km threshold intervals with 2 min rest, then 10 min cooldown"

**Create multiple workouts in one session:**
```
"Create these 3 workouts:
1. Easy 30 min run in zone 2  
2. 5x1km threshold intervals with 2 min rest
3. 10x30 second sprints with 90 second recovery"
```

### How It Works
1. **Request workouts** - Describe what you want to create
2. **Auto-authentication** - Browser opens for login when tokens expire
3. **Batch creation** - Create multiple workouts in the same session

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
- 💾 **Smart token handling** - Automatic re-authentication when tokens expire

## How It Works

1. Converts your natural language workout description into structured data
2. Translates to Garmin's workout API format with proper zones and targets
3. Creates the workout directly in your Garmin Connect account
4. Syncs automatically to your Garmin device

Made for Claude Code and Claude Desktop.