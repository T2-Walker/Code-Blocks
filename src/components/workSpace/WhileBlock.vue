<template>
  <div class="if-content">
    <div class="if-row if-condition-row">
      <span class="if-keyword">while</span>

      <select v-model="leftType" class="if-type-select" @change="onLeftTypeChange">
        <option value="variable">Переменная</option>
        <option value="number">Число</option>
      </select>

      <select
        v-if="leftType === 'variable'"
        v-model="leftVariable"
        class="if-variable-select"
        @change="onLeftVariableChange"
      >
        <option value="">Выберите переменную</option>
        <optgroup label="Переменные">
          <option v-for="varItem in simpleVariables" :key="varItem.name" :value="varItem.name">
            {{ varItem.name }}
          </option>
        </optgroup>
        <optgroup label="Массивы">
          <option v-for="varItem in arrayVariables" :key="varItem.name" :value="varItem.name">
            {{ varItem.name }} [{{ varItem.elementType }}[{{ varItem.size }}]]
          </option>
        </optgroup>
      </select>

      <select v-if="leftIsArray" v-model="leftIndex" class="if-index-select" @change="emitUpdate">
        <option value="all">Весь массив</option>
        <option v-for="i in leftArraySize" :key="i - 1" :value="i - 1">[{{ i - 1 }}]</option>
      </select>

      <input
        v-else-if="leftType === 'number'"
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
        @change="onRightVariableChange"
      >
        <option value="">Выберите переменную</option>
        <optgroup label="Переменные">
          <option v-for="varItem in simpleVariables" :key="varItem.name" :value="varItem.name">
            {{ varItem.name }}
          </option>
        </optgroup>
        <optgroup label="Массивы">
          <option v-for="varItem in arrayVariables" :key="varItem.name" :value="varItem.name">
            {{ varItem.name }} [{{ varItem.elementType }}[{{ varItem.size }}]]
          </option>
        </optgroup>
      </select>

      <select v-if="rightIsArray" v-model="rightIndex" class="if-index-select" @change="emitUpdate">
        <option value="all">Весь массив</option>
        <option v-for="i in rightArraySize" :key="i - 1" :value="i - 1">[{{ i - 1 }}]</option>
      </select>

      <input
        v-else-if="rightType === 'number'"
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
      <span class="if-result" :class="{ true: conditionResult, false: !conditionResult }">
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

const leftIndex = ref(props.block.leftIndex || 'all')
const rightIndex = ref(props.block.rightIndex || 'all')

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

const allVariables = computed(() => variables.value || [])

const simpleVariables = computed(() =>
  allVariables.value.filter((v) => v.type !== 'array' && allowedNames.value.includes(v.name)),
)

const arrayVariables = computed(() =>
  allVariables.value.filter((v) => v.type === 'array' && allowedNames.value.includes(v.name)),
)

watch(
  allowedNames,
  (names) => {
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
  },
  { immediate: true },
)

const leftIsArray = computed(() => {
  if (leftType.value !== 'variable' || !leftVariable.value) return false
  const v = getVariableByName(leftVariable.value)
  return v?.type === 'array'
})

const leftArraySize = computed(() => {
  if (!leftIsArray.value) return 0
  const v = getVariableByName(leftVariable.value)
  return v?.size || 0
})

const rightIsArray = computed(() => {
  if (rightType.value !== 'variable' || !rightVariable.value) return false
  const v = getVariableByName(rightVariable.value)
  return v?.type === 'array'
})

const rightArraySize = computed(() => {
  if (!rightIsArray.value) return 0
  const v = getVariableByName(rightVariable.value)
  return v?.size || 0
})

const getLeftValue = () => {
  if (leftType.value === 'number') return leftNumber.value

  const varObj = getVariableByName(leftVariable.value)
  if (!varObj) return 0

  // Для массива
  if (varObj.type === 'array') {
    if (leftIndex.value === 'all') {
      // Для "весь массив" используем первый элемент
      return varObj.value[0] || 0
    } else {
      const idx = parseInt(leftIndex.value)
      return varObj.value[idx] || 0
    }
  }

  // Для обычной переменной
  return varObj.value
}

const getRightValue = () => {
  if (rightType.value === 'number') return rightNumber.value

  const varObj = getVariableByName(rightVariable.value)
  if (!varObj) return 0

  if (varObj.type === 'array') {
    if (rightIndex.value === 'all') {
      return varObj.value[0] || 0
    } else {
      const idx = parseInt(rightIndex.value)
      return varObj.value[idx] || 0
    }
  }
  return varObj.value
}

const conditionResult = computed(() => {
  const leftVal = getLeftValue()
  const rightVal = getRightValue()

  switch (comparator.value) {
    case '==':
      return leftVal == rightVal
    case '!=':
      return leftVal != rightVal
    case '>':
      return leftVal > rightVal
    case '<':
      return leftVal < rightVal
    case '>=':
      return leftVal >= rightVal
    case '<=':
      return leftVal <= rightVal
    default:
      return false
  }
})

const conditionExpression = computed(() => {
  let left = leftType.value === 'variable' ? leftVariable.value : leftNumber.value
  let right = rightType.value === 'variable' ? rightVariable.value : rightNumber.value
  let leftVal = getLeftValue()
  let rightVal = getRightValue()

  if (leftIsArray.value && leftIndex.value !== 'all') {
    left = `${leftVariable.value}[${leftIndex.value}] (${leftVal})`
  } else if (leftIsArray.value) {
    left = `${leftVariable.value}[0] (${leftVal})`
  } else if (leftType.value === 'variable') {
    left = `${leftVariable.value} (${leftVal})`
  }

  if (rightIsArray.value && rightIndex.value !== 'all') {
    right = `${rightVariable.value}[${rightIndex.value}] (${rightVal})`
  } else if (rightIsArray.value) {
    right = `${rightVariable.value}[0] (${rightVal})`
  } else if (rightType.value === 'variable') {
    right = `${rightVariable.value} (${rightVal})`
  }

  return `${left} ${comparator.value} ${right}`
})

watch(conditionResult, (newResult) => {
  emit('condition-check', {
    id: props.block.id,
    result: newResult,
    expression: conditionExpression.value,
  })
})

const emitUpdate = () => {
  const updateData = {
    id: props.block.id,
    leftType: leftType.value,
    leftVariable: leftVariable.value,
    leftIndex: leftIndex.value,
    leftNumber: leftNumber.value,
    comparator: comparator.value,
    rightType: rightType.value,
    rightVariable: rightVariable.value,
    rightIndex: rightIndex.value,
    rightNumber: rightNumber.value,
  }

  console.log('WhileBlock emitUpdate:', updateData)

  emit('update-block', updateData)
}

const onLeftTypeChange = () => {
  if (leftType.value === 'variable') {
    leftVariable.value = ''
  } else {
    leftNumber.value = 0
  }
  leftIndex.value = 'all'
  emitUpdate()
}

const onRightTypeChange = () => {
  if (rightType.value === 'variable') {
    rightVariable.value = ''
  } else {
    rightNumber.value = 0
  }
  rightIndex.value = 'all'
  emitUpdate()
}

const onLeftVariableChange = () => {
  leftIndex.value = 'all'
  emitUpdate()
}

const onRightVariableChange = () => {
  rightIndex.value = 'all'
  emitUpdate()
}
</script>

<style scoped>
.if-content {
  min-width: 400px;
  padding: 15px;
  background-color: #0000ff;
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
  min-width: 120px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 12px;
  cursor: pointer;
}

.if-index-select {
  width: 80px;
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
  background: #ffc107;
  color: #333;
}

.if-result-row {
  margin-top: 12px;
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
  background: #4caf50;
  color: white;
}

.if-result.false {
  background: #f44336;
  color: white;
}

select,
input {
  outline: none;
}

select:hover,
input:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

select:focus,
input:focus {
  border-color: #4caf50;
}
</style>
