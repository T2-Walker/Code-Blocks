<template>
  <div class="workspace" ref="workspaceRef" @click="onWorkspaceClick">
    <GridBackground />
    
    <svg class="connection-lines">
      <g v-for="conn in connections" :key="conn.id" class="connection-group">
        <line
          :x1="getLinePosition(conn.from, conn.to).x1"
          :y1="getLinePosition(conn.from, conn.to).y1"
          :x2="getLinePosition(conn.from, conn.to).x2"
          :y2="getLinePosition(conn.from, conn.to).y2"
          stroke="#4CAF50"
          stroke-width="3"
          stroke-linecap="round"
        />
        <foreignObject
          :x="(getLinePosition(conn.from, conn.to).x1 + getLinePosition(conn.from, conn.to).x2) / 2 - 12"
          :y="(getLinePosition(conn.from, conn.to).y1 + getLinePosition(conn.from, conn.to).y2) / 2 - 12"
          width="24"
          height="24"
          class="delete-connection-wrapper"
        >
          <button 
            class="delete-connection-btn"
            @click.stop="deleteConnection(conn.id)"
            @mousedown.stop
          >
            ✕
          </button>
        </foreignObject>
      </g>
      
      <line
        v-if="isConnecting && tempLine"
        :x1="tempLine.x1"
        :y1="tempLine.y1"
        :x2="tempLine.x2"
        :y2="tempLine.y2"
        stroke="#ff9800"
        stroke-width="3"
        stroke-dasharray="5,5"
        stroke-linecap="round"
      />
    </svg>
    
    <WorkspaceBlock
      v-for="block in blocks"
      :key="block.id"
      :block="block"
      :bounds="bounds"
      :is-connection-source="isConnecting && sourceBlockId === block.id"
      @drag-start="setDraggingId"
      @drag-move="updateBlockPosition"
      @drag-end="clearDraggingId"
      @delete="deleteBlock"
      @start-connection="startConnection"
      @update-block="handleBlockUpdate"
    />
  </div>
</template>

<script setup>


import { ref, computed, onMounted, onUnmounted } from 'vue'
import GridBackground from './GridBackground.vue'
import WorkspaceBlock from './WorkspaceBlock.vue'
import { createBaseBlock } from '@/domain/blocks'
import { createVariableBlockAtPosition } from '@/domain/logic'
import { 
  createConnection, 
  deleteConnection as removeConnection,
  deleteConnectionsForBlock
} from '@/domain/connections'
import { createTempLine } from '@/domain/connectionLine'
import { canConnectBlocks } from '@/domain/connections'
import { useTerminal } from '@/composables/useTerminal'

const props = defineProps({
  blocks: Array,
  connections: Array,
})

const emit = defineEmits(['drop', 'update-block', 'delete-block', 'update-variable', 'connection-created', 'connection-deleted'])

const { addLine } = useTerminal()
const workspaceRef = ref(null)
const draggingId = ref(null)
const isConnecting = ref(false)
const sourceBlockId = ref(null)
const tempLine = ref(null)
const onMouseMoveRef = ref(null)

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

const getLinePosition = (fromId, toId) => {
  const fromBlock = props.blocks.find(b => b.id === fromId)
  const toBlock = props.blocks.find(b => b.id === toId)
  
  if (!fromBlock || !toBlock) return { x1: 0, y1: 0, x2: 0, y2: 0 }
  
  return {
    x1: fromBlock.x + 50,
    y1: fromBlock.y + 25,
    x2: toBlock.x + 50,
    y2: toBlock.y + 25
  }
}

const setDraggingId = (id) => {
  draggingId.value = id
}

const clearDraggingId = () => {
  draggingId.value = null
}

const updateBlockPosition = ({ id, x, y }) => {
  emit('update-block', { id, x, y })
  if (isConnecting.value && sourceBlockId.value === id) {
    updateTempLine()
  }
}

const handleBlockUpdate = (blockData) => {
  emit('update-block', blockData)
}

const startConnection = (blockId) => {
  if (isConnecting.value) cancelConnection()
  
  isConnecting.value = true
  sourceBlockId.value = blockId
  
  const sourceBlock = props.blocks.find(b => b.id === blockId)
  
  const onMouseMove = (e) => {
    if (!isConnecting.value || !workspaceRef.value) return
    const rect = workspaceRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    tempLine.value = createTempLine(sourceBlock, mouseX, mouseY)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  onMouseMoveRef.value = onMouseMove
}

const updateTempLine = () => {
  if (!isConnecting.value || !sourceBlockId.value) return
  const sourceBlock = props.blocks.find(b => b.id === sourceBlockId.value)
  if (sourceBlock && tempLine.value) {
    tempLine.value.x1 = sourceBlock.x + 50
    tempLine.value.y1 = sourceBlock.y + 25
  }
}

const completeConnection = (targetBlockId) => {
  console.log('Завершаем соединение с блоком:', targetBlockId)
  if (!isConnecting.value || !sourceBlockId.value) return
  
  const sourceBlock = props.blocks.find(b => b.id === sourceBlockId.value)
  const targetBlock = props.blocks.find(b => b.id === targetBlockId)
  
  if (!sourceBlock || !targetBlock) return
  
  const check = canConnectBlocks(sourceBlock, targetBlock, props.connections || [], props.blocks || [])
  if (!check.allowed) {
    addLine(`❌ ${check.reason}`, 'error')
    cancelConnection()
    return
  }
  
  const newConnection = createConnection(sourceBlockId.value, targetBlockId)
  if (newConnection) {
    emit('connection-created')
    addLine(`Создана связь между блоками`, 'success')
  } else {
    addLine(`❌ Связь уже существует`, 'error')
  }
  
  cancelConnection()
}

const cancelConnection = () => {
  isConnecting.value = false
  sourceBlockId.value = null
  tempLine.value = null
  if (onMouseMoveRef.value) {
    document.removeEventListener('mousemove', onMouseMoveRef.value)
    onMouseMoveRef.value = null
  }
}

const deleteConnection = (connectionId) => {
  removeConnection(connectionId)
  emit('connection-deleted')
  addLine(`Связь удалена`, 'output')
}

const onWorkspaceClick = (e) => {
  e.stopPropagation()
  if (!isConnecting.value) return
  
  const blockElement = e.target.closest('.workspace-block')
  if (blockElement) {
    const blockId = blockElement.__vueParentComponent?.props?.block?.id
    if (blockId && blockId !== sourceBlockId.value) {
      completeConnection(blockId)
    } else {
      cancelConnection()
    }
  } else {
    cancelConnection()
  }
}

const handlePaletteDrop = ({ type, clientX, clientY }) => {
  
  if (!workspaceRef.value)
  {
    return
  }
  
  const rect = workspaceRef.value.getBoundingClientRect()
  
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    return
  }
  
  let x = clientX - rect.left - 50
  let y = clientY - rect.top - 25
  x = Math.max(bounds.value.minX, Math.min(x, bounds.value.maxX))
  y = Math.max(bounds.value.minY, Math.min(y, bounds.value.maxY))
  
  console.log('Calculated position:', x, y)
  
  let newBlock
  if (type === 'variable') {
    console.log('Creating variable block')
    newBlock = createVariableBlockAtPosition(x, y)
  } else {
    console.log('Creating base block of type:', type)
    newBlock = createBaseBlock(type, x, y)
  }
  
  console.log('New block created:', newBlock)
  emit('drop', newBlock)
}

const deleteBlock = (blockId) => {
  deleteConnectionsForBlock(blockId)
  emit('connection-deleted')
  emit('delete-block', blockId)
}

defineExpose({ handlePaletteDrop })

onMounted(() => {})
onUnmounted(() => cancelConnection())
</script>

<style scoped>
.workspace {
  flex: 1;
  position: relative;
  background-color: #1e1e1e;
  overflow: hidden;
}

.connection-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.connection-group {
  pointer-events: none;
}

.delete-connection-wrapper {
  pointer-events: all;
  overflow: visible;
}

.delete-connection-btn {
  width: 24px;
  height: 24px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}

.delete-connection-btn:hover {
  transform: scale(1.2);
}
</style>