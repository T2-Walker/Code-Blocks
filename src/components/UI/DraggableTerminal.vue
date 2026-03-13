<template>
  <div
    ref="terminalRef"
    class="draggable-terminal"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      width: width + 'px',
      height: height + 'px'
    }"
    @mousedown="startDrag"
  >

    <div class="terminal-header" @mousedown.stop="startDrag">
      <span class="terminal-title">TERMINAL</span>
      <div class="terminal-controls">
        <button class="terminal-btn clear-btn" @click.stop="$emit('clear')">🗑</button>
        <button class="terminal-btn close-btn" @click.stop="$emit('close')">✕</button>
      </div>
    </div>


    <div class="terminal-content" ref="contentRef">
      <div
        v-for="(line, index) in lines"
        :key="index"
        class="terminal-line"
        :class="line.type"
      >
        <span class="line-text">{{ line.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  initialPosition: {
    type: Object,
    default: () => ({ x: window.innerWidth - 340, y: window.innerHeight - 340 })
  },
  width: {
    type: Number,
    default: 320
  },
  height: {
    type: Number,
    default: 300
  },
  lines: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['clear', 'close', 'update:position'])

const terminalRef = ref(null)
const contentRef = ref(null)
const position = ref({ ...props.initialPosition })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const startDrag = (event) => {
  if (event.target.closest('.terminal-btn')) return

  event.preventDefault()
  isDragging.value = true

  const rect = terminalRef.value.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (event) => {
  if (!isDragging.value) return

  event.preventDefault()

  let newX = event.clientX - dragOffset.value.x
  let newY = event.clientY - dragOffset.value.y

  newX = Math.max(0, Math.min(newX, window.innerWidth - props.width))
  newY = Math.max(0, Math.min(newY, window.innerHeight - props.height))

  position.value = { x: newX, y: newY }
  emit('update:position', position.value)
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const scrollToBottom = () => {
  if (contentRef.value) {
    contentRef.value.scrollTop = contentRef.value.scrollHeight
  }
}

defineExpose({
  scrollToBottom
})

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  stopDrag()
})
</script>

<style scoped>
.draggable-terminal {
  position: fixed;
  background-color: #1e1e1e;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  resize: both;
  min-width: 250px;
  min-height: 200px;
}
/* верхняя штучка у терминала*/
.terminal-header {
  background-color: #2d2d2d;
  padding: 8px 12px;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #4CAF50;
  user-select: none;
}

.terminal-title {
  color: #4CAF50;
  font-weight: bold;
  font-size: 14px;
}

.terminal-controls {
  display: flex;
  gap: 8px;
}

.terminal-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.terminal-btn:hover {
  background-color: #3d3d3d;
  color: white;
}

.clear-btn:hover {
  color: #4CAF50;
}

.close-btn:hover {
  color: #ff4444;
}

.terminal-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #000000;
  color: #00ff00;
  font-size: 14px;
  line-height: 1.6;
  text-shadow: 0 0 8px #00ff00;
}

.terminal-line {
  margin: 4px 0;
  padding: 4px 0;
  border-bottom: 1px solid #333;
  word-break: break-word;
  font-weight: 500;
}

.terminal-line.error {
  color: #ff4444;
  text-shadow: 0 0 8px #ff4444;
}

.terminal-line.success {
  color: #4CAF50;
  text-shadow: 0 0 8px #4CAF50;
}

.terminal-line.print {
  color: #FFA500;
  text-shadow: 0 0 8px #FFA500;
  font-weight: bold;
}

.terminal-line .line-text {
  color: inherit;
}

.terminal-content::-webkit-scrollbar {
  width: 8px;
}

.terminal-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.terminal-content::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 4px;
}

.terminal-content::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}
</style>
