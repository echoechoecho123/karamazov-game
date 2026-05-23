<template>
  <div class="scene-player">
    <!-- Atmosphere bar -->
    <div v-if="scene.atmosphere" class="scene-atmosphere">
      {{ scene.atmosphere }}
    </div>

    <!-- Dialogue lines -->
    <div class="dialogue-stream" ref="dialogueRef">
      <div
        v-for="(line, i) in visibleLines"
        :key="i"
        class="dialogue-line"
        :class="{
          'speaker-alyosha': line.speaker === 'alyosha',
          'speaker-ivan': line.speaker === 'ivan',
          'speaker-dmitri': line.speaker === 'dmitri',
          'speaker-smerdyakov': line.speaker === 'smerdyakov',
          'speaker-fyodor': line.speaker === 'fyodor',
          'speaker-zosima': line.speaker === 'zosima',
          'speaker-narrator': line.speaker === 'narrator',
          'inner-thought': line.tone === '内心',
          'key-line': line.tone === '陈述事实'
        }"
      >
        <span class="speaker-name" v-if="line.speaker && line.speaker !== 'narrator'">
          {{ getSpeakerName(line.speaker) }}
        </span>
        <span class="line-text">{{ line.line }}</span>
        <span class="line-tone" v-if="line.tone">{{ line.tone }}</span>
      </div>
    </div>

    <!-- Continue prompt -->
    <div v-if="showContinue" class="continue-prompt" @click="advanceDialogue">
      继续
    </div>

    <!-- Inner Storm -->
    <div v-if="showInnerStorm" class="inner-storm-overlay">
      <div class="storm-label">{{ currentInnerStorm.label }}</div>
      <div class="storm-fragments">
        <div
          v-for="(frag, fi) in currentInnerStorm.fragments"
          :key="fi"
          class="storm-fragment"
          :class="{ selected: selectedFragments.has(fi) }"
          @click="toggleFragment(fi)"
        >
          {{ frag.text }}
        </div>
      </div>
      <div class="storm-instruction">
        选择 {{ currentInnerStorm.pick || 2 }} 个念头来强化
      </div>
      <button
        class="storm-confirm"
        :disabled="selectedFragments.size !== (currentInnerStorm.pick || 2)"
        @click="confirmStorm"
      >
        ▸
      </button>
    </div>

    <!-- Inquisitor Speeches -->
    <div v-if="showInquisitor" class="inquisitor-overlay">
      <div class="inquisitor-speech-title">{{ currentSpeech.title }}</div>
      <div class="inquisitor-speech-content">{{ currentSpeech.content }}</div>
      <div class="inquisitor-choices">
        <button
          v-for="(choice, ci) in currentSpeech.choices"
          :key="ci"
          class="inquisitor-choice"
          :class="choice.style"
          @click="selectInquisitorChoice(ci)"
        >
          {{ choice.text }}
        </button>
      </div>
    </div>

    <!-- After scene -->
    <div v-if="showAfterStorm" class="after-storm">
      <p>{{ scene.afterStorm }}</p>
      <button class="scene-next-btn" @click="$emit('advance')">
        下一幕 ▸
      </button>
    </div>

    <!-- Trial verdicts -->
    <div v-if="showVerdicts" class="verdicts">
      <div v-for="(v, vi) in scene.verdicts" :key="vi" class="verdict-item">
        <p>{{ v.text }}</p>
      </div>
      <button class="scene-next-btn" @click="$emit('advance')">
        进入罪责分配 ▸
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getCharacter, applyEffects, getStateLabel, recordChoice } from '../store/gameStore.js'

const props = defineProps({
  scene: Object
})
const emit = defineEmits(['advance'])

const dialogueIndex = ref(0)
const showContinue = ref(true)
const showInnerStorm = ref(false)
const showInquisitor = ref(false)
const currentInquisitorIndex = ref(0)
const showAfterStorm = ref(false)
const showVerdicts = ref(false)
const selectedFragments = ref(new Set())
const dialogueRef = ref(null)

// Reset all state when scene changes
watch(() => props.scene?.id, () => {
  dialogueIndex.value = 0
  showContinue.value = true
  showInnerStorm.value = false
  showInquisitor.value = false
  currentInquisitorIndex.value = 0
  showAfterStorm.value = false
  showVerdicts.value = false
  selectedFragments.value = new Set()
})

const visibleLines = computed(() => {
  const base = props.scene.dialogue || []
  if (props.scene.dialogueContinued && dialogueIndex.value >= base.length) {
    return [...base, ...props.scene.dialogueContinued]
  }
  return base.slice(0, dialogueIndex.value + 1)
})

const currentInnerStorm = computed(() => props.scene.innerStorm)
const currentSpeech = computed(() => {
  if (props.scene.inquisitorSpeeches) {
    return props.scene.inquisitorSpeeches[currentInquisitorIndex.value]
  }
  return null
})

function advanceDialogue() {
  const allLines = [
    ...(props.scene.dialogue || []),
    ...(props.scene.dialogueContinued || [])
  ]

  if (dialogueIndex.value < allLines.length - 1) {
    dialogueIndex.value++
    scrollToBottom()
  } else {
    // Dialogue complete - check what's next
    if (props.scene.innerStorm && !showInnerStorm.value && !showAfterStorm.value) {
      showContinue.value = false
      showInnerStorm.value = true
    } else if (props.scene.inquisitorSpeeches && !showInquisitor.value && !showAfterStorm.value) {
      showContinue.value = false
      showInquisitor.value = true
      currentInquisitorIndex.value = 0
    } else if (props.scene.verdicts && !showVerdicts.value) {
      showContinue.value = false
      showVerdicts.value = true
    } else {
      showContinue.value = false
      showAfterStorm.value = true
    }
  }
}

function toggleFragment(index) {
  const s = new Set(selectedFragments.value)
  if (s.has(index)) {
    s.delete(index)
  } else {
    s.add(index)
  }
  selectedFragments.value = s
}

function confirmStorm() {
  const storm = currentInnerStorm.value
  if (!storm) return
  const chosen = []
  for (const idx of selectedFragments.value) {
    const frag = storm.fragments[idx]
    if (frag?.effects) {
      applyEffects(frag.effects)
      chosen.push(frag.text.slice(0, 30))
    }
  }
  // Record the choice
  const sceneId = props.scene?.id || 'unknown'
  recordChoice(`storm_${sceneId}`, chosen.join(' | '))
  showInnerStorm.value = false
  showAfterStorm.value = true
}

function selectInquisitorChoice(index) {
  const choice = currentSpeech.value?.choices?.[index]
  if (!choice) return
  if (choice.effects) applyEffects(choice.effects)
  recordChoice(`inquisitor_${currentInquisitorIndex.value}`, choice.text.slice(0, 40))

  if (choice.isFinal || currentInquisitorIndex.value >= (props.scene.inquisitorSpeeches?.length || 1) - 1) {
    showInquisitor.value = false
    showAfterStorm.value = true
  } else {
    currentInquisitorIndex.value++
  }
}

function scrollToBottom() {
  setTimeout(() => {
    if (dialogueRef.value) {
      dialogueRef.value.scrollTop = dialogueRef.value.scrollHeight
    }
  }, 50)
}

function getSpeakerName(id) {
  if (id === 'narrator') return ''
  const char = getCharacter(id)
  return char?.name || id
}
</script>
