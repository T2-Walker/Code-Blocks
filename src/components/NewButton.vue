<template>
  <button class="test-button" @click="goToTest">
     Test
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToTest = () => {
  router.push('/test')
}
</script>

<style scoped>
.test-button {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.test-button:hover {
  background: #45a049;
}
</style>