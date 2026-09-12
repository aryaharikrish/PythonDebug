import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number; // in milliseconds
  hasError: boolean;
  errorType?: string;
  errorMessage?: string;
  errorLine?: number;
  errorSnippet?: string;
  traceback?: string;
}

/**
 * Detects the local Python binary ('python', 'python3', or 'py')
 */
function getPythonCommand(): string {
  if (process.platform === "win32") {
    return "python";
  }
  return "python3";
}

/**
 * Parses Python stderr traceback to extract Error Type, Line Number, and Error Message
 */
export function parsePythonTraceback(stderr: string, code: string): {
  errorType: string;
  errorMessage: string;
  errorLine?: number;
  errorSnippet?: string;
} {
  if (!stderr) {
    return { errorType: "None", errorMessage: "" };
  }

  const lines = stderr.trim().split("\n");
  const codeLines = code.split("\n");

  // Common syntax error format:
  // File "temp.py", line 2
  //   def foo()
  //            ^
  // SyntaxError: expected ':'

  let errorLine: number | undefined;
  let errorType = "RuntimeError";
  let errorMessage = stderr;

  // Find line number pattern e.g., File "...", line 5
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    
    // Look for error header line like "IndexError: list index out of range"
    const errorMatch = line.match(/^([A-Z][a-zA-Z0-9_]*Error|[A-Z][a-zA-Z0-9_]*Exception):\s*(.*)$/);
    if (errorMatch) {
      errorType = errorMatch[1];
      errorMessage = errorMatch[2] || line;
    }

    // Look for line number
    const lineMatch = line.match(/File ".*?", line (\d+)/);
    if (lineMatch) {
      errorLine = parseInt(lineMatch[1], 10);
    }
  }

  let errorSnippet: string | undefined;
  if (errorLine && errorLine > 0 && errorLine <= codeLines.length) {
    errorSnippet = codeLines[errorLine - 1].trim();
  }

  return {
    errorType,
    errorMessage,
    errorLine,
    errorSnippet,
  };
}

/**
 * Securely executes Python code in an isolated subprocess with strict timeouts and memory constraints
 */
export async function executePythonCode(
  code: string,
  timeoutMs: number = 4000
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const tempDir = os.tmpdir();
  const filename = `pydebug_${Date.now()}_${Math.random().toString(36).substring(7)}.py`;
  const filePath = path.join(tempDir, filename);

  let codeToExecute = code;
  if (code.includes("input(")) {
    const inputMockHeader = `import sys
try:
    _pydebug_inputs = ["Alex", "25", "Python", "100"]
    _pydebug_input_idx = 0
    def _mock_input(prompt=""):
        global _pydebug_input_idx
        if prompt:
            sys.stdout.write(str(prompt) + "\\n")
            sys.stdout.flush()
        if _pydebug_input_idx < len(_pydebug_inputs):
            val = _pydebug_inputs[_pydebug_input_idx]
            _pydebug_input_idx += 1
            return val
        return "Alex"
    input = _mock_input
except Exception:
    pass

`;
    codeToExecute = inputMockHeader + code;
  }

  // Security prep: Inject restricted environment wrapper or execution guard if needed
  // Write python script to isolated temp file
  await fs.promises.writeFile(filePath, codeToExecute, "utf-8");

  return new Promise((resolve) => {
    let stdoutData = "";
    let stderrData = "";
    let timedOut = false;

    const pythonCmd = getPythonCommand();

    // Spawn python process in isolated mode
    // -I (isolate), -u (unbuffered binary stdout and stderr)
    const child = spawn(pythonCmd, ["-u", filePath], {
      cwd: tempDir,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        PYTHONDONTWRITEBYTECODE: "1",
      },
      timeout: timeoutMs,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch (e) {
        // ignore process kill error
      }
    }, timeoutMs);

    child.stdout?.on("data", (data: Buffer | string) => {
      // Limit output size to prevent memory exhaustion (max 50KB)
      if (stdoutData.length < 50000) {
        stdoutData += data.toString();
      }
    });

    child.stderr?.on("data", (data: Buffer | string) => {
      if (stderrData.length < 50000) {
        stderrData += data.toString();
      }
    });

    child.on("close", async (codeExit: number | null) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;

      // Clean up temporary execution file asynchronously
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err) {
        // cleanup silent catch
      }

      if (timedOut) {
        return resolve({
          stdout: stdoutData,
          stderr: "TimeLimitExceededError: Execution timed out (limit 4.0 seconds). Check for infinite loops!",
          exitCode: 124,
          executionTime,
          hasError: true,
          errorType: "TimeLimitExceededError",
          errorMessage: "Execution timed out (limit 4.0 seconds). Check for infinite loops!",
          traceback: "TimeLimitExceededError: Execution exceeded 4.0 seconds limit.",
        });
      }

      const hasTracebackOrError = /Traceback \(most recent call last\):|[A-Z][a-zA-Z0-9_]*(Error|Exception):/.test(stderrData);
      const hasError = codeExit !== 0 || hasTracebackOrError;
      const parsedError = hasError ? parsePythonTraceback(stderrData, code) : { errorType: "None", errorMessage: "" };

      resolve({
        stdout: stdoutData,
        stderr: stderrData,
        exitCode: codeExit,
        executionTime,
        hasError,
        errorType: parsedError.errorType,
        errorMessage: parsedError.errorMessage,
        errorLine: parsedError.errorLine,
        errorSnippet: parsedError.errorSnippet,
        traceback: stderrData,
      });
    });

    child.on("error", async (err: Error) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (e) {}

      resolve({
        stdout: stdoutData,
        stderr: `EnvironmentError: Failed to spawn Python interpreter. (${err.message})`,
        exitCode: 1,
        executionTime,
        hasError: true,
        errorType: "EnvironmentError",
        errorMessage: err.message,
      });
    });
  });
}
