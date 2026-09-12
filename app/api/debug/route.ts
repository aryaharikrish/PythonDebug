import { NextRequest, NextResponse } from "next/server";
import { analyzePythonError } from "@/lib/aiDebugger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, errorType, errorMessage, errorLine, errorSnippet, traceback } = body;

    const analysis = analyzePythonError(code, {
      stdout: "",
      stderr: traceback || errorMessage || "",
      exitCode: 1,
      executionTime: 0,
      hasError: true,
      errorType: errorType || "PythonError",
      errorMessage: errorMessage || "Runtime Exception",
      errorLine,
      errorSnippet,
      traceback,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "AI Debugging failure", message: error?.message },
      { status: 500 }
    );
  }
}
