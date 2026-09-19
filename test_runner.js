const fs = require('fs');

// Read aiDebugger.ts content and evaluate or test
const content = fs.readFileSync('./lib/aiDebugger.ts', 'utf8');

// Convert TS to JS by removing types
const jsContent = content
  .replace(/import .*/g, '')
  .replace(/export interface .*/g, '')
  .replace(/export function/g, 'function')
  .replace(/:\s*string/g, '')
  .replace(/:\s*number/g, '')
  .replace(/:\s*boolean/g, '')
  .replace(/:\s*ExecutionResult/g, '')
  .replace(/:\s*AIDebugAnalysis/g, '')
  .replace(/:\s*Record<string, string>/g, '')
  .replace(/:\s*any/g, '');

eval(jsContent);

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

console.log("=== AI DEBUGGER VERIFICATION RESULTS ===");
let passed = 0;
testCases.forEach((tc, idx) => {
  const repaired = repairPythonCode(tc.code, tc.errorType, tc.errorMessage, tc.errorLine, tc.errorSnippet);
  const isFixed = repaired !== tc.code;
  if (isFixed) passed++;
  console.log(`\n[${isFixed ? 'PASS' : 'FAIL'}] Test ${idx + 1}: ${tc.name}`);
  console.log("REPAIRED CODE:\n" + repaired);
});

console.log(`\nFinal Score: ${passed}/${testCases.length} tests passed.`);
