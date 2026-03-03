<template>
  <div class="variable-number-badge" :class="{ 'connected': connected }">
    {{ number }}
  </div>
</template>

<script setup>
defineProps({
  number: {
    type: Number,
    required: true
  },
  connected: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.variable-number-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background-color: #333;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  border: 2px solid #666;
  transition: all 0.2s;
}

.variable-number-badge.connected {
  background-color: #4CAF50;
  border-color: #45a049;
  transform: scale(1.1);
}
</style>