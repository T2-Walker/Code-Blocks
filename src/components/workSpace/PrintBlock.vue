<template>
  <div 
    class="workspace-block print-block"
    :class="{ dragging: isDragging, 'connection-source': isConnectionSource }"
    :style="{ left: block.x + 'px', top: block.y + 'px', backgroundColor: block.color }"
    @pointerdown="startDrag"
  >
    <div class="print-content">
      <div class="print-header">
        <span class="print-title">Написать</span>
      </div>
      
      <div class="print-variables">
        <div 
          v-for="(item, index) in selectedVariables" 
          :key="index"
          class="print-variable-row"
        >
          <select 
            v-model="item.name" 
            class="print-variable-select"
            @change="emitUpdate"
          >
            <option value="">Выберите переменную</option>
            <option v-for="varItem in allowedVariables" :key="varItem.name" :value="varItem.name">
              {{ varItem.name }}
            </option>
          </select>
          
          <button 
            v-if="selectedVariables.length > 1"
            class="print-remove-btn"
            @click.stop="removeVariable(index)"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div class="print-add-row">
        <button class="print-add-btn" @click.stop="addVariable">
          <span class="plus-icon">+</span> Добавить переменную
        </button>
      </div>
      
      <div class="print-preview" v-if="selectedVariables.length > 0">
        <span class="preview-label">Вывод:</span>
        <span class="preview-value">{{ previewText }}</span>
      </div>
    </div>

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
import { ref, computed, watch } from 'vue'
import DeleteButton from '../UI/DeleteButton.vue'
import { useVariables } from '@/composables/useVariables'
import { getDeclaredVariableNamesBeforeBlock } from '@/domain/chainContext'

const props = defineProps({
  block: Object,
  bounds: Object,
  isConnectionSource: Boolean,
  allBlocks: Array,
  allConnections: Array,
})

const emit = defineEmits([
  'drag-start', 'drag-move', 'drag-end', 'delete',
  'start-connection', 'update-block'
])

const { variables, getVariableByName } = useVariables()
const isDragging = ref(false)

const selectedVariables = ref(
  props.block.selectedVariables?.length 
    ? props.block.selectedVariables.map(name => ({ name }))
    : [{ name: '' }]
)

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

const previewText = computed(() => {
  const names = selectedVariables.value
    .map(item => item.name)
    .filter(name => name)
  
  if (names.length === 0) return '—'
  return names.join(', ')
})

const addVariable = () => {
  selectedVariables.value.push({ name: '' })
  emitUpdate()
}

const removeVariable = (index) => {
  selectedVariables.value.splice(index, 1)
  emitUpdate()
}

watch(allowedNames, (names) => {
  const set = new Set(names)
  let changed = false
  
  selectedVariables.value.forEach(item => {
    if (item.name && !set.has(item.name)) {
      item.name = ''
      changed = true
    }
  })
  
  if (changed) {
    emitUpdate()
  }
}, { immediate: true })

const emitUpdate = () => {
  const names = selectedVariables.value.map(item => item.name).filter(name => name)
  const updateData = {
    id: props.block.id,
    selectedVariables: names
  }
  
  console.log('📤 PrintBlock emitUpdate:', updateData)
  emit('update-block', updateData)
}

const startDrag = (event) => {
  if (event.target.closest('.delete-btn')) return
  if (event.target.closest('.connect-btn')) return
  if (event.target.closest('select')) return
  if (event.target.closest('button')) return

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
.print-block {
  min-width: 280px;
  padding: 15px;
  background-color: #FF9800;
  position: absolute;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
}

.print-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.print-header {
  text-align: left;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.print-title {
  font-weight: bold;
  color: white;
  font-size: 16px;
}

.print-variables {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.print-variable-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-variable-select {
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}

.print-remove-btn {
  width: 24px;
  height: 24px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.print-remove-btn:hover {
  transform: scale(1.1);
  background-color: #cc0000;
}

.print-add-row {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.print-add-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px dashed rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.print-add-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

.plus-icon {
  font-size: 16px;
  font-weight: bold;
}

.print-preview {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.preview-value {
  color: white;
  font-weight: bold;
  font-family: monospace;
  font-size: 14px;
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

.print-block:hover .connect-btn {
  opacity: 1;
}

.connect-btn:hover {
  background-color: #45a049;
  transform: scale(1.1);
}

select, input, button {
  outline: none;
}

select:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

select:focus {
  border-color: #4CAF50;
}
</style>