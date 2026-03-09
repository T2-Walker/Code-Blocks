<template>
  <div
    class="workspace-block"
    :class="{
      dragging: isDragging,
      'variable-block': block.type === 'variable',
      'connection-source': isConnectionSource,
    }"
    :style="{
      left: block.x + 'px',
      top: block.y + 'px',
      backgroundColor: block.color,
    }"
    @pointerdown="startDrag"
  >
    <template v-if="block.type === 'variable'">
      <div class="variable-block-content">
        <!-- Режим редактирования -->
        <template v-if="isEditing">
          <textarea
            ref="editInput"
            v-model="editText"
            class="variable-edit-textarea"
            :class="{ 'has-content': editText.length > 0 }"
            placeholder="// int a = 2, b = 5"
            rows="2"
            @input="parseEditText"
            @keydown.enter.prevent="handleEditEnter"
            @blur="handleEditBlur"
          ></textarea>

          <!-- Предпросмотр распознанного -->
          <div v-if="parsedVariables.length > 0" class="variable-preview">
            <div class="preview-items">
              <div v-for="(v, idx) in parsedVariables" :key="idx" class="preview-item">
                <span class="preview-type">{{ v.type }}</span>
                <span class="preview-name">{{ v.name }}</span>
                <span class="preview-equals">=</span>
                <span class="preview-value">{{ formatValue(v) }}</span>
              </div>
            </div>
          </div>

          <!-- Ошибка парсинга -->
          <div v-if="parseError" class="variable-parse-error">❌ {{ parseError }}</div>

          <!-- Кнопки действий -->
          <div class="variable-edit-actions">
            <button
              class="variable-save-btn"
              @click.stop="saveVariableEdit"
              :disabled="!isValidEdit"
            >
              ✓ Сохранить
            </button>
            <button class="variable-cancel-btn" @click.stop="cancelEdit">✗ Отмена</button>
          </div>
        </template>

        <!-- Режим просмотра (сохраненные переменные) -->
        <template v-else>
          <div class="variable-saved-list">
            <div
              v-for="(v, idx) in savedVariables"
              :key="idx"
              class="variable-saved-item"
              @click.stop="editVariable"
            >
              <span class="saved-type">{{ v.type }}</span>
              <span class="saved-name">{{ v.name }}</span>
              <span class="saved-equals">=</span>
              <span class="saved-value">{{ formatValue(v) }}</span>
            </div>
          </div>

          <!-- Кнопка редактирования (карандаш) -->
          <button
            class="variable-edit-trigger"
            @click.stop="editVariable"
            title="Редактировать переменные"
          >
            ✎
          </button>
        </template>
      </div>
    </template>

    <!-- Math блок -->
    <template v-else-if="block.type === 'math'">
      <MathBlock
        :block="block"
        :bounds="bounds"
        :is-connection-source="isConnectionSource"
        :all-blocks="allBlocks"
        :all-connections="allConnections"
        @drag-start="$emit('drag-start', block.id)"
        @drag-move="$emit('drag-move', $event)"
        @drag-end="$emit('drag-end')"
        @delete="$emit('delete', block.id)"
        @start-connection="$emit('start-connection', block.id)"
        @update-block="$emit('update-block', $event)"
        @execute="onMathExecute"
      />
    </template>

    <!-- If блок -->
    <template v-else-if="block.type === 'if'">
      <IfBlock
        :block="block"
        :bounds="bounds"
        :is-connection-source="isConnectionSource"
        :all-blocks="allBlocks"
        :all-connections="allConnections"
        @drag-start="$emit('drag-start', block.id)"
        @drag-move="$emit('drag-move', $event)"
        @drag-end="$emit('drag-end')"
        @delete="$emit('delete', block.id)"
        @start-connection="$emit('start-connection', block.id)"
        @update-block="$emit('update-block', $event)"
      />
    </template>

    <!-- Print блок -->
    <template v-else-if="block.type === 'print'">
      <PrintBlock
        :block="block"
        :bounds="bounds"
        :is-connection-source="isConnectionSource"
        :all-blocks="allBlocks"
        :all-connections="allConnections"
        @drag-start="$emit('drag-start', block.id)"
        @drag-move="$emit('drag-move', $event)"
        @drag-end="$emit('drag-end')"
        @delete="$emit('delete', block.id)"
        @start-connection="$emit('start-connection', block.id)"
        @update-block="$emit('update-block', $event)"
      />
    </template>

    <!-- Обычный блок -->
    <template v-else>
      <span>{{ block.name }}</span>
    </template>

    <!-- Кнопка соединения -->
    <button class="connect-btn" @click.stop="startConnection" @pointerdown.stop>🔗</button>

    <DeleteButton @delete="$emit('delete', block.id)" />
  </div>
</template>

<script setup>
import PrintBlock from './PrintBlock.vue'
import IfBlock from './IfBlock.vue'
import MathBlock from './MathBlock.vue'
import { ref, computed, nextTick, watch } from 'vue'
import DeleteButton from '../UI/DeleteButton.vue'
import { useVariables } from '@/composables/useVariables'

const props = defineProps({
  block: Object,
  bounds: Object,
  isConnectionSource: Boolean,
  allBlocks: Array,
  allConnections: Array,
})

const emit = defineEmits([
  'drag-start',
  'drag-move',
  'drag-end',
  'delete',
  'start-connection',
  'update-block',
  'math-execute',
])

const onMathExecute = (data) => {
  console.log('WorkspaceBlock onMathExecute:', data)
  emit('math-execute', data)
}

console.log('WorkspaceBlock props:', props.block)

const { getVariableByName, upsertVariable } = useVariables()
const isDragging = ref(false)
const isEditing = ref(false)
const editText = ref('')
const parsedVariables = ref([])
const savedVariables = ref([])
const parseError = ref('')
const isValidEdit = ref(false)
const editInput = ref(null)

const types = ['int', 'boolean', 'double', 'string']

watch(
  () => props.block,
  (block) => {
    console.log('[WATCH] block changed:', block)
    if (block.type === 'variable') {
      if (block.savedVariables) {
        console.log('[INIT] loading savedVariables:', block.savedVariables)
        savedVariables.value = block.savedVariables
      } else if (block.variableName) {
        console.log('[INIT] converting old format:', {
          name: block.variableName,
          type: block.variableType,
          value: block.variableValue,
        })
        savedVariables.value = [
          {
            name: block.variableName,
            type: block.variableType || 'int',
            value: block.variableValue ?? 0,
          },
        ]
      }
      console.log(' [INIT] savedVariables after load:', savedVariables.value)
    }
  },
  { immediate: true, deep: true },
)

const parseEditText = () => {
  console.log(' [PARSE] editText:', editText.value)

  parseError.value = ''
  parsedVariables.value = []
  isValidEdit.value = false

  const text = editText.value.trim()
  if (!text) {
    console.log('[PARSE] empty text')
    return
  }

  const lines = text.split('\n').filter((l) => l.trim())
  console.log('[PARSE] lines:', lines)

  const allVariables = []

  for (const line of lines) {
    console.log('[PARSE] parsing line:', line)
    const vars = parseLine(line)
    if (vars.error) {
      console.log('[PARSE] error:', vars.error)
      parseError.value = vars.error
      return
    }
    console.log('[PARSE] parsed vars from line:', vars.variables)
    allVariables.push(...vars.variables)
  }

  console.log('[PARSE] allVariables:', allVariables)
  parsedVariables.value = allVariables
  isValidEdit.value = allVariables.length > 0
}

const parseLine = (line) => {
  console.log('[LINE] parsing line:', line)
  const result = { variables: [], error: null }

  const typeMatch = line.match(/^(int|boolean|double|string)\s+(.+)$/)
  if (!typeMatch) {
    console.log('[LINE] error: no type match')
    return { error: 'Должно начинаться с типа: int, boolean, double, string' }
  }

  const type = typeMatch[1]

  if (!types.includes(type)) {
    return { error: `Неподдерживаемый тип: ${type}` }
  }

  const rest = typeMatch[2].trim()
  console.log('[LINE] type:', type, 'rest:', rest)

  const parts = rest.split(',').map((p) => p.trim())
  console.log('[LINE] parts:', parts)

  let commonValue = null
  const valueMatch = rest.match(/=\s*(.+)$/)
  if (valueMatch) {
    commonValue = parseValue(type, valueMatch[1].trim())
    console.log(' [LINE] common value found:', commonValue)
  }

  for (const part of parts) {
    console.log(' [LINE] processing part:', part)
    const varMatch = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*(.+))?$/)
    if (!varMatch) {
      console.log(' [LINE] invalid format in part:', part)
      return { error: `Неверный формат: ${part}` }
    }

    const name = varMatch[1]
    let value = commonValue

    if (varMatch[2]) {
      value = parseValue(type, varMatch[2].trim())
      console.log(' [LINE] individual value for', name, ':', value)
    } else if (value === null) {
      value = getDefaultValue(type)
      console.log(' [LINE] default value for', name, ':', value)
    }

    result.variables.push({ type, name, value })
  }

  console.log(' [LINE] result:', result)
  return result
}

const parseValue = (type, str) => {
  if (!types.includes(type)) {
    return str
  }

  str = str.trim()
  console.log(' [VALUE] parsing', type, 'value:', str)
  switch (type) {
    case 'int':
      console.log(' [VALUE] int parsed:', str)
      return isNaN(parseInt(str)) ? 0 : parseInt(str)
    case 'double':
      console.log(' [VALUE] double parsed:', str)
      return isNaN(parseFloat(str)) ? 0.0 : parseFloat(str)
    case 'boolean':
      console.log(' [VALUE] boolean parsed:', str.toLowerCase() === 'true')
      return str.toLowerCase() === 'true'
    case 'string':
      console.log(' [VALUE] string parsed:', str.replace(/^["']|["']$/g, ''))
      return str.replace(/^["']|["']$/g, '')
    default:
      return str
  }
}

const getDefaultValue = (type) => {
  if (!types.includes(type)) {
    return null
  }

  const defaults = {
    int: 0,
    double: 0.0,
    boolean: false,
    string: '',
  }
  console.log(' [DEFAULT] default for', type, ':', defaults[type])
  return defaults[type] || null
}

const formatValue = (v) => {
  if (v.type === 'string') return `"${v.value}"`
  if (v.type === 'boolean') return v.value ? 'true' : 'false'
  return v.value
}

const editVariable = () => {
  console.log(' [EDIT] starting edit, savedVariables:', savedVariables.value)
  isEditing.value = true

  if (savedVariables.value.length > 0) {
    const lines = []
    const byType = {}

    savedVariables.value.forEach((v) => {
      if (!byType[v.type]) byType[v.type] = []
      byType[v.type].push(v)
    })
    console.log(' [EDIT] grouped by type:', byType)

    Object.entries(byType).forEach(([type, vars]) => {
      const parts = vars.map((v) => {
        if (v.value === getDefaultValue(type)) {
          return v.name
        } else {
          return `${v.name} = ${v.type === 'string' ? `"${v.value}"` : v.value}`
        }
      })
      lines.push(`${type} ${parts.join(', ')}`)
    })

    editText.value = lines.join('\n')
    console.log('[EDIT] editText set to:', editText.value)
  } else {
    editText.value = 'int a = 0'
    console.log('[EDIT] no saved vars, default editText:', editText.value)
  }

  nextTick(() => {
    editInput.value?.focus()
    editInput.value?.select()
  })
}

const saveVariableEdit = () => {
  console.log(' [SAVE] attempting to save, parsedVariables:', parsedVariables.value)

  if (!isValidEdit.value) {
    console.log(' [SAVE] invalid, not saving')
    return
  }

  savedVariables.value = [...parsedVariables.value]
  console.log(' [SAVE] updated savedVariables:', savedVariables.value)

  savedVariables.value.forEach((v) => {
    console.log(' [SAVE] upserting variable:', v.name, v.value)
    upsertVariable({
      oldName: v.name,
      name: v.name,
      type: v.type,
      value: v.value,
    })
  })

  const updateData = {
    id: props.block.id,
    savedVariables: savedVariables.value,
    variableName: savedVariables.value[0]?.name,
    variableType: savedVariables.value[0]?.type,
    variableValue: savedVariables.value[0]?.value,
    x: props.block.x,
    y: props.block.y,
  }

  emit('update-block', updateData)

  isEditing.value = false
  editText.value = ''
  parsedVariables.value = []
}

const startNewVariable = () => {
  console.log('➕ [NEW] starting new variable')
  isEditing.value = true
  editText.value = ''
  nextTick(() => {
    editInput.value?.focus()
  })
}

const handleEditEnter = (e) => {
  console.log(' [ENTER] pressed, ctrlKey:', e.ctrlKey)
  if (e.ctrlKey || e.metaKey) {
    console.log(' [ENTER] Ctrl+Enter detected, saving')
    saveVariableEdit()
  }
}

const handleEditBlur = () => {}

const editName = ref('')
const editType = ref('int')
const editValue = ref('')
const nameInput = ref(null)

const currentVariable = computed(() => {
  if (!props.block.variableName) return null
  return getVariableByName(props.block.variableName)
})

const displayName = computed(() => {
  if (currentVariable.value) return currentVariable.value.name
  return props.block.variableName || 'variable'
})

const displayValue = computed(() => {
  if (currentVariable.value) {
    const val = currentVariable.value.value
    if (currentVariable.value.type === 'string') return `"${val}"`
    if (currentVariable.value.type === 'boolean') return val ? 'true' : 'false'
    return val
  }
  if (props.block.variableValue !== undefined) {
    if (props.block.variableType === 'string') return `"${props.block.variableValue}"`
    return props.block.variableValue
  }
  return '—'
})

const handleVariableClick = async () => {
  if (isEditing.value) return

  isEditing.value = true

  if (currentVariable.value) {
    editName.value = currentVariable.value.name
    editType.value = currentVariable.value.type
    editValue.value = currentVariable.value.value
  } else {
    editName.value = props.block.variableName || ''
    editType.value = props.block.variableType || 'int'
    editValue.value =
      props.block.variableValue ??
      (editType.value === 'int' ? 1 : editType.value === 'boolean' ? true : '')
  }

  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

const onTypeChange = () => {
  if (editType.value === 'int') editValue.value = 1
  else if (editType.value === 'boolean') editValue.value = true
  else if (editType.value === 'string') editValue.value = ''
}

const saveChanges = () => {
  if (!editName.value.trim()) {
    alert('Имя переменной не может быть пустым')
    return
  }

  const newName = editName.value.trim()
  const oldName = props.block.variableName

  try {
    upsertVariable({
      oldName,
      name: newName,
      type: editType.value,
      value: editValue.value,
    })

    emit('update-block', {
      id: props.block.id,
      variableName: newName,
      variableType: editType.value,
      variableValue: editValue.value,
      x: props.block.x,
      y: props.block.y,
    })

    isEditing.value = false
  } catch (e) {
    alert(e.message)
  }
}

const cancelEdit = () => {
  isEditing.value = false
}

const startDrag = (event) => {
  if (event.target.closest('.delete-btn')) return
  if (event.target.closest('.connect-btn')) return
  if (event.target.closest('input')) return
  if (event.target.closest('select')) return
  if (event.target.closest('button')) return
  if (event.target.closest('textarea')) return
  if (isEditing.value) return

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

    if (props.bounds) {
      newX = Math.max(props.bounds.minX, Math.min(newX, props.bounds.maxX))
      newY = Math.max(props.bounds.minY, Math.min(newY, props.bounds.maxY))
    }

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

const startConnection = (event) => {
  event.stopPropagation()
  emit('start-connection', props.block.id)
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
  z-index: 10;
}

.workspace-block:hover {
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.4);
  transform: scale(1.02);
}

.workspace-block.dragging {
  opacity: 0.9;
  z-index: 1000;
  transform: scale(1.02);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.5);
}

.workspace-block.connection-source {
  border-color: #ff9800;
  box-shadow: 0 0 0 2px #ff9800;
}

/* Стили для блока переменной */
.variable-block-content {
  padding: 8px;
  min-width: 250px;
}

.variable-edit-textarea {
  width: 100%;
  padding: 10px;
  background: #1e1e1e;
  color: #fff;
  border: 2px solid #4d4d4d;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  margin-bottom: 10px;
}

.variable-edit-textarea:focus {
  outline: none;
  border-color: #9c27b0;
}

.variable-edit-textarea::placeholder {
  color: #666;
  font-style: italic;
}

.variable-preview {
  margin-bottom: 12px;
  padding: 10px;
  background: #1e1e1e;
  border-radius: 6px;
  border-left: 3px solid #9c27b0;
}

.preview-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: #2d2d2d;
  border-radius: 4px;
}

.preview-type {
  color: #ffa726;
  font-weight: bold;
}

.preview-name {
  color: #66bb6a;
}

.preview-equals {
  color: #888;
}

.preview-value {
  color: #42a5f5;
}

.variable-parse-error {
  margin-bottom: 12px;
  padding: 8px;
  background: #ff4444;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.variable-edit-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.variable-save-btn,
.variable-cancel-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.variable-save-btn {
  background: #9c27b0;
  color: white;
}

.variable-save-btn:hover:not(:disabled) {
  background: #7b1fa2;
  transform: translateY(-2px);
}

.variable-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.variable-cancel-btn {
  background: #666;
  color: white;
}

.variable-cancel-btn:hover {
  background: #777;
  transform: translateY(-2px);
}

.variable-add-more-btn {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.variable-add-more-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #9c27b0;
}

.plus-icon {
  font-size: 16px;
  font-weight: bold;
}

.variable-saved-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.variable-saved-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.variable-saved-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.saved-type {
  color: #ffa726;
  font-weight: bold;
}

.saved-name {
  color: #66bb6a;
}

.saved-equals {
  color: #888;
}

.saved-value {
  color: #42a5f5;
}

.variable-edit-trigger {
  position: absolute;
  top: -8px;
  right: 30px;
  width: 24px;
  height: 24px;
  background: #9c27b0;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
}

.workspace-block:hover .variable-edit-trigger {
  opacity: 1;
}

.variable-edit-trigger:hover {
  transform: scale(1.1);
  background: #7b1fa2;
}

.connect-btn {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 24px;
  height: 24px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s,
    transform 0.2s;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workspace-block:hover .connect-btn {
  opacity: 1;
}

.connect-btn:hover {
  background-color: #45a049;
  transform: scale(1.1);
}
</style>
