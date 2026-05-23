<template>
  <div class="ending-screen">
    <div class="ending-ornament">✙</div>
    <h1 class="ending-title">{{ ending.title }}</h1>
    <div class="ending-divider">━━ ✙ ━━</div>

    <!-- Main narrative -->
    <p class="ending-text">{{ ending.narrative }}</p>

    <!-- Epigraph -->
    <div v-if="ending.epigraph" class="epigraph-section">
      <div class="epigraph-line"></div>
      <p class="epigraph-text">{{ ending.epigraph }}</p>
      <div class="epigraph-line"></div>
    </div>

    <!-- Character fate cards -->
    <div class="fates-section">
      <h3 class="section-heading">他们的命运</h3>
      <div class="fate-cards">
        <div v-for="fate in ending.fates" :key="fate.name" class="fate-card">
          <div class="fate-name">{{ fate.name }}</div>
          <p class="fate-text">{{ fate.fate }}</p>
        </div>
      </div>
    </div>

    <!-- Nearby endings -->
    <div v-if="ending.nearEndings" class="near-endings-section">
      <h3 class="section-heading">你离其他结局有多远</h3>
      <div class="near-ending-list">
        <div v-for="ne in ending.nearEndings" :key="ne.id" class="near-ending-item">
          <div class="near-ending-name">{{ ne.name }}</div>
          <div class="near-ending-distance">{{ ne.distance }}</div>
        </div>
      </div>
    </div>

    <div class="ending-ornament bottom">✙</div>

    <button class="restart-btn" @click="restart">重新开始</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getEnding } from '../store/gameStore.js'

const ending = computed(() => getEnding())

function restart() {
  window.location.reload()
}
</script>
