<template>
  <div class="math-content">
      <div class="math-row math-target-row">
        <select v-model="targetVariable" class="math-target-select" @change="onTargetChange">
          <option value="">Выберите переменную</option>
          <option v-for="varItem in allowedVariables" :key="varItem.name" :value="varItem.name">
            {{ varItem.name }}
          </option>
        </select>
        <span class="math-equals">=</span>
      </div>

      <div class="math-row">
        <select v-model="leftType" class="math-type-select" @change="onLeftTypeChange">
          <option value="variable">Переменная</option>
          <option value="number">Число</option>
        </select>

        <select
          v-if="leftType === 'variable'"
          v-model="leftVariable"
          class="math-variable-select"
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
          class="math-number-input"
          placeholder="число"
          @input="emitUpdate"
        />
      </div>

      <div class="math-row math-operator-row">
        <select v-model="operator" class="math-operator-select" @change="emitUpdate">
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">×</option>
          <option value="/">÷</option>
          <option value="%">%</option>
        </select>
      </div>

      <div class="math-row">
        <select v-model="rightType" class="math-type-select" @change="onRightTypeChange">
          <option value="variable">Переменная</option>
          <option value="number">Число</option>
        </select>

        <select
          v-if="rightType === 'variable'"
          v-model="rightVariable"
          class="math-variable-select"
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
          class="math-number-input"
          placeholder="число"
          @input="emitUpdate"
        />
      </div>

      <div class="math-row math-result-row" v-if="targetVariable">
        <span class="math-result-label">{{ targetVariable }} =</span>
        <span class="math-result">{{ computedResult }}</span>
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

const emit = defineEmits(['update-block', 'execute'])

const { variables, getVariableByName } = useVariables()

const targetVariable = ref(props.block.targetVariable || '')
const leftType = ref(props.block.leftType || 'variable')
const leftVariable = ref(props.block.leftVariable || '')
const leftNumber = ref(props.block.leftNumber || 0)
const operator = ref(props.block.operator || '+')
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

const allowedNameSet = computed(() => new Set(allowedNames.value))

const allowedVariables = computed(() => {
  // сохраняем порядок из цепочки; берём только реально существующие переменные
  const byName = new Map((variables.value || []).map((v) => [v.name, v]))
  return allowedNames.value.map((name) => byName.get(name)).filter(Boolean)
})

watch(
  allowedNameSet,
  (set) => {
    let changed = false

    if (targetVariable.value && !set.has(targetVariable.value)) {
      targetVariable.value = ''
      changed = true
    }

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

const computedResult = computed(() => {
  let leftVal = 0
  if (leftType.value === 'variable') {
    const varObj = getVariableByName(leftVariable.value)
    leftVal = varObj ? varObj.value : 0
  } else {
    leftVal = leftNumber.value
  }

  let rightVal = 0
  if (rightType.value === 'variable') {
    const varObj = getVariableByName(rightVariable.value)
    rightVal = varObj ? varObj.value : 0
  } else {
    rightVal = rightNumber.value
  }

  switch (operator.value) {
    case '+': return leftVal + rightVal
    case '-': return leftVal - rightVal
    case '*': return leftVal * rightVal
    case '/': return rightVal !== 0 ? leftVal / rightVal : 'Ошибка'
    case '%': return rightVal !== 0 ? leftVal % rightVal : 'Ошибка'
    default: return 0
  }
})

watch(computedResult, (newResult) => {
  if (targetVariable.value && newResult !== 'Ошибка') {
    emit('execute', {
      id: props.block.id,
      result: newResult,
      targetVariable: targetVariable.value
    })
  }
})

const emitUpdate = () => {
  const result = computedResult.value

  const updateData = {
    id: props.block.id,
    targetVariable: targetVariable.value,
    leftType: leftType.value,
    leftVariable: leftVariable.value,
    leftNumber: leftNumber.value,
    operator: operator.value,
    rightType: rightType.value,
    rightVariable: rightVariable.value,
    rightNumber: rightNumber.value,
    result: result
  }

  console.log('🚀 MathBlock emitUpdate CALLED with:', JSON.stringify(updateData))

  emit('update-block', updateData)
}

const onTargetChange = () => {
  emitUpdate()
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
.math-content {
  min-width: 300px;
  padding: 15px;
  background-color: #FF5722;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
}

select, input {
  background: white !important;
}

.math-row,
.math-target-row,
.math-operator-row,
.math-result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  width: 100%;
  background-color: #FF5722;
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

.math-block:hover .connect-btn,
.math-block:hover .delete-btn {
  opacity: 1;
}
.math-target-row {
  margin-bottom: 5px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.math-target-select {
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.math-target-select option {
  background: #FF5722;
  color: white;
}

.math-type-select {
  width: 90px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.math-variable-select {
  flex: 1;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 12px;
  cursor: pointer;
}

.math-number-input {
  width: 80px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 12px;
  text-align: center;
}

.math-operator-row {
  justify-content: center;
}

.math-operator-select {
  width: 60px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  cursor: pointer;
}

.math-operator-select option {
  background: #FF5722;
  color: white;
}

.math-result-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  justify-content: flex-start;
}

.math-result-label {
  font-size: 14px;
  color: white;
  font-weight: bold;
}

.math-result {
  font-size: 18px;
  font-weight: bold;
  color: #4CAF50;
  min-width: 60px;
  text-align: center;
}

.math-equals {
  font-size: 18px;
  font-weight: bold;
  color: white;
  margin: 0 5px;
}
</style>
