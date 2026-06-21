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
  {
    label: "Selection Sort",
    code: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr

data = [29, 10, 14, 37, 14]
selection_sort(data)
print(data)
`,
  },
  {
    label: "Quick Sort",
    code: `def quick_sort(arr, low, high):
    if low < high:
        pivot = arr[high]
        i = low - 1
        for j in range(low, high):
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        quick_sort(arr, low, i)
        quick_sort(arr, i + 2, high)
    return arr

data = [8, 3, 7, 4, 9, 1]
quick_sort(data, 0, len(data) - 1)
print(data)
`,
  },
  {
    label: "Merge Sort",
    code: `def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

data = [6, 2, 8, 5, 1, 9]
print(merge_sort(data))
`,
  },
  {
    label: "Binary Search Tree",
    code: `class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def insert(root, val):
    if root is None:
        return TreeNode(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

root = None
for v in [8, 3, 10, 1, 6, 14, 4, 7]:
    root = insert(root, v)
print(root.val)
`,
  },
  {
    label: "Binary Search",
    code: `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

nums = [2, 5, 8, 12, 16, 23, 38, 45]
index = binary_search(nums, 23)
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