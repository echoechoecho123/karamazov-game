<template>
  <div class="orthodox-cross" :style="{ left: x + 'px', top: y + 'px' }">
    <div class="cross-vertical"></div>
    <div class="cross-horizontal"></div>
    <div class="cross-slant"></div>
  </div>
</template>

<script setup>
defineProps({
  x: Number,
  y: Number
})
</script>
