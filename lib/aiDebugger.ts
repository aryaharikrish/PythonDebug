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

/**
 * Analyzes Python code errors using intelligent pattern recognition and structural fix rules
 */
export function analyzePythonError(
  code: string,
  executionResult: ExecutionResult
): AIDebugAnalysis {
  const { errorType, errorMessage, errorLine, errorSnippet, traceback } = executionResult;
  const lines = code.split("\n");

  // Fallback defaults if no specific error matched
  let simpleExplanation = "An error occurred while executing your Python code.";
  let rootCause = "The Python interpreter encountered an unexpected statement or runtime condition.";
  let suggestedFix = "Review the line highlighted in the error traceback and check for typos or incorrect logic.";
  let correctedCode = code;
  let learningTip = "Always test your code with small inputs and use print() statements or debuggers to inspect variables.";

  // 1. SyntaxError & IndentationError
  if (errorType === "SyntaxError" || errorType === "IndentationError") {
    if (errorMessage.includes("expected ':'") || (errorSnippet && !errorSnippet.endsWith(":"))) {
      simpleExplanation = "Python expected a colon (:) at the end of a block header statement.";
      rootCause = `The line '${errorSnippet || ""}' initiates a control structure (like if, for, while, or def) but is missing the trailing colon.`;
      suggestedFix = "Add a colon (:) at the end of the line.";
      learningTip = "In Python, compound statements like `def`, `if`, `else`, `for`, and `while` always end with a colon (:).";
      
      if (errorLine && errorLine <= lines.length) {
        const fixedLines = [...lines];
        fixedLines[errorLine - 1] = fixedLines[errorLine - 1].trimEnd() + ":";
        correctedCode = fixedLines.join("\n");
      }
    } else if (errorMessage.includes("unmatched") || errorMessage.includes("was never closed")) {
      simpleExplanation = "You have an unclosed bracket, parenthesis, or quote in your code.";
      rootCause = "Python reached the end of the line or file without finding the matching closing character `)`, `]`, `}`, `'`, or `\"`.";
      suggestedFix = "Ensure every opening parenthesis or bracket has a corresponding closing partner.";
      learningTip = "Check parenthesis balance in nested function calls like `print(len(items))`";
    } else if (errorType === "IndentationError") {
      simpleExplanation = "The code indentation (spacing) is inconsistent or missing.";
      rootCause = "Python relies on 4 spaces to define code blocks inside functions, loops, and conditional statements.";
      suggestedFix = "Indent all statements inside the block using 4 spaces.";
      learningTip = "Never mix Tab characters and space characters for indentation in Python scripts.";
      
      if (errorLine && errorLine <= lines.length) {
        const fixedLines = [...lines];
        fixedLines[errorLine - 1] = "    " + fixedLines[errorLine - 1].trimStart();
        correctedCode = fixedLines.join("\n");
      }
    }
  }

  // 2. NameError
  else if (errorType === "NameError") {
    const match = errorMessage.match(/name '(\w+)' is not defined/);
    const varName = match ? match[1] : "variable";
    
    simpleExplanation = `The variable or function '${varName}' has not been defined before use.`;
    rootCause = `Python looked up '${varName}' in the current scope but couldn't find a definition for it.`;
    suggestedFix = `Check for spelling mistakes in '${varName}' or define '${varName}' earlier in your program.`;
    learningTip = "Python variable names are case-sensitive! `myVariable` and `myvariable` are treated as two different variables.";

    // Attempt smart typo correction (e.g. prnt -> print, or user_result -> result)
    if (varName === "prnt" || varName === "prin" || varName === "prntt") {
      correctedCode = code.replace(new RegExp(`\\b${varName}\\b`, "g"), "print");
      suggestedFix = "Fix the typo: replace 'prnt' with built-in function 'print'.";
    } else if (errorSnippet && errorLine) {
      const fixedLines = [...lines];
      fixedLines[errorLine - 1] = `# Define ${varName} before accessing it\n${varName} = 0\n` + fixedLines[errorLine - 1];
      correctedCode = fixedLines.join("\n");
    }
  }

  // 3. TypeError
  else if (errorType === "TypeError") {
    if (errorMessage.includes("can only concatenate str") || errorMessage.includes("unsupported operand type")) {
      simpleExplanation = "You are trying to combine or operate on incompatible data types (e.g. string and integer).";
      rootCause = `The line '${errorSnippet || ""}' uses an operator (+) between a String and a non-String value without explicit type conversion.`;
      suggestedFix = "Wrap the number inside str() or use f-strings: f'Message: {number}'";
      learningTip = "Python doesn't automatically convert numbers to strings when using '+'. Use `f'{var}'` for clean string interpolation.";
      
      if (errorSnippet && errorLine && errorLine <= lines.length) {
        const fixedLines = [...lines];
        // Convert 'text' + num to f-string or str(num)
        const lineContent = fixedLines[errorLine - 1];
        if (lineContent.includes(" + ")) {
          const parts = lineContent.split("+");
          fixedLines[errorLine - 1] = lineContent.replace(/\+\s*([a-zA-Z0-9_]+)/, "+ str($1)");
          correctedCode = fixedLines.join("\n");
        }
      }
    } else if (errorMessage.includes("takes") && errorMessage.includes("positional argument")) {
      simpleExplanation = "The function call passed a different number of arguments than expected by the function definition.";
      rootCause = "Function signature expects parameters that were not provided in the call.";
      suggestedFix = "Pass all required parameters when calling the function, or provide default parameter values in the definition.";
      learningTip = "Optional function parameters should be given default values like `def greet(name, msg='Hello'):`";
    }
  }

  // 4. IndexError
  else if (errorType === "IndexError") {
    simpleExplanation = "You tried to access a list element using an index that does not exist.";
    rootCause = "Python lists use 0-based indexing (first item is at index 0, last item is at index len(list) - 1).";
    suggestedFix = "Use a valid index within range, or check `len(list)` before accessing elements.";
    learningTip = "To safely get the last element of any non-empty Python list, use negative index `-1` like `items[-1]`.";

    if (errorSnippet && errorLine && errorLine <= lines.length) {
      const fixedLines = [...lines];
      const matchIndex = errorSnippet.match(/\[(\d+)\]/);
      if (matchIndex) {
        const invalidIdx = matchIndex[1];
        fixedLines[errorLine - 1] = fixedLines[errorLine - 1].replace(`[${invalidIdx}]`, "[len(numbers)-1 if len(numbers)>0 else 0]");
        correctedCode = fixedLines.join("\n");
      }
    }
  }

  // 5. KeyError
  else if (errorType === "KeyError") {
    const keyMatch = errorMessage.match(/'(.*?)'/);
    const keyName = keyMatch ? keyMatch[1] : "key";
    
    simpleExplanation = `The dictionary key '${keyName}' does not exist in the dictionary.`;
    rootCause = `Tried accessing dict['${keyName}'] directly, but the key has not been assigned in the dictionary.`;
    suggestedFix = `Use dict.get('${keyName}', default_value) to safely retrieve values without raising a KeyError.`;
    learningTip = "The `.get()` method returns `None` or a default fallback if a key isn't present, preventing crashes!";

    if (errorSnippet && errorLine && errorLine <= lines.length) {
      const fixedLines = [...lines];
      fixedLines[errorLine - 1] = fixedLines[errorLine - 1].replace(
        new RegExp(`\\[(['"])${keyName}\\1\\]`),
        `.get('${keyName}', 'Default Value')`
      );
      correctedCode = fixedLines.join("\n");
    }
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
    
    if (errorSnippet && errorLine && errorLine <= lines.length) {
      const fixedLines = [...lines];
      fixedLines[errorLine - 1] = `# Added zero check\ndenominator = 1 # Avoid division by zero\n` + fixedLines[errorLine - 1];
      correctedCode = fixedLines.join("\n");
    }
  }

  // 8. AttributeError
  else if (errorType === "AttributeError") {
    simpleExplanation = "You tried to access a method or property that doesn't exist on this object or data type.";
    rootCause = `The object/variable is of a type that does not support the requested method or attribute.`;
    suggestedFix = "Check object type with `type(obj)` and verify the correct method name (e.g., lists use `.append()`, not `.add()`).";
    learningTip = "Lists use `.append()`, Sets use `.add()`, and Strings use `.replace()`. Know your data type methods!";
  }

  // 9. TimeLimitExceededError
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
    correctedCode: correctedCode || code,
    learningTip,
    errorSnippet,
  };
}
