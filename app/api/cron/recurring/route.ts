import { NextRequest, NextResponse } from "next/server";
import { processAllDueRecurring } from "@lib/recurring/job";

// Triggered by an external cron service (Vercel Cron, cron-job.org, GitHub Actions, etc.)
// Protect with CRON_SECRET to prevent unauthorized access.
//
// Example Vercel cron (vercel.json):
//   { "crons": [{ "path": "/api/cron/recurring", "schedule": "0 6 * * *" }] }
//
// Example curl test:
//   curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/recurring

async function handler(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET no está configurado en el servidor" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await processAllDueRecurring();
    const duration_ms = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      processed: result.processed,
      skipped: result.skipped,
      failed: result.failed,
      duration_ms,
      ...(result.errors.length > 0 ? { errors: result.errors } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler; // some cron providers use POST
