export function calculateConnectionLine(block1, block2) {
  if (!block1 || !block2) return null
  
  const x1 = block1.x + 50
  const y1 = block1.y + 25
  const x2 = block2.x + 50
  const y2 = block2.y + 25
  
  return {
    x1: Math.round(x1),
    y1: Math.round(y1),
    x2: Math.round(x2),
    y2: Math.round(y2)
  }
}

export function createTempLine(fromBlock, mouseX, mouseY) {
  if (!fromBlock) return null
  
  return {
    x1: fromBlock.x + 50,
    y1: fromBlock.y + 25,
    x2: mouseX,
    y2: mouseY
  }
}

export function canConnectBlocks(sourceBlock, targetBlock) {
  if (!sourceBlock || !targetBlock) return { allowed: false, reason: 'Блок не существует' }
  if (sourceBlock.id === targetBlock.id) return { allowed: false, reason: 'Нельзя соединить блок с самим собой' }
  
  return { allowed: true }
}