import { reactive, computed } from 'vue'
import charactersData from '../data/characters.json'
import scenesData from '../data/scenes.json'

const characters = reactive(JSON.parse(JSON.stringify(charactersData.characters)))
const stateLabels = charactersData.stateLabels
const scenes = scenesData.scenes
const endings = scenesData.endings

// Game state
const currentSceneIndex = reactive({ value: 0 })
const investigationComplete = reactive({ value: false })
const philosophyResults = reactive({})
const guiltValues = reactive({})
const playerChoices = reactive({})
const collectedEvidence = reactive({})

// Computed
const currentScene = computed(() => scenes[currentSceneIndex.value])

function getCharacter(id) {
  return characters[id]
}

function applyEffects(effects) {
  for (const [charId, stateChanges] of Object.entries(effects)) {
    const char = characters[charId]
    if (!char) continue
    for (const [stateKey, delta] of Object.entries(stateChanges)) {
      if (char.states[stateKey] !== undefined) {
        // Amplify effects so choices feel meaningful
        const amplified = Math.round(delta * 1.5)
        char.states[stateKey] = Math.max(0, Math.min(100, char.states[stateKey] + amplified))
      }
    }
  }
}

function getStateLabel(key) {
  return stateLabels[key] || key
}

function nextScene() {
  if (currentSceneIndex.value < scenes.length - 1) {
    currentSceneIndex.value++
  }
}

function prevScene() {
  if (currentSceneIndex.value > 0) {
    currentSceneIndex.value--
  }
}

function setScene(index) {
  if (index >= 0 && index < scenes.length) {
    currentSceneIndex.value = index
  }
}

function setGuilt(charId, value) {
  guiltValues[charId] = value
}

function setPhilosophyResult(chainId, stance) {
  philosophyResults[chainId] = stance
}

function recordChoice(key, value) {
  playerChoices[key] = value
}

function recordEvidence(itemId) {
  collectedEvidence[itemId] = true
}

function getEnding() {
  const gv = guiltValues
  const cond = {
    fyodor_guilt: gv.fyodor ?? 50,
    dmitri_guilt: gv.dmitri ?? 50,
    ivan_guilt: gv.ivan ?? 50,
    smerdyakov_guilt: gv.smerdyakov ?? 50,
    alyosha_guilt: gv.alyosha ?? 30,
    ivan_conscience: characters.ivan?.states?.conscience ?? 60
  }

  for (const ending of endings) {
    if (ending.condition && checkCondition(ending.condition, cond)) {
      return ending
    }
  }
  return endings.find(e => e.id === 'family_tragedy') || endings[3] || endings[0]
}

function checkCondition(conditionStr, values) {
  if (!conditionStr) return false
  const parts = conditionStr.split(' AND ')
  return parts.every(part => {
    const match = part.trim().match(/(\w+)\s*([<>=!]+)\s*(\d+)/)
    if (!match) return false
    const [, key, op, val] = match
    const actual = values[key] || 0
    const numVal = parseInt(val)
    switch (op) {
      case '>': return actual > numVal
      case '<': return actual < numVal
      case '>=': return actual >= numVal
      case '<=': return actual <= numVal
      case '==': return actual === numVal
      default: return false
    }
  })
}

export {
  characters, scenes, endings, stateLabels,
  currentSceneIndex, investigationComplete, philosophyResults, guiltValues,
  playerChoices, collectedEvidence,
  currentScene, getCharacter, applyEffects, getStateLabel,
  nextScene, prevScene, setScene, setGuilt, setPhilosophyResult,
  recordChoice, recordEvidence, getEnding
}
