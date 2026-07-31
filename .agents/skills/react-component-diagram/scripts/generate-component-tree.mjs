#!/usr/bin/env node
/**
 * Generate or update docs/component-tree.dio from React component scan.
 * Run from client/ (directory with package.json).
 *
 * Usage:
 *   node generate-component-tree.mjs
 *   node generate-component-tree.mjs --root src/app/App.tsx --out docs/component-tree.dio
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  findProjectRoot,
  scanComponentTree,
} from './scan-component-tree.mjs'

const NODE_W = 140
const NODE_H = 50
const LEVEL_DY = 100
const SIBLING_DX = 160
const PAGE_WIDTH = 1169

const DEFAULT_ROOT = 'src/app/App.tsx'
const DEFAULT_OUT = 'docs/component-tree.dio'

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, out: DEFAULT_OUT, src: 'src' }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--root') args.root = argv[++i]
    else if (argv[i] === '--out') args.out = argv[++i]
    else if (argv[i] === '--src') args.src = argv[++i]
  }
  return args
}

function escapeXmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nodeLabel(name) {
  return escapeXmlAttr(
    `<div style="color: rgb(228, 228, 228); background-color: rgb(24, 24, 24); font-family: Consolas, &quot;Courier New&quot;, monospace; font-size: 14px; line-height: 19px;"><span style="color: #efb080;font-weight: bold;">${name}</span></div>`,
  )
}

function cursorLink(absFile) {
  return `cursor://file/${absFile.replace(/\//g, '\\')}`
}

function normalizePath(p) {
  return path.normalize(p.replace(/^cursor:\/\/file\//i, '')).toLowerCase()
}

/**
 * Flatten tree to list of { name, file, parentFile|null, depth } + edges.
 */
function flattenTree(tree) {
  const nodes = []
  const edges = []

  function walk(node, parentFile, depth) {
    nodes.push({ name: node.name, file: node.file, parentFile, depth })
    for (const child of node.children) {
      edges.push({ parentFile: node.file, childFile: child.file })
      walk(child, node.file, depth + 1)
    }
  }

  walk(tree, null, 0)
  return { nodes, edges }
}

/**
 * Parse existing .dio UserObjects for geometry reuse.
 */
function parseExistingDio(xml) {
  const byFile = new Map()
  const userObjectRe =
    /<UserObject\s+([^>]*?)\s*(?:\/>|>[\s\S]*?<\/UserObject>)/g
  let m
  while ((m = userObjectRe.exec(xml)) !== null) {
    const attrs = m[1]
    const idMatch = attrs.match(/\bid="([^"]+)"/)
    const linkMatch = attrs.match(/\blink="([^"]+)"/)
    if (!idMatch || !linkMatch) continue
    const id = idMatch[1]
    const file = linkMatch[1].replace(/^cursor:\/\/file\//i, '')
    const block = m[0]
    const geo = block.match(/<mxGeometry\s+([^/]*)\/>/)
    let x = null
    let y = null
    if (geo) {
      const xm = geo[1].match(/\bx="([^"]+)"/)
      const ym = geo[1].match(/\by="([^"]+)"/)
      if (xm) x = Number(xm[1])
      if (ym) y = Number(ym[1])
    }
    byFile.set(normalizePath(file), { id, file, x, y })
  }
  return byFile
}

function assignLayout(nodes, existingByFile) {
  const byDepth = new Map()
  for (const n of nodes) {
    if (!byDepth.has(n.depth)) byDepth.set(n.depth, [])
    byDepth.get(n.depth).push(n)
  }

  const positioned = []
  let nextId = 2
  const usedIds = new Set()

  for (const [, levelNodes] of [...byDepth.entries()].sort((a, b) => a[0] - b[0])) {
    const n = levelNodes.length
    let x = (PAGE_WIDTH - n * SIBLING_DX) / 2
    const yDefault = 20 + levelNodes[0].depth * LEVEL_DY

    for (const node of levelNodes) {
      const prev = existingByFile.get(normalizePath(node.file))
      let id
      if (prev?.id && !usedIds.has(prev.id) && /^\d+$/.test(prev.id)) {
        id = prev.id
      } else {
        while (usedIds.has(String(nextId))) nextId++
        id = String(nextId++)
      }
      usedIds.add(id)

      const xPos =
        prev?.x != null && !Number.isNaN(prev.x) ? prev.x : Math.round(x)
      const yPos =
        prev?.y != null && !Number.isNaN(prev.y) ? prev.y : yDefault

      positioned.push({
        ...node,
        id,
        x: xPos,
        y: yPos,
      })
      x += SIBLING_DX
    }
  }

  return positioned
}

function buildDio(positioned, edges) {
  const fileToId = new Map(
    positioned.map((n) => [normalizePath(n.file), n.id]),
  )

  const diagramId = `CT${Date.now().toString(36)}`
  const nodeXml = positioned
    .map((n) => {
      const label = nodeLabel(n.name)
      const link = escapeXmlAttr(cursorLink(n.file))
      return `                <UserObject label="${label}" link="${link}" id="${n.id}">
                    <mxCell style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1">
                        <mxGeometry x="${n.x}" y="${n.y}" width="${NODE_W}" height="${NODE_H}" as="geometry"/>
                    </mxCell>
                </UserObject>`
    })
    .join('\n')

  let edgeIdx = 1
  const edgeXml = edges
    .map((e) => {
      const source = fileToId.get(normalizePath(e.parentFile))
      const target = fileToId.get(normalizePath(e.childFile))
      if (!source || !target) return null
      const id = `e${edgeIdx++}`
      return `                <mxCell id="${id}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="${source}" target="${target}">
                    <mxGeometry relative="1" as="geometry"/>
                </mxCell>`
    })
    .filter(Boolean)
    .join('\n')

  return `<mxfile host="65bd71144e">
    <diagram id="${diagramId}" name="Component Tree">
        <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${PAGE_WIDTH}" pageHeight="827" math="0" shadow="0">
            <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
${nodeXml}
${edgeXml}
            </root>
        </mxGraphModel>
    </diagram>
</mxfile>
`
}

function main() {
  const args = parseArgs(process.argv)
  const projectRoot = findProjectRoot(process.cwd())
  const outPath = path.resolve(projectRoot, args.out)

  const scanned = scanComponentTree(projectRoot, args.root, args.src)
  const { nodes, edges } = flattenTree(scanned.tree)

  let existingByFile = new Map()
  if (fs.existsSync(outPath)) {
    existingByFile = parseExistingDio(fs.readFileSync(outPath, 'utf8'))
  }

  const positioned = assignLayout(nodes, existingByFile)
  const xml = buildDio(positioned, edges)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, xml, 'utf8')

  console.log(
    `Wrote ${outPath} (${positioned.length} nodes, ${edges.length} edges, root=${scanned.root})`,
  )
}

main()
