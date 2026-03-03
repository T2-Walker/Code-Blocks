let connections = []
let nextId = 1
export function canConnectBlocks(sourceBlock, targetBlock, connections, blocks) {
  if (!sourceBlock || !targetBlock) return { allowed: false, reason: 'Блок не существует' }
  if (sourceBlock.id === targetBlock.id) return { allowed: false, reason: 'Нельзя соединить блок с самим собой' }
  
  const exists = connections.some(
    conn => (conn.from === sourceBlock.id && conn.to === targetBlock.id) ||
            (conn.from === targetBlock.id && conn.to === sourceBlock.id)
  )
  
  if (exists) return { allowed: false, reason: 'Связь уже существует' }
  

  if (targetBlock.type === 'math') {
    return canConnectToMath(sourceBlock, targetBlock, connections, blocks)
  }
  
  if (sourceBlock.type === 'math') {
    return canConnectToMath(targetBlock, sourceBlock, connections, blocks)
  }
  
  return { allowed: true }
}

function canConnectToMath(sourceBlock, targetBlock, connections, blocks) {
  return { allowed: true }
}

export function createConnection(fromBlockId, toBlockId) {
  const exists = connections.some(
    conn => (conn.from === fromBlockId && conn.to === toBlockId) ||
            (conn.from === toBlockId && conn.to === fromBlockId)
  )
  
  if (exists) return null
  
  const connection = {
    id: `conn_${nextId++}`,
    from: fromBlockId,
    to: toBlockId,
    createdAt: Date.now()
  }
  
  connections.push(connection)
  return connection
}

export function deleteConnection(connectionId) {
  connections = connections.filter(conn => conn.id !== connectionId)
}

export function deleteConnectionsForBlock(blockId) {
  connections = connections.filter(conn => conn.from !== blockId && conn.to !== blockId)
}

export function getAllConnections() {
  return [...connections]
}

export function getConnectionsForBlock(blockId) {
  return connections.filter(conn => conn.from === blockId || conn.to === blockId)
}

export function areBlocksConnected(blockId1, blockId2) {
  return connections.some(
    conn => (conn.from === blockId1 && conn.to === blockId2) ||
            (conn.from === blockId2 && conn.to === blockId1)
  )
}

export function clearAllConnections() {
  connections = []
  nextId = 1
}