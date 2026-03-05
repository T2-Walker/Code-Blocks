export function getDeclaredVariableNamesBeforeBlock(blocks, connections, targetBlockId) {
  const byId = new Map(blocks.map((b) => [b.id, b]))

  const prevMap = new Map()
  const nextMap = new Map()

  for (const conn of connections || []) {
    if (!nextMap.has(conn.from)) nextMap.set(conn.from, [])
    nextMap.get(conn.from).push(conn.to)

    if (!prevMap.has(conn.to)) prevMap.set(conn.to, conn.from)
  }


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

