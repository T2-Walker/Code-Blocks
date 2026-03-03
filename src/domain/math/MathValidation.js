export function canConnectToMath(sourceBlock, targetBlock, currentConnections, allBlocks) {
  if (targetBlock.type !== 'math') return true
  
  const connectedVars = getConnectedVariables(targetBlock.id, currentConnections, allBlocks)
  
  if (connectedVars.length >= 2) {
    return {
      allowed: false,
      reason: 'К математическому блоку можно подключить только 2 переменные'
    }
  }
  
  return { allowed: true }
}

export function getConnectedVariables(mathBlockId, connections, blocks) {
  const mathConnections = connections.filter(
    conn => conn.from === mathBlockId || conn.to === mathBlockId
  )
  
  const variables = mathConnections
    .map(conn => {
      const otherId = conn.from === mathBlockId ? conn.to : conn.from
      return blocks.find(b => b.id === otherId)
    })
    .filter(b => b && b.type === 'variable')
  
  return variables
}

export function getMathValues(mathBlock, connections, blocks, getVariableValue) {
  const variables = getConnectedVariables(mathBlock.id, connections, blocks)
  
  const values = []
  for (const varBlock of variables) {
    const variable = getVariableValue(varBlock.variableName)
    if (variable) {
      values.push(variable.value)
    }
  }
  
  return values
}