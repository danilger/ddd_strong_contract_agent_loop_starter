---
name: react-component-diagram
description: >-
  Autonomously build/update client React component-tree draw.io (.dio) via
  npm run docs:component-tree. Use in client Pi loop after adding or changing
  project React components; also for component diagram / component tree requests.
---

# React Component Diagram (loop-autonomous)

Generate/update `docs/component-tree.dio` for the **client** package. Nodes link via `cursor://file/`.

## Autonomous rules (MUST)

- **Never** AskQuestion, never wait for user confirm, never ask for root/path/mode.
- Fixed defaults (override only if a human outside loop explicitly asks):
  - root: `src/app/App.tsx`
  - out: `docs/component-tree.dio`
- From cwd **`client/`** run exactly:

```bash
npm run docs:component-tree
```

That invokes `.agents/skills/react-component-diagram/scripts/generate-component-tree.mjs`.

## When

- After creating or changing project React components under `client/src/`
- Client AGENTS.md / openspec tasks require it
- User asks for component tree / schema.dio (still non-interactive defaults)

## Manual CLI (same defaults)

```bash
# cwd = client/
node ../.agents/skills/react-component-diagram/scripts/generate-component-tree.mjs
node ../.agents/skills/react-component-diagram/scripts/generate-component-tree.mjs --root src/app/App.tsx --out docs/component-tree.dio
```

Scan-only JSON:

```bash
node ../.agents/skills/react-component-diagram/scripts/scan-component-tree.mjs src/app/App.tsx --src src
```

## Guardrails

- Only regenerate the diagram file — no unrelated refactors.
- Do not include third-party UI kit components.
- If the script fails, fix the failure; do not skip silently.
