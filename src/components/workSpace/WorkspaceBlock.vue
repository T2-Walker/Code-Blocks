<template>
  <div 
    class="workspace-block"
    :class="{ 
      dragging: isDragging, 
      'variable-block': block.type === 'variable',
      'connection-source': isConnectionSource 
    }"
    :style="{
      left: block.x + 'px',
      top: block.y + 'px',
      backgroundColor: block.color,
    }"
    @pointerdown="startDrag"
  >
    <template v-if="block.type === 'variable'">
      <div class="variable-content" @click.stop="handleVariableClick">
        <template v-if="!isEditing">
          <div class="variable-name-block">{{ displayName }}</div>
          <div class="variable-value-block">{{ displayValue }}</div>
        </template>
        
        <template v-else>
          <input
            v-model="editName"
            type="text"
            class="variable-edit-input"
            placeholder="имя"
            @keydown.enter.stop="saveChanges"
            ref="nameInput"
          />
          <select
            v-model="editType"
            class="variable-edit-select"
            @change="onTypeChange"
          >
            <option value="int">int</option>
            <option value="string">string</option>
            <option value="boolean">boolean</option>
          </select>
          
          <input
            v-if="editType === 'int'"
            v-model.number="editValue"
            type="number"
            class="variable-edit-input"
            placeholder="значение"
            @keydown.enter.stop="saveChanges"
          />
          <input
            v-else-if="editType === 'string'"
            v-model="editValue"
            type="text"
            class="variable-edit-input"
            placeholder="значение"
            @keydown.enter.stop="saveChanges"
          />
          <select
            v-else-if="editType === 'boolean'"
            v-model="editValue"
            class="variable-edit-select"
          >
            <option :value="true">true</option>
            <option :value="false">false</option>
          </select>
          
          <div class="variable-edit-actions">
            <button class="variable-save-btn" @click.stop="saveChanges">✓</button>
            <button class="variable-cancel-btn" @click.stop="cancelEdit">✗</button>
          </div>
        </template>
      </div>
    </template>

<template v-else-if="block.type === 'math'">
  <MathBlock
    :block="block"
    :bounds="bounds"
    :is-connection-source="isConnectionSource"
    @drag-start="$emit('drag-start', block.id)"
    @drag-move="$emit('drag-move', $event)"
    @drag-end="$emit('drag-end')"
    @delete="$emit('delete', block.id)"
    @start-connection="$emit('start-connection', block.id)"
    @update-block="$emit('update-block', $event)"
    @execute="onMathExecute"
  />
</template>
    <template v-else>
      <span>{{ block.name }}</span>
    </template>
    <button 
      class="connect-btn"
      @click.stop="startConnection"
      @pointerdown.stop
    >
      🔗
    </button>

    <DeleteButton @delete="$emit('delete', block.id)" />
  </div>
</template>

<script setup>
import MathBlock from './MathBlock.vue'
import { ref, computed, nextTick } from 'vue'
import DeleteButton from '../UI/DeleteButton.vue'
import { useVariables } from '@/composables/useVariables'

const props = defineProps({
  block: Object,
  bounds: Object,
  isConnectionSource: Boolean
})



const emit = defineEmits([
  'drag-start', 
  'drag-move', 
  'drag-end', 
  'delete',
  'start-connection',
  'update-block',
  'math-execute'
])

const onMathExecute = (data) => {
  console.log('WorkspaceBlock onMathExecute:', data)
  emit('math-execute', data)
}

const handleBlockUpdate = (blockData) => {
  console.log('WorkspaceArea handleBlockUpdate:', blockData)
  emit('update-block', blockData)
}

const { variableTypes, getVariableByName, upsertVariable } = useVariables()
const isDragging = ref(false)
const isEditing = ref(false)

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

const displayType = computed(() => {
  if (currentVariable.value) return currentVariable.value.type
  return props.block.variableType || 'int'
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
    editValue.value = props.block.variableValue ?? 
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
      value: editValue.value
    })
    
    emit('update-block', {
      id: props.block.id,
      variableName: newName,
      variableType: editType.value,
      variableValue: editValue.value,
      x: props.block.x,
      y: props.block.y
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
  transition: box-shadow 0.2s, transform 0.1s;
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

.variable-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
}

.variable-name-block {
  font-size: 14px;
  font-weight: bold;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  text-align: left;
}

.variable-value-block {
  font-size: 13px;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-family: monospace;
  text-align: left;
}

.variable-edit-input,
.variable-edit-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #4CAF50;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  color: #333;
  margin-bottom: 4px;
}

.variable-edit-select {
  cursor: pointer;
}

.variable-edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.variable-save-btn,
.variable-cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.variable-save-btn {
  background-color: #4CAF50;
  color: white;
}

.variable-save-btn:hover {
  background-color: #45a049;
}

.variable-cancel-btn {
  background-color: #ff4444;
  color: white;
}

.variable-cancel-btn:hover {
  background-color: #cc0000;
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

.workspace-block:hover .connect-btn {
  opacity: 1;
}

.connect-btn:hover {
  background-color: #45a049;
  transform: scale(1.1);
}
</style>