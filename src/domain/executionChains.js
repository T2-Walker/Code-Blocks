import { getAllConnections } from './connections'

export function buildExecutionChains(blocks, startId = null) {
  const connections = getAllConnections()

  const nextMap = {}
  const prevMap = {}
  const thenMap = {}

  for (const conn of connections) {
    if (!nextMap[conn.from]) nextMap[conn.from] = []
    nextMap[conn.from].push(conn.to)

    if (prevMap[conn.to] === undefined) {
      prevMap[conn.to] = conn.from
    }

    if (conn.type === 'then') {
      if (!thenMap[conn.from]) thenMap[conn.from] = []
      thenMap[conn.from].push(conn.to)
    }
  }

  const byId = {}
  blocks.forEach((b) => {
    byId[b.id] = b
  })

  if (startId) {
    return buildSingleChain(startId, byId, nextMap, thenMap)
  }

  const chains = []
  const globalVisited = new Set()

  const startBlocks = blocks.filter((b) => b.type === 'start')

  for (const start of startBlocks) {
    const nextList = nextMap[start.id] || []

    if (nextList.length === 0) {
      // цепочка только из start
      chains.push([start])
      globalVisited.add(start.id)
      continue
    }

    for (const firstId of nextList) {
      const chain = [start]
      globalVisited.add(start.id)

      let currentId = firstId

      while (currentId && !globalVisited.has(currentId)) {
        const block = byId[currentId]
        if (!block) break

        chain.push(block)
        globalVisited.add(currentId)

        if (thenMap[currentId] && thenMap[currentId].length > 0) {
          block.thenConnections = thenMap[currentId]
        }

        const nextForCurrent = nextMap[currentId] || []
        if (nextForCurrent.length !== 1) break

        currentId = nextForCurrent[0]
      }

      chains.push(chain)
    }
  }

  const reachableIds = new Set()
  for (const chain of chains) {
    for (const b of chain) {
      reachableIds.add(b.id)
    }
  }

  return { chains, reachableIds }
}

function buildSingleChain(startId, byId, nextMap, thenMap) {
  const chain = []
  const visited = new Set()
  let currentId = startId

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const block = byId[currentId]
    if (!block) break

    chain.push(block)

    // Сохраняем then-связи если есть
    if (thenMap[currentId] && thenMap[currentId].length > 0) {
      block.thenConnections = thenMap[currentId]
    }

    // Идем дальше по цепочке (берем первую normal связь)
    const nextForCurrent = nextMap[currentId] || []
    const normalNext = nextForCurrent.filter((id) => {
      const conn = getAllConnections().find((c) => c.from === currentId && c.to === id)
      return conn && conn.type !== 'then'
    })

    if (normalNext.length === 0) break
    currentId = normalNext[0]
  }

  return { chains: [chain], reachableIds: visited }
}
