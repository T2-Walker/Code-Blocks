export const BLOCK_TYPES = {
  start: {
    type: 'start',
    label: 'Начать',
    color: '#4CAF50',
  },
  print: {
    type: 'print',
    label: 'Написать',
    color: '#FF9800',
  },
  variable: {
    type: 'variable',
    label: 'Переменная',
    color: '#9C27B0',
  },
  math: {
    type: 'math',
    label: 'Math',
    color: '#FF5722',
  }
}

export const MATH_OPERATIONS = [
  { value: '+', label: 'Сложение', symbol: '+' },
  { value: '-', label: 'Вычитание', symbol: '-' },
  { value: '*', label: 'Умножение', symbol: '×' },
  { value: '/', label: 'Деление', symbol: '÷' },
  { value: '%', label: 'Остаток', symbol: '%' },
]

export const BLOCK_PALETTE = [
  BLOCK_TYPES.start,
  BLOCK_TYPES.print,
  BLOCK_TYPES.variable,
  BLOCK_TYPES.math,
]

export function createBaseBlock(type, x, y) {
  const config = BLOCK_TYPES[type]
  if (!config) {
    throw new Error(`Неизвестный тип блока: ${type}`)
  }
  
  const baseBlock = {
    id: Date.now() + Math.random(),
    type: config.type,
    name: config.label,
    color: config.color,
    x: Math.round(x),
    y: Math.round(y),
  }
  
  if (type === 'math') {
    return {
      ...baseBlock,
      operation: '+',
      customValue: 5,
      customValuePosition: 'right',
      targetVariable: ''
    }
  }
  
  return baseBlock
}