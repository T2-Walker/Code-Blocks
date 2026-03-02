export const BLOCK_TYPES = {
  start: {
    type: 'start',
    label: 'Начать',
    color: '#4CAF50',
  },
  variable: {
    type: 'variable',
    label: 'Переменная',
    color: '#9C27B0',
  },
}

// Блоки, которые отображаются в сайдбаре
export const BLOCK_PALETTE = [
  BLOCK_TYPES.start,
  BLOCK_TYPES.variable,
]

export function createBaseBlock(type, x, y) {
  const config = BLOCK_TYPES[type]
  if (!config) {
    throw new Error(`Неизвестный тип блока: ${type}`)
  }

  return {
    id: Date.now() + Math.random(),
    type: config.type,
    name: config.label,
    color: config.color,
    x: Math.round(x),
    y: Math.round(y),
  }
}

