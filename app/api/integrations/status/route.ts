import { NextResponse } from "next/server";
import { integrationStatus } from "@/lib/integration-status";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(integrationStatus(), { headers: { "Cache-Control": "no-store" } });
}
