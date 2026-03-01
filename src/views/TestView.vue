<template>
  <div class="test-page">
    <button class="back-btn" @click="$router.push('/')">
      ← Назад
    </button>
    
    <div class="container">
      <SidebarBlocks />
      <WorkspaceArea 
        :blocks="blocks"
        @drop="addBlock"
        @update-block="updateBlockPosition"
        @delete-block="deleteBlock"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SidebarBlocks from '@/components/sidebar/SidebarBlocks.vue'
import WorkspaceArea from '@/components/workspace/WorkspaceArea.vue'

const router = useRouter()
const blocks = ref([])

const addBlock = (newBlock) => {
  blocks.value.push(newBlock)
}

const updateBlockPosition = ({ id, x, y }) => {
  const block = blocks.value.find(b => b.id === id)
  if (block) {
    block.x = Math.round(x)
    block.y = Math.round(y)
  }
}

const deleteBlock = (blockId) => {
  blocks.value = blocks.value.filter(b => b.id !== blockId)
}
</script>

<style scoped>
.test-page {
  width: 100%;
  height: 100vh;
  background-color: #1e1e1e;
  position: relative;
  overflow: hidden;
}

.back-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 25px;
  cursor: pointer;
  z-index: 1000;
  font-weight: bold;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #45a049;
}

.container {
  display: flex;
  height: 100vh;
}
</style>