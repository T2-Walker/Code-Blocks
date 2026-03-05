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
import SidebarBlocks from '@/components/sidebar/SidebarBlocks.vue'
import WorkspaceArea from '@/components/workSpace/WorkspaceArea.vue'
import DraggableTerminal from '@/components/UI/DraggableTerminal.vue'
import { useTerminal } from '@/composables/useTerminal'
import { useExecutionState } from '@/composables/useExecutionState'
import { getAllConnections } from '@/domain/connections'
import { buildExecutionChains } from '@/domain/executionChains'
import { useVariables } from '@/composables/useVariables'

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

const updateBlockPosition = ({ id, x, y, variableName, variableType, variableValue, targetVariable, leftType, leftVariable, leftNumber, operator, rightType, rightVariable, rightNumber, selectedVariables, comparator }) => {
  console.log('📥 TestView updateBlockPosition:', { 
    id, x, y, variableName, variableType, variableValue, 
    targetVariable, leftVariable, rightVariable, selectedVariables, comparator 
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
    if (selectedVariables !== undefined) block.selectedVariables = selectedVariables
    if (comparator !== undefined) block.comparator = comparator // ЭТО ВАЖНО!
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
 
  const { chains, reachableIds } = buildExecutionChains(blocks.value)

  const getVarValueByName = (name) => {
    const v = getVariableByName(name)
    return v ? v.value : undefined
  }

  for (const chain of chains) {
    const knownVarsSet = new Set()
    const varsOrder = []

    const touchVar = (name) => {
      if (!name) return
      if (!knownVarsSet.has(name)) {
        knownVarsSet.add(name)
        varsOrder.push(name)
      }
    }

    for (const block of chain) {
      if (!reachableIds.has(block.id)) continue

      if (block.type === 'variable') {
        if (block.variableName) {
          touchVar(block.variableName)
        }
      }
// ========== IF БЛОК ==========
if (block.type === 'if') {
  console.log('🔍 IF block data:', {
    leftType: block.leftType,
    leftVariable: block.leftVariable,
    leftNumber: block.leftNumber,
    comparator: block.comparator,
    rightType: block.rightType,
    rightVariable: block.rightVariable,
    rightNumber: block.rightNumber
  })
  
  if (block.leftType === 'variable' && !knownVarsSet.has(block.leftVariable)) {
    addLine(
      `❌ Ошибка: переменная "${block.leftVariable}" не объявлена в цепочке до if-блока`,
      'error',
    )
    break
  }
  
  if (block.rightType === 'variable' && !knownVarsSet.has(block.rightVariable)) {
    addLine(
      `❌ Ошибка: переменная "${block.rightVariable}" не объявлена в цепочке до if-блока`,
      'error',
    )
    break
  }

  let leftVal = 0
  let leftDisplay = ''
  if (block.leftType === 'variable') {
    const v = getVarValueByName(block.leftVariable)
    leftVal = typeof v === 'number' ? v : 0
    leftDisplay = `${block.leftVariable} (${leftVal})`
  } else {
    leftVal = block.leftNumber || 0
    leftDisplay = String(leftVal)
  }

  let rightVal = 0
  let rightDisplay = ''
  if (block.rightType === 'variable') {
    const v = getVarValueByName(block.rightVariable)
    rightVal = typeof v === 'number' ? v : 0
    rightDisplay = `${block.rightVariable} (${rightVal})`
  } else {
    rightVal = block.rightNumber || 0
    rightDisplay = String(rightVal)
  }

  let conditionMet = false
  const comparator = block.comparator || '=='
  
  switch (comparator) {
    case '==': conditionMet = leftVal == rightVal; break
    case '!=': conditionMet = leftVal != rightVal; break
    case '>': conditionMet = leftVal > rightVal; break
    case '<': conditionMet = leftVal < rightVal; break
    case '>=': conditionMet = leftVal >= rightVal; break
    case '<=': conditionMet = leftVal <= rightVal; break
  }

  if (conditionMet) {
    addLine(`✅ Условие ${leftDisplay} ${comparator} ${rightDisplay} выполнено`, 'success')
  } else {
    addLine(`❌ Условие ${leftDisplay} ${comparator} ${rightDisplay} не выполнено`, 'error')
    break
  }
}
      // ========== КОНЕЦ IF БЛОКА ==========

      if (block.type === 'math') {
        if (!block.targetVariable) {
          addLine('Math-блок без целевой переменной, пропуск', 'error')
          continue
        }
        if (!knownVarsSet.has(block.targetVariable)) {
          addLine(
            `Ошибка: целевая переменная "${block.targetVariable}" не объявлена в цепочке до math-блока`,
            'error',
          )
          continue
        }

        let leftVal = 0
        if (block.leftType === 'variable') {
          if (!knownVarsSet.has(block.leftVariable)) {
            addLine(
              `Ошибка: переменная "${block.leftVariable}" не объявлена в цепочке до math-блока`,
              'error',
            )
            continue
          }
          const v = getVarValueByName(block.leftVariable)
          leftVal = typeof v === 'number' ? v : 0
        } else {
          leftVal = block.leftNumber || 0
        }

        let rightVal = 0
        if (block.rightType === 'variable') {
          if (!knownVarsSet.has(block.rightVariable)) {
            addLine(
              `Ошибка: переменная "${block.rightVariable}" не объявлена в цепочке до math-блока`,
              'error',
            )
            continue
          }
          const v = getVarValueByName(block.rightVariable)
          rightVal = typeof v === 'number' ? v : 0
        } else {
          rightVal = block.rightNumber || 0
        }

        let result
        switch (block.operator) {
          case '+':
            result = leftVal + rightVal
            break
          case '-':
            result = leftVal - rightVal
            break
          case '*':
            result = leftVal * rightVal
            break
          case '/':
            result = rightVal !== 0 ? leftVal / rightVal : 'Ошибка'
            break
          case '%':
            result = rightVal !== 0 ? leftVal % rightVal : 'Ошибка'
            break
          default:
            result = 0
        }

        if (result === 'Ошибка') {
          addLine(
            `Ошибка в math-блоке для переменной "${block.targetVariable}": деление на ноль`,
            'error',
          )
          continue
        }

        updateVariableValue(block.targetVariable, result)
        
      }

      if (block.type === 'print') {
        const varsToPrint = block.selectedVariables || []
        
        if (varsToPrint.length === 0) {
          addLine('Нет переменных для вывода', 'output')
        } else {
          addLine('Вывод:', 'output')
          for (const varName of varsToPrint) {
            if (!knownVarsSet.has(varName)) {
              addLine(`  ${varName} = (не объявлена в цепочке)`, 'error')
              continue
            }
            
            const v = getVariableByName(varName)
            if (v) {
              addLine(`  ${v.name} = ${v.value}`, 'print')
            } else {
              addLine(`  ${varName} = (не найдена)`, 'error')
            }
          }
        }
      }
    }
  }
  
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