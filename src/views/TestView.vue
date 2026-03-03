<template>
  <div class="test-page">
    <div class="button-container">
      <button class="run-btn" @click="runExecution">▶ ВЫПОЛНИТЬ</button>
      <button class="end-btn" @click="endExecution" :disabled="!isExecuted">⏹ КОНЕЦ</button>
      <button class="back-btn" @click="$router.push('/')">← НАЗАД</button>
    </div>
    
    <button class="terminal-toggle" @click="toggleTerminal">
      {{ isTerminalVisible ? '▼' : '▲' }}
    </button>
    
    <div class="container">
      <SidebarBlocks @palette-drop="onPaletteDrop" />
      <WorkspaceArea
        ref="workspaceAreaRef"
        :blocks="blocks"
        :connections="connections"
        :is-executed="isExecuted"
        @drop="addBlock"
        @update-block="updateBlockPosition"
        @delete-block="deleteBlock"
        @update-variable="updateVariableBlock"
        @connection-created="onConnectionCreated"
        @connection-deleted="onConnectionDeleted"
        @math-execute="onMathExecute"
      />
    </div>
    
    <DraggableTerminal
      v-if="isTerminalVisible"
      :lines="terminalLines"
      :initial-position="terminalPosition"
      @clear="clearTerminal"
      @update:position="updatePosition"
    />
  </div>
</template>

<script setup>

import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SidebarBlocks from '@/components/sidebar/SidebarBlocks.vue'
import WorkspaceArea from '@/components/workSpace/WorkspaceArea.vue'
import DraggableTerminal from '@/components/UI/DraggableTerminal.vue'
import { useTerminal } from '@/composables/useTerminal'
import { useExecutionState } from '@/composables/useExecutionState'
import { getAllConnections } from '@/domain/connections'
import { useVariables } from '@/composables/useVariables'

const router = useRouter()
const blocks = ref([])
const workspaceAreaRef = ref(null)
const connections = ref([])
const { variables, getVariableByName, upsertVariable } = useVariables()
const { 
  terminalLines, 
  isTerminalVisible, 
  terminalPosition,
  addLine, 
  clearTerminal, 
  toggleTerminal,
  updatePosition 
} = useTerminal()

const { 
  isExecuted,
  saveInitialState, 
  restoreInitialState, 
  setExecuted,
  resetExecution 
} = useExecutionState()
const updateVariableValue = (name, value) => {
  console.log('updateVariableValue called with:', name, value)
  const variable = getVariableByName(name)
  console.log('Found variable:', variable)
  if (variable) {
    upsertVariable({
      oldName: name,
      name,
      type: variable.type,
      value
    })
    console.log('Variable updated to:', value)
  }
}

  watch(variables, (newVars) => {
    if (!isExecuted.value) {
      saveInitialState(newVars)
    }
  }, { deep: true, immediate: true })

const addBlock = (newBlock) => {
  console.log('ADD BLOCK CALLED WITH:', newBlock)
  
  const exists = blocks.value.some(b => b.id === newBlock.id)
  if (exists) {
    console.log('Block already exists, skipping')
    return
  }
  
  blocks.value.push(newBlock)
  addLine(`Создан блок: ${newBlock.type}`, 'success')
}

const updateBlockPosition = ({ id, x, y, variableName, variableType, variableValue, targetVariable, leftType, leftVariable, leftNumber, operator, rightType, rightVariable, rightNumber }) => {
  console.log('TestView updateBlockPosition:', { 
    id, x, y, variableName, variableType, variableValue, 
    targetVariable, leftVariable, rightVariable 
  })
  
  const block = blocks.value.find((b) => b.id === id)
  if (block) {
    if (x !== undefined) block.x = Math.round(x)
    if (y !== undefined) block.y = Math.round(y)
    if (variableName !== undefined) block.variableName = variableName
    if (variableType !== undefined) block.variableType = variableType
    if (variableValue !== undefined) block.variableValue = variableValue
    if (targetVariable !== undefined) block.targetVariable = targetVariable
    if (leftType !== undefined) block.leftType = leftType
    if (leftVariable !== undefined) block.leftVariable = leftVariable
    if (leftNumber !== undefined) block.leftNumber = leftNumber
    if (operator !== undefined) block.operator = operator
    if (rightType !== undefined) block.rightType = rightType
    if (rightVariable !== undefined) block.rightVariable = rightVariable
    if (rightNumber !== undefined) block.rightNumber = rightNumber
  }
}

const updateVariableBlock = ({ id, variableName, variableType, variableValue }) => {
  const block = blocks.value.find((b) => b.id === id)
  if (block) {
    block.variableName = variableName
    block.variableType = variableType
    block.variableValue = variableValue
  }
}

const deleteBlock = (blockId) => {
  const block = blocks.value.find((b) => b.id === blockId)
  const blockName = block ? (block.variableName || block.name) : 'блок'
  blocks.value = blocks.value.filter((b) => b.id !== blockId)
  connections.value = getAllConnections()
  addLine(`Удален блок: ${blockName}`, 'output')
}

const onConnectionCreated = () => {
  connections.value = getAllConnections()
}

const onConnectionDeleted = () => {
  connections.value = getAllConnections()
}

const onPaletteDrop = (payload) => {
  if (workspaceAreaRef.value && workspaceAreaRef.value.handlePaletteDrop) {
    workspaceAreaRef.value.handlePaletteDrop(payload)
  }
}

const onMathExecute = ({ result, targetVariable }) => {
  console.log('TestView onMathExecute:', { result, targetVariable })
  if (targetVariable && isExecuted.value) {
    updateVariableValue(targetVariable, result)
    addLine(`📝 ${targetVariable} = ${result}`, 'print')
  }
}

const runExecution = () => {
  
  console.log('=== RUN EXECUTION START ===')
  console.log('variables.value:', variables.value)
  console.log('blocks.value:', blocks.value)
  
  addLine('--- Начало выполнения ---', 'output')
  
  const startBlocks = blocks.value.filter(b => b.type === 'start')
  if (startBlocks.length === 0) {
    addLine('Ошибка: Не найден блок "Начать"', 'error')
    return
  }

  saveInitialState(variables.value)
  
  const allVariables = {}
  variables.value.forEach(v => {
    allVariables[v.name] = v.value
  })
  
  console.log('Все переменные:', allVariables)
  console.log('=== ПРОВЕРКА ПЕРЕМЕННЫХ ===')
console.log('Имена переменных:', Object.keys(allVariables))
console.log('Значения:', Object.values(allVariables))
  
  const mathBlocks = blocks.value.filter(b => b.type === 'math')
  
  mathBlocks.forEach(mathBlock => {
  console.log('Math блок ПОЛНОСТЬЮ:', JSON.parse(JSON.stringify(mathBlock)))
  
  console.log('leftVariable value:', mathBlock.leftVariable)
  console.log('rightVariable value:', mathBlock.rightVariable)
    console.log('Math блок ПОЛНОСТЬЮ:', JSON.parse(JSON.stringify(mathBlock)))
    
    if (!mathBlock.targetVariable) {
      console.log('Math блок без целевой переменной')
      return
    }
    
    console.log('Math блок данные:', {
      targetVariable: mathBlock.targetVariable,
      leftType: mathBlock.leftType,
      leftVariable: mathBlock.leftVariable,
      leftNumber: mathBlock.leftNumber,
      operator: mathBlock.operator,
      rightType: mathBlock.rightType,
      rightVariable: mathBlock.rightVariable,
      rightNumber: mathBlock.rightNumber
    })
let leftVal = 0
if (mathBlock.leftType === 'variable') {
  leftVal = allVariables[mathBlock.leftVariable] !== undefined ? allVariables[mathBlock.leftVariable] : 0
  console.log(`Левая переменная ${mathBlock.leftVariable} = ${leftVal}`)
} else {
  leftVal = mathBlock.leftNumber || 0
  console.log(`Левое число = ${leftVal}`)
}

let rightVal = 0
if (mathBlock.rightType === 'variable') {
  console.log('Looking for right variable:', mathBlock.rightVariable)
  rightVal = allVariables[mathBlock.rightVariable] !== undefined ? allVariables[mathBlock.rightVariable] : 0
  console.log(`Правая переменная ${mathBlock.rightVariable} = ${rightVal}`)
} else {
  rightVal = mathBlock.rightNumber || 0
  console.log(`Правое число = ${rightVal}`)
}
    
    let result
    switch (mathBlock.operator) {
      case '+': result = leftVal + rightVal; break
      case '-': result = leftVal - rightVal; break
      case '*': result = leftVal * rightVal; break
      case '/': result = rightVal !== 0 ? leftVal / rightVal : 'Ошибка'; break
      case '%': result = rightVal !== 0 ? leftVal % rightVal : 'Ошибка'; break
      default: result = 0
    }
    
    console.log(`Результат: ${leftVal} ${mathBlock.operator} ${rightVal} = ${result}`)
    
    if (result !== 'Ошибка') {
      console.log('About to update variable:', mathBlock.targetVariable, 'with value:', result)
      updateVariableValue(mathBlock.targetVariable, result)
      addLine(`📝 ${mathBlock.targetVariable} = ${result}`, 'print')
    }
  })
  
  const printBlocks = blocks.value.filter(b => b.type === 'print')
  
  printBlocks.forEach(printBlock => {
    const printConnections = connections.value.filter(
      conn => conn.from === printBlock.id || conn.to === printBlock.id
    )
    
    printConnections.forEach(conn => {
      const otherId = conn.from === printBlock.id ? conn.to : conn.from
      const otherBlock = blocks.value.find(b => b.id === otherId)
      
      if (otherBlock && otherBlock.type === 'variable') {
        const variable = variables.value.find(v => v.name === otherBlock.variableName)
        if (variable) {
          addLine(`📝 ${variable.name} = ${variable.value}`, 'print')
        }
      }
    })
  })
  
  setExecuted()
  addLine('--- Выполнение завершено ---', 'output')
}

const endExecution = () => {
  restoreInitialState(updateVariableValue)
  resetExecution()
  addLine('🔄 Возврат к начальным значениям', 'output')
}
</script>

<style scoped>

.test-page {
  width: 100%;
  height: 100vh;
  background-color: #1e1e1e;
  position: relative;
  overflow: hidden;
}

.button-container {
  position: absolute;
  top: 20px;
  right: 30px;
  display: flex;
  gap: 15px;
  z-index: 1000;
}

.run-btn {
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 25px;
  cursor: pointer;
  font-weight: bold;
  min-width: 120px;
}

.run-btn:hover {
  background: #f57c00;
}

.end-btn {
  background: #f44336;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 25px;
  cursor: pointer;
  font-weight: bold;
  min-width: 100px;
}

.end-btn:hover:not(:disabled) {
  background: #d32f2f;
}

.end-btn:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.back-btn {
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 25px;
  cursor: pointer;
  font-weight: bold;
  min-width: 100px;
}

.back-btn:hover {
  background: #45a049;
}

.terminal-toggle {
  position: absolute;
  bottom: 20px;
  right: 30px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  z-index: 1000;
  font-size: 16px;
}

.terminal-toggle:hover {
  background: #45a049;
}

.container {
  display: flex;
  height: 100vh;
}

.debug-btn {
  position: absolute;
  top: 20px;
  left: 30px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  z-index: 1000;
  font-weight: bold;
}

.debug-btn:hover {
  background: #1976D2;
}
</style>