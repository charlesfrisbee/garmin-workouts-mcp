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

⚠️ **Important**: Garmin's auth tokens expire after ~5 minutes. Plan multiple workouts and create them all in one session.

### Quick Start

1. **Request a workout** - Just describe what you want: "Create a 10 min warmup, 5x1km threshold intervals with 2 min rest, then 10 min cooldown"

2. **Authenticate when needed** - A browser window will open to Garmin Connect for you to log in (happens when tokens expire ~every 5 minutes)

3. **Your workout appears** - The tool creates it directly in your Garmin Connect account and provides a link to view it

4. **Available on device** - The workout will be available in Garmin Connect and can be sent to your device from there

**Your login is temporarily saved** - Tokens are stored securely on your machine but expire after ~5 minutes, so you may need to re-authenticate between sessions.

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

## Legal Disclaimer

This project is an unofficial third-party tool that interacts with Garmin Connect's web interface. It is not affiliated with, endorsed by, or sponsored by Garmin Ltd. or any of its affiliates.

- **Use at your own risk** - This tool may stop working if Garmin changes their API or terms of service
- **Not for commercial use** - This is a personal project intended for individual use only
- **No warranty** - The software is provided "as is" without any guarantees
- **Respect Garmin's terms** - Users are responsible for complying with Garmin Connect's terms of service
- **Data responsibility** - You are responsible for the workouts created and any data shared with Garmin

If you represent Garmin and have concerns about this project, please reach out through GitHub issues.

## Development

### Token Storage

Auth tokens are stored securely in:

- **Location**: `~/.config/garmin-workouts-mcp/auth.json`
- **Permissions**: 600 (user read/write only)
- **Expiry**: ~5 minutes from login
- **Content**: JWT tokens and cookies for Garmin Connect API

### Local Development

```bash
# Clone and install
git clone https://github.com/charlesfrisbee/garmin-workouts-mcp.git
cd garmin-workouts-mcp
pnpm install

# Build and test locally
pnpm run build
pnpm run pack

# Add to Claude Code for testing
claude mcp add garmin-workouts-mcp ./garmin-workouts-mcp-local.tgz
```

### Requirements

- **Node.js** 16+
- **pnpm**
- **Claude Code** (for local testing)
- **Garmin Connect account**
