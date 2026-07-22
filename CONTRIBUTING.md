# Contributing to RunX

## Setup
```bash
npm install
npm run dev
```
Open http://localhost:3000/app. The first Python run downloads the Pyodide
runtime (~10s on a typical connection); every run after that is instant.

## Before opening a PR
```bash
npm run build   # must pass
npm test        # must pass
```

## Where things live
See the "Project structure" section in `README.md`, and `CLAUDE.md` for the
fuller architecture/contract notes.
