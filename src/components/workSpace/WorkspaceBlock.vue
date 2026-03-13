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
      <VariableBlock
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

    <template v-else-if="block.type === 'end'">
      <EndBlock
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

    <template v-else-if="block.type === 'while'">
      <WhileBlock
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

    <!-- Start блок -->
    <template v-else>
      <span>{{ block.name }}</span>
    </template>

    <!-- Кнопка соединения -->
    <button class="connect-btn" @click.stop="startConnection" @pointerdown.stop>🔗</button>

    <button
      v-if="block.type === 'if' || block.type === 'while'"
      class="connect-then-btn"
      @click.stop="startThenConnection"
      @pointerdown.stop
      title="Создать then-ветку (выполняется при истинном условии)"
    >
      🔗
    </button>

    <DeleteButton @delete="$emit('delete', block.id)" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PrintBlock from './PrintBlock.vue'
import IfBlock from './IfBlock.vue'
import MathBlock from './MathBlock.vue'
import VariableBlock from './VariableBlock.vue'
import EndBlock from './EndBlock.vue'
import WhileBlock from './WhileBlock.vue'
import DeleteButton from '../UI/DeleteButton.vue'

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
  emit('math-execute', data)
}

const isDragging = ref(false)
const isEditing = ref(false)

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
  emit('start-connection', {
    blockId: props.block.id,
    blockType: props.block.type,
    connectionType: 'normal',
  })
}

const startThenConnection = (event) => {
  event.stopPropagation()
  emit('start-connection', {
    blockId: props.block.id,
    blockType: props.block.type,
    connectionType: 'then',
  })
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

.connect-then-btn {
  position: absolute;
  top: -8px;
  left: 24px;
  width: 24px;
  height: 24px;
  background-color: #ff9800;
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

.workspace-block:hover .connect-then-btn {
  opacity: 1;
}

.connect-then-btn:hover {
  background-color: #f57c00;
  transform: scale(1.1);
}
</style>
