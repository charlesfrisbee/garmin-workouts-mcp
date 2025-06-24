# Garmin Workout Generator

A natural language to Garmin Connect workout creation tool, designed as an MCP (Model Context Protocol) server for Claude.

## What This Project Does

This tool allows you to create structured workouts in Garmin Connect using natural language descriptions. Instead of manually building workouts step-by-step in the Garmin Connect web interface, you can simply describe your workout and have it automatically created with proper targets, zones, and durations.

### Examples
- **Input**: "10 min warmup zone 3, then 5x1km threshold intervals zone 4 with 2 min rest between, then 10 min cooldown zone 2"
- **Output**: Complete structured workout in Garmin Connect with proper heart rate zones, distance/time conditions, and step sequencing

## Key Features

### 🧠 Natural Language Processing
- Converts human workout descriptions into Garmin's complex API format
- Understands workout terminology: intervals, threshold, tempo, sprints, recovery
- Parses durations: "10 min", "5:00", "1.5 km", "30 sec"
- Parses targets: "Zone 3", "138 BPM", "4:30/km pace"
- Handles intensities: warmup, active intervals, recovery/rest, cooldown

### 🔐 Smart Authentication
- **Token caching**: Stores Garmin auth tokens securely in `~/.config/garmin-workouts-mcp/`
- **Expiry checking**: Automatically detects when tokens expire (JWT parsing)
- **Auto re-authentication**: Seamlessly triggers browser login when needed
- **Session persistence**: No need to log in every time

### 🏃 Workout Creation
- **Multiple sports**: Running, cycling, swimming support
- **Complex structures**: Multi-step workouts with repeating intervals
- **Proper targeting**: Heart rate zones, specific BPM, pace targets
- **Garmin API integration**: Direct API calls to create workouts instantly

## Architecture

### MCP Server Design
This project is built as an MCP server that provides two main tools:

1. **`check_garmin_auth`**: Validates authentication and triggers login if needed
2. **`create_garmin_workout`**: Converts natural language to Garmin workouts

### Core Components

#### Authentication (`src/garmin-auth.ts`)
- Manages Garmin Connect authentication tokens
- Handles JWT token parsing and expiry detection
- Provides secure local storage of credentials
- Automated browser-based re-authentication flow

#### Workout Creation (`src/garmin-workout-creator.ts`)
- Natural language parsing engine
- Garmin API payload generation
- Workout step sequencing and validation
- Error handling and response processing

#### MCP Server (`src/mcp-server.ts`)
- Model Context Protocol implementation
- Tool registration and request handling
- Integration with Claude for natural language processing

### Garmin API Format Understanding

The project includes deep knowledge of Garmin's workout API structure:

```json
{
  "workoutName": "5x 1km Threshold Intervals",
  "workoutSegments": [{
    "workoutSteps": [{
      "stepType": {"stepTypeKey": "warmup"},
      "endCondition": {"conditionTypeKey": "time", "conditionValue": 600},
      "targetType": {"workoutTargetTypeKey": "heart.rate.zone"},
      "zoneNumber": 3
    }]
  }]
}
```

## Installation

### Claude Code (Recommended)

Simply run:
```bash
claude mcp add garmin-workouts-mcp
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

### Development Setup

For local development:

1. **Clone and install**:
   ```bash
   git clone <repository>
   cd garmin-workouts-mcp
   pnpm install
   ```

2. **Add to Claude Code**:
   ```bash
   claude mcp add garmin-workouts-mcp pnpm run mcp-server
   ```

## Usage

### As MCP Server (Recommended)
1. **Authentication**: "Check my Garmin authentication status"
2. **Create workouts**: "Create a tempo run: 15 min warmup, 20 min tempo in zone 4, 10 min cooldown"

### Development Commands
- `pnpm run mcp-server`: Run MCP server with tsx (development)
- `pnpm run build`: Compile TypeScript to JavaScript

## Development Context

### Natural Language Processing Strategy
The system uses a hybrid approach:
- **Pattern matching** for common workout terminology
- **Contextual parsing** for complex workout structures
- **Default fallbacks** for ambiguous descriptions
- **Structured conversion** to Garmin API format

### Authentication Flow
1. Check stored tokens for validity (JWT expiry parsing)
2. If expired/missing, launch Puppeteer browser instance
3. Navigate to Garmin Connect, wait for manual login
4. Intercept Bearer tokens from API requests
5. Store securely with expiration metadata
6. Auto-refresh when tokens approach expiry

### Tested Workout Types
- **Threshold intervals**: Long sustained efforts at lactate threshold
- **Sprint intervals**: Short high-intensity efforts with long recovery
- **Tempo runs**: Sustained moderate-hard efforts
- **Base training**: Extended aerobic efforts
- **Recovery runs**: Easy-paced recovery sessions

## Technical Details

### Dependencies
- **Puppeteer**: Browser automation for authentication
- **@modelcontextprotocol/sdk**: MCP server implementation
- **TypeScript**: Type safety and modern JavaScript features

### Token Security
- Tokens stored in user config directory with 600 permissions
- JWT parsing for precise expiry detection
- Automatic cleanup on authentication errors
- No plaintext password storage

### Error Handling
- Graceful degradation when authentication fails
- Detailed error messages for API failures
- Automatic retry with re-authentication on 401 errors
- User-friendly feedback for common issues

## Future Enhancements

### Planned Features
- **Workout templates**: Save and reuse common workout patterns
- **Training plan generation**: Multi-week periodized programs
- **Calendar integration**: Schedule workouts automatically
- **Device sync verification**: Confirm workouts appear on devices

### API Expansion
- **Activity analysis**: Parse completed workouts for insights
- **Performance tracking**: Monitor training load and progression
- **Social features**: Share workouts with training partners

## File Structure

```
src/
├── mcp-server.ts           # MCP server entry point
├── garmin-auth.ts          # Authentication management
├── garmin-workout-creator.ts # Natural language → Garmin API
├── garminTokenExtractor.ts  # Legacy auth implementation
├── garminConnectBot.ts     # Legacy Puppeteer interface
└── createCustomWorkout.ts  # Development testing script

dist/                       # Compiled JavaScript
.mcp.json                  # MCP server configuration
CLAUDE_CONFIG.md           # Claude Code setup instructions
```

## Usage Examples

### Basic Workouts
- "30 minute easy run in zone 2"
- "45 minute bike ride with 5 min warmup and cooldown"
- "20 minute pool swim"

### Interval Training
- "5x1km at threshold pace with 90 second recovery"
- "8x400m at 5k pace with 60 second rest"
- "3x8 minute tempo intervals with 2 minute recovery"

### Complex Sessions
- "Pyramid workout: 1-2-3-4-3-2-1 minutes hard with equal recovery"
- "Fartlek run: 10 min warmup, then 30 seconds hard / 90 seconds easy x 10, then cooldown"
- "Threshold progression: 10 min warmup, 3x10 min building from zone 3 to zone 4, 10 min cooldown"

This tool bridges the gap between human workout planning and Garmin's technical workout structure, making it easy to create sophisticated training sessions with natural language.