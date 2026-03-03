import { getAllConnections } from './connections'

export function buildExecutionChains(blocks) {
  const connections = getAllConnections()

  const nextMap = {}
  const prevMap = {}

  for (const conn of connections) {
    if (!nextMap[conn.from]) nextMap[conn.from] = []
    nextMap[conn.from].push(conn.to)

    if (prevMap[conn.to] === undefined) {
      prevMap[conn.to] = conn.from
    }
  }

  const byId = {}
  blocks.forEach((b) => {
    byId[b.id] = b
  })

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

