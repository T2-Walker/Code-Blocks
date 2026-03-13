<template>
  <div class="app">
    <NavBar />
    <div class="content">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'
</script>

<style>
.app {
  display: flex;
  flex-direction: column;
  background-color: #264b91;
  background-image: url('https://s10.iimage.su/s/09/gdxI2bQxa5m1zhPzRjTXK9tbFz1HdNPzoF2guowh1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
  width: 100%;
}

.content {
  flex: 1;
  flex-direction: column;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 0;
}

. {
  background-color: #131313;
  width: 100%;
  min-height: 100%;
}
</style>
