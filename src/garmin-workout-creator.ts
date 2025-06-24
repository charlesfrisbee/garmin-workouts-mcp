import fetch from "node-fetch";

interface GarminApiResponse {
  workoutId: number;
  workoutName: string;
}

interface WorkoutResult {
  success: boolean;
  workoutId?: string;
  name?: string;
  url?: string;
  error?: string;
}

interface WorkoutStep {
  name: string;
  duration: string;
  target: string;
  intensity: "warmup" | "active" | "rest" | "cooldown";
  notes?: string;
}

interface WorkoutData {
  name: string;
  sport: "running" | "cycling" | "swimming";
  steps: WorkoutStep[];
}

/**
 * Create a Garmin workout from natural language description
 */
export async function createGarminWorkout(
  description: string,
  authToken: string,
  cookies: string,
  customName?: string,
  sport: string = "running",
  llmParser?: (
    description: string,
    sport: string,
    customName?: string
  ) => Promise<WorkoutData>
): Promise<WorkoutResult> {
  try {
    // Parse the description into workout data using LLM
    const workoutData = llmParser
      ? await llmParser(description, sport, customName)
      : await parseWorkoutDescriptionWithLLM(description, sport, customName);

    // Convert to Garmin API format
    const payload = convertToGarminPayload(workoutData);

    console.error(`🏃 Creating workout: ${workoutData.name}`);
    console.error(`📊 Workout has ${workoutData.steps.length} steps:`);
    workoutData.steps.forEach((step, i) => {
      console.error(
        `  ${i + 1}. ${step.name}: ${step.duration} at ${step.target} (${
          step.intensity
        })`
      );
    });
    console.error(
      `📤 Garmin payload has ${payload.workoutSegments[0].workoutSteps.length} steps`
    );

    // Write debug info to file for inspection
    try {
      const fs = require("fs");
      const debugInfo = {
        workoutName: workoutData.name,
        inputSteps: workoutData.steps,
        outputSteps: payload.workoutSegments[0].workoutSteps,
        fullPayload: payload,
      };
      fs.writeFileSync(
        "/tmp/garmin-debug.json",
        JSON.stringify(debugInfo, null, 2)
      );
      console.error(`📝 Debug info written to /tmp/garmin-debug.json`);
    } catch (e) {
      console.error("Failed to write debug file:", e);
    }

    // Make API call to Garmin
    const response = await fetch(
      "https://connect.garmin.com/workout-service/workout",
      {
        method: "POST",
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          authorization: authToken,
          "content-type": "application/json;charset=UTF-8",
          cookie: cookies,
          "di-backend": "connectapi.garmin.com",
          nk: "NT",
          origin: "https://connect.garmin.com",
          referer: `https://connect.garmin.com/modern/workout/create/${sport}`,
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
          "x-app-ver": "5.14.1.2",
          "x-lang": "en-US",
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      const result = (await response.json()) as GarminApiResponse;
      const workoutId = result.workoutId.toString();
      return {
        success: true,
        workoutId,
        name: result.workoutName,
        url: `https://connect.garmin.com/modern/workout/${workoutId}`,
      };
    } else {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);

      if (response.status === 401) {
        return {
          success: false,
          error:
            "Authentication expired. Please re-authenticate with Garmin Connect.",
        };
      }

      return {
        success: false,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }
  } catch (error) {
    console.error("Workout creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Parse natural language workout description into structured data using LLM
 */
async function parseWorkoutDescriptionWithLLM(
  description: string,
  sport: string = "running",
  customName?: string
): Promise<WorkoutData> {
  // This function should be called by the MCP server which has access to the LLM
  // For now, we'll throw an error to indicate LLM parser is required
  throw new Error(
    "LLM parser is required. This function should be called with an LLM parser from the MCP server."
  );
}

// All parsing logic removed - now handled by LLM in MCP server

/**
 * Convert workout data to Garmin API format
 */
function convertToGarminPayload(workoutData: WorkoutData) {
  // Sport type mapping
  const sportMapping: {
    [key: string]: { id: number; key: string; order: number };
  } = {
    running: { id: 1, key: "running", order: 1 },
    cycling: { id: 2, key: "cycling", order: 2 },
    swimming: { id: 5, key: "swimming", order: 5 },
  };

  const sport = sportMapping[workoutData.sport] || sportMapping["running"];

  // Convert workout steps
  const workoutSteps = workoutData.steps.map((step, index) => {
    return convertWorkoutStep(step, index + 1);
  });

  return {
    sportType: {
      sportTypeId: sport.id,
      sportTypeKey: sport.key,
      displayOrder: sport.order,
    },
    subSportType: null,
    workoutName: workoutData.name,
    estimatedDistanceUnit: { unitKey: null },
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: {
          sportTypeId: sport.id,
          sportTypeKey: sport.key,
          displayOrder: sport.order,
        },
        workoutSteps,
      },
    ],
    avgTrainingSpeed: 3.0727914832080057,
    estimatedDurationInSecs: 0,
    estimatedDistanceInMeters: 0,
    estimateType: null,
    isWheelchair: false,
  };
}

/**
 * Convert a single workout step to Garmin format
 */
function convertWorkoutStep(step: WorkoutStep, stepOrder: number) {
  // Step type mapping based on intensity
  const stepTypeMapping: {
    [key: string]: { id: number; key: string; order: number };
  } = {
    warmup: { id: 1, key: "warmup", order: 1 },
    cooldown: { id: 2, key: "cooldown", order: 2 },
    active: { id: 3, key: "interval", order: 3 },
    rest: { id: 4, key: "recovery", order: 4 },
  };

  const stepType = stepTypeMapping[step.intensity] || stepTypeMapping["active"];

  // Parse duration
  const { conditionType, conditionValue } = parseDuration(step.duration);

  // Parse target type
  const { targetType, zoneNumber } = parseTarget(step.target);

  const stepData: any = {
    stepId: stepOrder,
    stepOrder,
    stepType: {
      stepTypeId: stepType.id,
      stepTypeKey: stepType.key,
      displayOrder: stepType.order,
    },
    type: "ExecutableStepDTO",
    endCondition: conditionType,
    endConditionValue: conditionValue,
    targetType,
  };

  // Add zoneNumber if it's a heart rate zone target
  if (zoneNumber !== null) {
    stepData.zoneNumber = zoneNumber;
  }

  return stepData;
}

/**
 * Parse target string to Garmin target format
 */
function parseTarget(target: string): {
  targetType: any;
  zoneNumber: number | null;
} {
  // Default to no target
  const noTargetType = {
    workoutTargetTypeId: 1,
    workoutTargetTypeKey: "no.target",
    displayOrder: 1,
  };

  if (!target || target === "Open") {
    return { targetType: noTargetType, zoneNumber: null };
  }

  // Parse heart rate zones (Zone 1, Zone 2, etc.)
  const zoneMatch = target.match(/Zone\s+(\d+)/i);
  if (zoneMatch) {
    const zone = parseInt(zoneMatch[1]);
    return {
      targetType: {
        workoutTargetTypeId: 4,
        workoutTargetTypeKey: "heart.rate.zone",
        displayOrder: 4,
      },
      zoneNumber: zone,
    };
  }

  // Parse specific BPM (138 BPM, etc.)
  const bpmMatch = target.match(/(\d+)\s*BPM/i);
  if (bpmMatch) {
    return {
      targetType: {
        workoutTargetTypeId: 2,
        workoutTargetTypeKey: "heart.rate.bpm",
        displayOrder: 2,
      },
      zoneNumber: null,
    };
  }

  // Parse pace targets (4:30/km, etc.)
  const paceMatch = target.match(/(\d+):(\d+)\/km/i);
  if (paceMatch) {
    return {
      targetType: {
        workoutTargetTypeId: 6,
        workoutTargetTypeKey: "pace.zone",
        displayOrder: 6,
      },
      zoneNumber: null,
    };
  }

  // Fallback to no target
  return { targetType: noTargetType, zoneNumber: null };
}

/**
 * Parse duration string to Garmin condition format
 */
function parseDuration(duration: string): {
  conditionType: any;
  conditionValue: number;
} {
  // Default to lap button (open duration)
  const lapButtonCondition = {
    conditionTypeId: 1,
    conditionTypeKey: "lap.button",
    displayOrder: 1,
    displayable: true,
  };

  if (duration === "Open") {
    return {
      conditionType: lapButtonCondition,
      conditionValue: 1000,
    };
  }

  // Parse distance format (1.0 km, 1000 m, etc.)
  const distanceMatch = duration.match(/([\d.]+)\s*(km|m)/i);
  if (distanceMatch) {
    const value = parseFloat(distanceMatch[1]);
    const unit = distanceMatch[2].toLowerCase();

    // Convert to meters
    const meters = unit === "km" ? value * 1000 : value;

    return {
      conditionType: {
        conditionTypeId: 3,
        conditionTypeKey: "distance",
        displayOrder: 3,
        displayable: true,
      },
      conditionValue: meters,
    };
  }

  // Parse time format (MM:SS or HH:MM:SS)
  if (duration.includes(":")) {
    const parts = duration.split(":").map(Number);
    let seconds = 0;

    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }

    return {
      conditionType: {
        conditionTypeId: 2,
        conditionTypeKey: "time",
        displayOrder: 2,
        displayable: true,
      },
      conditionValue: seconds,
    };
  }

  // Default fallback
  return {
    conditionType: lapButtonCondition,
    conditionValue: 1000,
  };
}
