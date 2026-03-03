<template>
  <div class="sidebar">
    <h3>Блоки</h3>
    <CategoryItem
      title="📋 Операторы"
      :expanded="expanded.operators"
      @toggle="toggleCategory('operators')"
    >
      <BlockItem
        block-type="start"
        block-name="Начать"
        block-color="#4CAF50"
        @palette-drop="onPaletteDrop"
      />
      <BlockItem
        block-type="print"
        block-name="Написать"
        block-color="#FF9800"
        @palette-drop="onPaletteDrop"
      />
      <BlockItem
        block-type="variable"
        block-name="Переменная"
        block-color="#9C27B0"
        @palette-drop="onPaletteDrop"
      />
      <BlockItem
  block-type="math"
  block-name="Math"
  block-color="#FF5722"
  @palette-drop="onPaletteDrop"
/>
    </CategoryItem>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import CategoryItem from './CategoryItem.vue'
import BlockItem from './BlockItem.vue'

const emit = defineEmits(['palette-drop'])

const expanded = reactive({
  operators: true,
  variables: false
})

const toggleCategory = (category) => {
  expanded[category] = !expanded[category]
}

const onPaletteDrop = (payload) => {
  emit('palette-drop', payload)
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  background-color: #2d2d2d;
  color: white;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-right: 1px solid #3d3d3d;
}

.sidebar h3 {
  padding: 20px;
  margin: 0;
  border-bottom: 1px solid #3d3d3d;
}
</style>