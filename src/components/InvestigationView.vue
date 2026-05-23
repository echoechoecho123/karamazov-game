<template>
  <div class="investigation-view">
    <div class="scene-atmosphere">{{ scene.atmosphere || '寂静的宅邸 · 雪从破窗飘进来' }}</div>
    <div class="investigation-intro">{{ scene.intro }}</div>

    <div class="philosophy-phase">
      <div class="chain-list">
        <div
          v-for="chain in scene.philosophyChains"
          :key="chain.id"
          class="chain-card"
          :class="{ resolved: resolvedChains.has(chain.id), active: activeChain === chain.id }"
          @click="activeChain = chain.id"
        >
          <div class="chain-title">{{ chain.title }}</div>
          <div class="chain-nodes" v-if="activeChain === chain.id">
            <div v-for="(node, ni) in chain.nodes" :key="ni" class="chain-node">
              <span class="chain-dot"></span>
              {{ node }}
            </div>
          </div>
          <div class="chain-question" v-if="activeChain === chain.id">
            <span class="question-mark">?</span>
            {{ chain.question }}
          </div>
          <div class="chain-choices" v-if="activeChain === chain.id && !resolvedChains.has(chain.id)">
            <button
              v-for="(choice, ci) in chain.choices"
              :key="ci"
              class="chain-choice"
              @click.stop="resolveChain(chain, ci)"
            >
              {{ choice.text }}
            </button>
          </div>
          <div class="chain-resolved" v-if="resolvedChains.has(chain.id)">
            已思辨 ✓
          </div>
        </div>
      </div>

      <div class="resolve-count">
        已思辨：{{ resolvedChains.size }} / {{ scene.philosophyChains.length }}
      </div>

      <button
        v-if="resolvedChains.size >= 4"
        class="scene-next-btn"
        @click="$emit('advance')"
      >
        进入法庭 ▸
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { setPhilosophyResult } from '../store/gameStore.js'

const props = defineProps({ scene: Object })
const emit = defineEmits(['advance'])

const activeChain = ref(null)
const resolvedChains = ref(new Set())

function resolveChain(chain, choiceIndex) {
  const choice = chain.choices[choiceIndex]
  if (choice?.effects) {
    for (const [key, val] of Object.entries(choice.effects)) {
      setPhilosophyResult(key, val)
    }
  }
  setPhilosophyResult(chain.id, choice?.stance || 'obligation')
  const r = new Set(resolvedChains.value)
  r.add(chain.id)
  resolvedChains.value = r
}
</script>
