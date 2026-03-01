<template>
  <button 
    class="delete-btn"
    @click="$emit('delete')"
    title="Удалить"
  >
    ✕
  </button>
</template>

<script setup>
defineEmits(['delete'])
</script>

<style scoped>
.delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s, background-color 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.workspace-block:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: #cc0000;
  transform: scale(1.1);
}

.delete-btn:active {
  transform: scale(0.9);
}
</style>