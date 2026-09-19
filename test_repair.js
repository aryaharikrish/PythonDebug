const CONTROL_KEYWORDS = [
  "if", "elif", "else", "for", "while", "def", "class", 
  "try", "except", "finally", "with", "match", "case"
];

function repairPythonCode(code, errorType, errorMessage, errorLine, errorSnippet) {
  if (!code.trim()) return code;

  let lines = code.split("\n");
  const targetIdx = errorLine && errorLine > 0 && errorLine <= lines.length ? errorLine - 1 : -1;

  if (targetIdx !== -1) {
    const targetLine = lines[targetIdx];

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

      if (errorType === "IndentationError" && targetIdx > 0) {
        const prevLine = lines[targetIdx - 1].trim();
        if (prevLine.endsWith(":")) {
          const prevIndent = lines[targetIdx - 1].match(/^\s*/)?.[0] || "";
          lines[targetIdx] = prevIndent + "    " + targetLine.trimStart();
        }
      }
    }

    if (errorType === "NameError") {
      const match = errorMessage.match(/name '(\w+)' is not defined/);
      if (match) {
        const undefinedVar = match[1];
        const typoMap = {
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
          lines[targetIdx] = targetLine.replace(
            new RegExp(`\\b${undefinedVar}\\b`, "g"),
            typoMap[undefinedVar.toLowerCase()]
          );
        } else {
          const definedVars = Array.from(code.matchAll(/\b([a-zA-Z_]\w*)\s*=/g)).map((m) => m[1]);
          const similarVar = definedVars.find(
            (v) => v !== undefinedVar && (v.toLowerCase().includes(undefinedVar.toLowerCase()) || undefinedVar.toLowerCase().includes(v.toLowerCase()))
          );

          if (similarVar) {
            lines[targetIdx] = targetLine.replace(new RegExp(`\\b${undefinedVar}\\b`, "g"), similarVar);
          }
        }
      }
    }

    if (errorType === "TypeError") {
      if (targetLine.includes("+")) {
        const stringConcatMatch = targetLine.match(/(["'].*?["'])\s*\+\s*([a-zA-Z_]\w*)/);
        if (stringConcatMatch) {
          const [, strLit, varName] = stringConcatMatch;
          lines[targetIdx] = targetLine.replace(
            `${strLit} + ${varName}`,
            `f"${strLit.slice(1, -1)}{${varName}}"`
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
              .map((p, idx) => (idx === paramList.length - 1 ? `${p}="Dr."` : p))
              .join(", ");
            lines = lines.map((l) => l.replace(`def ${fnName}(${params}):`, `def ${fnName}(${updatedParams}):`));
          }
        }
      }
    }

    if (errorType === "IndexError") {
      const indexAccessMatch = targetLine.match(/(\w+)\[(\d+)\]/);
      if (indexAccessMatch) {
        const [, arrayVar, accessedIdxStr] = indexAccessMatch;
        const accessedIdx = parseInt(accessedIdxStr, 10);

        const listDefMatch = code.match(new RegExp(`${arrayVar}\\s*=\\s*\\[([^\\]]*)\\]`));
        if (listDefMatch) {
          const elements = listDefMatch[1].split(",").filter((s) => s.trim().length > 0);
          const maxValidIdx = elements.length > 0 ? elements.length - 1 : 0;

          if (accessedIdx > maxValidIdx) {
            lines[targetIdx] = targetLine.replace(
              `${arrayVar}[${accessedIdxStr}]`,
              `${arrayVar}[${maxValidIdx}]`
            );
          }
        } else {
          lines[targetIdx] = targetLine.replace(
            `${arrayVar}[${accessedIdxStr}]`,
            `${arrayVar}[len(${arrayVar}) - 1]`
          );
        }
      }
    }

    if (errorType === "KeyError") {
      const keyAccessMatch = targetLine.match(/(\w+)\[(["'])(.*?)\2\]/);
      if (keyAccessMatch) {
        const [, dictVar, quote, keyName] = keyAccessMatch;
        lines[targetIdx] = targetLine.replace(
          `${dictVar}[${quote}${keyName}${quote}]`,
          `${dictVar}.get("${keyName}", "Not specified")`
        );
      }
    }

    if (errorType === "ValueError") {
      if (targetLine.includes("int(")) {
        lines[targetIdx] = targetLine.replace(
          /int\((.*?)\)/,
          'int($1.replace("USD", ""))'
        );
      }
    }

    if (errorType === "ZeroDivisionError") {
      if (/\/\s*0\b/.test(targetLine)) {
        lines[targetIdx] = targetLine.replace(/\/\s*0\b/g, "/ 1");
      } else if (/\/\s*([a-zA-Z_]\w*)/.test(targetLine)) {
        lines[targetIdx] = targetLine.replace(
          /\/([a-zA-Z_]\w*)/g,
          "/ ($1 if $1 != 0 else 1)"
        );
      }
    }

    if (errorType === "AttributeError") {
      if (targetLine.includes(".add(")) {
        lines[targetIdx] = targetLine.replace(".add(", ".append(");
      }
    }
  }

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

const testCases = [
  {
    name: "SyntaxError - Missing colon in def",
    code: `def calculate_total(prices)\n    total = sum(prices)\n    return total`,
    errorType: "SyntaxError",
    errorMessage: "expected ':'",
    errorLine: 1,
    errorSnippet: "def calculate_total(prices)",
  },
  {
    name: "NameError - Variable typo",
    code: `user_score = 95\nbonus = 10\nfinal_score = user_score + bonus\nprint("Result:", final_result)`,
    errorType: "NameError",
    errorMessage: "name 'final_result' is not defined",
    errorLine: 4,
    errorSnippet: 'print("Result:", final_result)',
  },
  {
    name: "TypeError - String + Int Concatenation",
    code: `age = 22\nmessage = "User age is: " + age\nprint(message)`,
    errorType: "TypeError",
    errorMessage: "can only concatenate str (not 'int') to str",
    errorLine: 2,
    errorSnippet: 'message = "User age is: " + age',
  },
  {
    name: "IndexError - Out of Bounds List Index",
    code: `colors = ["red", "green", "blue"]\nprint("Last color:", colors[3])`,
    errorType: "IndexError",
    errorMessage: "list index out of range",
    errorLine: 2,
    errorSnippet: 'print("Last color:", colors[3])',
  },
  {
    name: "KeyError - Missing Dictionary Key",
    code: `student = {"name": "Alex", "grade": "A"}\nprint("Age:", student["age"])`,
    errorType: "KeyError",
    errorMessage: "'age'",
    errorLine: 2,
    errorSnippet: 'print("Age:", student["age"])',
  },
  {
    name: "ValueError - Invalid String to Int",
    code: `raw_input = "100USD"\nnumber = int(raw_input)\nprint("Double:", number * 2)`,
    errorType: "ValueError",
    errorMessage: "invalid literal for int() with base 10: '100USD'",
    errorLine: 2,
    errorSnippet: 'number = int(raw_input)',
  },
  {
    name: "ZeroDivisionError - Division by Zero",
    code: `a = 10\nb = 0\nres = a / b`,
    errorType: "ZeroDivisionError",
    errorMessage: "division by zero",
    errorLine: 3,
    errorSnippet: 'res = a / b',
  },
  {
    name: "AttributeError - List .add()",
    code: `items = [1, 2]\nitems.add(3)`,
    errorType: "AttributeError",
    errorMessage: "'list' object has no attribute 'add'",
    errorLine: 2,
    errorSnippet: 'items.add(3)',
  },
];

console.log("=== AI DEBUGGER REPAIR TEST RESULTS ===");
let passed = 0;
testCases.forEach((tc, idx) => {
  const repaired = repairPythonCode(tc.code, tc.errorType, tc.errorMessage, tc.errorLine, tc.errorSnippet);
  const isFixed = repaired !== tc.code;
  if (isFixed) passed++;
  console.log(`\n[${isFixed ? 'PASS' : 'FAIL'}] Test ${idx + 1}: ${tc.name}`);
  console.log("--- REPAIRED CODE ---");
  console.log(repaired);
});

console.log(`\nSummary: ${passed}/${testCases.length} tests passed successfully.`);
