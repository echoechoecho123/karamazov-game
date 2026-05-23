<template>
  <div class="investigation-view">
    <!-- Atmosphere -->
    <div class="scene-atmosphere">
      {{ scene.atmosphere || '寂静的宅邸 · 雪从破窗飘进来' }}
    </div>

    <div class="investigation-intro">{{ scene.intro }}</div>

    <!-- Phase tabs -->
    <div class="investigation-tabs">
      <button
        :class="{ active: phase === 'evidence' }"
        @click="phase = 'evidence'"
        :disabled="false"
      >物证</button>
      <button
        :class="{ active: phase === 'philosophy' }"
        @click="phase = 'philosophy'"
        :disabled="collectedEvidence.size < 3"
      >思辨</button>
    </div>

    <!-- Phase 1: Evidence Collection -->
    <div v-if="phase === 'evidence'" class="evidence-phase">
      <div class="evidence-map">
        <div
          v-for="item in scene.evidenceItems"
          :key="item.id"
          class="evidence-node"
          :class="{
            collected: collectedEvidence.has(item.id),
            active: selectedEvidence === item.id
          }"
          :style="getNodePosition(item)"
          @click="selectEvidence(item)"
        >
          <span class="evidence-icon">{{ evidenceIcon(item) }}</span>
          <span class="evidence-label">{{ item.name }}</span>
        </div>
      </div>

      <div v-if="selectedEvidenceData" class="evidence-detail">
        <h3 class="evidence-name">{{ selectedEvidenceData.name }}</h3>
        <p class="evidence-location">{{ selectedEvidenceData.location }}</p>
        <div class="evidence-card">
          <p class="evidence-surface">{{ selectedEvidenceData.surface }}</p>
        </div>
        <div class="evidence-card deep" v-if="collectedEvidence.has(selectedEvidenceData.id)">
          <p class="evidence-deep">{{ selectedEvidenceData.deep }}</p>
          <div class="evidence-tag">{{ selectedEvidenceData.philosophyTag }}</div>
        </div>
        <button
          v-if="!collectedEvidence.has(selectedEvidenceData.id)"
          class="collect-btn"
          @click="collectEvidence(selectedEvidenceData.id)"
        >收集证物</button>
      </div>

      <div class="evidence-count">
        已收集：{{ collectedEvidence.size }} / {{ scene.evidenceItems.length }}
      </div>
    </div>

    <!-- Phase 2: Philosophy Chains -->
    <div v-if="phase === 'philosophy'" class="philosophy-phase">
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
import { ref, computed } from 'vue'
import { applyEffects, setPhilosophyResult, recordEvidence } from '../store/gameStore.js'

const props = defineProps({ scene: Object })
const emit = defineEmits(['advance'])

const phase = ref('evidence')
const selectedEvidence = ref(null)
const collectedEvidence = ref(new Set())
const activeChain = ref(null)
const resolvedChains = ref(new Set())

const selectedEvidenceData = computed(() => {
  if (!selectedEvidence.value) return null
  return props.scene.evidenceItems.find(e => e.id === selectedEvidence.value)
})

function selectEvidence(item) {
  selectedEvidence.value = item.id
}

function collectEvidence(id) {
  const c = new Set(collectedEvidence.value)
  c.add(id)
  collectedEvidence.value = c
  recordEvidence(id)
}

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

function evidenceIcon(item) {
  const icons = {
    pestle: '⚒', envelope: '✉', chair: '🪑',
    footprints: '👣', book: '📖', icon: '✙'
  }
  return icons[item.id] || '○'
}

const nodePositions = {
  pestle: { top: '65%', left: '15%' },
  envelope: { top: '20%', left: '40%' },
  chair: { top: '35%', left: '55%' },
  footprints: { top: '70%', left: '50%' },
  book: { top: '55%', left: '75%' },
  icon: { top: '15%', left: '70%' }
}

function getNodePosition(item) {
  const pos = nodePositions[item.id] || { top: '50%', left: '50%' }
  return { top: pos.top, left: pos.left }
}
</script>
