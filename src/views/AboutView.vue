<template>
  <div class="about">
    <div class="about_alert">
      <h1>ТГУ ФИТ группа 182501</h1>
      <h1>Нестеров Михаил</h1>
      <h1>Глазырина Екатерина</h1>
      <h1>Каштанов Арсений</h1>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.about {
  width: 92%;
  height: 450px;

  margin: 100px auto;
  text-decoration: none;
  color: white;
  border-radius: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;

  min-height: 10%;
  background: transparent !important;

  position: relative;
  overflow: hidden;
}
.about_alert {
  margin-top: 70px;
}
.about::before {
  content: '';
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(90deg);
  width: 300px;
  height: 600px;
  background: linear-gradient(135deg, rgba(22, 7, 117, 0.5), rgba(165, 20, 98, 0.5));
  border-radius: 100px;
  z-index: 0;
}

.about > * {
  position: relative;
  z-index: 1;
}

.about h1 {
  font-size: 36px; /* Заголовок */
  font-weight: bold;
}

.about_button {
  background-color: #000000;
  color: white;
  border-color: black;
}
</style>
