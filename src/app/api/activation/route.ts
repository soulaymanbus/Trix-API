import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

// Initialize Upstash Redis client if credentials exist in environment (Vercel)
const redis =
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
  (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
    ? new Redis({
        url: (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)!,
        token: (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)!,
      })
    : null;

// Local disk fallback for development
const DB_DIR = path.join(process.cwd(), "data");

function ensureUserFile(userId: string) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const userFile = path.join(DB_DIR, `user_${userId}.json`);
  if (!fs.existsSync(userFile)) {
    const initialData = { uid: userId, apiKey: "", packages: [], lines: [] };
    fs.writeFileSync(userFile, JSON.stringify(initialData, null, 2), "utf-8");
  }
  return userFile;
}

// Read user isolated data
async function getUserData(userId: string): Promise<{ uid: string; apiKey: string; packages: any[]; lines: any[] }> {
  const defaultData = { uid: userId, apiKey: "", packages: [], lines: [] };
  if (!userId) return defaultData;

  if (redis) {
    try {
      const data = await redis.get<{ uid: string; apiKey: string; packages: any[]; lines: any[] }>(`user_db:${userId}`);
      if (data && typeof data === "object") {
        return {
          uid: userId,
          apiKey: data.apiKey || "",
          packages: Array.isArray(data.packages) ? data.packages : [],
          lines: Array.isArray(data.lines) ? data.lines : [],
        };
      }
    } catch (err) {
      console.error(`Upstash Redis fetch error for user ${userId}:`, err);
    }
  }

  // Local filesystem fallback
  try {
    const userFile = ensureUserFile(userId);
    const raw = fs.readFileSync(userFile, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      uid: userId,
      apiKey: parsed.apiKey || "",
      packages: Array.isArray(parsed.packages) ? parsed.packages : [],
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
    };
  } catch {
    return defaultData;
  }
}

// Save user isolated data
async function saveUserData(userId: string, data: { apiKey?: string; packages?: any[]; lines?: any[] }): Promise<void> {
  if (!userId) return;
  const current = await getUserData(userId);
  const updated = {
    uid: userId,
    apiKey: data.apiKey !== undefined ? data.apiKey : current.apiKey,
    packages: data.packages !== undefined ? data.packages : current.packages,
    lines: data.lines !== undefined ? data.lines : current.lines,
  };

  if (redis) {
    try {
      await redis.set(`user_db:${userId}`, updated);
      return;
    } catch (err) {
      console.error(`Upstash Redis save error for user ${userId}:`, err);
    }
  }

  // Local filesystem fallback
  const userFile = ensureUserFile(userId);
  fs.writeFileSync(userFile, JSON.stringify(updated, null, 2), "utf-8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const userId = searchParams.get("user_id") || "default_admin";

  // Handle User Auth Verification
  if (action === "auth_login") {
    const pass = searchParams.get("password") || "";
    if (!pass.trim()) {
      return NextResponse.json({ status: "false", message: "Password is required" }, { status: 400 });
    }
    const uid = `usr_${pass.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const userData = await getUserData(uid);
    return NextResponse.json({
      status: "true",
      uid,
      password: pass.trim(),
      apiKey: userData.apiKey,
      packages: userData.packages,
      lines: userData.lines,
    });
  }

  // Handle Multi-Tenant User Data Fetch
  if (action === "cloud_get") {
    const userData = await getUserData(userId);
    return NextResponse.json({ lines: userData.lines, apiKey: userData.apiKey, packages: userData.packages });
  }

  const apiKey = searchParams.get("api_key");

  if (!apiKey) {
    return NextResponse.json(
      [{ status: "false", message: "API Key is required" }],
      { status: 400 }
    );
  }

  const targetUrl = new URL("https://activationpanel.net/api/api.php");
  searchParams.forEach((value, key) => {
    if (
      key !== "action" ||
      (value !== "cloud_get" &&
        value !== "cloud_save" &&
        value !== "cloud_save_settings" &&
        value !== "cloud_delete" &&
        value !== "cloud_clear" &&
        value !== "auth_login")
    ) {
      targetUrl.searchParams.append(key, value);
    }
  });

  try {
    const res = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = [{ status: "false", message: text || "Invalid API response" }];
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      [
        {
          status: "false",
          message: error.message || "Failed to reach Activation Panel API",
        },
      ],
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, line, id, apiKey, packages, userId } = body;
    const uid = userId || "default_admin";

    if (action === "cloud_save_settings") {
      await saveUserData(uid, { apiKey, packages });
      return NextResponse.json({ status: "true", apiKey, packages });
    }

    if (action === "cloud_save" && line) {
      const userData = await getUserData(uid);
      const currentLines = userData.lines;
      const filtered = currentLines.filter((item: any) => item.id !== line.id);
      const updatedLines = [line, ...filtered];
      await saveUserData(uid, { lines: updatedLines });
      return NextResponse.json({ status: "true", lines: updatedLines });
    }

    if (action === "cloud_delete" && id) {
      const userData = await getUserData(uid);
      const updatedLines = userData.lines.filter((item: any) => item.id !== id);
      await saveUserData(uid, { lines: updatedLines });
      return NextResponse.json({ status: "true", lines: updatedLines });
    }

    if (action === "cloud_clear") {
      await saveUserData(uid, { lines: [] });
      return NextResponse.json({ status: "true", lines: [] });
    }

    return NextResponse.json(
      { status: "false", message: "Invalid cloud action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "false", message: error.message },
      { status: 500 }
    );
  }
}
