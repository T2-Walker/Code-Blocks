<template>
  <div 
    class="block-item"
    :style="{ backgroundColor: blockColor }"
    draggable="true"
    @dragstart="onDragStart"
  >
    🟢 {{ blockName }}
  </div>
</template>

<script setup>
const props = defineProps({
  blockType: String,
  blockName: String,
  blockColor: String
})

const emit = defineEmits(['dragstart'])

const onDragStart = (event) => {
  emit('dragstart', event, {
    type: props.blockType,
    name: props.blockName,
    color: props.blockColor
  })
}
</script>

<style scoped>
.block-item {
  padding: 15px;
  border-radius: 5px;
  cursor: grab;
  text-align: center;
  transition: transform 0.1s, opacity 0.1s;
  color: white;
  font-weight: bold;
}

.block-item:active {
  cursor: grabbing;
  opacity: 0.8;
  transform: scale(0.98);
}
</style>