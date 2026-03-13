<template>
  <div class="math-content">
    <!-- Текстовое поле для ввода выражения -->
    <textarea
      v-model="expression"
      class="math-expression-input"
      placeholder="a = 2 + s[2]"
      rows="3"
      @input="onExpressionChange"
      @keydown.enter.prevent="onEnterKey"
    ></textarea>
    
    <!-- Блок ошибок (появляется только если есть ошибка) -->
    <div v-if="error" class="math-error">
      ❌ {{ error }}
    </div>
    
    <!-- Блок предпросмотра (появляется только если нет ошибки) -->
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

// Новые переменные для отслеживания записи в массив
const isArrayAssignment = ref(false)
const arrayName = ref('')
const arrayIndex = ref(-1)
const emit = defineEmits(['update-block', 'execute'])

const { variables, getVariableByName } = useVariables()

// ЕДИНСТВЕННАЯ реактивная переменная - выражение
const expression = ref(props.block.expression || 'a = 0')

// Для ошибок и предпросмотра
const error = ref('')
const preview = ref(null)

// Запоминаем последнее выполненное выражение
const lastExecutedExpression = ref('')

// Функция для парсинга выражения
const parseExpression = (expr) => {
  console.log('🔍 Парсим:', expr)
  
  // Сбрасываем ошибки
  error.value = ''
  preview.value = null
  isArrayAssignment.value = false
  arrayName.value = ''  // Сначала сбрасываем
  arrayIndex.value = -1
  
  // 1. Проверяем, есть ли знак "="
  if (!expr.includes('=')) {
    error.value = 'Должно быть = (пример: a = 2 + 3)'
    return null
  }
  
  // 2. Разделяем на левую и правую часть
  const parts = expr.split('=')
  if (parts.length !== 2) {
    error.value = 'Должен быть один знак ='
    return null
  }
  
  const target = parts[0].trim()
  const expression = parts[1].trim()
  
  // 3. Проверяем целевую переменную (может быть массивом или обычной переменной)
  if (!target) {
    error.value = 'Нет целевой переменной'
    return null
  }
  
  // Проверяем, не массив ли это (например "arr[2]")
  const targetArrayMatch = target.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]$/)
  console.log('targetArrayMatch:', targetArrayMatch)
  
  if (targetArrayMatch) {
    // ЭТО ЗАПИСЬ В МАССИВ!
    const arrayNameStr = targetArrayMatch[1]  // Переименовали, чтобы не путать с ref
    const index = parseInt(targetArrayMatch[2])
    
    // Проверяем существование массива
    const arrayVar = getVariableByName(arrayNameStr)
    if (!arrayVar) {
      error.value = `Массив "${arrayNameStr}" не существует`
      return null
    }
    
    if (arrayVar.type !== 'array') {
      error.value = `"${arrayNameStr}" не является массивом`
      return null
    }
    
    if (index < 0 || index >= arrayVar.size) {
      error.value = `Индекс ${index} вне диапазона (0-${arrayVar.size-1})`
      return null
    }
    
    // Запоминаем, что это запись в массив
    isArrayAssignment.value = true
    arrayName.value = arrayNameStr  // ← присваиваем строку в ref
    arrayIndex.value = index
    
  } else {
    // ЭТО ОБЫЧНАЯ ПЕРЕМЕННАЯ
    if (!target.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      error.value = `Неверное имя переменной: ${target}`
      return null
    }
    
    // Проверяем, существует ли целевая переменная
    const targetVar = getVariableByName(target)
    if (!targetVar) {
      error.value = `Переменная "${target}" не существует`
      return null
    }
    
    isArrayAssignment.value = false
  }
  
  // 4. Проверяем правую часть
  if (!expression) {
    error.value = 'Нет выражения после ='
    return null
  }
  
  // 5. Парсим выражение
  const result = parseMathExpression(expression)
  
  if (result.error) {
    error.value = result.error
    return null
  }
  
  // 6. Показываем предпросмотр
  preview.value = result.value
  
  // 7. Возвращаем результат для вычисления
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

// Парсинг числа, переменной или массива
const parseValue = (str) => {
  str = str.trim()
  
  // Проверяем, число ли это
  if (!isNaN(Number(str))) {
    return { value: Number(str) }
  }
  
  // Проверяем, массив ли это (с индексами)
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
  
  // Проверяем, переменная ли это
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
  
  // Проверяем, скобки ли это
  if (str.startsWith('(') && str.endsWith(')')) {
    return parseMathExpression(str.substring(1, str.length - 1))
  }
  
  return { error: `Неверный синтаксис: "${str}"` }
}

// Парсинг математического выражения (без =)
const parseMathExpression = (expr) => {
  // Убираем лишние пробелы
  expr = expr.trim()
  
  // Пробуем найти операторы в порядке приоритета
  // Сначала ищем + и - (вне скобок)
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
        break // нашли самый левый оператор
      }
    }
  }
  
  // Если не нашли + или -, ищем * / %
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
  
  // Если нашли оператор
  if (operatorIndex !== -1) {
    const left = expr.substring(0, operatorIndex).trim()
    const right = expr.substring(operatorIndex + 1).trim()
    
    // Рекурсивно парсим левую и правую части
    const leftResult = parseMathExpression(left)
    if (leftResult.error) return leftResult
    
    const rightResult = parseMathExpression(right)
    if (rightResult.error) return rightResult
    
    // Вычисляем результат
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
  
  // Если нет операторов - это число, переменная или массив
  return parseValue(expr)
}

// Выполнение математической операции
// Новый флаг
const wasExecuted = ref(false)

const executeMath = () => {
  const result = parseExpression(expression.value)
  
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
}

const onExpressionChange = () => {
  console.log('✏️ expression changed:', expression.value)
  const result = parseExpression(expression.value)
  
  // Сбрасываем флаг при изменении выражения
  wasExecuted.value = false
  
  emitUpdate()
}

// Добавьте кнопку для ручного выполнения
const handleKeydown = (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    executeMath()
  }
}

// Обработка Enter
const onEnterKey = (e) => {
  if (e.ctrlKey || e.metaKey) {
    executeMath()
  }
}

// Вызывается при каждом изменении текста
// Добавьте эту переменную
const lastValidExpression = ref('')


// Обновление блока
const emitUpdate = () => {
  const updateData = {
    id: props.block.id,
    expression: expression.value
  }
  emit('update-block', updateData)
}

// Следим за изменениями в переменных (для валидации)
watch(() => variables.value, () => {
  parseExpression(expression.value)
}, { deep: true })

// Инициализация при загрузке
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
}

/* СТИЛИ ДЛЯ НОВОГО ПОЛЯ ВВОДА */
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

/* СТИЛИ ДЛЯ ОШИБОК */
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

/* СТИЛИ ДЛЯ ПРЕДПРОСМОТРА */
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

/* СТАРЫЕ СТИЛИ - ОСТАВЛЯЕМ ДЛЯ СОВМЕСТИМОСТИ */
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

.math-block:hover .connect-btn,
.math-block:hover .delete-btn {
  opacity: 1;
}
</style>