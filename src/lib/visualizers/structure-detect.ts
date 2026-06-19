/**
 * DSA structure detection.
 *
 * Given a ValueNode + the variable's name, decides which visualizer to use.
 * Detection uses two complementary signals:
 *
 *   1. Shape  — what the ValueNode looks like (all scalar items, nested items,
 *               dict with "next" key, etc.).
 *   2. Name   — hint from the variable name ("stack", "queue", "head", etc.).
 *
 * Name hints take priority over shape hints when both are present, because a
 * programmer naming something "stack" almost certainly means a stack even if
 * it currently has 0 items. Name hints only ever apply to container-like
 * kinds (list/tuple/set/deque/dict/object) — a function or class whose name
 * happens to match (e.g. `class Node:`) is never reclassified, since it has
 * no items/entries/attributes for the chosen view to render.
 *
 * Rules (in priority order):
 *   linked-list  — dict/object with a "next" attribute OR name includes
 *                  "node","linked","head","tail"
 *   queue        — collections.deque (any name) OR name includes "queue"
 *                  OR name starts with "q_"/"dq_"/"deq"
 *   stack        — name includes "stack" OR name starts with "stk"/"st_"
 *   array        — list/tuple whose items are all scalars (int/float/str/bool)
 *   generic-list — any other list/tuple/set
 *   dict         — dict that isn't a linked-list node
 *   primitive    — int/float/str/bool/none
 *   other        — anything else
 */

import type { ValueNode, ValueKind } from "@/types/snapshot";

export type StructureKind =
  | "array"        // flat list of scalars → ArrayView
  | "stack"        // list used as a stack → StackView
  | "queue"        // list/deque used as a queue → QueueView
  | "linked-list"  // dict/object with .next → LinkedListView
  | "generic-list" // list/tuple/set with non-scalar items
  | "dict"         // plain dict
  | "primitive"    // int, float, str, bool, none
  | "other";       // function, module, object without next, etc.

const SCALAR_KINDS: ReadonlySet<ValueKind> = new Set([
  "int", "float", "str", "bool", "none",
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

const LINKED_LIST_NAME = /node|linked|head|tail/i;
const QUEUE_NAME = /queue|^q_|^dq_|^deq/i;
const STACK_NAME = /stack|^stk|^st_/i;

/** Kinds a name hint is allowed to reclassify — anything with items/entries/attributes. */
const CONTAINER_KINDS: ReadonlySet<ValueKind> = new Set([
  "list", "tuple", "set", "deque", "dict", "object",
]);

export function detectStructure(name: string, node: ValueNode): StructureKind {
  // A deque is unambiguously a queue regardless of variable name.
  if (node.kind === "deque") return "queue";

  // Name-hint fast paths (highest priority, but only for container-like
  // values — a class/function whose name matches isn't a real container).
  if (CONTAINER_KINDS.has(node.kind)) {
    if (LINKED_LIST_NAME.test(name) || hasNextAttr(node)) return "linked-list";
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
      return hasNextAttr(node) ? "linked-list" : "other";

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
    kind === "stack" ||
    kind === "queue" ||
    kind === "linked-list"
  );
}
