/**
 * Friendly, templated explanations for common Python exceptions — RunX's
 * answer to Thonny's "Assistant" panel, but tuned for the DSA code students
 * paste here. Rules-based and finite: a lookup keyed on the exception type,
 * lightly specialized by the message. No LLM. The optional AI layer can expand
 * on these later, but these are always available and instant.
 */

export interface ExceptionHelp {
  /** Plain-English what-went-wrong. */
  hint: string;
  /** Concrete thing to check or fix. */
  fix: string;
}

/**
 * Map an exception type + message to a student-friendly hint. Always returns
 * something (a generic fallback for unknown types).
 */
export function explainException(type: string, message: string): ExceptionHelp {
  const msg = message || "";

  switch (type) {
    case "IndexError":
      return {
        hint: "You tried to read or write a list/sequence position that doesn't exist — the index is past the end (or negative beyond the start).",
        fix: "Check the index against `len(...)`. In loops, a common cause is going up to `len(arr)` instead of `len(arr) - 1`, or comparing `arr[j + 1]` near the last element.",
      };
    case "KeyError":
      return {
        hint: `You looked up a dictionary key that isn't present${msg ? ` (${msg})` : ""}.`,
        fix: "Check the key exists first (`if k in d`) or use `d.get(k, default)`. For graphs, make sure every node you visit is actually a key in the adjacency dict.",
      };
    case "ZeroDivisionError":
      return {
        hint: "You divided by zero (or took a modulo by zero).",
        fix: "Guard the denominator before dividing — e.g. `if n != 0`. Watch for an empty list giving `len(arr) == 0`.",
      };
    case "NameError":
      return {
        hint: `A name was used before it was defined${msg ? ` (${msg})` : ""} — often a typo or a variable used outside the scope where it was created.`,
        fix: "Check the spelling and that the variable/function is defined before this line and in the same scope.",
      };
    case "TypeError":
      return {
        hint: `An operation got a value of the wrong type${msg ? ` (${msg})` : ""}.`,
        fix: "Check the types involved — e.g. adding a number to a string, indexing something that isn't subscriptable, or calling something that isn't a function. `int(...)`/`str(...)` conversions often help.",
      };
    case "ValueError":
      return {
        hint: `A function got a value of the right type but an unacceptable value${msg ? ` (${msg})` : ""}.`,
        fix: "Check the argument you passed — e.g. `int('abc')`, or unpacking the wrong number of items.",
      };
    case "AttributeError":
      return {
        hint: `You accessed an attribute or method the object doesn't have${msg ? ` (${msg})` : ""}.`,
        fix: "Check the object's type and spelling. A frequent DSA cause is calling a method on `None` — e.g. a tree node's `.left` that was never set.",
      };
    case "RecursionError":
      return {
        hint: "The recursion went too deep — usually a base case that never triggers, so the function keeps calling itself.",
        fix: "Make sure every path reaches a base case, and that the argument actually shrinks toward it on each call.",
      };
    case "UnboundLocalError":
      return {
        hint: `A local variable was read before it was assigned in this function${msg ? ` (${msg})` : ""}.`,
        fix: "Assign the variable before using it, or use `global`/`nonlocal` if you meant to modify an outer one.",
      };
    case "IndentationError":
      return {
        hint: "Python couldn't parse the indentation — blocks must be indented consistently.",
        fix: "Use a consistent number of spaces (4 is standard) and don't mix tabs and spaces.",
      };
    case "SyntaxError":
      return {
        hint: `Python couldn't parse the code${msg ? ` (${msg})` : ""}.`,
        fix: "Check for a missing `:` at the end of `if`/`for`/`def`, unbalanced brackets/quotes, or a typo near the reported line.",
      };
    default:
      return {
        hint: msg || `The program raised ${type}.`,
        fix: "Read the message above and check the highlighted line.",
      };
  }
}
