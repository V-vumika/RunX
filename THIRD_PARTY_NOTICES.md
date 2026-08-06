# Third-party notices

RunX is built on top of these major open-source projects (see `package.json`
for the full, exact dependency list and versions):

| Project | License | Used for |
|---|---|---|
| [Next.js](https://nextjs.org) | MIT | App framework |
| [React](https://react.dev) | MIT | UI |
| [Pyodide](https://pyodide.org) | MPL-2.0 | Python execution (loaded from CDN at runtime, not bundled) |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | MIT | Code editor |
| [Tailwind CSS](https://tailwindcss.com) | MIT | Styling |
| [Radix UI](https://www.radix-ui.com) (via shadcn/ui) | MIT | Accessible UI primitives |
| [Zustand](https://github.com/pmndrs/zustand) | MIT | State management |
| [Framer Motion](https://www.framer.com/motion/) | MIT | Animation |
| [acorn](https://github.com/acornjs/acorn) | MIT | JavaScript parsing (for the JS tracer) |
| [astring](https://github.com/davidbonnet/astring) | MIT | JavaScript code generation (for the JS tracer) |

Pyodide is fetched from jsDelivr's CDN at runtime and is not redistributed in
this repository or its published build.
