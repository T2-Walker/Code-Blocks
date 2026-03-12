let connections = []
let nextId = 1

export function canConnectBlocks(sourceBlock, targetBlock, currentConnections, allBlocks, connectionType = 'normal') {
  if (!sourceBlock || !targetBlock) {
    return { allowed: false, reason: 'Блок не существует' }
  }

  if (sourceBlock.id === targetBlock.id) {
    return { allowed: false, reason: 'Нельзя соединить блок с самим собой' }
  }

  if (connectionType.value === 'then' && sourceBlock.type !== 'if') {
    return { allowed: false, reason: 'Then-связи можно создавать только от блока Условие' }
  }

  const exists = currentConnections.some(
    (conn) =>
      (conn.from === sourceBlock.id && conn.to === targetBlock.id) ||
      (conn.from === targetBlock.id && conn.to === sourceBlock.id),
  )

  if (exists) {
    return { allowed: false, reason: 'Связь уже существует' }
  }

  const { incomingCount, outgoingCount } = buildDegreeMaps(currentConnections)

  const isStartSource = sourceBlock.type === 'start'
  const isStartTarget = targetBlock.type === 'start'

  // Ограничения для исходящих связей
  if (isStartSource) {
    if ((outgoingCount[sourceBlock.id] || 0) >= 1) {
      return {
        allowed: false,
        reason: 'От блока "Начать" может идти только одна исходящая связь',
      }
    }
  } else if (sourceBlock.type === 'if') {
    const existingNormal = currentConnections.some(
      conn => conn.from === sourceBlock.id && conn.type === 'normal'
    )
    const existingThen = currentConnections.some(
      conn => conn.from === sourceBlock.id && conn.type === 'then'
    )

    if (connectionType === 'normal' && existingNormal) {
      return { allowed: false, reason: 'У блока If может быть только одна обычная связь' }
    }
    if (connectionType === 'then' && existingThen) {
      return { allowed: false, reason: 'У блока If может быть только одна then-связь' }
    }
  } else if ((outgoingCount[sourceBlock.id] || 0) >= 1) {
    return {
      allowed: false,
      reason: 'От блока может идти только одна исходящая связь',
    }
  }

  // Ограничения для входящих связей
  // У start может быть сколько угодно входящих
  if (!isStartTarget && (incomingCount[targetBlock.id] || 0) >= 1) {
    return {
      allowed: false,
      reason: 'К блоку может приходить только одна входящая связь',
    }
  }

  // Запрет циклов: добавление source -> target не должно создавать путь target -> source
  const willCreateCycle = checkCycle(sourceBlock.id, targetBlock.id, currentConnections)
  if (willCreateCycle) {
    return {
      allowed: false,
      reason: 'Эта связь создаст цикл, что недопустимо',
    }
  }

  return { allowed: true }
}

function buildDegreeMaps(conns) {
  const incomingCount = {}
  const outgoingCount = {}

  for (const conn of conns) {
    outgoingCount[conn.from] = (outgoingCount[conn.from] || 0) + 1
    incomingCount[conn.to] = (incomingCount[conn.to] || 0) + 1
  }

  return { incomingCount, outgoingCount }
}

function checkCycle(sourceId, targetId, conns) {
  // Проверяем, существует ли путь из targetId в sourceId по already existing connections
  const visited = new Set()
  const stack = [targetId]

  const outgoingMap = {}
  for (const conn of conns) {
    if (!outgoingMap[conn.from]) {
      outgoingMap[conn.from] = []
    }
    outgoingMap[conn.from].push(conn.to)
  }

  while (stack.length > 0) {
    const current = stack.pop()
    if (current === sourceId) return true
    if (visited.has(current)) continue
    visited.add(current)

    const next = outgoingMap[current] || []
    for (const n of next) {
      if (!visited.has(n)) {
        stack.push(n)
      }
    }
  }

  return false
}

export function createConnection(fromBlockId, toBlockId, type = 'normal') {
  const exists = connections.some(
    (conn) =>
      (conn.from === fromBlockId && conn.to === toBlockId) ||
      (conn.from === toBlockId && conn.to === fromBlockId),
  )

  if (exists) return null

  const connection = {
    id: `conn_${nextId++}`,
    from: fromBlockId,
    to: toBlockId,
    createdAt: Date.now(),
    type: type,
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
