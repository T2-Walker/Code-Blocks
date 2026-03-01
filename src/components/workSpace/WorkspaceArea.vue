<template>
  <div 
    class="workspace"
    ref="workspaceRef"
    @dragover.prevent
    @drop="onDrop"
  >
    <GridBackground />
    
    <WorkspaceBlock
      v-for="block in blocks"
      :key="block.id"
      :block="block"
      :bounds="bounds"
      @drag-start="setDraggingId"
      @drag-move="updateBlockPosition"
      @drag-end="clearDraggingId"
      @delete="deleteBlock"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import GridBackground from './GridBackground.vue'
import WorkspaceBlock from './WorkspaceBlock.vue'

const props = defineProps({
  blocks: Array
})

const emit = defineEmits(['drop', 'update-block', 'delete-block'])

const workspaceRef = ref(null)
const draggingId = ref(null)

// Вычисляем границы
const bounds = computed(() => {
  if (!workspaceRef.value) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  
  const rect = workspaceRef.value.getBoundingClientRect()
  return {
    minX: 0,
    minY: 0,
    maxX: rect.width - 100,
    maxY: rect.height - 50
  }
})

const setDraggingId = (id) => {
  draggingId.value = id
}

const clearDraggingId = () => {
  draggingId.value = null
}

const updateBlockPosition = ({ id, x, y }) => {
  emit('update-block', { id, x, y })
}

const onDrop = (event) => {
  event.preventDefault()
  
  try {
    const blockData = JSON.parse(event.dataTransfer.getData('text/plain'))
    const rect = workspaceRef.value.getBoundingClientRect()
    
    let x = event.clientX - rect.left - 50
    let y = event.clientY - rect.top - 25
    
    x = Math.max(bounds.value.minX, Math.min(x, bounds.value.maxX))
    y = Math.max(bounds.value.minY, Math.min(y, bounds.value.maxY))
    
    const newBlock = {
      id: Date.now() + Math.random(),
      name: blockData.name || 'Начать',
      color: blockData.color || '#4CAF50',
      type: blockData.type,
      x: Math.round(x),
      y: Math.round(y)
    }
    
    emit('drop', newBlock)
  } catch (e) {
    console.error('Ошибка при добавлении блока:', e)
  }
}

const deleteBlock = (blockId) => {
  emit('delete-block', blockId)
}
</script>

<style scoped>
.workspace {
  flex: 1;
  position: relative;
  background-color: #1e1e1e;
  overflow: hidden;
}
</style>