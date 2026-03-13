export function getDeclaredVariableNamesBeforeBlock(blocks, connections, targetBlockId) {
  console.log(' ChainContext for block:', targetBlockId)

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
  const pathToStart = []

  while (currentId != null && !visited.has(currentId)) {
    visited.add(currentId)
    pathToStart.unshift(currentId)
    const block = byId.get(currentId)
    if (!block) break
    if (block.type === 'start') {
      startId = block.id
      break
    }
    currentId = prevMap.get(currentId)
  }

  if (!startId) {
    console.log(' No start block found')
    return []
  }

  console.log(' Path to start:', pathToStart)

  const names = []
  const seen = new Set()

  for (const id of pathToStart) {
    const b = byId.get(id)
    if (!b) continue

    console.log('Processing block:', b.type, b.id)


    if (b.type === 'variable') {
      if (b.savedVariables && Array.isArray(b.savedVariables)) {
        b.savedVariables.forEach(v => {
          if (v.name && !seen.has(v.name)) {
            seen.add(v.name)
            names.push(v.name)
            console.log(' Found variable from savedVariables:', v.name)
          }
        })
      } else if (b.variableName) {

        if (!seen.has(b.variableName)) {
          seen.add(b.variableName)
          names.push(b.variableName)
        }
      }
    }

    if (b.type === 'math' && b.targetVariable) {
      if (!seen.has(b.targetVariable)) {
        seen.add(b.targetVariable)
        names.push(b.targetVariable)
        console.log(' Found math target:', b.targetVariable)
      }
    }

    if (id === targetBlockId) {
      console.log(' Reached target block, stopping')
      break
    }
  }

  console.log(' Final variables for block', targetBlockId, ':', names)
  return names
}
