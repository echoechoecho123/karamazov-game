<template>
  <div class="start-screen">
    <div class="start-ornament top">✙</div>
    <h1 class="start-title">卡拉马佐夫</h1>
    <h2 class="start-subtitle">良心之罪</h2>
    <div class="start-divider">━━ ✙ ━━</div>
    <p class="start-epigraph">
      "如果上帝不存在，一切是否都被允许？"
    </p>
    <p class="start-credit">基于陀思妥耶夫斯基《卡拉马佐夫兄弟》</p>
    <button class="start-btn" @click="$emit('start')">
      进入
      <span class="btn-glow"></span>
    </button>
    <div class="start-ornament bottom">✙</div>
  </div>
</template>

<script setup>
defineEmits(['start'])
</script>
