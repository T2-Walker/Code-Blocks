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
  background-color: aquamarine;
  min-height: 100vh;
  width: 100%;
}

.content{
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
