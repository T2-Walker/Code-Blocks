export function getDeclaredVariableNamesBeforeBlock(blocks, connections, targetBlockId) {
  const byId = new Map(blocks.map((b) => [b.id, b]))

  // incoming: one predecessor for non-start (but we still compute it generally)
  const prevMap = new Map()
  // outgoing: may have multiple for start, but in current rules only 1
  const nextMap = new Map()

  for (const conn of connections || []) {
    if (!nextMap.has(conn.from)) nextMap.set(conn.from, [])
    nextMap.get(conn.from).push(conn.to)

    // keep first predecessor; constraints should prevent >1 for non-start targets
    if (!prevMap.has(conn.to)) prevMap.set(conn.to, conn.from)
  }

  // Find nearest start upstream (do NOT go past start even if it has incoming links)
  let currentId = targetBlockId
  const visited = new Set()
  let startId = null

  while (currentId != null && !visited.has(currentId)) {
    visited.add(currentId)
    const block = byId.get(currentId)
    if (!block) break
    if (block.type === 'start') {
      startId = block.id
      break
    }
    currentId = prevMap.get(currentId)
  }

  if (!startId) return []

  // Walk forward from start until reaching targetBlockId, collecting declared/changed variables
  const names = []
  const seen = new Set()
  let walkId = startId
  const forwardVisited = new Set()

  while (walkId != null && !forwardVisited.has(walkId)) {
    forwardVisited.add(walkId)

    if (walkId === targetBlockId) break

    const b = byId.get(walkId)
    if (!b) break

    if (b.type === 'variable' && b.variableName) {
      const n = String(b.variableName).trim()
      if (n && !seen.has(n)) {
        seen.add(n)
        names.push(n)
      }
    }

    if (b.type === 'math' && b.targetVariable) {
      const n = String(b.targetVariable).trim()
      if (n && !seen.has(n)) {
        seen.add(n)
        names.push(n)
      }
    }

    const next = nextMap.get(walkId) || []
    if (next.length !== 1) break
    walkId = next[0]
  }

  return names
}

