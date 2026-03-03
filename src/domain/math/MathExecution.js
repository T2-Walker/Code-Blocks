import { MATH_OPERATIONS } from '../blocks'

export function executeMathOperation(operation, values, customValue, customValuePosition) {
  if (values.length === 0) return null
  
  if (values.length === 1) {
    const val = values[0]
    const num = customValue
    
    switch (operation) {
      case '+': 
        return customValuePosition === 'left' ? num + val : val + num
      case '-': 
        return customValuePosition === 'left' ? num - val : val - num
      case '*': 
        return customValuePosition === 'left' ? num * val : val * num
      case '/': 
        if (customValuePosition === 'left') {
          return num / val
        } else {
          return val / num
        }
      case '%': 
        if (customValuePosition === 'left') {
          return num % val
        } else {
          return val % num
        }
      case '//': 
        if (customValuePosition === 'left') {
          return Math.floor(num / val)
        } else {
          return Math.floor(val / num)
        }
      default: return null
    }
  }
  
  if (values.length === 2) {
    const [first, second] = values
    
    switch (operation) {
      case '+': return first + second
      case '-': return first - second
      case '*': return first * second
      case '/': return first / second
      case '%': return first % second
      case '//': return Math.floor(first / second)
      default: return null
    }
  }
  
  return null
}

export function getOperationSymbol(operation) {
  const op = MATH_OPERATIONS.find(o => o.value === operation)
  return op ? op.symbol : operation
}