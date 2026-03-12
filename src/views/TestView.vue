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
  const variable = getVariableByName(name)
  if (variable) {
    upsertVariable({
      oldName: name,
      name,
      type: variable.type,
      value
    })
  }
}

  watch(variables, (newVars) => {
    if (!isExecuted.value) {
      saveInitialState(newVars)
    }
  }, { deep: true, immediate: true })

const addBlock = (newBlock) => {

  const exists = blocks.value.some(b => b.id === newBlock.id)
  if (exists) {
    return
  }

  blocks.value.push(newBlock)
  addLine(`Создан блок: ${newBlock.type}`, 'success')
}

const updateBlockPosition = ({
  id, x, y, variableName, variableType, variableValue,
  targetVariable, leftType, leftVariable, leftNumber, operator,
  rightType, rightVariable, rightNumber, selectedVariables,
  comparator, savedVariables, leftIndex, rightIndex  // ← ДОБАВИТЬ СЮДА
}) => {
  console.log('📥 TestView updateBlockPosition:', {
    id, x, y, variableName, variableType, variableValue,
    targetVariable, leftVariable, rightVariable, selectedVariables,
    comparator, savedVariables, leftIndex, rightIndex  // ← И В ЛОГИ
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
    if (leftIndex !== undefined) block.leftIndex = leftIndex    // ← ДОБАВИТЬ
    if (operator !== undefined) block.operator = operator
    if (rightType !== undefined) block.rightType = rightType
    if (rightVariable !== undefined) block.rightVariable = rightVariable
    if (rightNumber !== undefined) block.rightNumber = rightNumber
    if (rightIndex !== undefined) block.rightIndex = rightIndex  // ← ДОБАВИТЬ
    if (selectedVariables !== undefined) block.selectedVariables = selectedVariables
    if (comparator !== undefined) block.comparator = comparator
    if (savedVariables !== undefined) block.savedVariables = savedVariables
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
        if (block.savedVariables && Array.isArray(block.savedVariables)) {
          block.savedVariables.forEach(v => {
            if (v.name) touchVar(v.name)
          })
        } else if (block.variableName) {
          touchVar(block.variableName)
        }
      }
if (block.type === 'if') {
  console.log('🔍 IF block data:', {
    leftType: block.leftType,
    leftVariable: block.leftVariable,
    leftIndex: block.leftIndex,
    leftNumber: block.leftNumber,
    comparator: block.comparator,
    rightType: block.rightType,
    rightVariable: block.rightVariable,
    rightIndex: block.rightIndex,
    rightNumber: block.rightNumber
  })


  const getValueWithIndex = (varName, index) => {
    const v = getVariableByName(varName)
    if (!v) return 0

    if (v.type === 'array') {
      if (index === 'all') {
        return v.value[0] || 0
      } else {
        const idx = parseInt(index)
        return v.value[idx] || 0
      }
    }
    return v.value
  }

  let leftVal = 0
  let leftDisplay = ''

  if (block.leftType === 'variable') {
    leftVal = getValueWithIndex(block.leftVariable, block.leftIndex)
    const v = getVariableByName(block.leftVariable)

    if (v && v.type === 'array') {
      if (block.leftIndex === 'all') {
        leftDisplay = `${block.leftVariable}[0] (${leftVal})`
      } else {
        leftDisplay = `${block.leftVariable}[${block.leftIndex}] (${leftVal})`
      }
    } else {
      leftDisplay = `${block.leftVariable} (${leftVal})`
    }
  } else {
    leftVal = block.leftNumber || 0
    leftDisplay = String(leftVal)
  }

  let rightVal = 0
  let rightDisplay = ''

  if (block.rightType === 'variable') {
    rightVal = getValueWithIndex(block.rightVariable, block.rightIndex)
    const v = getVariableByName(block.rightVariable)

    if (v && v.type === 'array') {
      if (block.rightIndex === 'all') {
        rightDisplay = `${block.rightVariable}[0] (${rightVal})`
      } else {
        rightDisplay = `${block.rightVariable}[${block.rightIndex}] (${rightVal})`
      }
    } else {
      rightDisplay = `${block.rightVariable} (${rightVal})`
    }
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

  // Выводим результат
  if (conditionMet) {
    addLine(`✅ Условие ${leftDisplay} ${comparator} ${rightDisplay} выполнено`, 'success')
  } else {
    addLine(`❌ Условие ${leftDisplay} ${comparator} ${rightDisplay} не выполнено`, 'error')
    break
  }
}
      if (block.type === 'math') {
        if (!block.targetVariable) {
          addLine('Math-блок без целевой переменной, пропуск', 'error')
          continue
        }
        let leftVal = 0
        if (block.leftType === 'variable') {
          const v = getVarValueByName(block.leftVariable)
          leftVal = typeof v === 'number' ? v : 0
        } else {
          leftVal = block.leftNumber || 0
        }

        let rightVal = 0
        if (block.rightType === 'variable') {
          const v = getVarValueByName(block.rightVariable)
          rightVal = typeof v === 'number' ? v : 0
        } else {
          rightVal = block.rightNumber || 0
        }

        let result
        switch (block.operator) {
          case '+': result = leftVal + rightVal; break
          case '-': result = leftVal - rightVal; break
          case '*': result = leftVal * rightVal; break
          case '/': result = rightVal !== 0 ? leftVal / rightVal : 'Ошибка'; break
          case '%': result = rightVal !== 0 ? leftVal % rightVal : 'Ошибка'; break
          default: result = 0
        }

        if (result === 'Ошибка') {
          addLine(`Ошибка в math-блоке: деление на ноль`, 'error')
          continue
        }

        updateVariableValue(block.targetVariable, result)

      }

      if (block.type === 'print') {
  const itemsToPrint = block.selectedVariables || []

  if (itemsToPrint.length === 0) {
    addLine('Нет переменных для вывода', 'output')
  } else {
    addLine('Вывод:', 'output')
    for (const item of itemsToPrint) {
      const varName = item.name || item
      const v = getVariableByName(varName)

      if (v) {
        if (v.type === 'array') {
          const index = item.index
          if (index === 'all') {
            addLine(`  ${v.name} = [${v.value.join(', ')}]`, 'print')
          } else {
            const idx = parseInt(index)
            addLine(`  ${v.name}[${idx}] = ${v.value[idx]}`, 'print')
          }
        } else {
          addLine(`  ${v.name} = ${v.value}`, 'print')
        }
      } else {
        addLine(`  ${varName} = (переменная не найдена)`, 'error')
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
  background-color: #1f1a2e;
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
