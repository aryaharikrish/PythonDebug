import { NextRequest, NextResponse } from "next/server";
import { executePythonCode } from "@/lib/pythonExecutor";
import { analyzePythonError } from "@/lib/aiDebugger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, customInputs } = body;

    if (typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code input. Expected string." },
        { status: 400 }
      );
    }

    console.log(`[PYDEBUG EXECUTION REQUEST] Received Python code (${code.length} chars)`);

    // Execute Python code in isolated sandbox with 4.0s timeout and optional custom user inputs
    const executionResult = await executePythonCode(
      code,
      4000,
      typeof customInputs === "string" ? customInputs : ""
    );

    // If an error occurred, run AI diagnostic analysis
    let debugAnalysis = null;
    if (executionResult.hasError) {
      debugAnalysis = analyzePythonError(code, executionResult);
    }

    console.log(
      `[PYDEBUG RESULT] Success: ${!executionResult.hasError} | Execution Time: ${executionResult.executionTime}ms | Error: ${executionResult.errorType || "None"}`
    );

    return NextResponse.json({
      success: true,
      result: executionResult,
      debugAnalysis,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Execution server error",
        message: error?.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
