import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import puppeteer, { Browser, Page } from "puppeteer";

interface AuthData {
  authToken: string;
  cookies: string;
  expiresAt: number;
  issuedAt: number;
}

export class GarminAuth {
  private configDir: string;
  private authFile: string;

  constructor() {
    this.configDir = join(homedir(), ".config", "garmin-workouts-mcp");
    this.authFile = join(this.configDir, "auth.json");
    
    // Ensure config directory exists
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Get valid authentication data, refreshing if needed
   */
  async getValidAuth(): Promise<AuthData | null> {
    const stored = this.loadStoredAuth();
    
    if (stored && this.isTokenValid(stored)) {
      return stored;
    }

    // Token expired or doesn't exist, need to re-authenticate
    return null;
  }

  /**
   * Perform authentication flow and store tokens
   */
  async authenticate(): Promise<AuthData | null> {
    console.error("🚀 Starting Garmin authentication...");
    
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=VizDisplayCompositor",
      ],
    });

    let authData: AuthData | null = null;

    try {
      const page = await browser.newPage();
      
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await page.evaluateOnNewDocument(() => {
        delete (navigator as any).webdriver;
        (window as any).chrome = {
          runtime: {},
          loadTimes: function () {},
          csi: function () {},
          app: {},
        };
      });

      await page.setViewport({ width: 1366, height: 768 });

      let authToken = "";
      let cookies = "";

      // Set up request interception to capture auth token
      await page.setRequestInterception(true);

      page.on("request", (request) => {
        const authHeader = request.headers()["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ") && !authToken) {
          authToken = authHeader;
          console.error("🎯 Captured auth token!");
        }
        request.continue();
      });

      console.error("🔐 Opening Garmin Connect login...");
      console.error("👉 Please login manually in the browser");

      // Go directly to workouts page (will redirect to login if needed)
      await page.goto("https://connect.garmin.com/modern/workouts", {
        waitUntil: "networkidle2",
      });

      console.error("⏳ Waiting for login completion...");
      console.error("💡 The page should redirect to login, then back to workouts");

      // Wait for the workouts page to load properly (means we're logged in)
      await page.waitForFunction(
        () => {
          return (
            window.location.href.includes("/modern/workouts") &&
            !window.location.href.includes("sso.garmin.com") &&
            document.querySelector('select[name="select-workout"]') !== null
          );
        },
        { timeout: 300000 } // 5 minutes for manual login
      );

      // Extract cookies
      const pageCookies = await page.cookies();
      cookies = pageCookies.map((c) => `${c.name}=${c.value}`).join("; ");

      // Make sure we have an auth token by triggering a request
      if (!authToken) {
        console.error("🔄 Triggering request to capture auth token...");
        await page.reload();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      if (authToken && cookies) {
        console.error("✅ Authentication successful!");
        
        // Parse token expiration
        const tokenPayload = this.parseJWT(authToken);
        
        authData = {
          authToken,
          cookies,
          expiresAt: tokenPayload.exp * 1000, // Convert to milliseconds
          issuedAt: tokenPayload.iat * 1000,
        };

        // Store auth data
        this.storeAuth(authData);
      } else {
        console.error("❌ Could not extract authentication data");
      }
    } catch (error) {
      console.error("❌ Authentication failed:", error);
    } finally {
      await browser.close();
    }

    return authData;
  }

  /**
   * Parse JWT token to extract payload
   */
  private parseJWT(token: string): any {
    try {
      const tokenWithoutBearer = token.replace("Bearer ", "");
      const parts = tokenWithoutBearer.split(".");
      const payload = parts[1];
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + "=".repeat((4 - payload.length % 4) % 4);
      
      const decoded = Buffer.from(paddedPayload, "base64").toString();
      return JSON.parse(decoded);
    } catch (error) {
      console.error("Failed to parse JWT:", error);
      return { exp: 0, iat: 0 };
    }
  }

  /**
   * Check if token is still valid (not expired)
   */
  private isTokenValid(authData: AuthData): boolean {
    const now = Date.now();
    const expiresAt = authData.expiresAt;
    
    // Consider token expired if it expires within the next 30 seconds
    const bufferMs = 30 * 1000;
    
    return now + bufferMs < expiresAt;
  }

  /**
   * Load stored authentication data
   */
  private loadStoredAuth(): AuthData | null {
    try {
      if (!existsSync(this.authFile)) {
        return null;
      }

      const data = readFileSync(this.authFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to load stored auth:", error);
      return null;
    }
  }

  /**
   * Store authentication data securely
   */
  private storeAuth(authData: AuthData): void {
    try {
      writeFileSync(this.authFile, JSON.stringify(authData, null, 2), {
        mode: 0o600, // Only owner can read/write
      });
      console.error(`💾 Authentication data stored securely`);
    } catch (error) {
      console.error("Failed to store auth data:", error);
    }
  }

  /**
   * Clear stored authentication data
   */
  clearAuth(): void {
    try {
      if (existsSync(this.authFile)) {
        writeFileSync(this.authFile, "");
        console.error("🗑️ Authentication data cleared");
      }
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  }
}