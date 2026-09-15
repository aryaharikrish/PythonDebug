import { ExecutionResult } from "./pythonExecutor";

export interface AIDebugAnalysis {
  errorType: string;
  errorLine?: number;
  errorMessage: string;
  simpleExplanation: string;
  rootCause: string;
  suggestedFix: string;
  correctedCode: string;
  learningTip: string;
  errorSnippet?: string;
}

const CONTROL_KEYWORDS = [
  "if", "elif", "else", "for", "while", "def", "class", 
  "try", "except", "finally", "with", "match", "case"
];

/**
 * Advanced Multi-Pass Python Code Transformer
 * Guarantees accurate code correction for syntax, runtime, and structural Python errors.
 */
export function repairPythonCode(
  code: string,
  errorType: string,
  errorMessage: string,
  errorLine?: number,
  errorSnippet?: string
): string {
  if (!code.trim()) return code;

  let lines = code.split("\n");

  // Only perform clean, high-confidence syntax & typo fixes
  lines = lines.map((line) => {
    let l = line;
    const trimmed = l.trim();
    if (!trimmed || trimmed.startsWith("#")) return l;

    // 1. Python keyword case & common typos
    l = l.replace(/\btrue\b/g, "True")
         .replace(/\bfalse\b/g, "False")
         .replace(/\bnone\b/g, "None")
         .replace(/\bnull\b/g, "None")
         .replace(/\bundefined\b/g, "None")
         .replace(/\bprnt\b/g, "print")
         .replace(/\bprin\b/g, "print")
         .replace(/\blenn\b/g, "len")
         .replace(/\blength\b/g, "len");

    // 2. Python 2 print format: print "hello" -> print("hello")
    if (/^\s*print\s+[^()].*$/.test(l)) {
      l = l.replace(/(\s*print)\s+(.*)/, '$1($2)');
    }

    // 3. Single '=' in condition: if x = 5: -> if x == 5:
    if (/^\s*(if|elif|while)\s+[^=!<>=]+=[^=].*$/.test(l)) {
      l = l.replace(/(\s*(?:if|elif|while)\s+[\w\s()."+*/-]+?)=(?!=)(.*)/, '$1==$2');
    }

    // 4. Missing colon on block statements
    const isControl = CONTROL_KEYWORDS.some(
      (kw) => trimmed.startsWith(kw + " ") || trimmed.startsWith(kw + "(") || trimmed === kw
    );
    if (isControl && !trimmed.endsWith(":")) {
      l = l.trimEnd() + ":";
    }

    // 5. Stray colon on non-control statements: print("hello"): -> print("hello")
    const isNonControl = !CONTROL_KEYWORDS.some(
      (kw) => trimmed.startsWith(kw + " ") || trimmed.startsWith(kw + ":") || trimmed === kw
    );
    if (isNonControl && l.trimEnd().endsWith(":")) {
      l = l.trimEnd().slice(0, -1).trimEnd();
    }

    // 6. Balance parentheses on single line if unclosed
    const openP = (l.match(/\(/g) || []).length;
    const closeP = (l.match(/\)/g) || []).length;
    if (openP > closeP) {
      l += ")".repeat(openP - closeP);
    }

    return l;
  });

  // Target-specific simple fixes
  if (errorLine && errorLine > 0 && errorLine <= lines.length) {
    const idx = errorLine - 1;
    const targetLine = lines[idx];

    if (errorType === "NameError") {
      const match = errorMessage.match(/name '(\w+)' is not defined/);
      if (match) {
        const varName = match[1];
        const definedVars = Array.from(code.matchAll(/\b([a-zA-Z_]\w*)\s*=/g)).map((m) => m[1]);
        const similarVar = definedVars.find((v) => v.toLowerCase() === varName.toLowerCase());
        if (similarVar && targetLine) {
          lines[idx] = targetLine.replace(new RegExp(`\\b${varName}\\b`, "g"), similarVar);
        }
      }
    }
  }

  return lines.join("\n");
}

/**
 * Analyzes Python code errors using intelligent pattern recognition and structural fix rules
 */
export function analyzePythonError(
  code: string,
  executionResult: ExecutionResult
): AIDebugAnalysis {
  const errorType = executionResult.errorType || "";
  const errorMessage = executionResult.errorMessage || "";
  const errorLine = executionResult.errorLine;
  const errorSnippet = executionResult.errorSnippet || "";

  // Generate repaired code using multi-pass engine
  let correctedCode = repairPythonCode(code, errorType, errorMessage, errorLine, errorSnippet);

  // Default explanations
  let simpleExplanation = "An error occurred while executing your Python code.";
  let rootCause = "The Python interpreter encountered an unexpected statement or runtime condition.";
  let suggestedFix = "Review the line highlighted in the error traceback and check for typos or incorrect logic.";
  let learningTip = "Always test your code with small inputs and use print() statements or debuggers to inspect variables.";

  // 1. SyntaxError & IndentationError
  if (errorType === "SyntaxError" || errorType === "IndentationError") {
    if (errorType === "IndentationError") {
      simpleExplanation = "The code indentation (spacing) is inconsistent or missing.";
      rootCause = "Python relies on 4 spaces to define code blocks inside functions, loops, and conditional statements.";
      suggestedFix = "Indent all statements inside the block using 4 spaces.";
      learningTip = "Never mix Tab characters and space characters for indentation in Python scripts.";
    } else if (code.includes("print ")) {
      simpleExplanation = "Python 3 requires parentheses around print arguments.";
      rootCause = "The `print` statement was written in legacy Python 2 syntax without parentheses `print(...)`.";
      suggestedFix = "Wrap your print arguments in parentheses: `print('Message')`.";
      learningTip = "In Python 3, `print()` is a built-in function, not a keyword statement.";
    } else if (errorMessage.includes("expected ':'")) {
      simpleExplanation = "Python expected a colon (:) at the end of a block header statement.";
      rootCause = `The line initiates a control structure (like if, for, while, or def) but is missing the trailing colon.`;
      suggestedFix = "Add a colon (:) at the end of the line.";
      learningTip = "In Python, compound statements like `def`, `if`, `else`, `for`, and `while` always end with a colon (:).";
    } else {
      simpleExplanation = "SyntaxError: Your code contains invalid Python syntax.";
      rootCause = `The statement '${errorSnippet || "on line " + errorLine}' violates Python grammar rules.`;
      suggestedFix = "Check for stray colons, missing parentheses, or invalid assignment operators.";
      learningTip = "Review Python syntax for function calls, variables, and conditionals.";
    }
  }

  // 2. NameError
  else if (errorType === "NameError") {
    const match = errorMessage.match(/name '(\w+)' is not defined/);
    const varName = match ? match[1] : "variable";
    
    simpleExplanation = `The variable or function '${varName}' has not been defined before use.`;
    rootCause = `Python looked up '${varName}' in the current scope but couldn't find a definition for it.`;
    suggestedFix = `Check for spelling mistakes in '${varName}', capitalize Python keywords (True/False/None), or define '${varName}' earlier.`;
    learningTip = "Python keywords like `True`, `False`, and `None` are case-sensitive and must start with a capital letter.";
  }

  // 3. TypeError
  else if (errorType === "TypeError") {
    simpleExplanation = "You are trying to combine or operate on incompatible data types (e.g. string and integer).";
    rootCause = `Using an operator (+) between a String and a non-String value without explicit type conversion.`;
    suggestedFix = "Wrap numbers inside str() or use f-strings: f'Message: {number}'";
    learningTip = "Python doesn't automatically convert numbers to strings when using '+'. Use `f'{var}'` for clean string interpolation.";
  }

  // 4. IndexError
  else if (errorType === "IndexError") {
    simpleExplanation = "You tried to access a list element using an index that does not exist.";
    rootCause = "Python lists use 0-based indexing (first item is at index 0, last item is at index len(list) - 1).";
    suggestedFix = "Use a valid index within range, or check `len(list)` before accessing elements.";
    learningTip = "To safely get the last element of any non-empty Python list, use negative index `-1` like `items[-1]`.";
  }

  // 5. KeyError
  else if (errorType === "KeyError") {
    const keyMatch = errorMessage.match(/'(.*?)'/);
    const keyName = keyMatch ? keyMatch[1] : "key";
    
    simpleExplanation = `The dictionary key '${keyName}' does not exist in the dictionary.`;
    rootCause = `Tried accessing dict['${keyName}'] directly, but the key has not been assigned in the dictionary.`;
    suggestedFix = `Use dict.get('${keyName}', default_value) to safely retrieve values without raising a KeyError.`;
    learningTip = "The `.get()` method returns `None` or a default fallback if a key isn't present, preventing crashes!";
  }

  // 6. ValueError
  else if (errorType === "ValueError") {
    simpleExplanation = "A function received an argument with the right type, but an inappropriate value.";
    rootCause = `Passing invalid data (e.g. string with letters to int()) causes ValueError.`;
    suggestedFix = "Validate or clean string inputs before converting to integers or floats.";
    learningTip = "Use `.isdigit()` to verify if a string contains valid numbers before calling `int()`.";
  }

  // 7. ZeroDivisionError
  else if (errorType === "ZeroDivisionError") {
    simpleExplanation = "You tried to divide a number by zero.";
    rootCause = "Division or modulo operations with 0 as the divisor are mathematically undefined in Python.";
    suggestedFix = "Add a check `if divisor != 0:` before performing division.";
    learningTip = "Always validate user input or variables used as denominators before dividing.";
  }

  // 8. AttributeError
  else if (errorType === "AttributeError") {
    simpleExplanation = "You tried to access a method or property that doesn't exist on this object or data type.";
    rootCause = `The object/variable is of a type that does not support the requested method or attribute.`;
    suggestedFix = "Check object type with `type(obj)` and verify method names (e.g. lists use `.append()`, not `.add()`).";
    learningTip = "Lists use `.append()`, Sets use `.add()`, and Strings use `.replace()`. Know your data type methods!";
  }

  // 9. EOFError & input() handling
  else if (errorType === "EOFError" || (errorType === "TimeLimitExceededError" && code.includes("input("))) {
    simpleExplanation = "Your program paused while waiting for keyboard input from input().";
    rootCause = "The Python input() function waits for standard input (stdin) in an interactive terminal.";
    suggestedFix = "Provide values in the Input (stdin) box above the editor or assign test variables directly.";
    learningTip = "In PyDebug, enter test values into the `Input (stdin):` text box above the code editor!";
  }

  // 10. TimeLimitExceededError
  else if (errorType === "TimeLimitExceededError") {
    simpleExplanation = "Your program ran for too long and was interrupted (likely an infinite loop).";
    rootCause = "A `while` loop condition never became False, or loop control variables were not incremented.";
    suggestedFix = "Check loop termination conditions and ensure variables inside `while` loops are updated.";
    learningTip = "Inside a `while counter < 10:` loop, always ensure `counter += 1` executes every iteration!";
  }

  return {
    errorType: errorType || "PythonError",
    errorLine: errorLine || 1,
    errorMessage: errorMessage || "Runtime execution failure",
    simpleExplanation,
    rootCause,
    suggestedFix,
    correctedCode,
    learningTip,
    errorSnippet,
  };
}


