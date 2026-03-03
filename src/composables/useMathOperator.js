import { ref } from 'vue'

export function useMathOperator() {
  const getConnectedVariablesCount = (mathBlockId, connections, blocks) => {
    const mathConnections = connections.filter(
      conn => conn.from === mathBlockId || conn.to === mathBlockId
    )
    
    return mathConnections
      .map(conn => {
        const otherId = conn.from === mathBlockId ? conn.to : conn.from
        return blocks.find(b => b.id === otherId)
      })
      .filter(b => b && b.type === 'variable').length
  }
  
  const getConnectedValues = (mathBlockId, connections, blocks, getVariableValue) => {
    const mathConnections = connections.filter(
      conn => conn.from === mathBlockId || conn.to === mathBlockId
    )
    
    return mathConnections
      .map(conn => {
        const otherId = conn.from === mathBlockId ? conn.to : conn.from
        const block = blocks.find(b => b.id === otherId)
        if (block && block.type === 'variable') {
          const variable = getVariableValue(block.variableName)
          return variable ? variable.value : null
        }
        return null
      })
      .filter(v => v !== null)
  }
  
  return {
    getConnectedVariablesCount,
    getConnectedValues
  }
}