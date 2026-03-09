<template>
  <div
    class="grid-background"
    :style="{
      left: minX + 'px',
      top: minY + 'px',
      width: maxX - minX + 'px',
      height: maxY - minY + 'px',
    }"
  ></div>
</template>

<script setup>
defineProps({
  minX: { type: Number, default: -2000 },
  minY: { type: Number, default: -2000 },
  maxX: { type: Number, default: 2000 },
  maxY: { type: Number, default: 2000 },
})
</script>

<style scoped>
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}
</style>
