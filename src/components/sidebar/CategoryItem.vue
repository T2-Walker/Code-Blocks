<template>
  <div class="category">
    <div class="category-header" @click="$emit('toggle')">
      <span>{{ title }}</span>
      <span>{{ expanded ? '▼' : '▶' }}</span>
    </div>
    
    <div class="category-content" v-if="expanded">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  expanded: Boolean
})

defineEmits(['toggle'])
</script>

<style scoped>
.category {
  border-bottom: 1px solid #3d3d3d;
}

.category-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.category-header:hover {
  background-color: #3d3d3d;
}

.category-content {
  padding: 10px 20px 20px 20px;
}
</style>