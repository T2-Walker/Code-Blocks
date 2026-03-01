<template>
  <div 
    class="workspace-block"
    :class="{ 'dragging': isDragging }"
    :style="{ 
      left: block.x + 'px', 
      top: block.y + 'px',
      backgroundColor: block.color 
    }"
    @mousedown="startDrag"
  >
    <span>{{ block.name }}</span>
    <DeleteButton @delete="$emit('delete', block.id)" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DeleteButton from '../UI/DeleteButton.vue'

const props = defineProps({
  block: Object,
  bounds: Object
})

const emit = defineEmits(['drag-start', 'drag-move', 'drag-end', 'delete'])

const isDragging = ref(false)

const startDrag = (event) => {
  if (event.target.classList.contains('delete-btn')) return
  
  event.preventDefault()
  isDragging.value = true
  
  const startX = event.clientX
  const startY = event.clientY
  const startBlockX = props.block.x
  const startBlockY = props.block.y
  
  emit('drag-start', props.block.id)
  
  const onMouseMove = (e) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    
    let newX = startBlockX + dx
    let newY = startBlockY + dy
    
    // Применяем границы
    newX = Math.max(props.bounds.minX, Math.min(newX, props.bounds.maxX))
    newY = Math.max(props.bounds.minY, Math.min(newY, props.bounds.maxY))
    
    emit('drag-move', { id: props.block.id, x: newX, y: newY })
  }
  
  const onMouseUp = () => {
    isDragging.value = false
    emit('drag-end')
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
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
</style>