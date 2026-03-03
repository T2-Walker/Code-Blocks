export function validateChain(startBlock, blocks, connections) {
  const visited = new Set()
  let hasPrint = false
  
  function traverse(blockId) {
    if (visited.has(blockId)) return
    visited.add(blockId)
    
    const block = blocks.find(b => b.id === blockId)
    if (!block) return
    
    if (block.type === 'print') {
      hasPrint = true
      return
    }
    
    const blockConnections = connections.filter(
      conn => conn.from === blockId || conn.to === blockId
    )
    
    blockConnections.forEach(conn => {
      const nextId = conn.from === blockId ? conn.to : conn.from
      traverse(nextId)
    })
  }
  
  traverse(startBlock.id)
  
  if (!hasPrint) {
    return { valid: false, error: 'Не найден блок "Написать" в цепочке' }
  }
  
  return { valid: true, error: '' }
}

export function executeChain(startBlock, blocks, connections, getVariableByName) {
  const results = []
  const visited = new Set()
  
  function traverse(blockId) {
    if (visited.has(blockId)) return
    visited.add(blockId)
    
    const block = blocks.find(b => b.id === blockId)
    if (!block) return
    
    const blockConnections = connections.filter(
      conn => conn.from === blockId || conn.to === blockId
    )
    
    if (block.type === 'print') {
      blockConnections.forEach(conn => {
        const prevId = conn.from === blockId ? conn.to : conn.from
        const prevBlock = blocks.find(b => b.id === prevId)
        
        if (prevBlock && prevBlock.type === 'variable') {
          const variable = getVariableByName(prevBlock.variableName)
          if (variable) {
            results.push({
              type: 'print',
              message: `${prevBlock.variableName} = ${variable.value}`
            })
          }
        }
      })
    }
    
    blockConnections.forEach(conn => {
      const nextId = conn.from === blockId ? conn.to : conn.from
      traverse(nextId)
    })
  }
  
  traverse(startBlock.id)
  return results
}