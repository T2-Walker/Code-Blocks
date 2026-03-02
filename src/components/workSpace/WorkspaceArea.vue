<template>
  <div class="workspace" ref="workspaceRef">
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
      @click="onBlockClick"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import GridBackground from './GridBackground.vue'
import WorkspaceBlock from './WorkspaceBlock.vue'
import { createBaseBlock } from '@/domain/blocks'
import { createVariableBlockAtPosition } from '@/domain/logic'

defineProps({
  blocks: Array,
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
    maxY: rect.height - 50,
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

const handlePaletteDrop = ({ type, clientX, clientY }) => {
  if (!workspaceRef.value) return

  const rect = workspaceRef.value.getBoundingClientRect()

  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return
  }

  let x = clientX - rect.left - 50
  let y = clientY - rect.top - 25

  x = Math.max(bounds.value.minX, Math.min(x, bounds.value.maxX))
  y = Math.max(bounds.value.minY, Math.min(y, bounds.value.maxY))

  let newBlock

  if (type === 'variable') {
    newBlock = createVariableBlockAtPosition(x, y)
  } else {
    newBlock = createBaseBlock(type, x, y)
  }

  emit('drop', newBlock)
}

defineExpose({
  handlePaletteDrop,
})

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
