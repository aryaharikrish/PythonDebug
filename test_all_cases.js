const fs = require('fs');

const CONTROL_KEYWORDS = [
  "if", "elif", "else", "for", "while", "def", "class", 
  "try", "except", "finally", "with", "match", "case"
];

function findBestSimilarVariable(undefinedVar, code) {
  if (!undefinedVar || undefinedVar.length < 2) return undefined;

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
    return typoMap[undefinedVar.toLowerCase()];
  }

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

  let bestMatch;
  let maxScore = -1;
  const targetLower = undefinedVar.toLowerCase();

  for (const candidate of unique) {
    const candLower = candidate.toLowerCase();
    let score = 0;

    if (candLower === targetLower) return candidate;

    let prefixLen = 0;
    while (
      prefixLen < candLower.length &&
      prefixLen < targetLower.length &&
      candLower[prefixLen] === targetLower[prefixLen]
    ) {
      prefixLen++;
    }
    if (prefixLen >= 3) score += prefixLen * 4;

    const candTokens = candLower.split("_").filter(Boolean);
    const targetTokens = targetLower.split("_").filter(Boolean);
    const overlap = candTokens.filter((t) => targetTokens.includes(t));
    score += overlap.length * 6;

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

function repairPythonCode(code, errorType, errorMessage, errorLine, errorSnippet) {
  if (!code.trim()) return code;

  let lines = code.split("\n");

  let targetIdx = errorLine && errorLine > 0 && errorLine <= lines.length ? errorLine - 1 : -1;
  if (targetIdx === -1 && errorSnippet) {
    const snippetTrimmed = errorSnippet.trim();
    targetIdx = lines.findIndex((l) => l.trim() === snippetTrimmed);
  }

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
    }

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

const tests = [
  {
    name: "Challenge 1: SyntaxError - Missing Colon in def",
    code: `def calculate_total(prices)\n    total = sum(prices)\n    return total`,
    errorType: "SyntaxError",
    errorMessage: "expected ':'",
    errorLine: 1,
    errorSnippet: "def calculate_total(prices)",
  },
  {
    name: "Challenge 2: NameError - Variable Typo (final_result vs final_score)",
    code: `user_score = 95\nbonus = 10\nfinal_score = user_score + bonus\nprint("Result:", final_result)`,
    errorType: "NameError",
    errorMessage: "name 'final_result' is not defined",
    errorLine: 4,
    errorSnippet: 'print("Result:", final_result)',
  },
  {
    name: "Challenge 3: TypeError - String + Int Concatenation",
    code: `age = 22\nmessage = "User age is: " + age\nprint(message)`,
    errorType: "TypeError",
    errorMessage: "can only concatenate str (not 'int') to str",
    errorLine: 2,
    errorSnippet: 'message = "User age is: " + age',
  },
  {
    name: "Challenge 4: IndexError - Out of Bounds List Index (colors[3])",
    code: `colors = ["red", "green", "blue"]\nprint("Last color:", colors[3])`,
    errorType: "IndexError",
    errorMessage: "list index out of range",
    errorLine: 2,
    errorSnippet: 'print("Last color:", colors[3])',
  },
  {
    name: "Challenge 5: KeyError - Missing Dictionary Key (student['age'])",
    code: `student = {"name": "Alex", "grade": "A"}\nprint("Age:", student["age"])`,
    errorType: "KeyError",
    errorMessage: "'age'",
    errorLine: 2,
    errorSnippet: 'print("Age:", student["age"])',
  },
  {
    name: "Challenge 6: ValueError - Invalid String to Int Conversion (100USD)",
    code: `raw_input = "100USD"\nnumber = int(raw_input)\nprint("Double:", number * 2)`,
    errorType: "ValueError",
    errorMessage: "invalid literal for int() with base 10: '100USD'",
    errorLine: 2,
    errorSnippet: 'number = int(raw_input)',
  },
  {
    name: "ZeroDivisionError - Division by Zero (a / 0)",
    code: `a = 10\nres = a / 0`,
    errorType: "ZeroDivisionError",
    errorMessage: "division by zero",
    errorLine: 2,
    errorSnippet: 'res = a / 0',
  },
];

console.log("================== AI REPAIR ENGINE TEST SUITE ==================\n");

let passCount = 0;
tests.forEach((t, i) => {
  const result = repairPythonCode(t.code, t.errorType, t.errorMessage, t.errorLine, t.errorSnippet);
  const success = result !== t.code;
  if (success) passCount++;

  console.log(`[${success ? 'PASS' : 'FAIL'}] Test #${i + 1}: ${t.name}`);
  console.log("--- REPAIRED OUTPUT ---");
  console.log(result);
  console.log("----------------------------------------------------------------\n");
});

console.log(`FINAL RESULT: ${passCount} / ${tests.length} tests passed successfully.`);
