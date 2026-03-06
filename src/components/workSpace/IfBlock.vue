<template>
  <div class="if-content">
      <div class="if-row if-condition-row">
        <span class="if-keyword">if</span>
        
        <select v-model="leftType" class="if-type-select" @change="onLeftTypeChange">
          <option value="variable">Переменная</option>
          <option value="number">Число</option>
        </select>
        
        <select 
          v-if="leftType === 'variable'" 
          v-model="leftVariable" 
          class="if-variable-select"
          @change="emitUpdate"
        >
          <option value="">Выберите переменную</option>
          <option v-for="varItem in allowedVariables" :key="varItem.name" :value="varItem.name">
            {{ varItem.name }}
          </option>
        </select>
        
        <input
          v-else
          v-model.number="leftNumber"
          type="number"
          class="if-number-input"
          placeholder="число"
          @input="emitUpdate"
        />

        <select v-model="comparator" class="if-comparator-select" @change="emitUpdate">
          <option value="==">==</option>
          <option value="!=">!=</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value=">=">&gt;=</option>
          <option value="<=">&lt;=</option>
        </select>

        <select v-model="rightType" class="if-type-select" @change="onRightTypeChange">
          <option value="variable">Переменная</option>
          <option value="number">Число</option>
        </select>
        
        <select 
          v-if="rightType === 'variable'" 
          v-model="rightVariable" 
          class="if-variable-select"
          @change="emitUpdate"
        >
          <option value="">Выберите переменную</option>
          <option v-for="varItem in allowedVariables" :key="varItem.name" :value="varItem.name">
            {{ varItem.name }}
          </option>
        </select>
        
        <input
          v-else
          v-model.number="rightNumber"
          type="number"
          class="if-number-input"
          placeholder="число"
          @input="emitUpdate"
        />
      </div>

      <div class="if-row if-result-row">
        <span class="if-condition-display">
          {{ conditionExpression }}
        </span>
        <span class="if-result" :class="{ 'true': conditionResult, 'false': !conditionResult }">
          {{ conditionResult ? 'true' : 'false' }}
        </span>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVariables } from '@/composables/useVariables'
import { getDeclaredVariableNamesBeforeBlock } from '@/domain/chainContext'

const props = defineProps({
  block: Object,
  allBlocks: Array,
  allConnections: Array,
})

const emit = defineEmits(['update-block', 'condition-check'])

const { variables, getVariableByName } = useVariables()

const leftType = ref(props.block.leftType || 'variable')
const leftVariable = ref(props.block.leftVariable || '')
const leftNumber = ref(props.block.leftNumber || 0)
const comparator = ref(props.block.comparator || '==')
const rightType = ref(props.block.rightType || 'variable')
const rightVariable = ref(props.block.rightVariable || '')
const rightNumber = ref(props.block.rightNumber || 0)

const allowedNames = computed(() => {
  return getDeclaredVariableNamesBeforeBlock(
    props.allBlocks || [],
    props.allConnections || [],
    props.block.id,
  )
})

const allowedVariables = computed(() => {
  const byName = new Map((variables.value || []).map((v) => [v.name, v]))
  return allowedNames.value.map((name) => byName.get(name)).filter(Boolean)
})

watch(allowedNames, (names) => {
  const set = new Set(names)
  let changed = false

  if (leftType.value === 'variable' && leftVariable.value && !set.has(leftVariable.value)) {
    leftVariable.value = ''
    changed = true
  }

  if (rightType.value === 'variable' && rightVariable.value && !set.has(rightVariable.value)) {
    rightVariable.value = ''
    changed = true
  }

  if (changed) {
    emitUpdate()
  }
}, { immediate: true })

const getLeftValue = () => {
  if (leftType.value === 'variable') {
    const varObj = getVariableByName(leftVariable.value)
    return varObj ? varObj.value : 0
  }
  return leftNumber.value
}

const getRightValue = () => {
  if (rightType.value === 'variable') {
    const varObj = getVariableByName(rightVariable.value)
    return varObj ? varObj.value : 0
  }
  return rightNumber.value
}

const conditionResult = computed(() => {
  const leftVal = getLeftValue()
  const rightVal = getRightValue()
  
  switch (comparator.value) {
    case '==': return leftVal == rightVal
    case '!=': return leftVal != rightVal
    case '>': return leftVal > rightVal
    case '<': return leftVal < rightVal
    case '>=': return leftVal >= rightVal
    case '<=': return leftVal <= rightVal
    default: return false
  }
})

const conditionExpression = computed(() => {
  const left = leftType.value === 'variable' ? leftVariable.value : leftNumber.value
  const right = rightType.value === 'variable' ? rightVariable.value : rightNumber.value
  return `${left} ${comparator.value} ${right}`
})

watch(conditionResult, (newResult) => {
  emit('condition-check', {
    id: props.block.id,
    result: newResult,
    expression: conditionExpression.value
  })
})

const emitUpdate = () => {
  const updateData = {
    id: props.block.id,
    leftType: leftType.value,
    leftVariable: leftVariable.value,
    leftNumber: leftNumber.value,
    comparator: comparator.value,
    rightType: rightType.value,
    rightVariable: rightVariable.value,
    rightNumber: rightNumber.value,
  }
  
  console.log('📤 IfBlock emitUpdate:', updateData)
  
  emit('update-block', updateData)
}

const onLeftTypeChange = () => {
  if (leftType.value === 'variable') {
    leftVariable.value = ''
  } else {
    leftNumber.value = 0
  }
  emitUpdate()
}

const onRightTypeChange = () => {
  if (rightType.value === 'variable') {
    rightVariable.value = ''
  } else {
    rightNumber.value = 0
  }
  emitUpdate()
}

// drag и кнопка соединения обрабатываются во внешнем WorkspaceBlock
</script>

<style scoped>
.if-content {
  min-width: 350px;
  padding: 15px;
  background-color: #FFC107;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
}

.if-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  width: 100%;
}

.if-condition-row {
  flex-wrap: wrap;
}

.if-keyword {
  font-weight: bold;
  color: white;
  font-size: 16px;
  margin-right: 5px;
}

.if-type-select {
  width: 90px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.if-variable-select {
  flex: 1;
  min-width: 100px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 12px;
  cursor: pointer;
}

.if-number-input {
  width: 80px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 12px;
  text-align: center;
}

.if-comparator-select {
  width: 70px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  cursor: pointer;
}

.if-comparator-select option {
  background: #FFC107;
  color: #333;
}

.if-result-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  justify-content: flex-start;
}

.if-condition-display {
  font-size: 14px;
  color: white;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}

.if-result {
  font-size: 14px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 4px;
}

.if-result.true {
  background: #4CAF50;
  color: white;
}

.if-result.false {
  background: #f44336;
  color: white;
}

.connect-btn {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 24px;
  height: 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.if-block:hover .connect-btn {
  opacity: 1;
}

.connect-btn:hover {
  background-color: #45a049;
  transform: scale(1.1);
}

select, input {
  outline: none;
}

select:hover, input:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

select:focus, input:focus {
  border-color: #4CAF50;
}
</style>