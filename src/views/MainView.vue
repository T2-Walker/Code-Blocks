<template>
  <div class="main">
    <div class="main_alert">
      <h3>Главная страница</h3>

      <button class="test-button" @click="goToTest">START</button>
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
  color: rgb(255, 255, 255);
  border-color: black;
}

.test-button {
  background: linear-gradient(135deg, rgba(20, 110, 59, 0.73), rgba(12, 94, 39, 0.73));
  box-shadow:
    0 0 15px #00ff23,
    inset 0 0 15px rgba(85, 255, 66, 0.62);
  color: white;
  border: 2px solid rgba(157, 255, 173, 0.59);
  border-radius: 50px;
  padding: 10px 25px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 20px;

  font-family: 'evolventa', Arial, sans-serif;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}
/*анимация при наведении*/
.test-button:hover {
  background: linear-gradient(135deg, rgba(20, 110, 59, 0.73), rgba(12, 94, 39, 0.73));
  box-shadow:
    0 0 15px #00ff23,
    0 5px 15px rgb(4, 2, 27),
    inset 0 0 15px rgba(85, 255, 66, 0.62);
  color: white;
  border: 2px solid rgba(157, 255, 173, 0.59);
  transform: scale(1.05);
}
</style>
