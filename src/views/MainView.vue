<template>
  <div class="main">
    <div class="main_alert">
      <h3>Главная страница</h3>
      
       <button class="test-button" @click="goToTest"> Test</button> //кнопка перебброса кодблок
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const testMessage = ref('Работает!')
const router = useRouter()

const goToTest = () =>
{
  console.log('Кнопка нажата')
  router.push('/test')
}
// Переброс
</script>

<style scoped>
.main {
  width: 92%; /* размеры самой страницы (блока) */
  height: 450px;
  background-color: gray;
  margin: 50px auto;
  text-decoration: none;
  color: white;
  border-radius: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
}
.main_button {
  background-color: #000000;
  color: white;
  border-color: black;
}
.test-button {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.2s;
}

.test-button:hover
{
  background: #45a049;
}
</style>
