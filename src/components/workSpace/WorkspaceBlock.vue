<template>
  <div
    class="workspace-block"
    :class="{ dragging: isDragging, 'variable-block': isVariableBlock }"
    :style="{
      left: block.x + 'px',
      top: block.y + 'px',
      backgroundColor: block.color,
    }"
    @pointerdown="startDrag"
  >
    <template v-if="isVariableBlock">
      <div class="variable-content">
        <div class="variable-header">
          <span class="variable-name" @click.stop="startEdit('name')">
            <template v-if="editingField !== 'name'">
              {{ display.name }}
            </template>
            <input
              v-else
              v-model="localName"
              type="text"
              class="inline-input"
              :class="{ error: !!nameError }"
              @keydown.enter.stop.prevent="commitName"
              @blur="commitName"
            />
          </span>
          <span class="variable-type" @click.stop="startEdit('type')">
            <template v-if="editingField !== 'type'">
              {{ display.type }}
            </template>
            <select
              v-else
              v-model="localType"
              class="inline-select"
              @change="commitType"
              @blur="cancelEdit"
            >
              <option
                v-for="type in variableTypes"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </span>
        </div>
        <div class="variable-value" @click.stop="startEdit('value')">
          <template v-if="editingField !== 'value'">
            {{ display.value }}
          </template>
          <input
            v-else-if="localType === 'int' || localType === 'string'"
            v-model="localRawValue"
            type="text"
            class="inline-input"
            :class="{ error: !!valueError }"
            @keydown.enter.stop.prevent="commitValue"
            @blur="commitValue"
          />
          <select
            v-else-if="localType === 'boolean'"
            v-model="localRawValue"
            class="inline-select"
            @change="commitValue"
            @blur="cancelEdit"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
          <input
            v-else
            v-model="localRawValue"
            type="text"
            class="inline-input"
            :class="{ error: !!valueError }"
            @keydown.enter.stop.prevent="commitValue"
            @blur="commitValue"
          />
        </div>
      </div>
    </template>

    <!-- Обычный блок -->
    <template v-else>
      <span>{{ block.name }}</span>
    </template>

    <DeleteButton @delete="$emit('delete', block.id)" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import DeleteButton from '../UI/DeleteButton.vue'
import { useVariables } from '@/composables/useVariables'
import {
  formatVariableForDisplay,
  validateVariableName,
  validateAndNormalizeValue,
} from '@/domain/logic'

const props = defineProps({
  block: Object,
  bounds: Object,
})

const emit = defineEmits(['drag-start', 'drag-move', 'drag-end', 'delete'])

const isDragging = ref(false)
const editingField = ref(null)
const localName = ref('')
const localType = ref('int')
const localRawValue = ref('')
const nameError = ref('')
const valueError = ref('')

const { variables, variableTypes, upsertVariable, getVariableByName } = useVariables()

const isVariableBlock = computed(() => props.block.type === 'variable')

const currentVariable = computed(() => {
  if (!props.block.variableName) return undefined
  return getVariableByName(props.block.variableName)
})

const display = computed(() => {
  if (editingField.value) {
    // во время редактирования отображаем локальные значения
    const temp = {
      name: localName.value,
      type: localType.value,
      value: localRawValue.value,
    }
    return formatVariableForDisplay(temp)
  }

  if (currentVariable.value) {
    return formatVariableForDisplay(currentVariable.value)
  }

  if (props.block.variableName || props.block.variableType || props.block.variableValue != null) {
    return formatVariableForDisplay({
      name: props.block.variableName,
      type: props.block.variableType || 'int',
      value: props.block.variableValue,
    })
  }

  return formatVariableForDisplay(null)
})

watch(
  () => props.block,
  (block) => {
    if (!editingField.value) {
      const baseName = block.variableName || currentVariable.value?.name || ''
      const baseType = block.variableType || currentVariable.value?.type || 'int'
      const baseValue =
        block.variableValue ??
        currentVariable.value?.value ??
        (baseType === 'int' ? 1 : baseType === 'boolean' ? true : '')

      localName.value = baseName
      localType.value = baseType
      localRawValue.value = baseValue
    }
  },
  { immediate: true, deep: true },
)

const startEdit = (field) => {
  if (!isVariableBlock.value) return
  editingField.value = field
  nameError.value = ''
  valueError.value = ''

  if (field === 'name') {
    localName.value = currentVariable.value?.name || props.block.variableName || ''
  }
  if (field === 'type') {
    localType.value = currentVariable.value?.type || props.block.variableType || 'int'
  }
  if (field === 'value') {
    const base = currentVariable.value?.value ?? props.block.variableValue
    if (localType.value === 'boolean') {
      localRawValue.value = base === true ? 'true' : base === false ? 'false' : 'false'
    } else {
      localRawValue.value =
        base === undefined || base === null
          ? localType.value === 'int'
            ? '1'
            : ''
          : String(base)
    }
  }
}

const cancelEdit = () => {
  editingField.value = null
  nameError.value = ''
  valueError.value = ''
}

const commitName = () => {
  const existingNames = variables.value
    .map((v) => v.name)
    .filter((n) => n !== (currentVariable.value?.name || ''))

  const result = validateVariableName(localName.value, existingNames)
  if (!result.ok) {
    nameError.value = result.error
    return
  }

  nameError.value = ''

  const oldName = currentVariable.value?.name || props.block.variableName || ''
  const type = currentVariable.value?.type || localType.value || 'int'
  const value = currentVariable.value?.value ?? localRawValue.value ?? 1

  try {
    upsertVariable({
      oldName: oldName || undefined,
      name: result.value,
      type,
      value,
    })
  } catch (e) {
    nameError.value = e.message
    return
  }

  emit('update-block', {
    id: props.block.id,
    variableName: result.value,
    variableType: type,
    variableValue: value,
  })

  editingField.value = null
}

const commitType = () => {
  const newType = localType.value
  // при смене типа сбрасываем значение
  localRawValue.value = newType === 'int' ? '1' : newType === 'boolean' ? 'false' : ''
  valueError.value = ''

  const name = currentVariable.value?.name || props.block.variableName || localName.value
  if (!name) {
    // ещё не задано имя — просто обновляем локальное состояние блока
    emit('update-block', {
      id: props.block.id,
      variableType: newType,
      variableValue: newType === 'int' ? 1 : newType === 'boolean' ? false : '',
    })
    editingField.value = null
    return
  }

  const valueResult = validateAndNormalizeValue(newType, localRawValue.value)
  if (!valueResult.ok) {
    valueError.value = valueResult.error
    return
  }

  try {
    upsertVariable({
      oldName: name,
      name,
      type: newType,
      value: valueResult.value,
    })
  } catch (e) {
    valueError.value = e.message
    return
  }

  emit('update-block', {
    id: props.block.id,
    variableName: name,
    variableType: newType,
    variableValue: valueResult.value,
  })

  editingField.value = null
}

const commitValue = () => {
  const type = localType.value
  const result = validateAndNormalizeValue(type, localRawValue.value)
  if (!result.ok) {
    valueError.value = result.error
    return
  }

  valueError.value = ''

  const name = currentVariable.value?.name || props.block.variableName || localName.value

  if (name) {
    try {
      upsertVariable({
        oldName: name,
        name,
        type,
        value: result.value,
      })
    } catch (e) {
      valueError.value = e.message
      return
    }
  }

  emit('update-block', {
    id: props.block.id,
    variableName: name,
    variableType: type,
    variableValue: result.value,
  })

  editingField.value = null
}

const startDrag = (event) => {
  // не перетаскиваем если кликнули на значение переменной или на крестик
  if (event.target.classList.contains('delete-btn')) return
  if (event.target.closest('.variable-content')) {
    // внутри блока переменной drag не должен начинаться, если идёт редактирование
    if (editingField.value) return
  }

  event.preventDefault()
  isDragging.value = true

  const startX = event.clientX
  const startY = event.clientY
  const startBlockX = props.block.x
  const startBlockY = props.block.y

  emit('drag-start', props.block.id)

  const onPointerMove = (e) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    let newX = startBlockX + dx
    let newY = startBlockY + dy

    newX = Math.max(props.bounds.minX, Math.min(newX, props.bounds.maxX))
    newY = Math.max(props.bounds.minY, Math.min(newY, props.bounds.maxY))

    emit('drag-move', { id: props.block.id, x: newX, y: newY })
  }

  const onPointerUp = () => {
    isDragging.value = false
    emit('drag-end')
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('pointercancel', onPointerUp)
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerUp)
}
</script>

<style scoped>
.workspace-block {
  position: absolute;
  min-width: 100px;
  padding: 15px 20px;
  border-radius: 5px;
  cursor: move;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  user-select: none;
  transition:
    box-shadow 0.2s,
    transform 0.1s;
  will-change: left, top;
  border: 2px solid transparent;
  color: white;
  font-weight: bold;
}

.workspace-block:hover {
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4);
  transform: scale(1.02);
}

.workspace-block.dragging {
  opacity: 0.9;
  transform: scale(1.02);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.5);
}

.variable-block {
  min-width: 160px;
  padding: 12px;
  cursor: pointer;
}

.variable-block:hover {
  filter: brightness(1.05);
}

.variable-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.variable-name {
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.variable-type {
  font-size: 11px;
  padding: 2px 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  text-transform: lowercase;
}

.variable-value {
  font-size: 13px;
  padding: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-family: monospace;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inline-input,
.inline-select {
  width: 100%;
  border: none;
  outline: none;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 12px;
}

.inline-input.error,
.inline-select.error {
  border: 1px solid #ff6b6b;
}
</style>
