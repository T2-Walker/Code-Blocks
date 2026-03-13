<template>
  <div class="variable-block-content">
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

      <div v-if="parsedVariables.length > 0" class="variable-preview">
        <div class="preview-items">
          <div v-for="(v, idx) in parsedVariables" :key="idx" class="preview-item">
            <span class="preview-type">{{ v.type === 'array' ? `${v.elementType}[${v.size}]` : v.type }}</span>
            <span class="preview-name">{{ v.name }}</span>
            <span class="preview-equals">=</span>
            <span class="preview-value">{{ formatValue(v) }}</span>
          </div>
        </div>
      </div>
      <div v-if="parseError" class="variable-parse-error">❌ {{ parseError }}</div>

      <div class="variable-edit-actions">
        <button class="variable-save-btn" @click.stop="saveVariableEdit" :disabled="!isValidEdit">
          ✓ Сохранить
        </button>
        <button class="variable-cancel-btn" @click.stop="cancelEdit">✗ Отмена</button>
      </div>
    </template>

    <template v-else>
      <div class="variable-saved-list">
        <div
          v-for="(v, idx) in savedVariables"
          :key="idx"
          class="variable-saved-item"
          @click.stop="editVariable"
        >
          <span class="saved-type">{{ v.type === 'array' ? `${v.elementType}[${v.size}]` : v.type }}</span>
          <span class="saved-name">{{ v.name }}</span>
          <span class="saved-equals">=</span>
          <span class="saved-value">{{ formatValue(v) }}</span>
        </div>
      </div>
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

<script setup>
import { nextTick, ref, watch } from 'vue'
import { useVariables } from '@/composables/useVariables.js'

const props = defineProps({
  block: Object,
  allBlocks: Array,
  allConnections: Array,
})

const emit = defineEmits(['update-block'])

const { variables, getVariableByName, upsertVariable } = useVariables()
const isEditing = ref(false)
const editText = ref('')
const parsedVariables = ref([])
const savedVariables = ref([])
const parseError = ref('')
const isValidEdit = ref(false)
const editInput = ref(null)



const types = ['int', 'boolean', 'double', 'string']

watch(() => variables.value, (newVars) => {

    if (isEditing.value) return

  console.log('VariableBlock: store изменился', newVars)

  if (savedVariables.value && savedVariables.value.length > 0) {
    let changed = false

    const updatedVars = savedVariables.value.map(v => {
      const storeVar = getVariableByName(v.name)
      if (storeVar && storeVar.value !== v.value) {
        changed = true
        return { ...v, value: storeVar.value }
      }
      return v
    })

    if (changed) {
      savedVariables.value = updatedVars
    }
  }
}, { deep: true})

const parseEditText = () => {
  parseError.value = ''
  parsedVariables.value = []
  isValidEdit.value = false

  const text = editText.value.trim()
  if (!text) {
    return
  }

  const lines = text.split('\n').filter((l) => l.trim())

  const allVariables = []

  for (const line of lines) {
    const vars = parseLine(line)
    if (vars.error) {
      parseError.value = vars.error
      return
    }
    allVariables.push(...vars.variables)
  }

  parsedVariables.value = allVariables
  isValidEdit.value = allVariables.length > 0
}

const parseLine = (line) => {
  const result = { variables: [], error: null }

  const arrayMatch = line.match(/^(int|boolean|double|string)\[(\d+)\]\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\{([^}]*)\}$/)

  if (arrayMatch) {
    const elementType = arrayMatch[1]
    const size = parseInt(arrayMatch[2])
    const arrayName = arrayMatch[3]
    const valuesStr = arrayMatch[4].trim()

    const valueArray = valuesStr.split(',').map(v => {
      const val = v.trim()
      return parseValue(elementType, val)
    })

    if (valueArray.length !== size) {
      return { error: `Размер массива ${size}, но передано ${valueArray.length} элементов` }
    }

    result.variables.push({
      type: 'array',
      name: arrayName,
      elementType: elementType,
      size: size,
      value: valueArray
    })

    return result
  }

  const typeMatch = line.match(/^(int|boolean|double|string)\s+(.+)$/)
  if (!typeMatch) {
    return { error: 'Должно начинаться с типа: int, boolean, double, string' }
  }

  const type = typeMatch[1]

  if (!types.includes(type)) {
    return { error: `Неподдерживаемый тип: ${type}` }
  }

  const rest = typeMatch[2].trim()

  const parts = rest.split(',').map((p) => p.trim())

  let commonValue = null
  const valueMatch = rest.match(/=\s*(.+)$/)
  if (valueMatch) {
    commonValue = parseValue(type, valueMatch[1].trim())
  }

  for (const part of parts) {
    const varMatch = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*(.+))?$/)
    if (!varMatch) {
      return { error: `Неверный формат: ${part}` }
    }

    const name = varMatch[1]
    let value = commonValue

    if (varMatch[2]) {
      value = parseValue(type, varMatch[2].trim())
    } else if (value === null) {
      value = getDefaultValue(type)
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

const formatValue = (v) => {
  if (v.type === 'array') {
    return `[${v.value.join(', ')}]`
  }
  if (v.type === 'string') return `"${v.value}"`
  if (v.type === 'boolean') return v.value ? 'true' : 'false'
  return v.value
}

const getDefaultValue = (type, elementType = 'int') => {
  if (type === 'array') {
    return []
  }

  const defaults = {
    int: 0,
    double: 0.0,
    boolean: false,
    string: '',
  }
  return defaults[type] || null
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

    Object.entries(byType).forEach(([type, vars]) => {
      const hasArray = vars.some(v => v.type === 'array')

      if (hasArray) {
        vars.forEach(v => {
          if (v.type === 'array') {
            const valuesStr = v.value.join(', ')
            lines.push(`${v.elementType}[${v.size}] ${v.name} = {${valuesStr}}`)
          } else {
            if (v.value === getDefaultValue(v.type)) {
              lines.push(`${v.type} ${v.name}`)
            } else {
              lines.push(`${v.type} ${v.name} = ${v.type === 'string' ? `"${v.value}"` : v.value}`)
            }
          }
        })
      } else {
        const parts = vars.map((v) => {
          if (v.value === getDefaultValue(type)) {
            return v.name
          } else {
            return `${v.name} = ${v.type === 'string' ? `"${v.value}"` : v.value}`
          }
        })
        lines.push(`${type} ${parts.join(', ')}`)
      }
    })

    editText.value = lines.join('\n')
  } else {
    editText.value = 'int a = 0'
  }

  nextTick(() => {
    editInput.value?.focus()
    editInput.value?.select()
  })
}

watch(
  () => props.block,
  (block) => {
    if (block.type === 'variable') {
      if (block.savedVariables) {
        savedVariables.value = block.savedVariables
      } else if (block.variableName) {
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

const refreshFromStore = () => {
  if (savedVariables.value.length > 0) {
    const updatedVars = savedVariables.value.map(v => {
      const storeVar = getVariableByName(v.name)
      if (storeVar) {
        return { ...v, value: storeVar.value }
      }
      return v
    })
    savedVariables.value = updatedVars
  }
}

watch(() => variables.value, () => {
  if (!isEditing.value) {
    refreshFromStore()
  }
}, { deep: true })

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

    if (v.type === 'array') {
      upsertVariable({
        oldName: v.name,
        name: v.name,
        type: 'array',
        elementType: v.elementType,
        size: v.size,
        value: v.value,
      })
    } else {
      upsertVariable({
        oldName: v.name,
        name: v.name,
        type: v.type,
        value: v.value,
      })
    }
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

const handleEditEnter = (e) => {
  if (e.ctrlKey || e.metaKey) {
    saveVariableEdit()
  }
}

const handleEditBlur = () => {}

const cancelEdit = () => {
  isEditing.value = false
  editText.value = ''
  parsedVariables.value = []
  parseError.value = ''
}
</script>

<style scoped>
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

.variable-edit-trigger:hover {
  transform: scale(1.1);
  background: #7b1fa2;
}

.variable-block:hover .variable-edit-trigger {
  opacity: 1;
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

.plus-icon {
  font-size: 16px;
  font-weight: bold;
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
</style>
