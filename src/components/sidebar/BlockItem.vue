<template>
  <div class="block-item" :style="{ backgroundColor: blockColor }" @pointerdown="onPointerDown">
    ♥ {{ blockName }}
  </div>
</template>

<script setup>
const props = defineProps({
  blockType: String,
  blockName: String,
  blockColor: String,
})

const emit = defineEmits(['palette-drop'])

const onPointerDown = (event) => {
  event.preventDefault()

  const startX = event.clientX
  const startY = event.clientY

  const pointerId = event.pointerId
  event.target.setPointerCapture(pointerId)

  const payload = {
    type: props.blockType,
    name: props.blockName,
    color: props.blockColor,
  }

  const onPointerUp = (e) => {
    const dx = Math.abs(e.clientX - startX)
    const dy = Math.abs(e.clientY - startY)

    if (dx > 3 || dy > 3) {
      emit('palette-drop', {
        ...payload,
        clientX: e.clientX,
        clientY: e.clientY,
      })
    }

    event.target.releasePointerCapture(pointerId)
    document.removeEventListener('pointerup', onPointerUp)
  }

  document.addEventListener('pointerup', onPointerUp, { once: true })
}
</script>

<style scoped>
.block-item {
  padding: 12px 15px;
  border-radius: 5px;
  cursor: grab;
  text-align: center;
  transition:
    transform 0.1s,
    opacity 0.1s;
  color: white;
  font-weight: bold;
  margin-bottom: 8px;
}

.block-item:last-child {
  margin-bottom: 0;
}

.block-item:active {
  cursor: grabbing;
  opacity: 0.8;
  transform: scale(0.98);
}
</style>
