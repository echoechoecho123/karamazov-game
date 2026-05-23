<template>
  <div class="app" @click="onGlobalClick">
    <OrthodoxCross v-if="crossVisible" :x="crossX" :y="crossY" />

    <StartScreen v-if="!gameStarted" @start="gameStarted = true" />

    <template v-else>
      <header class="game-header" v-if="sceneType !== 'ending'">
        <div class="header-left">
          <span class="scene-era">{{ currentScene.era }}</span>
          <h2 class="scene-title">{{ currentScene.title }}</h2>
        </div>
        <div class="header-pov">
          <span class="pov-label">视角</span>
          <span class="pov-name">{{ povCharacter?.name || '调查者' }}</span>
        </div>
      </header>

      <main class="game-main">
        <ScenePlayer
          v-if="sceneType === 'dialogue'"
          :scene="currentScene"
          @advance="onSceneAdvance"
        />
        <InvestigationView
          v-else-if="sceneType === 'investigation'"
          :scene="currentScene"
          @advance="onSceneAdvance"
        />
        <GuiltAllocation
          v-else-if="sceneType === 'guilt'"
          :scene="currentScene"
          @advance="onSceneAdvance"
        />
        <EndingScreen
          v-else-if="sceneType === 'ending'"
        />
      </main>

      <nav class="scene-nav" v-if="sceneType !== 'ending'">
        <button
          v-for="(s, i) in scenes"
          :key="s.id"
          @click="setSceneStore(i)"
          :class="{ active: i === sceneIdxRef.value, played: i < sceneIdxRef.value }"
          :disabled="i > sceneIdxRef.value + 1"
        >
          {{ i + 1 }}
        </button>
      </nav>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  scenes, currentSceneIndex as sceneIdxRef, currentScene,
  getCharacter, nextScene, setScene as setSceneStore
} from './store/gameStore.js'
import StartScreen from './components/StartScreen.vue'
import ScenePlayer from './components/ScenePlayer.vue'
import InvestigationView from './components/InvestigationView.vue'
import GuiltAllocation from './components/GuiltAllocation.vue'
import EndingScreen from './components/EndingScreen.vue'
import OrthodoxCross from './components/OrthodoxCross.vue'

const gameStarted = ref(false)
const crossVisible = ref(false)
const crossX = ref(0)
const crossY = ref(0)

const currentSceneIndex = computed(() => sceneIdxRef.value)

const sceneType = computed(() => {
  if (currentSceneIndex.value >= scenes.length) return 'ending'
  const s = currentScene.value
  if (!s) return 'dialogue'
  if (s.id === 'guilt_allocation') return 'guilt'
  if (s.id === 'investigation') return 'investigation'
  if (s.id === 'trial') return 'dialogue'
  return 'dialogue'
})

const povCharacter = computed(() => {
  const pov = currentScene.value?.pov
  return pov && pov !== 'investigator' && pov !== 'observer' ? getCharacter(pov) : null
})

function onSceneAdvance() {
  if (sceneIdxRef.value < scenes.length - 1) {
    nextScene()
  } else {
    sceneIdxRef.value = scenes.length
  }
}

function onGlobalClick(event) {
  crossX.value = event.clientX
  crossY.value = event.clientY
  crossVisible.value = true
  setTimeout(() => { crossVisible.value = false }, 1200)
}
</script>

<style>
@import './styles/main.css';
</style>
