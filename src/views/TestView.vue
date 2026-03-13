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
import { getDeclaredVariableNamesBeforeBlock } from '@/domain/chainContext.js'

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
  updatePosition,
} = useTerminal()

const { isExecuted, saveInitialState, restoreInitialState, setExecuted, resetExecution } =
  useExecutionState()
const updateVariableValue = (name, value) => {
  const variable = getVariableByName(name)
  if (variable) {
    upsertVariable({
      oldName: name,
      name,
      type: variable.type,
      value
    })
    console.log('upsertVariable выполнен')
  } else {
    console.log('Переменная не найдена!')
  }
}

const updateVariableBlockValue = (varName, newValue) => {
  console.log('updateVariableBlockValue:', varName, newValue)

  const variableBlocks = blocks.value.filter(b =>
    b.type === 'variable' &&
    b.savedVariables?.some(v => v.name === varName)
  )

  variableBlocks.forEach(block => {
    const varIndex = block.savedVariables.findIndex(v => v.name === varName)
    if (varIndex !== -1) {
      const updatedSavedVariables = [...block.savedVariables]
      updatedSavedVariables[varIndex] = {
        ...updatedSavedVariables[varIndex],
        value: newValue
      }

      updateBlockPosition({
        id: block.id,
        savedVariables: updatedSavedVariables
      })
    }
  })
}

watch(
  variables,
  (newVars) => {
    if (!isExecuted.value) {
      saveInitialState(newVars)
    }
  },
  { deep: true, immediate: true },
)

const addBlock = (newBlock) => {

  const exists = blocks.value.some(b => b.id === newBlock.id)
  if (exists) {
    return
  }

  blocks.value.push(newBlock)
  addLine(`Создан блок: ${newBlock.type}`, 'success')
}
const updateBlockPosition = (data) => {
  const block = blocks.value.find((b) => b.id === data.id)
  if (block) {
    if (data.x !== undefined) block.x = Math.round(data.x)
    if (data.y !== undefined) block.y = Math.round(data.y)
    if (data.variableName !== undefined) block.variableName = data.variableName
    if (data.variableType !== undefined) block.variableType = data.variableType
    if (data.variableValue !== undefined) block.variableValue = data.variableValue
    if (data.targetVariable !== undefined) block.targetVariable = data.targetVariable
    if (data.leftType !== undefined) block.leftType = data.leftType
    if (data.leftVariable !== undefined) block.leftVariable = data.leftVariable
    if (data.leftNumber !== undefined) block.leftNumber = data.leftNumber
    if (data.operator !== undefined) block.operator = data.operator
    if (data.rightType !== undefined) block.rightType = data.rightType
    if (data.rightVariable !== undefined) block.rightVariable = data.rightVariable
    if (data.rightNumber !== undefined) block.rightNumber = data.rightNumber
    if (data.selectedVariables !== undefined) block.selectedVariables = data.selectedVariables
    if (data.comparator !== undefined) block.comparator = data.comparator
    if (data.savedVariables !== undefined) block.savedVariables = data.savedVariables
    if (data.leftIndex !== undefined) block.leftIndex = data.leftIndex
    if (data.rightIndex !== undefined) block.rightIndex = data.rightIndex
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
  const blockName = block ? block.variableName || block.name : 'блок'
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

const onMathExecute = ({ result, targetVariable, targetArray, targetIndex }) => {

  if (targetArray) {
    const arrayVar = getVariableByName(targetArray)
    if (arrayVar && arrayVar.type === 'array') {
      const newArray = [...arrayVar.value]
      newArray[targetIndex] = result

      upsertVariable({
        oldName: targetArray,
        name: targetArray,
        type: 'array',
        elementType: arrayVar.elementType,
        size: arrayVar.size,
        value: newArray
      })

      updateVariableBlockValue(targetArray, newArray)


    }
  } else if (targetVariable) {
    updateVariableValue(targetVariable, result)
    updateVariableBlockValue(targetVariable, result)


  }
}
const runExecution = async (initialContext = null) => {
  addLine('--- Начало выполнения ---', 'output')

  if (!initialContext) {
    const startBlocks = blocks.value.filter((b) => b.type === 'start')
    if (startBlocks.length === 0) {
      addLine('Ошибка: Не найден блок "Начать"', 'error')
      return
    }
    saveInitialState(variables.value)
  }

  const currentVariables = {}
  if (initialContext) {
    Object.assign(currentVariables, initialContext)
  } else {
    variables.value.forEach((v) => {
      currentVariables[v.name] = v.value
    })
  }

  const { chains, reachableIds } = initialContext?.startId
    ? buildExecutionChains(blocks.value, initialContext.startId)
    : buildExecutionChains(blocks.value)

  const getVarValueByName = (name) => {
    return currentVariables[name]
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
          block.savedVariables.forEach((v) => {
            if (v.name) {
              touchVar(v.name)
              currentVariables[v.name] = v.value
            }
          })
        } else if (block.variableName) {
          touchVar(block.variableName)
          currentVariables[block.variableName] = block.variableValue ?? 0
        }
      }
      if (block.type === 'if') {
        console.log('If block data:', {
          leftType: block.leftType,
          leftVariable: block.leftVariable,
          leftIndex: block.leftIndex,
          leftNumber: block.leftNumber,
          comparator: block.comparator,
          rightType: block.rightType,
          rightVariable: block.rightVariable,
          rightIndex: block.rightIndex,
          rightNumber: block.rightNumber,
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
          case '==':
            conditionMet = leftVal == rightVal
            break
          case '!=':
            conditionMet = leftVal != rightVal
            break
          case '>':
            conditionMet = leftVal > rightVal
            break
          case '<':
            conditionMet = leftVal < rightVal
            break
          case '>=':
            conditionMet = leftVal >= rightVal
            break
          case '<=':
            conditionMet = leftVal <= rightVal
            break
        }

        const varNamesBeforeIf = getDeclaredVariableNamesBeforeBlock(
          blocks.value,
          connections.value,
          block.id,
        )

        if (conditionMet) {
          let thenContext = {
            startId: null,
          }
          varNamesBeforeIf.forEach((name) => {
            thenContext[name] = currentVariables[name]
          })

          const thenConnections = connections.value.filter(
            (conn) => conn.from === block.id && conn.type === 'then',
          )

          for (const thenConn of thenConnections) {
            const thenResult = runExecution({
              ...thenContext,
              startId: thenConn.to,
            })

            if (thenResult) {
              Object.assign(currentVariables, thenResult)
            }
          }
          addLine(`Условие ${leftDisplay} ${comparator} ${rightDisplay} выполнено`, 'success')
        } else {
          addLine(`Условие ${leftDisplay} ${comparator} ${rightDisplay} не выполнено`, 'error')
          if (!initialContext) break
        }
      }

      if (block.type === 'while') {
  console.log('While block data:', {
    leftType: block.leftType,
    leftVariable: block.leftVariable,
    leftIndex: block.leftIndex,
    leftNumber: block.leftNumber,
    comparator: block.comparator,
    rightType: block.rightType,
    rightVariable: block.rightVariable,
    rightIndex: block.rightIndex,
    rightNumber: block.rightNumber,
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
  if (block.leftType === 'variable') {
    leftVal = getValueWithIndex(block.leftVariable, block.leftIndex)
  } else {
    leftVal = block.leftNumber || 0
  }

  let rightVal = 0
  if (block.rightType === 'variable') {
    rightVal = getValueWithIndex(block.rightVariable, block.rightIndex)
  } else {
    rightVal = block.rightNumber || 0
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

  const varNamesBeforeWhile = getDeclaredVariableNamesBeforeBlock(
    blocks.value,
    connections.value,
    block.id,
  )

  if (conditionMet) {
    const thenConnections = connections.value.filter(
      (conn) => conn.from === block.id && conn.type === 'then',
    )

    let iterationCount = 0
    const MAX_ITERATIONS = 500

    while (conditionMet && iterationCount < MAX_ITERATIONS) {
      iterationCount++

      addLine(`▶️ Итерация ${iterationCount} началась`, 'output')

      let loopContext = {}
      varNamesBeforeWhile.forEach((name) => {
        loopContext[name] = currentVariables[name]
      })

      for (const thenConn of thenConnections) {
        const targetBlock = blocks.value.find(b => b.id === thenConn.to)

        if (targetBlock && targetBlock.type === 'math') {

          targetBlock.executeTrigger = (targetBlock.executeTrigger || 0) + 1

          updateBlockPosition({
            id: targetBlock.id,
            executeTrigger: targetBlock.executeTrigger
          })

          await new Promise(resolve => setTimeout(resolve, 10))

        } else {
          const loopResult = runExecution({
            ...loopContext,
            startId: thenConn.to,
          })

          if (loopResult) {
            Object.assign(currentVariables, loopResult)
          }
        }
      }
      if (block.leftType === 'variable') {
        leftVal = getValueWithIndex(block.leftVariable, block.leftIndex)
      } else {
        leftVal = block.leftNumber || 0
      }

      if (block.rightType === 'variable') {
        rightVal = getValueWithIndex(block.rightVariable, block.rightIndex)
      } else {
        rightVal = block.rightNumber || 0
      }


      let leftDisplay = ''
      let rightDisplay = ''

      if (block.leftType === 'variable') {
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
        leftDisplay = String(leftVal)
      }

      if (block.rightType === 'variable') {
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
        rightDisplay = String(rightVal)
      }

      switch (comparator) {
        case '==': conditionMet = leftVal == rightVal; break
        case '!=': conditionMet = leftVal != rightVal; break
        case '>': conditionMet = leftVal > rightVal; break
        case '<': conditionMet = leftVal < rightVal; break
        case '>=': conditionMet = leftVal >= rightVal; break
        case '<=': conditionMet = leftVal <= rightVal; break
      }

      addLine(`Итерация ${iterationCount} завершена: ${leftDisplay} ${comparator} ${rightDisplay} = ${conditionMet}`, 'output')
    }

    if (iterationCount >= MAX_ITERATIONS) {
      addLine(`Достигнут лимит итераций (${MAX_ITERATIONS}) в блоке while`, 'warning')
    }

    addLine(`Цикл выполнен ${iterationCount} раз`, 'success')
  }
}

      if (block.type === 'math') {
  const isThenBranch = initialContext?.startId !== undefined
  const prefix = isThenBranch ? '[then] ' : ''

  if (isThenBranch) {
    continue
  }
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

  currentVariables[block.targetVariable] = result
  addLine(`${prefix}📝 ${block.targetVariable} = ${result}`, 'print')

  if (!initialContext) {
    updateVariableValue(block.targetVariable, result)
  }
}

      if (block.type === 'print') {
        const itemsToPrint = block.selectedVariables || []

        const isThenBranch = initialContext?.startId !== undefined
        const prefix = isThenBranch ? '[then] ' : ''

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
                  addLine(`  ${prefix}${v.name} = [${v.value.join(', ')}]`, 'print')
                } else {
                  const idx = parseInt(index)
                  addLine(`  ${prefix}${v.name}[${idx}] = ${v.value[idx]}`, 'print')
                }
              } else {
                addLine(`  ${prefix}${v.name} = ${v.value}`, 'print')
              }
            } else {
              addLine(`  ${prefix}${varName} = (переменная не найдена)`, 'error')
            }
          }
        }
      }
    }
  }

  if (!initialContext) {
    setExecuted()
  }

  addLine('--- Выполнение завершено ---', 'output')

  if (initialContext) {
    return currentVariables
  }
}
const endExecution = () => {
  restoreInitialState(updateVariableValue)
  resetExecution()
  addLine('Возврат к начальным значениям', 'output')
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
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  z-index: 1000;
  font-weight: bold;
}

.debug-btn:hover {
  background: #1976d2;
}
</style>
