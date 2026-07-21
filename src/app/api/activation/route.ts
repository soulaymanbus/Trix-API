import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("api_key");

  if (!apiKey) {
    return NextResponse.json(
      [{ status: "false", message: "API Key is required" }],
      { status: 400 }
    );
  }

  const targetUrl = new URL("https://activationpanel.net/api/api.php");
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
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
