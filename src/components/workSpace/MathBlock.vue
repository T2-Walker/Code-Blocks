<template>
  <div 
    class="math-content" 
    :class="{ 'executed': wasExecuted }"
  >
    <textarea
      v-model="expression"
      class="math-expression-input"
      placeholder="a = 2 + s[2]"
      rows="3"
      @input="onExpressionChange"
 
    ></textarea>
     <button 
      class="math-execute-btn" 
      @click.stop="executeMath"
      :disabled="!isValid"
      title="Выполнить выражение"
    >
      ✓
    </button>
    
    
    <div v-if="error" class="math-error">
      ❌ {{ error }}
    </div>
    
    <div v-if="preview && !error" class="math-preview">
      <span class="preview-label">=</span>
      <span class="preview-value">{{ preview }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useVariables } from '@/composables/useVariables'

const props = defineProps({
  block: Object,
  allBlocks: Array,
  allConnections: Array,
})

const isArrayAssignment = ref(false)
const isExecuting = ref(false)
const arrayName = ref('')
const arrayIndex = ref(-1)
const emit = defineEmits(['update-block', 'execute'])
const isValid = ref(false)

const { variables, getVariableByName } = useVariables()

const expression = ref(props.block.expression || 'a = 0')
const error = ref('')
const preview = ref(null)
const wasExecuted = ref(false)

const parseExpression = (expr) => {
  error.value = ''
  preview.value = null
  isArrayAssignment.value = false
  arrayName.value = ''
  arrayIndex.value = -1
  
  if (!expr.includes('=')) {
    error.value = 'Должно быть = (пример: a = 2 + 3)'
    isValid.value = false
    return null
  }
  
  const parts = expr.split('=')
  if (parts.length !== 2) {
    error.value = 'Должен быть один знак ='
    isValid.value = false
    return null
  }
  
  const target = parts[0].trim()
  const expression = parts[1].trim()
  
  if (!target) {
    error.value = 'Нет целевой переменной'
    isValid.value = false
    return null
  }
  
  if (!expression) {
    error.value = 'Нет выражения после ='
    isValid.value = false
    return null
  }
  
  const targetArrayMatch = target.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]$/)
  
  if (targetArrayMatch) {
    const arrayNameStr = targetArrayMatch[1]
    const index = parseInt(targetArrayMatch[2])
    
    const arrayVar = getVariableByName(arrayNameStr)
    if (!arrayVar) {
      error.value = `Массив "${arrayNameStr}" не существует`
      isValid.value = false
      return null
    }
    
    if (arrayVar.type !== 'array') {
      error.value = `"${arrayNameStr}" не является массивом`
      isValid.value = false
      return null
    }
    
    if (index < 0 || index >= arrayVar.size) {
      error.value = `Индекс ${index} вне диапазона (0-${arrayVar.size-1})`
      isValid.value = false
      return null
    }
    
    isArrayAssignment.value = true
    arrayName.value = arrayNameStr
    arrayIndex.value = index
    
  } else {
    if (!target.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      error.value = `Неверное имя переменной: ${target}`
      isValid.value = false
      return null
    }
    const targetVar = getVariableByName(target)
    if (!targetVar) {
      error.value = `Переменная "${target}" не существует`
      isValid.value = false
      return null
    }
    isArrayAssignment.value = false
  }
  
  const result = parseMathExpression(expression)
  
  if (result.error) {
    error.value = result.error
    isValid.value = false
    return null
  }
  
  preview.value = result.value
  isValid.value = true
  
  if (isArrayAssignment.value) {
    return {
      targetArray: arrayName.value,
      targetIndex: arrayIndex.value,
      value: result.value
    }
  } else {
    return {
      target,
      value: result.value
    }
  }
}


const updateValidState = () => {
  const result = parseExpression(expression.value)
  isValid.value = !!(result && !error.value)
  return result
}

const executeMath = () => {
  if (isExecuting.value)
  {
    return
  }
  isExecuting.value = true
  
  const result = updateValidState()
  
  if (result && !error.value) {
    if (isArrayAssignment.value) {
      emit('execute', {
        id: props.block.id,
        result: result.value,
        targetArray: result.targetArray,
        targetIndex: result.targetIndex
      })
    } else {
      emit('execute', {
        id: props.block.id,
        result: result.value,
        targetVariable: result.target
      })
    }
    
    wasExecuted.value = true
    
  }
  
  isExecuting.value = false
}

watch(() => variables.value, () => {
  updateValidState()
}, { deep: true })

const parseMathExpression = (expr) => {
  expr = expr.trim()
  
  if (expr === '') {
    return { error: 'Пустое выражение' }
  }

  let bracketLevel = 0
  let operatorIndex = -1
  let operator = null
  
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i]
    
    if (char === '(') bracketLevel++
    else if (char === ')') bracketLevel--
    
    if (bracketLevel === 0) {
      if (char === '+' || char === '-') {
        operatorIndex = i
        operator = char
        break
      }
    }
  }
  
  if (operatorIndex === -1) {
    bracketLevel = 0
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i]
      
      if (char === '(') bracketLevel++
      else if (char === ')') bracketLevel--
      
      if (bracketLevel === 0) {
        if (char === '*' || char === '/' || char === '%') {
          operatorIndex = i
          operator = char
          break
        }
      }
    }
  }
  
  if (operatorIndex !== -1) {
    const left = expr.substring(0, operatorIndex).trim()
    const right = expr.substring(operatorIndex + 1).trim()
    
    if (right === '') {
      return { error: 'Неполное выражение после оператора' }
    }
    
    const leftResult = parseMathExpression(left)
    if (leftResult.error) return leftResult
    
    const rightResult = parseMathExpression(right)
    if (rightResult.error) return rightResult
    
    let value
    switch (operator) {
      case '+': value = leftResult.value + rightResult.value; break
      case '-': value = leftResult.value - rightResult.value; break
      case '*': value = leftResult.value * rightResult.value; break
      case '/': 
        if (rightResult.value === 0) return { error: 'Деление на ноль' }
        value = leftResult.value / rightResult.value
        break
      case '%': 
        if (rightResult.value === 0) return { error: 'Деление на ноль' }
        value = leftResult.value % rightResult.value
        break
      default: return { error: 'Неизвестный оператор' }
    }
    
    return { value }
  }
  
  return parseValue(expr)
}

const parseValue = (str) => {
  str = str.trim()
  
  if (str === '') {
    return { error: 'Пустое значение' }
  }
  
  if (!isNaN(Number(str))) {
    return { value: Number(str) }
  }
  
  const arrayMatch = str.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]$/)
  if (arrayMatch) {
    const name = arrayMatch[1]
    const index = parseInt(arrayMatch[2])
    const variable = getVariableByName(name)
    if (!variable) {
      return { error: `Переменная "${name}" не найдена` }
    }
    if (variable.type !== 'array') {
      return { error: `"${name}" не является массивом` }
    }
    if (index < 0 || index >= variable.value.length) {
      return { error: `Индекс ${index} вне диапазона (0-${variable.value.length-1})` }
    }
    return { value: variable.value[index] }
  }
  
  const varMatch = str.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
  if (varMatch) {
    const name = str
    const variable = getVariableByName(name)
    if (!variable) {
      return { error: `Переменная "${name}" не найдена` }
    }
    if (variable.type === 'array') {
      return { error: `"${name}" - это массив, нужен индекс (например ${name}[0])` }
    }
    
    return { value: variable.value }
  }
  
  if (str.startsWith('(') && str.endsWith(')')) {
    return parseMathExpression(str.substring(1, str.length - 1))
  }
  
  return { error: `Неверный синтаксис: "${str}"` }
}

const onExpressionChange = () => {

  updateValidState()
  emitUpdate()
}

const emitUpdate = () => {
  const updateData = {
    id: props.block.id,
    expression: expression.value
  }
  emit('update-block', updateData)
}


watch(() => props.block, (block) => {
  if (block.expression) {
    expression.value = block.expression
    parseExpression(block.expression)
  }
}, { immediate: true })
</script>

<style scoped>
.math-content {
  min-width: 320px;
  padding: 15px;
  background-color: #FF5722;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.math-content.executed {
  border-color: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.math-expression-input {
  width: 100%;
  padding: 12px;
  background: #1e1e1e;
  color: #fff;
  border: 2px solid #4d4d4d;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  margin-bottom: 10px;
}

.math-expression-input:focus {
  outline: none;
  border-color: #FF5722;
  box-shadow: 0 0 0 2px rgba(255, 87, 34, 0.3);
}

.math-execute-btn {
  width: 40px;
  height: 40px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 10px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.math-execute-btn:hover {
  background: #45a049;
}

.math-error {
  padding: 10px;
  background: #ff4444;
  color: white;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 8px;
  font-family: 'Courier New', monospace;
  border-left: 3px solid #cc0000;
}
.math-preview {
  padding: 10px;
  background: #2d2d2d;
  border-radius: 4px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 3px solid #4CAF50;
}

.preview-label {
  font-size: 18px;
  font-weight: bold;
  color: #888;
}

.preview-value {
  font-size: 18px;
  font-weight: bold;
  color: #4CAF50;
  font-family: monospace;
}

.delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.math-execute-btn:hover:not(:disabled) {
  background: #45a049;
  transform: scale(1.1);
}

.math-execute-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.math-block:hover .connect-btn,
.math-block:hover .delete-btn {
  opacity: 1;
}
</style>