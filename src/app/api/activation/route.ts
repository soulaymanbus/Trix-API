import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

// Initialize Upstash Redis client if credentials exist in environment (Vercel)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Local disk fallback for development
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "saved_lines.json");

function ensureLocalStorage() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]), "utf-8");
  }
}

async function getCloudLines(): Promise<any[]> {
  if (redis) {
    try {
      const data = await redis.get<any[]>("activation_lines_db");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Upstash Redis fetch error:", err);
    }
  }

  // Fallback to local filesystem
  ensureLocalStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveCloudLines(lines: any[]): Promise<void> {
  if (redis) {
    try {
      await redis.set("activation_lines_db", lines);
      return;
    } catch (err) {
      console.error("Upstash Redis save error:", err);
    }
  }

  // Fallback to local filesystem
  ensureLocalStorage();
  fs.writeFileSync(DB_FILE, JSON.stringify(lines, null, 2), "utf-8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Handle Cloud Storage Fetch Endpoint
  if (action === "cloud_get") {
    const lines = await getCloudLines();
    return NextResponse.json(lines);
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
        value !== "cloud_delete" &&
        value !== "cloud_clear")
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
    const { action, line, id } = body;

    if (action === "cloud_save" && line) {
      const current = await getCloudLines();
      const filtered = current.filter((item: any) => item.id !== line.id);
      const updated = [line, ...filtered];
      await saveCloudLines(updated);
      return NextResponse.json({ status: "true", lines: updated });
    }

    if (action === "cloud_delete" && id) {
      const current = await getCloudLines();
      const updated = current.filter((item: any) => item.id !== id);
      await saveCloudLines(updated);
      return NextResponse.json({ status: "true", lines: updated });
    }

    if (action === "cloud_clear") {
      await saveCloudLines([]);
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
