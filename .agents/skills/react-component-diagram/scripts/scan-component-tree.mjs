#!/usr/bin/env node
/**
 * Scan React component tree from an entry file.
 * Run from project root (directory with package.json).
 *
 * Usage: node scan-component-tree.mjs <name-or-path> [--src src]
 *
 * Outputs JSON: { root, rootFile, usesOutlet, projectRoot, tree }
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const EXCLUDE_IMPORT_RE =
  /^(react(-dom)?|react-router(-dom)?(\/.*)?|@mui\/|@emotion\/|notistack|awesome-photo-view|react-pull-to-refreshify|zustand|@hookform\/|zod|openapi-fetch|@repo\/|@ts-rest\/)/

const EXCLUDE_SYMBOLS = new Set([
  'Outlet',
  'Navigate',
  'Link',
  'NavLink',
  'RouterProvider',
  'BrowserRouter',
  'Routes',
  'Route',
  'StrictMode',
  'Fragment',
  'Suspense',
  'SnackbarProvider',
  'ThemeProvider',
  'CssBaseline',
  'PullToRefreshify',
  'PhotoSlider',
  'Controller',
  'CircularProgress',
  'Typography',
  'Box',
  'Button',
  'TextField',
  'Alert',
  'Dialog',
  'DialogTitle',
  'DialogContent',
  'DialogActions',
  'AppBar',
  'Toolbar',
  'IconButton',
  'Menu',
  'MenuItem',
  'Paper',
  'Divider',
  'Fab',
  'Tooltip',
])

function parseArgs(argv) {
  const args = { src: 'src', entry: null }
  const rest = []
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--src') args.src = argv[++i]
    else rest.push(argv[i])
  }
  args.entry = rest[0]
  return args
}

export function findProjectRoot(startDir) {
  let dir = path.resolve(startDir)
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir
    dir = path.dirname(dir)
  }
  console.error('Could not find project root (package.json). Run from project directory.')
  process.exit(1)
}

export function resolveEntry(entry, projectRoot, srcDir) {
  if (!entry) {
    console.error('Usage: scan-component-tree.mjs <ComponentName|file-path> [--src src]')
    process.exit(1)
  }

  const absSrc = path.join(projectRoot, srcDir)
  if (fs.existsSync(path.join(projectRoot, entry))) {
    return path.resolve(projectRoot, entry)
  }
  if (fs.existsSync(entry)) return path.resolve(entry)

  const name = entry.replace(/\.(tsx|jsx)$/, '')
  const candidates = []
  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name)
      if (f.isDirectory()) walk(full)
      else if (/\.(tsx|jsx)$/.test(f.name) && path.basename(f.name, path.extname(f.name)) === name) {
        candidates.push(full)
      }
    }
  }
  walk(absSrc)
  if (candidates.length === 0) {
    console.error(`Component file not found for: ${entry}`)
    process.exit(1)
  }
  if (candidates.length > 1) {
    console.error(`Multiple matches for ${entry}:\n${candidates.join('\n')}`)
    process.exit(1)
  }
  return candidates[0]
}

function parseImports(content, filePath, projectRoot, srcDir) {
  const absSrc = path.join(projectRoot, srcDir)
  const imports = new Map()

  const importRe =
    /import\s+(?:(?:type\s+)?\{([^}]+)\}|([A-Z][A-Za-z0-9_$]*))\s+from\s+['"]([^'"]+)['"]/g

  let m
  while ((m = importRe.exec(content)) !== null) {
    const named = m[1]
    const defaultName = m[2]
    const spec = m[3]

    if (EXCLUDE_IMPORT_RE.test(spec)) continue

    let resolved = null
    if (spec.startsWith('@/')) {
      resolved = path.join(absSrc, spec.slice(2))
    } else if (spec.startsWith('.')) {
      resolved = path.resolve(path.dirname(filePath), spec)
    } else if (!spec.startsWith('@')) {
      continue
    }

    if (!resolved) continue

    const exts = [
      '',
      '.tsx',
      '.jsx',
      '.ts',
      '/index.tsx',
      '/index.jsx',
      '/index.ts',
    ]
    let finalPath = null
    for (const ext of exts) {
      const p = resolved + ext
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        finalPath = p
        break
      }
    }
    if (!finalPath || !finalPath.startsWith(absSrc)) continue

    /**
     * Резолвит символ из barrel index.ts → реальный .tsx.
     */
    function resolveSymbolFile(barrelPath, symbol) {
      if (!barrelPath.endsWith('.ts') || barrelPath.endsWith('.tsx')) {
        return barrelPath
      }
      const barrel = fs.readFileSync(barrelPath, 'utf8')
      const re = new RegExp(
        `export\\s+\\{[^}]*\\b${symbol}\\b[^}]*\\}\\s+from\\s+['"]([^'"]+)['"]`,
      )
      const hit = barrel.match(re)
      if (!hit) return barrelPath
      const target = path.resolve(path.dirname(barrelPath), hit[1])
      for (const c of [
        target + '.tsx',
        target + '.jsx',
        path.join(target, 'index.tsx'),
        target,
      ]) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
      }
      return barrelPath
    }

    if (defaultName) {
      imports.set(defaultName, resolveSymbolFile(finalPath, defaultName))
    }
    if (named) {
      for (const part of named.split(',')) {
        const sym = part.trim().split(/\s+as\s+/)[0].trim()
        if (/^[A-Z]/.test(sym)) {
          imports.set(sym, resolveSymbolFile(finalPath, sym))
        }
      }
    }
  }

  return imports
}

function getExportedName(content, filePath) {
  const base = path.basename(filePath, path.extname(filePath))
  const fn = content.match(/export\s+function\s+([A-Z][A-Za-z0-9_]*)/)
  if (fn) return fn[1]
  const constEx = content.match(/export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*=/)
  if (constEx) return constEx[1]
  const memo = content.match(/export\s+default\s+memo\(\s*function\s+([A-Z][A-Za-z0-9_]*)/)
  if (memo) return memo[1]
  return base
}

function findJsxComponents(content, imports) {
  const used = new Set()
  const jsxRe = /<([A-Z][A-Za-z0-9_.]*)/g
  let m
  while ((m = jsxRe.exec(content)) !== null) {
    const sym = m[1].split('.')[0]
    if (EXCLUDE_SYMBOLS.has(sym)) continue
    if (imports.has(sym)) used.add(sym)
  }
  return [...used]
}

function scan(filePath, projectRoot, srcDir, cache, visiting) {
  const abs = path.resolve(filePath)
  if (cache.has(abs)) return cache.get(abs)

  if (visiting.has(abs)) {
    const name = path.basename(abs, path.extname(abs))
    return { name, file: abs, children: [] }
  }
  visiting.add(abs)

  const content = fs.readFileSync(abs, 'utf8')
  const name = getExportedName(content, abs)
  const imports = parseImports(content, abs, projectRoot, srcDir)
  const childSyms = findJsxComponents(content, imports)

  const node = { name, file: abs, children: [] }
  cache.set(abs, node)

  for (const sym of childSyms) {
    const childPath = imports.get(sym)
    if (!childPath) continue
    const childNode = scan(childPath, projectRoot, srcDir, cache, visiting)
    if (!node.children.find((c) => c.file === childNode.file)) {
      node.children.push(childNode)
    }
  }

  visiting.delete(abs)
  return node
}

/**
 * Сканирует дерево компонентов от entry.
 */
export function scanComponentTree(projectRoot, entry, srcDir = 'src') {
  const entryPath = resolveEntry(entry, projectRoot, srcDir)
  const tree = scan(entryPath, projectRoot, srcDir, new Map(), new Set())
  const usesOutlet = fs.readFileSync(entryPath, 'utf8').includes('<Outlet')
  return {
    root: tree.name,
    rootFile: tree.file,
    usesOutlet,
    projectRoot,
    tree,
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])

if (isMain) {
  const args = parseArgs(process.argv)
  const projectRoot = findProjectRoot(process.cwd())
  const output = scanComponentTree(projectRoot, args.entry, args.src)
  console.log(JSON.stringify(output, null, 2))
}
