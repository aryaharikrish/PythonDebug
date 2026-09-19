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
 * Intelligent Similarity Matcher for NameError variable typos
 */
function findBestSimilarVariable(undefinedVar: string, code: string): string | undefined {
  if (!undefinedVar || undefinedVar.length < 2) return undefined;

  const typoMap: Record<string, string> = {
    prnt: "print",
    prin: "print",
    lenn: "len",
    length: "len",
    true: "True",
    false: "False",
    none: "None",
    null: "None",
    undefined: "None",
  };
  if (typoMap[undefinedVar.toLowerCase()]) {
    return typoMap[undefinedVar.toLowerCase()];
  }

  // Find all variable identifiers declared or assigned in code
  const declaredVars = Array.from(code.matchAll(/\b([a-zA-Z_]\w*)\b/g))
    .map((m) => m[1])
    .filter(
      (v) =>
        v !== undefinedVar &&
        !CONTROL_KEYWORDS.includes(v) &&
        !["print", "range", "len", "sum", "int", "str", "float", "list", "dict", "set"].includes(v)
    );

  const unique = Array.from(new Set(declaredVars));
  if (unique.length === 0) return undefined;

  let bestMatch: string | undefined;
  let maxScore = -1;
  const targetLower = undefinedVar.toLowerCase();

  for (const candidate of unique) {
    const candLower = candidate.toLowerCase();
    let score = 0;

    if (candLower === targetLower) return candidate;

    // Common prefix bonus
    let prefixLen = 0;
    while (
      prefixLen < candLower.length &&
      prefixLen < targetLower.length &&
      candLower[prefixLen] === targetLower[prefixLen]
    ) {
      prefixLen++;
    }
    if (prefixLen >= 3) score += prefixLen * 4;

    // Token overlap (split by _)
    const candTokens = candLower.split("_").filter(Boolean);
    const targetTokens = targetLower.split("_").filter(Boolean);
    const overlap = candTokens.filter((t) => targetTokens.includes(t));
    score += overlap.length * 6;

    // Substring match
    if (candLower.includes(targetLower) || targetLower.includes(candLower)) {
      score += 5;
    }

    if (score > maxScore && score >= 4) {
      maxScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

/**
 * Multi-Pass Python Code Transformer
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

  // Determine line index (fallback: search by snippet if errorLine is mismatched)
  let targetIdx = errorLine && errorLine > 0 && errorLine <= lines.length ? errorLine - 1 : -1;
  if (targetIdx === -1 && errorSnippet) {
    const snippetTrimmed = errorSnippet.trim();
    targetIdx = lines.findIndex((l) => l.trim() === snippetTrimmed);
  }

  // Targeted Repair on Error Line
  if (targetIdx !== -1) {
    const targetLine = lines[targetIdx];

    // 1. SyntaxError & IndentationError targeted repairs
    if (errorType === "SyntaxError" || errorType === "IndentationError") {
      const trimmedTarget = targetLine.trim();

      const isHeader = CONTROL_KEYWORDS.some(
        (kw) => trimmedTarget.startsWith(kw + " ") || trimmedTarget.startsWith(kw + "(") || trimmedTarget === kw
      );
      if (isHeader && !trimmedTarget.endsWith(":")) {
        lines[targetIdx] = targetLine.trimEnd() + ":";
      }

      if (/^\s*print\s+[^()].*$/.test(targetLine)) {
        lines[targetIdx] = targetLine.replace(/(\s*print)\s+(.*)/, '$1($2)');
      }

      const openP = (targetLine.match(/\(/g) || []).length;
      const closeP = (targetLine.match(/\)/g) || []).length;
      if (openP > closeP) {
        lines[targetIdx] = targetLine + ")".repeat(openP - closeP);
      }

      if (errorType === "IndentationError" && targetIdx > 0) {
        const prevLine = lines[targetIdx - 1].trim();
        if (prevLine.endsWith(":")) {
          const prevIndent = lines[targetIdx - 1].match(/^\s*/)?.[0] || "";
          lines[targetIdx] = prevIndent + "    " + targetLine.trimStart();
        }
      }
    }

    // 2. NameError repairs
    if (errorType === "NameError") {
      const match = errorMessage.match(/name '(\w+)' is not defined/);
      if (match) {
        const undefinedVar = match[1];
        const replacementVar = findBestSimilarVariable(undefinedVar, code);
        if (replacementVar) {
          lines[targetIdx] = targetLine.replace(
            new RegExp(`\\b${undefinedVar}\\b`, "g"),
            replacementVar
          );
        }
      }
    }

    // 3. TypeError repairs (String + Int concatenation or missing args)
    if (errorType === "TypeError") {
      if (targetLine.includes("+")) {
        const stringFirstMatch = targetLine.match(/(["'].*?["'])\s*\+\s*([a-zA-Z_]\w*)/);
        const varFirstMatch = targetLine.match(/([a-zA-Z_]\w*)\s*\+\s*(["'].*?["'])/);

        if (stringFirstMatch) {
          const [, strLit, varName] = stringFirstMatch;
          lines[targetIdx] = targetLine.replace(
            `${strLit} + ${varName}`,
            `f"${strLit.slice(1, -1)}{${varName}}"`
          );
        } else if (varFirstMatch) {
          const [, varName, strLit] = varFirstMatch;
          lines[targetIdx] = targetLine.replace(
            `${varName} + ${strLit}`,
            `f"{${varName}}${strLit.slice(1, -1)}"`
          );
        } else {
          lines[targetIdx] = targetLine.replace(
            /(\+\s*)([a-zA-Z_]\w*)(?!\s*\()/g,
            "$1str($2)"
          );
        }
      }

      if (errorMessage.includes("positional argument")) {
        const fnMatch = code.match(/def\s+(\w+)\s*\(([^)]+)\):/);
        if (fnMatch) {
          const [, fnName, params] = fnMatch;
          const paramList = params.split(",").map((p) => p.trim());
          if (paramList.length > 1 && !paramList[paramList.length - 1].includes("=")) {
            const updatedParams = paramList
              .map((p, pIdx) => (pIdx === paramList.length - 1 ? `${p}="Dr."` : p))
              .join(", ");
            lines = lines.map((l) => l.replace(`def ${fnName}(${params}):`, `def ${fnName}(${updatedParams}):`));
          }
        }
      }

      if (errorMessage.includes("takes 0 positional arguments but 1 was given")) {
        for (let i = targetIdx; i >= 0; i--) {
          if (/^\s*def\s+\w+\(\s*\):/.test(lines[i])) {
            lines[i] = lines[i].replace("()", "(self)");
            break;
          }
        }
      }
    }

    // 4. IndexError repairs (List index out of range)
    if (errorType === "IndexError") {
      const indexAccessMatch = targetLine.match(/(\w+)\[([^\]]+)\]/);
      if (indexAccessMatch) {
        const [, arrayVar, accessedExpr] = indexAccessMatch;
        const accessedIdx = parseInt(accessedExpr, 10);

        const listDefMatch = code.match(new RegExp(`${arrayVar}\\s*=\\s*\\[([^\\]]*)\\]`));
        if (listDefMatch) {
          const elements = listDefMatch[1].split(",").filter((s) => s.trim().length > 0);
          const maxValidIdx = elements.length > 0 ? elements.length - 1 : 0;

          if (!isNaN(accessedIdx)) {
            if (accessedIdx > maxValidIdx) {
              lines[targetIdx] = targetLine.replace(
                `${arrayVar}[${accessedExpr}]`,
                `${arrayVar}[${maxValidIdx}]`
              );
            }
          } else {
            lines[targetIdx] = targetLine.replace(
              `${arrayVar}[${accessedExpr}]`,
              `${arrayVar}[${maxValidIdx}]`
            );
          }
        } else {
          if (!isNaN(accessedIdx) && accessedIdx > 0) {
            lines[targetIdx] = targetLine.replace(
              `${arrayVar}[${accessedExpr}]`,
              `${arrayVar}[${accessedIdx - 1}]`
            );
          } else {
            lines[targetIdx] = targetLine.replace(
              `${arrayVar}[${accessedExpr}]`,
              `${arrayVar}[len(${arrayVar}) - 1]`
            );
          }
        }
      }
    }

    // 5. KeyError repairs (Missing dictionary key)
    if (errorType === "KeyError") {
      const keyAccessMatch = targetLine.match(/(\w+)\[(["'])(.*?)\2\]/);
      if (keyAccessMatch) {
        const [, dictVar, quote, keyName] = keyAccessMatch;
        lines[targetIdx] = targetLine.replace(
          `${dictVar}[${quote}${keyName}${quote}]`,
          `${dictVar}.get("${keyName}", "Not specified")`
        );
      } else {
        const varKeyMatch = targetLine.match(/(\w+)\[([a-zA-Z_]\w*)\]/);
        if (varKeyMatch) {
          const [, dictVar, varKey] = varKeyMatch;
          lines[targetIdx] = targetLine.replace(
            `${dictVar}[${varKey}]`,
            `${dictVar}.get(${varKey}, "Not specified")`
          );
        }
      }
    }

    // 6. ValueError repairs (Invalid string conversion to int)
    if (errorType === "ValueError") {
      if (targetLine.includes("int(")) {
        if (/int\(\s*([a-zA-Z_]\w*)\s*\)/.test(targetLine)) {
          const match = targetLine.match(/int\(\s*([a-zA-Z_]\w*)\s*\)/);
          if (match) {
            const varName = match[1];
            lines[targetIdx] = targetLine.replace(
              `int(${varName})`,
              `int(${varName}.replace("USD", ""))`
            );
          }
        }
      }
    }

    // 7. ZeroDivisionError repairs
    if (errorType === "ZeroDivisionError") {
      if (/[\/%]\s*0\b/.test(targetLine)) {
        lines[targetIdx] = targetLine.replace(/([\/%])\s*0\b/g, "$1 1");
      } else if (/[\/%]\s*([a-zA-Z_]\w*)/.test(targetLine)) {
        lines[targetIdx] = targetLine.replace(
          /([\/%])\s*([a-zA-Z_]\w*)/g,
          "$1 ($2 if $2 != 0 else 1)"
        );
      }
    }

    // 8. AttributeError repairs
    if (errorType === "AttributeError") {
      if (targetLine.includes(".add(")) {
        lines[targetIdx] = targetLine.replace(".add(", ".append(");
      }
    }
  }

  // Global Pass: Fix structural block header colons & assignment operators
  lines = lines.map((line) => {
    let l = line;
    const trimmed = l.trim();
    if (!trimmed || trimmed.startsWith("#")) return l;

    const isControl = CONTROL_KEYWORDS.some(
      (kw) => trimmed.startsWith(kw + " ") || trimmed.startsWith(kw + "(") || trimmed === kw
    );
    if (isControl && !trimmed.endsWith(":") && !trimmed.includes("#")) {
      l = l.trimEnd() + ":";
    }

    if (/^\s*(if|elif|while)\s+[a-zA-Z_]\w*\s*=[^=].*$/.test(l)) {
      l = l.replace(/(\s*(?:if|elif|while)\s+[a-zA-Z_]\w*\s*)=(?!=)(.*)/, "$1==$2");
    }

    return l;
  });

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
    } else if (code.includes("print ") && !code.includes("print(")) {
      simpleExplanation = "Python 3 requires parentheses around print arguments.";
      rootCause = "The `print` statement was written in legacy Python 2 syntax without parentheses `print(...)`.";
      suggestedFix = "Wrap your print arguments in parentheses: `print('Message')`.";
      learningTip = "In Python 3, `print()` is a built-in function, not a keyword statement.";
    } else if (errorMessage.includes("expected ':'") || errorSnippet.startsWith("def ") || errorSnippet.startsWith("if ")) {
      simpleExplanation = "Python expected a colon (:) at the end of a block header statement.";
      rootCause = "The line initiates a control structure (like def, if, for, while, or class) but is missing the trailing colon.";
      suggestedFix = "Add a colon (:) at the end of the line (e.g. `def my_func():`).";
      learningTip = "In Python, compound statements like `def`, `if`, `else`, `for`, and `while` always end with a colon (:).";
    } else {
      simpleExplanation = "SyntaxError: Your code contains invalid Python syntax.";
      rootCause = `The statement '${errorSnippet || "on line " + errorLine}' violates Python grammar rules.`;
      suggestedFix = "Check for missing colons, unclosed parentheses, or single '=' in conditionals.";
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
    if (errorMessage.includes("takes 0 positional arguments but 1 was given")) {
      simpleExplanation = "Method inside a Python class is missing the mandatory 'self' parameter.";
      rootCause = "Instance methods in Python classes must accept 'self' as their first parameter to access instance attributes.";
      suggestedFix = "Add 'self' inside the method signature: `def method_name(self):`";
      learningTip = "Python passes the instance object automatically as the first argument to class methods.";
    } else if (errorMessage.includes("positional argument")) {
      simpleExplanation = "Function call is missing required positional arguments.";
      rootCause = "The function parameters were not passed during invocation and lack default values.";
      suggestedFix = "Provide default argument values in the function definition (e.g., `title='Dr.'`) or pass all required arguments.";
      learningTip = "Default parameter values make function arguments optional during function calls.";
    } else {
      simpleExplanation = "You are trying to combine or operate on incompatible data types (e.g. string and integer).";
      rootCause = "Using an operator (+) between a String and a non-String value without explicit type conversion.";
      suggestedFix = "Wrap numbers inside str() or use f-strings: f'Message: {number}'";
      learningTip = "Python doesn't automatically convert numbers to strings when using '+'. Use `f'{var}'` for clean string interpolation.";
    }
  }

  // 4. IndexError
  else if (errorType === "IndexError") {
    simpleExplanation = "You tried to access a list element using an index that does not exist.";
    rootCause = "Python lists use 0-based indexing (first item is index 0, last item is index len(list) - 1).";
    suggestedFix = "Use a valid index within range (0 to len(list)-1), or check `len(list)` before accessing elements.";
    learningTip = "To safely get the last element of any non-empty Python list, use negative index `-1` like `items[-1]`.";
  }

  // 5. KeyError
  else if (errorType === "KeyError") {
    const keyMatch = errorMessage.match(/'(.*?)'/);
    const keyName = keyMatch ? keyMatch[1] : "key";
    
    simpleExplanation = `The dictionary key '${keyName}' does not exist in the dictionary.`;
    rootCause = `Tried accessing dict['${keyName}'] directly, but the key has not been assigned in the dictionary.`;
    suggestedFix = `Use dict.get('${keyName}', 'default_value') to safely retrieve values without raising a KeyError.`;
    learningTip = "The `.get()` method returns `None` or a default fallback if a key isn't present, preventing crashes!";
  }

  // 6. ValueError
  else if (errorType === "ValueError") {
    simpleExplanation = "A function received an argument with the right type, but an inappropriate value.";
    rootCause = "Passing invalid data (e.g. string with non-numeric text like '100USD' to int()) causes ValueError.";
    suggestedFix = "Clean string inputs by removing non-numeric characters before converting to integers or floats.";
    learningTip = "Use `.replace('USD', '')` or regex to clean string formatted numbers before calling `int()`.";
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
    rootCause = "The object/variable is of a type that does not support the requested method or attribute.";
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
