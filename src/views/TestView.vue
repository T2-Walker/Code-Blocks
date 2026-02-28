<template>
  <div class="test-page">
    <div class="test-content">
      <h1>Тестовая страница</h1>
      <p>Здесь будет блочный конструктор</p>
      <button @click="$router.push('/')" class="back-btn">
        ← Назад
      </button>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.test-page {
  width: 92%;
  height: 450px;
  background-color: #666;
  margin: 50px auto;
  border-radius: 20px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.back-btn {
  background: #333;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 25px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

.back-btn:hover {
  background: #222;
}
</style>