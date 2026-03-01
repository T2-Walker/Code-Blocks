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
        @dragstart="onDragStart"
      />
    </CategoryItem>
    
    <CategoryItem 
      title="📊 Переменные"
      :expanded="expanded.variables"
      @toggle="toggleCategory('variables')"
    >
      <div class="empty-category">Скоро появятся</div>
    </CategoryItem>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import CategoryItem from './CategoryItem.vue'
import BlockItem from './BlockItem.vue'

const expanded = reactive({
  operators: true,
  variables: false
})

const toggleCategory = (category) => {
  expanded[category] = !expanded[category]
}

const onDragStart = (event, blockData) => {
  event.dataTransfer.setData('text/plain', JSON.stringify(blockData))
  event.dataTransfer.effectAllowed = 'move'
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

.empty-category {
  color: #888;
  font-style: italic;
  padding: 10px;
  text-align: center;
}
</style>