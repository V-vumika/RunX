/**
 * Interview-mode problem bank — a small, curated set of classic DSA problems,
 * each with a bare top-level starter function in BOTH Python and JavaScript.
 *
 * The starter is deliberately a driverless free function (no top-level call),
 * so the existing entry-synthesis machinery (src/lib/execution/entry/) detects
 * it, the InputsPanel collects arguments, and Run works exactly like it does
 * for a pasted LeetCode solution — nothing interview-specific was added to the
 * execution path. Parameter names are identical across both languages so one
 * set of example inputs (keyed by name) drives either language's driver.
 *
 * targetComplexity is the class a good solution should hit; it is compared
 * against the ALREADY-EXISTING rules-based classifier (classify.ts) — never an
 * LLM guess (the AI-teacher phase was cancelled; this stays deterministic).
 */

export interface ExampleCase {
  /** Argument values as source text (e.g. "[2, 7, 11, 15]"), keyed by param name. */
  inputs: Record<string, string>;
  /** What a correct solution prints for these inputs (compared loosely — see grade.ts). */
  expectedOutput: string;
  /** Short label shown above the example, e.g. "nums = [2, 7, 11, 15], target = 9". */
  label: string;
}

export interface InterviewProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium";
  /** Prompt, one paragraph per entry. */
  prompt: string[];
  constraints: string[];
  examples: ExampleCase[];
  starter: { python: string; javascript: string };
  targetComplexity: string;
  complexityNote: string;
  /** Revealed one at a time, least to most specific. */
  hints: string[];
}

export const INTERVIEW_PROBLEMS: InterviewProblem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    prompt: [
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
      "You may assume each input has exactly one solution, and you may not use the same element twice.",
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "Exactly one valid answer exists"],
    examples: [
      { inputs: { nums: "[2, 7, 11, 15]", target: "9" }, expectedOutput: "[0, 1]", label: "nums = [2, 7, 11, 15], target = 9" },
      { inputs: { nums: "[3, 2, 4]", target: "6" }, expectedOutput: "[1, 2]", label: "nums = [3, 2, 4], target = 6" },
    ],
    starter: {
      python: `def two_sum(nums, target):
    # TODO: return the indices of the two numbers that add up to target
    return []
`,
      javascript: `function twoSum(nums, target) {
  // TODO: return the indices of the two numbers that add up to target
  return [];
}
`,
    },
    targetComplexity: "O(n)",
    complexityNote: "A hash map from value to index resolves each pair in one pass.",
    hints: [
      "A brute-force pair of nested loops checks every pair in O(n²) — it works, but there's a faster way.",
      "As you scan once, remember every value you've already seen and its index.",
      "For each number, check whether target - number was already seen — if so, you're done.",
    ],
  },
  {
    id: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: "Easy",
    prompt: ["Given an array of integers nums, return true if any value appears at least twice, and false if every element is distinct."],
    constraints: ["1 ≤ nums.length ≤ 10⁵"],
    examples: [
      { inputs: { nums: "[1, 2, 3, 1]" }, expectedOutput: "True", label: "nums = [1, 2, 3, 1]" },
      { inputs: { nums: "[1, 2, 3, 4]" }, expectedOutput: "False", label: "nums = [1, 2, 3, 4]" },
    ],
    starter: {
      python: `def contains_duplicate(nums):
    # TODO: return True if any value appears at least twice
    return False
`,
      javascript: `function containsDuplicate(nums) {
  // TODO: return true if any value appears at least twice
  return false;
}
`,
    },
    targetComplexity: "O(n)",
    complexityNote: "A set lets you check \"have I seen this?\" in O(1) instead of scanning what came before.",
    hints: [
      "Sorting first and checking neighbors works in O(n log n) — can you avoid the sort?",
      "A set remembers every value seen so far.",
      "The moment you're about to add a value that's already in the set, you have your answer.",
    ],
  },
  {
    id: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    prompt: ["Given two strings s and t, return true if t is an anagram of s (uses exactly the same letters, same counts), and false otherwise."],
    constraints: ["1 ≤ s.length, t.length ≤ 5·10⁴", "Lowercase English letters only"],
    examples: [
      { inputs: { s: "'anagram'", t: "'nagaram'" }, expectedOutput: "True", label: "s = \"anagram\", t = \"nagaram\"" },
      { inputs: { s: "'rat'", t: "'car'" }, expectedOutput: "False", label: "s = \"rat\", t = \"car\"" },
    ],
    starter: {
      python: `def is_anagram(s, t):
    # TODO: return True if t is an anagram of s
    return False
`,
      javascript: `function isAnagram(s, t) {
  // TODO: return true if t is an anagram of s
  return false;
}
`,
    },
    targetComplexity: "O(n)",
    complexityNote: "A single pass counting letters beats sorting both strings.",
    hints: [
      "Different lengths can never be anagrams — that's a free early check.",
      "Count how many times each letter appears in s.",
      "Walk t subtracting from those same counts — if anything goes negative or is left over, it's not an anagram.",
    ],
  },
  {
    id: "best-time-to-buy-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    prompt: [
      "You're given an array prices where prices[i] is the price of a stock on day i.",
      "You may buy on one day and sell on a later day. Return the maximum profit you can achieve, or 0 if no profit is possible.",
    ],
    constraints: ["1 ≤ prices.length ≤ 10⁵"],
    examples: [
      { inputs: { prices: "[7, 1, 5, 3, 6, 4]" }, expectedOutput: "5", label: "prices = [7, 1, 5, 3, 6, 4]" },
      { inputs: { prices: "[7, 6, 4, 3, 1]" }, expectedOutput: "0", label: "prices = [7, 6, 4, 3, 1]" },
    ],
    starter: {
      python: `def max_profit(prices):
    # TODO: return the maximum profit from one buy and one sell
    return 0
`,
      javascript: `function maxProfit(prices) {
  // TODO: return the maximum profit from one buy and one sell
  return 0;
}
`,
    },
    targetComplexity: "O(n)",
    complexityNote: "Track the lowest price seen so far and the best profit in a single pass.",
    hints: [
      "Checking every pair of buy/sell days is O(n²) — there's a one-pass way.",
      "As you scan, keep the lowest price seen so far.",
      "At each day, the best sell-today profit is price − lowest-so-far; keep the best of those.",
    ],
  },
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    prompt: ["Given a sorted array of integers nums and an integer target, return the index of target in nums, or -1 if it isn't there."],
    constraints: ["nums is sorted in ascending order", "All values are distinct"],
    examples: [
      { inputs: { nums: "[-1, 0, 3, 5, 9, 12]", target: "9" }, expectedOutput: "4", label: "nums = [-1, 0, 3, 5, 9, 12], target = 9" },
      { inputs: { nums: "[-1, 0, 3, 5, 9, 12]", target: "2" }, expectedOutput: "-1", label: "nums = [-1, 0, 3, 5, 9, 12], target = 2" },
    ],
    starter: {
      python: `def binary_search(nums, target):
    # TODO: return the index of target in the sorted nums, or -1
    return -1
`,
      javascript: `function binarySearch(nums, target) {
  // TODO: return the index of target in the sorted nums, or -1
  return -1;
}
`,
    },
    targetComplexity: "O(log n)",
    complexityNote: "Sorted input lets you halve the search window every step instead of scanning linearly.",
    hints: [
      "A left-to-right scan works but is only O(n) — the array being sorted lets you do better.",
      "Keep a low and high boundary; look at the middle element.",
      "If the middle is too small, discard the left half; too large, discard the right half.",
    ],
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    prompt: ["Given an integer array nums, find the contiguous subarray (containing at least one number) with the largest sum, and return that sum."],
    constraints: ["1 ≤ nums.length ≤ 10⁵"],
    examples: [
      { inputs: { nums: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]" }, expectedOutput: "6", label: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]" },
      { inputs: { nums: "[1]" }, expectedOutput: "1", label: "nums = [1]" },
    ],
    starter: {
      python: `def max_subarray(nums):
    # TODO: return the sum of the contiguous subarray with the largest sum
    return 0
`,
      javascript: `function maxSubArray(nums) {
  // TODO: return the sum of the contiguous subarray with the largest sum
  return 0;
}
`,
    },
    targetComplexity: "O(n)",
    complexityNote: "Kadane's algorithm decides, at each element, whether to extend the running subarray or restart — one pass, O(n).",
    hints: [
      "Trying every possible subarray is O(n²) — there's a one-pass way (Kadane's algorithm).",
      "At each element, decide: extend the current run, or start a new one from here?",
      "A running sum resets to the current element whenever adding it would make things worse; track the best running sum seen.",
    ],
  },
];

export function getInterviewProblem(id: string): InterviewProblem | undefined {
  return INTERVIEW_PROBLEMS.find((p) => p.id === id);
}
