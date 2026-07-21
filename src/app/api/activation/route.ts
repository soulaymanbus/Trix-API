import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cloud / Server-side storage path for persistent storage
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "saved_lines.json");

function ensureStorage() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]), "utf-8");
  }
}

function getCloudLines() {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCloudLines(lines: any[]) {
  ensureStorage();
  fs.writeFileSync(DB_FILE, JSON.stringify(lines, null, 2), "utf-8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Handle Cloud Storage Endpoints
  if (action === "cloud_get") {
    const lines = getCloudLines();
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
    if (key !== "action" || (value !== "cloud_get" && value !== "cloud_save" && value !== "cloud_delete" && value !== "cloud_clear")) {
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
      [{ status: "false", message: error.message || "Failed to reach Activation Panel API" }],
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, line, id } = body;

    if (action === "cloud_save" && line) {
      const current = getCloudLines();
      const filtered = current.filter((item: any) => item.id !== line.id);
      const updated = [line, ...filtered];
      saveCloudLines(updated);
      return NextResponse.json({ status: "true", lines: updated });
    }

    if (action === "cloud_delete" && id) {
      const current = getCloudLines();
      const updated = current.filter((item: any) => item.id !== id);
      saveCloudLines(updated);
      return NextResponse.json({ status: "true", lines: updated });
    }

    if (action === "cloud_clear") {
      saveCloudLines([]);
      return NextResponse.json({ status: "true", lines: [] });
    }

    return NextResponse.json({ status: "false", message: "Invalid cloud action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ status: "false", message: error.message }, { status: 500 });
  }
}
