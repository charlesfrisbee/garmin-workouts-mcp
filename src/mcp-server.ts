#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GarminAuth } from "./garmin-auth";
import { createGarminWorkout } from "./garmin-workout-creator";

// Types for workout parsing
interface WorkoutStep {
  name: string;
  duration: string;
  target: string;
  intensity: 'warmup' | 'active' | 'rest' | 'cooldown';
  notes?: string;
}

interface WorkoutData {
  name: string;
  sport: 'running' | 'cycling' | 'swimming';
  steps: WorkoutStep[];
}

const server = new Server(
  {
    name: "garmin-workouts",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize auth manager
const garminAuth = new GarminAuth();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_garmin_workout",
        description: "Create a workout in Garmin Connect from structured workout data. Claude should parse the natural language description and pass structured workout steps.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the workout",
            },
            sport: {
              type: "string",
              enum: ["running", "cycling", "swimming"],
              description: "Sport type (defaults to running)",
            },
            steps: {
              type: "array",
              description: "Array of workout steps",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Step name (e.g., 'Warm-up', 'Sprint 1', 'Recovery 1')",
                  },
                  duration: {
                    type: "string", 
                    description: "Duration in MM:SS format (e.g., '10:00') or distance (e.g., '1.5 km')",
                  },
                  target: {
                    type: "string",
                    description: "Target zone or intensity. Use 'Zone 1' for recovery/easy, 'Zone 2' for aerobic/base, 'Zone 3' for tempo, 'Zone 4' for threshold, 'Zone 5' for VO2 max/all-out efforts. IMPORTANT: Default warmup and cooldown steps to 'Zone 2' unless user specifically requests otherwise. Use 'Open' only when no specific target is mentioned.",
                  },
                  intensity: {
                    type: "string",
                    enum: ["warmup", "active", "rest", "cooldown"],
                    description: "Step intensity type",
                  },
                },
                required: ["name", "duration", "target", "intensity"],
              },
            },
          },
          required: ["name", "sport", "steps"],
        },
      },
      {
        name: "check_garmin_auth",
        description: "Check if Garmin authentication is valid",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "authenticate_garmin",
        description: "Authenticate with Garmin Connect (opens browser)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "create_garmin_workout": {
      const { name: workoutName, sport = "running", steps } = args as {
        name: string;
        sport?: string;
        steps: WorkoutStep[];
      };

      try {
        // Check auth first
        const authData = await garminAuth.getValidAuth();
        if (!authData) {
          return {
            content: [
              {
                type: "text",
                text: "❌ Authentication required. Please run the 'authenticate_garmin' tool to authenticate with Garmin Connect.",
              },
            ],
          };
        }

        // Create workout data from structured input
        const workoutData: WorkoutData = {
          name: workoutName,
          sport: sport as 'running' | 'cycling' | 'swimming',
          steps
        };

        // Create LLM parser that just returns the structured data
        const llmParser = async () => workoutData;

        // Create workout with structured data
        const result = await createGarminWorkout(
          workoutName, // description not needed anymore
          authData.authToken,
          authData.cookies,
          workoutName,
          sport,
          llmParser
        );

        if (result.success) {
          return {
            content: [
              {
                type: "text",
                text: `✅ Workout created successfully!\n\n**${result.name}** (ID: ${result.workoutId})\n\n🔗 **View in Garmin Connect:** ${result.url}\n\nThe workout is now available in your Garmin Connect account and ready to sync to your device.`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `❌ Failed to create workout: ${result.error}`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error creating workout: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }

    case "check_garmin_auth": {
      try {
        const authData = await garminAuth.getValidAuth();
        if (authData) {
          const expiresAt = new Date(authData.expiresAt);
          return {
            content: [
              {
                type: "text",
                text: `✅ Garmin authentication is valid and ready to use.\nToken expires: ${expiresAt.toLocaleString()}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: "❌ No valid Garmin authentication found. Please run the 'authenticate_garmin' tool to authenticate.",
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Authentication error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }

    case "authenticate_garmin": {
      try {
        console.error("🔐 Starting Garmin authentication...");
        const authData = await garminAuth.authenticate();
        if (authData) {
          const expiresAt = new Date(authData.expiresAt);
          return {
            content: [
              {
                type: "text",
                text: `✅ Successfully authenticated with Garmin Connect! You can now create workouts.\nToken expires: ${expiresAt.toLocaleString()}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: "❌ Authentication failed. Please ensure you can access Garmin Connect in your browser.",
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Authentication error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Garmin Workouts MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});