/**
 * DSA structure detection.
 *
 * Given a ValueNode + the variable's name, decides which visualizer to use.
 * Detection uses two complementary signals:
 *
 *   1. Shape  — what the ValueNode looks like (all scalar items, nested items,
 *               dict with "next" key, left/right attrs, adjacency dict, etc.).
 *   2. Name   — hint from the variable name ("stack", "queue", "head", etc.).
 *
 * Shape wins whenever it's unambiguous (e.g. an object literally has
 * left/right attributes → it's a tree node, no matter what it's called).
 * Name hints only kick in when shape alone can't tell linked-list node and
 * tree node apart (both are commonly just named "node"). This ordering
 * matters: earlier code checked the "node" name hint before the shape, which
 * meant a tree-traversal parameter named `node` got misclassified as a
 * linked-list. Name hints only ever apply to container-like kinds
 * (list/tuple/set/deque/dict/object) — a function or class whose name
 * happens to match (e.g. `class Node:`) is never reclassified, since it has
 * no items/entries/attributes for the chosen view to render.
 *
 * Rules (in priority order):
 *   tree         — object with a "left" or "right" attribute (shape) OR name
 *                  is "tree"/"root"/"bst" (only when shape can't decide)
 *   linked-list  — dict/object with a "next" attribute (shape) OR name
 *                  includes "node","linked","head","tail" (only when shape
 *                  can't decide)
 *   graph        — dict whose every value is a list/tuple/set/deque
 *                  (adjacency list) OR object with both "nodes" and "edges"
 *                  attributes, OR name includes "graph"/"adjacency"/"adj"
 *   queue        — collections.deque (any name) OR name includes "queue"
 *                  OR name starts with "q_"/"dq_"/"deq"
 *   stack        — name includes "stack" OR name starts with "stk"/"st_"
 *   array        — list/tuple whose items are all scalars (int/float/str/bool)
 *   generic-list — any other list/tuple/set
 *   dict         — dict that isn't a linked-list node or adjacency list
 *   primitive    — int/float/str/bool/none
 *   other        — anything else
 */

import type { ValueNode, ValueKind } from "@/types/snapshot";

export type StructureKind =
  | "array"        // flat list of scalars → ArrayView
  | "matrix"       // List of Lists of scalars → MatrixView
  | "stack"        // list used as a stack → StackView
  | "queue"        // list/deque used as a queue → QueueView
  | "linked-list"  // dict/object with .next → LinkedListView
  | "tree"         // object with .left/.right → TreeView
  | "graph"        // adjacency dict, or object with .nodes/.edges → GraphView
  | "generic-list" // list/tuple/set with non-scalar items
  | "dict"         // plain dict
  | "primitive"    // int, float, str, bool, none
  | "other";       // function, module, object without next, etc.

const SCALAR_KINDS: ReadonlySet<ValueKind> = new Set([
  "int", "float", "str", "bool", "none",
]);

const SEQUENCE_KINDS: ReadonlySet<ValueKind> = new Set([
  "list", "tuple", "set", "deque",
]);

function allScalars(node: ValueNode): boolean {
  return (node.items ?? []).every((item) => SCALAR_KINDS.has(item.kind));
}

function hasNextAttr(node: ValueNode): boolean {
  if (node.kind === "dict") {
    return (node.entries ?? []).some(
      (e) => e.key.kind === "str" && e.key.repr === "'next'"
    );
  }
  if (node.kind === "object") {
    return (node.attributes ?? []).some((a) => a.name === "next");
  }
  return false;
}

function hasLeftOrRightAttr(node: ValueNode): boolean {
  return (
    node.kind === "object" &&
    (node.attributes ?? []).some((a) => a.name === "left" || a.name === "right")
  );
}

function hasNodesAndEdgesAttrs(node: ValueNode): boolean {
  if (node.kind !== "object") return false;
  const names = new Set((node.attributes ?? []).map((a) => a.name));
  return names.has("nodes") && names.has("edges");
}

/** A non-empty dict where every value is a sequence — the classic adjacency-list shape. */
function isAdjacencyDict(node: ValueNode): boolean {
  if (node.kind !== "dict") return false;
  const entries = node.entries ?? [];
  return entries.length > 0 && entries.every((e) => SEQUENCE_KINDS.has(e.value.kind));
}

const TREE_NAME = /^tree$|^root$|^bst$/i;
const LINKED_LIST_NAME = /node|linked|head|tail/i;
const GRAPH_NAME = /graph|adjacency|^adj$/i;
const QUEUE_NAME = /queue|^q_|^dq_|^deq/i;
const STACK_NAME = /stack|^stk|^st_/i;

/** Kinds a name hint is allowed to reclassify — anything with items/entries/attributes. */
const CONTAINER_KINDS: ReadonlySet<ValueKind> = new Set([
  "list", "tuple", "set", "deque", "dict", "object",
]);

export function detectStructure(name: string, node: ValueNode): StructureKind {
  // A deque is unambiguously a queue regardless of variable name.
  if (node.kind === "deque") return "queue";

  // Shape first: an object's actual attributes settle tree vs linked-list
  // vs neither before any name hint gets a vote.
  if (hasLeftOrRightAttr(node)) return "tree";
  if (hasNextAttr(node)) return "linked-list";
  if (hasNodesAndEdgesAttrs(node) || isAdjacencyDict(node)) return "graph";

  // Name-hint fast paths — only for container-like values, and only once
  // shape has already failed to decide (a class/function whose name
  // matches isn't a real container, so it's gated out entirely).
  if (CONTAINER_KINDS.has(node.kind)) {
    if (TREE_NAME.test(name)) return "tree";
    if (LINKED_LIST_NAME.test(name)) return "linked-list";
    if (GRAPH_NAME.test(name)) return "graph";
    if (QUEUE_NAME.test(name)) return "queue";
    if (STACK_NAME.test(name)) return "stack";
  }

  // Shape-based detection.
  switch (node.kind) {
    case "list":
    case "tuple":
      return allScalars(node) ? "array" : "generic-list";

    case "set":
      return "generic-list";

    case "dict":
      return "dict";

    case "object":
      return "other";

    case "int":
    case "float":
    case "str":
    case "bool":
    case "none":
      return "primitive";

    default:
      return "other";
  }
}

/** Returns true when a structure kind has a dedicated DSA visualizer. */
export function hasDedicatedView(kind: StructureKind): boolean {
  return (
    kind === "array" ||
    kind === "matrix" ||
    kind === "stack" ||
    kind === "queue" ||
    kind === "linked-list"
  );
}
