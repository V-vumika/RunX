"use client";

import { Button } from "@/components/ui/button";
import { useExecutionStore } from "@/lib/store/execution-store";

const EXAMPLES = [
  {
    label: "Bubble Sort",
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

data = [5, 2, 9, 1, 7]
bubble_sort(data)
print(data)
`,
  },
  {
    label: "Fibonacci",
    code: `def fib(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(fib(8))
`,
  },
  {
    label: "Linear Search",
    code: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1

nums = [4, 8, 15, 16, 23, 42]
index = linear_search(nums, 23)
print("found at index:", index)
`,
  },
];

export function ExamplePicker() {
  const setCode = useExecutionStore((s) => s.setCode);
  const reset = useExecutionStore((s) => s.reset);

  return (
    <div className="flex items-center gap-1">
      {EXAMPLES.map((ex) => (
        <Button
          key={ex.label}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => {
            setCode(ex.code);
            reset();
          }}
        >
          {ex.label}
        </Button>
      ))}
    </div>
  );
}