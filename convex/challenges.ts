import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all challenges, optionally filtered by category
export const list = query({
  args: { categorySlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.categorySlug) {
      return await ctx.db
        .query("challenges")
        .withIndex("by_category", (q) => q.eq("categorySlug", args.categorySlug!))
        .collect();
    }
    return await ctx.db.query("challenges").collect();
  },
});

// Get single challenge by ID
export const getById = query({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Seed challenges into database if empty
export const seedChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("challenges").first();
    if (existing) return { seeded: false, count: 0 };

    const initialChallenges = [
      {
        title: "Fix Missing Colon",
        category: "Syntax Errors",
        categorySlug: "syntax-errors",
        difficulty: "Beginner" as const,
        description: "The function definition is missing syntax punctuation required by Python grammar rules.",
        buggyCode: "def calculate_total(prices)\n    total = sum(prices)\n    return total\n\nprint(calculate_total([10, 20, 30]))",
        expectedOutput: "60",
        hint: "Python function definitions and control flows (if, def, for) must end with a colon (:).",
        solutionExplanation: "Added `:` at the end of `def calculate_total(prices):` to form valid Python syntax.",
        solutionCode: "def calculate_total(prices):\n    total = sum(prices)\n    return total\n\nprint(calculate_total([10, 20, 30]))",
        order: 1,
      },
      {
        title: "Undefined Variable Reference",
        category: "Name Errors",
        categorySlug: "name-errors",
        difficulty: "Beginner" as const,
        description: "The script tries to print a variable name that was misspelled or not defined in scope.",
        buggyCode: "user_score = 95\nbonus_points = 10\nfinal_result = user_score + bonus_points\nprint(final_score)",
        expectedOutput: "105",
        hint: "Check the variable name passed to `print()`. It should match `final_result`.",
        solutionExplanation: "The code tried to print `final_score` which was undefined. Renamed to `final_result`.",
        solutionCode: "user_score = 95\nbonus_points = 10\nfinal_result = user_score + bonus_points\nprint(final_result)",
        order: 2,
      },
      {
        title: "String & Integer Concatenation",
        category: "Type Errors",
        categorySlug: "type-errors",
        difficulty: "Beginner" as const,
        description: "Python cannot implicitly concatenate strings with integers using the + operator.",
        buggyCode: "age = 22\nmessage = 'User age is: ' + age\nprint(message)",
        expectedOutput: "User age is: 22",
        hint: "Convert `age` to string using `str(age)` or use an f-string `f'User age is: {age}'`.",
        solutionExplanation: "Converted integer `age` to `str(age)` or formatted using `f'User age is: {age}'`.",
        solutionCode: "age = 22\nmessage = f'User age is: {age}'\nprint(message)",
        order: 3,
      },
      {
        title: "List Index Out of Range",
        category: "Index Errors",
        categorySlug: "index-errors",
        difficulty: "Beginner" as const,
        description: "Attempting to access an index beyond the bounds of the list.",
        buggyCode: "colors = ['red', 'green', 'blue']\nprint('Last color:', colors[3])",
        expectedOutput: "Last color: blue",
        hint: "Python lists are 0-indexed. A list of 3 items has valid indices 0, 1, and 2, or negative index -1.",
        solutionExplanation: "Changed index 3 to 2 or -1 to safely access the last item in the list.",
        solutionCode: "colors = ['red', 'green', 'blue']\nprint('Last color:', colors[2])",
        order: 4,
      },
      {
        title: "Dictionary Missing Key",
        category: "Key Errors",
        categorySlug: "key-errors",
        difficulty: "Intermediate" as const,
        description: "Accessing a dictionary key that does not exist directly using bracket notation.",
        buggyCode: "student = {'name': 'Alex', 'grade': 'A'}\nprint('Age:', student['age'])",
        expectedOutput: "Age: Not specified",
        hint: "Use `.get('age', 'Not specified')` or check if `'age' in student` before accessing.",
        solutionExplanation: "Switched to `student.get('age', 'Not specified')` to handle missing keys gracefully.",
        solutionCode: "student = {'name': 'Alex', 'grade': 'A'}\nprint('Age:', student.get('age', 'Not specified'))",
        order: 5,
      },
      {
        title: "Invalid String to Int Conversion",
        category: "Value Errors",
        categorySlug: "value-errors",
        difficulty: "Intermediate" as const,
        description: "Passing a non-numeric string to `int()` function causes a ValueError.",
        buggyCode: "raw_input = '100USD'\nclean_number = int(raw_input)\nprint(clean_number * 2)",
        expectedOutput: "200",
        hint: "Strip out non-numeric characters before converting or use `.replace('USD', '')`.",
        solutionExplanation: "Removed 'USD' suffix before passing the string to `int()`.",
        solutionCode: "raw_input = '100USD'\nclean_number = int(raw_input.replace('USD', ''))\nprint(clean_number * 2)",
        order: 6,
      },
      {
        title: "Off-by-One Loop Sum",
        category: "Logic Errors",
        categorySlug: "logic-errors",
        difficulty: "Intermediate" as const,
        description: "The loop stops one element early because range(1, N) excludes N.",
        buggyCode: "# Sum numbers 1 to 5 inclusive\nsum_val = 0\nfor i in range(1, 5):\n    sum_val += i\nprint('Sum:', sum_val)",
        expectedOutput: "Sum: 15",
        hint: "`range(start, stop)` goes up to `stop - 1`. To include 5, use `range(1, 6)`.",
        solutionExplanation: "Changed range limit to `range(1, 6)` to include 5 in the sum calculation.",
        solutionCode: "sum_val = 0\nfor i in range(1, 6):\n    sum_val += i\nprint('Sum:', sum_val)",
        order: 7,
      },
      {
        title: "Safe File Handling",
        category: "File Handling Errors",
        categorySlug: "file-handling-errors",
        difficulty: "Intermediate" as const,
        description: "Opening a file without proper error handling or context manager.",
        buggyCode: "import os\n\nfilename = 'sample_data.txt'\nwith open(filename, 'r') as f:\n    data = f.read()\nprint(data)",
        expectedOutput: "Sample content loaded safely.",
        hint: "Check if file exists before opening or use try/except block with FileNotFoundError handling.",
        solutionExplanation: "Added `os.path.exists()` fallback or dummy write when file does not exist.",
        solutionCode: "import os\n\nfilename = 'sample_data.txt'\nif not os.path.exists(filename):\n    with open(filename, 'w') as f:\n        f.write('Sample content loaded safely.')\n\nwith open(filename, 'r') as f:\n    print(f.read())",
        order: 8,
      },
      {
        title: "Missing Positional Argument",
        category: "Function Errors",
        categorySlug: "function-errors",
        difficulty: "Intermediate" as const,
        description: "Calling a function with fewer parameters than required without default arguments.",
        buggyCode: "def greet(name, greeting):\n    return f'{greeting}, {name}!'\n\nprint(greet('Sam'))",
        expectedOutput: "Hello, Sam!",
        hint: "Either provide the second argument `'Hello'` or set a default parameter value `greeting='Hello'`.",
        solutionExplanation: "Added default value `greeting='Hello'` to function signature.",
        solutionCode: "def greet(name, greeting='Hello'):\n    return f'{greeting}, {name}!'\n\nprint(greet('Sam'))",
        order: 9,
      },
      {
        title: "Missing Self Parameter in Class",
        category: "Object-Oriented Programming Errors",
        categorySlug: "oop-errors",
        difficulty: "Advanced" as const,
        description: "Instance methods in Python classes must explicitly take `self` as their first parameter.",
        buggyCode: "class BankAccount:\n    def __init__(self, balance):\n        self.balance = balance\n        \n    def get_balance():\n        return self.balance\n\nacc = BankAccount(500)\nprint('Balance:', acc.get_balance())",
        expectedOutput: "Balance: 500",
        hint: "Instance methods require `self` as the first argument, e.g., `def get_balance(self):`.",
        solutionExplanation: "Added `self` to `def get_balance(self):` so it properly references the class instance.",
        solutionCode: "class BankAccount:\n    def __init__(self, balance):\n        self.balance = balance\n        \n    def get_balance(self):\n        return self.balance\n\nacc = BankAccount(500)\nprint('Balance:', acc.get_balance())",
        order: 10,
      },
    ];

    for (const challenge of initialChallenges) {
      await ctx.db.insert("challenges", challenge);
    }
    return { seeded: true, count: initialChallenges.length };
  },
});
