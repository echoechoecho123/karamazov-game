<template>
  <div class="guilt-view">
    <div class="guilt-atmosphere">{{ scene.atmosphere }}</div>
    <p class="guilt-intro">{{ scene.intro }}</p>

    <div class="guilt-context">
      <span class="context-icon">◈</span>
      以下初始值由你在前七幕的所有选择决定——每一句沉默、每一个念头、每一次哲学推论。
      你可以手动调整。
    </div>

    <div class="guilt-sliders">
      <div v-for="slider in scene.guiltSliders" :key="slider.id" class="guilt-item">
        <div class="guilt-header">
          <span class="guilt-label">{{ slider.label }}</span>
          <span class="guilt-value" :style="{ color: getGuiltColor(getVal(slider.id)) }">
            {{ getVal(slider.id) }}%
          </span>
        </div>
        <input type="range" min="0" max="100" :value="getVal(slider.id)"
          @input="updateGuilt(slider.id, $event)" class="guilt-slider"
          :style="{ '--guilt-color': getGuiltColor(getVal(slider.id)) }" />
        <p class="guilt-hint">{{ slider.hint }}</p>
        <div class="guilt-reasons" v-if="reasonItems[slider.id]?.length">
          <p v-for="(r, i) in reasonItems[slider.id]" :key="i" class="guilt-reason">
            {{ r.prefix }}{{ r.text }}
          </p>
        </div>
      </div>
    </div>

    <div class="guilt-total">
      罪责总和：{{ totalGuilt }}%
      <span class="guilt-warning">（罪责无需等于100%——有些罪溢出，有些罪未竟）</span>
    </div>

    <button class="scene-next-btn veredict-btn" @click="$emit('advance')">宣判 ▸</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  guiltValues, setGuilt, characters, philosophyResults, getStateLabel,
  playerChoices, collectedEvidence, recordChoice
} from '../store/gameStore.js'

const props = defineProps({ scene: Object })
const emit = defineEmits(['advance'])

const values = ref({})
const reasonItems = ref({})

function computeDefaults() {
  const s = characters; const p = philosophyResults; const pc = playerChoices; const ev = collectedEvidence

  const defaults = {}
  const reasons = {}

  // ── FYODOR ──
  let fb = 30 + Math.round(((s.fyodor?.states?.passion ?? 85) - (s.fyodor?.states?.conscience ?? 5)) / 3)
  const fr = []
  if (p.chain_fyodor === 'consequence') { fb += 20; fr.push({ prefix: '▸ ', text: '哲学推论：他创造的地狱必然导致暴力' }) }
  else if (p.chain_fyodor === 'existential') { fb += 35; fr.push({ prefix: '▸ ', text: '哲学推论：他的一生都在自我毁灭' }) }
  else { fr.push({ prefix: '▸ ', text: '哲学推论：恶人不等于活该被杀' }) }
  if (ev.envelope) { fr.push({ prefix: '▸ ', text: '物证：那封写给格鲁申卡的信——他死前还在谋划诱惑' }) }
  defaults.fyodor = Math.max(0, Math.min(100, fb))
  reasons.fyodor = fr

  // ── DMITRI ──
  let db = 20 + Math.round(((s.dmitri?.states?.passion ?? 90) + (s.dmitri?.states?.despair ?? 40) - (s.dmitri?.states?.conscience ?? 50)) / 3)
  const dr = []
  if (p.chain_dmitri === 'consequence') { db += 25; dr.push({ prefix: '▸ ', text: '哲学推论：他的暴力倾向为谋杀创造了条件' }) }
  else if (p.chain_dmitri === 'existential') { db += 15; dr.push({ prefix: '▸ ', text: '哲学推论：最后一刻的转身是高尚的——但仇恨真实存在' }) }
  else { dr.push({ prefix: '▸ ', text: '哲学推论：法律上他无罪' }) }
  if (pc.storm_dmitri_night) {
    const storm = pc.storm_dmitri_night
    if (storm.includes('转身') || storm.includes('不做')) {
      db -= 18; dr.push({ prefix: '✦ ', text: '在深夜的花园里，你让他选择了转身离开。他没有成为那个虫豸。' })
    } else if (storm.includes('完了')) {
      db += 12; dr.push({ prefix: '✦ ', text: '在深夜的花园里，他被绝望淹没——\"我本来就完了\"。' })
    }
  }
  if ((s.dmitri?.states?.conscience ?? 50) > 65) { db -= 12 }
  if (ev.pestle) { dr.push({ prefix: '▸ ', text: '物证：铜杵——他没杀人，但留下了最致命的证据' }) }
  defaults.dmitri = Math.max(0, Math.min(100, db))
  reasons.dmitri = dr

  // ── IVAN ──
  const ivR = s.ivan?.states?.reason ?? 95, ivC = s.ivan?.states?.conscience ?? 60
  const ivD = s.ivan?.states?.despair ?? 45, ivF = s.ivan?.states?.faith ?? 10
  let ib = 30 + Math.round((ivR + ivD - ivC - ivF/2) / 3)
  const ir = []
  if (p.chain_ivan === 'existential') { ib += 30; ir.push({ prefix: '▸ ', text: '哲学推论：他的哲学和谋杀之间有因果链条' }) }
  else if (p.chain_ivan === 'consequence') { ib += 15; ir.push({ prefix: '▸ ', text: '哲学推论：他的沉默创造了杀人的条件' }) }
  else { ir.push({ prefix: '▸ ', text: '哲学推论：思想本身不应为他人的曲解负责' }) }

  // Check inquisitor choices
  const inqKeys = Object.keys(pc).filter(k => k.startsWith('inquisitor_'))
  if (inqKeys.length >= 3) {
    const allDark = inqKeys.every(k => pc[k].includes('继续陈述') || pc[k].includes('完成'))
    if (allDark) { ib += 20; ir.push({ prefix: '✦ ', text: '在宗教大法官的辩词中，你完成了全部控诉——没有一次停下来面对沉默的基督。' }) }
    else if (inqKeys.some(k => pc[k].includes('沉默') || pc[k].includes('直视'))) {
      ib -= 10; ir.push({ prefix: '✦ ', text: '在宗教大法官的辩词中，你停下来了——你直视了沉默的基督。' })
    }
  }

  // Silence choice in scene 4
  if (pc.storm_ivan_smerdyakov_1) {
    if (pc.storm_ivan_smerdyakov_1.includes('沉默')) {
      ib += 20; ir.push({ prefix: '✦ ', text: '在去莫斯科之前，你选择了沉默。斯麦尔佳科夫将这理解为默许。' })
    } else if (pc.storm_ivan_smerdyakov_1.includes('追问')) {
      ib -= 10; ir.push({ prefix: '✦ ', text: '在去莫斯科之前，你追问了他——但他退缩了，结果并未改变。' })
    }
  }

  if (ivD > 70) { ib += 15; ir.push({ prefix: '▸ ', text: '他的精神在崩溃边缘——斯麦尔佳科夫的告白击碎了他' }) }
  if (ivC > 75) { ir.push({ prefix: '▸ ', text: '但他从未停止自省。良知是他的审判者。' }) }
  if (ev.book) { ir.push({ prefix: '▸ ', text: '物证：斯麦尔佳科夫房间里那本翻开的哲学书——书页上有铅笔划的线' }) }
  defaults.ivan = Math.max(0, Math.min(100, ib))
  reasons.ivan = ir

  // ── SMERDYAKOV ──
  let sb = 70
  const sr = []
  if (p.chain_smerdyakov === 'obligation') { sb = 90; sr.push({ prefix: '▸ ', text: '哲学推论：动手的人承担最终责任——无论谁影响了他' }) }
  else if (p.chain_smerdyakov === 'existential') { sb = 75; sr.push({ prefix: '▸ ', text: '哲学推论：他的选择是自主的——但这意味着谁都可以成为他' }) }
  else { sb = 65; sr.push({ prefix: '▸ ', text: '哲学推论：他是被伊万哲学武装的工具' }) }
  if (ev.footprints) { sr.push({ prefix: '▸ ', text: '物证：走廊上的泥脚印——他精心设计的癫痫伪装有一个漏洞' }) }
  if (ev.chair) { sr.push({ prefix: '▸ ', text: '物证：翻倒的椅子——死者把他放进来了，因为他是\"自己人\"' }) }
  defaults.smerdyakov = sb
  reasons.smerdyakov = sr

  // ── ALYOSHA ──
  const alF = s.alyosha?.states?.faith ?? 80, alD = s.alyosha?.states?.doubt ?? 25
  const alC = s.alyosha?.states?.conscience ?? 75
  let ab = Math.round((alD + (100 - alF) / 2) / 2)
  const ar = []
  if (p.chain_alyosha === 'existential') { ab += 25; ar.push({ prefix: '▸ ', text: '哲学推论：爱如果不行动，就不是真正的爱' }) }
  else if (p.chain_alyosha === 'consequence') { ab += 15; ar.push({ prefix: '▸ ', text: '哲学推论：他的消极让一切无可挽回' }) }
  else { ar.push({ prefix: '▸ ', text: '哲学推论：他只是太年轻太软弱' }) }

  // Storm from scene 1
  if (pc.storm_monastery) {
    if (pc.storm_monastery.includes('不安') || pc.storm_monastery.includes('羞耻')) {
      ab += 12; ar.push({ prefix: '✦ ', text: '在修道院聚会后，你让阿辽沙直面了不安和羞耻——他的信仰开始动摇。' })
    } else if (pc.storm_monastery.includes('爱能包容')) {
      ab -= 8; ar.push({ prefix: '✦ ', text: '在修道院聚会后，你选择相信爱能包容一切——包括父亲，包括伊万的问题。' })
    }
  }
  if (alC > 80) { ab += 10; ar.push({ prefix: '▸ ', text: '他的良知知道自己本可以做更多' }) }
  if (ev.icon) { ar.push({ prefix: '▸ ', text: '物证：书房角落里那尊落灰的圣像——沉默的见证者' }) }
  defaults.alyosha = Math.max(0, Math.min(100, ab))
  reasons.alyosha = ar

  return { defaults, reasons }
}

onMounted(() => {
  const { defaults, reasons } = computeDefaults()
  for (const [id, val] of Object.entries(defaults)) {
    if (guiltValues[id] === undefined) {
      values.value[id] = val; setGuilt(id, val)
    } else {
      values.value[id] = guiltValues[id]
    }
  }
  reasonItems.value = reasons
})

function getVal(id) { return values.value[id] ?? 0 }
function updateGuilt(id, event) {
  const val = parseInt(event.target.value); values.value[id] = val; setGuilt(id, val)
}
const totalGuilt = computed(() => {
  const sl = props.scene.guiltSliders || []
  return sl.reduce((sum, s) => sum + (values.value[s.id] || 0), 0)
})
function getGuiltColor(val) {
  if (val >= 70) return '#dc2626'; if (val >= 40) return '#e85d3a'; return '#8b6914'
}
</script>
