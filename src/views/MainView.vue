<template>
  <div class="main">
    <div class="main_alert">
      <h3>Главная страница</h3>

      <button class="test-button" @click="goToTest">Test</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const testMessage = ref('Работает!')
const router = useRouter()

const goToTest = () => {
  console.log('Кнопка нажата')
  router.push('/test')
}
// Переброс
</script>

<style scoped>
.main {
  width: 30%; /* размеры самой страницы (блока) */
  height: 200px;
  background: linear-gradient(135deg, rgba(149, 13, 88, 0.5), rgba(43, 43, 151, 0.5));


  margin: 150px auto;
  text-decoration: none;
  color: white;
  border-radius: 1000px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);

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
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  font-family: 'evolventa', Arial, sans-serif;
  transition: all 0.3s ease;
}
/*анимация при наведении*/
.test-button:hover {
  background: #45a049;
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgb(19, 14, 90);
}
</style>
