/**
 * Curated starter programs for the example gallery (shown in the Explain
 * empty state). Each one is small, deterministic, standard-library Python that
 * traces cleanly and lands on a distinct visualizer, so a first-time visitor
 * sees RunX working in one click.
 */

export interface Example {
  id: string;
  title: string;
  blurb: string;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    id: "bubble-sort",
    title: "Bubble Sort",
    blurb: "Watch bars swap into order · O(n²)",
    code: `def bubble_sort(a):
    for i in range(len(a)):
        for j in range(len(a) - 1 - i):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
    return a

arr = [5, 2, 9, 1, 6, 3]
bubble_sort(arr)
print(arr)
`,
  },
  {
    id: "binary-search",
    title: "Binary Search",
    blurb: "Halve the range each step · O(log n)",
    code: `def binary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

nums = [1, 3, 5, 7, 9, 11, 13]
print(binary_search(nums, 9))
`,
  },
  {
    id: "bst",
    title: "Binary Search Tree",
    blurb: "Grow a tree node by node",
    code: `class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def insert(root, val):
    if root is None:
        return Node(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

root = None
for v in [5, 3, 8, 1, 4, 7]:
    root = insert(root, v)
`,
  },
  {
    id: "dijkstra",
    title: "Dijkstra",
    blurb: "Shortest paths on a weighted graph",
    code: `import heapq

def dijkstra(graph, src):
    dist = {node: float('inf') for node in graph}
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(heap, (dist[v], v))
    return dist

graph = {
    'A': [('B', 4), ('C', 1)],
    'B': [('D', 1)],
    'C': [('B', 2), ('D', 5)],
    'D': [],
}
print(dijkstra(graph, 'A'))
`,
  },
  {
    id: "trie",
    title: "Trie",
    blurb: "Store words as a tree of characters",
    code: `class Trie:
    def __init__(self):
        self.children = {}
        self.end = False

    def insert(self, word):
        node = self
        for c in word:
            if c not in node.children:
                node.children[c] = Trie()
            node = node.children[c]
        node.end = True

    def search(self, word):
        node = self
        for c in word:
            if c not in node.children:
                return False
            node = node.children[c]
        return node.end

trie = Trie()
for w in ["cat", "car", "dog"]:
    trie.insert(w)
print(trie.search("car"), trie.search("cow"))
`,
  },
  {
    id: "fibonacci",
    title: "Fibonacci",
    blurb: "Recursion + a branching call tree · O(2ⁿ)",
    code: `def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(6))
`,
  },
];
