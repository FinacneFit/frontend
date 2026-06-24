<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  file: { type: File, required: true },
})
const emit = defineEmits(['confirm', 'cancel'])

const VIEW_SIZE = 320
const OUTPUT_SIZE = 512

const imageElement = ref(null)
const imageUrl = ref('')
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)
const isSaving = ref(false)
let dragStart = null

const baseScale = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return 1
  return Math.max(VIEW_SIZE / naturalWidth.value, VIEW_SIZE / naturalHeight.value)
})
const scale = computed(() => baseScale.value * zoom.value)
const displayWidth = computed(() => naturalWidth.value * scale.value)
const displayHeight = computed(() => naturalHeight.value * scale.value)
const imageStyle = computed(() => ({
  width: `${displayWidth.value}px`,
  height: `${displayHeight.value}px`,
  left: `${(VIEW_SIZE - displayWidth.value) / 2 + offsetX.value}px`,
  top: `${(VIEW_SIZE - displayHeight.value) / 2 + offsetY.value}px`,
}))

function clampOffsets() {
  const maxX = Math.max(0, (displayWidth.value - VIEW_SIZE) / 2)
  const maxY = Math.max(0, (displayHeight.value - VIEW_SIZE) / 2)
  offsetX.value = Math.min(maxX, Math.max(-maxX, offsetX.value))
  offsetY.value = Math.min(maxY, Math.max(-maxY, offsetY.value))
}

watch(zoom, () => nextTick(clampOffsets))

function onImageLoad(event) {
  naturalWidth.value = event.target.naturalWidth
  naturalHeight.value = event.target.naturalHeight
  offsetX.value = 0
  offsetY.value = 0
}

function startDrag(event) {
  event.currentTarget.setPointerCapture(event.pointerId)
  isDragging.value = true
  dragStart = {
    x: event.clientX,
    y: event.clientY,
    offsetX: offsetX.value,
    offsetY: offsetY.value,
  }
}

function moveDrag(event) {
  if (!isDragging.value || !dragStart) return
  offsetX.value = dragStart.offsetX + event.clientX - dragStart.x
  offsetY.value = dragStart.offsetY + event.clientY - dragStart.y
  clampOffsets()
}

function endDrag() {
  isDragging.value = false
  dragStart = null
}

async function confirmCrop() {
  if (!imageElement.value || !naturalWidth.value) return
  isSaving.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const context = canvas.getContext('2d')
    const imageLeft = (VIEW_SIZE - displayWidth.value) / 2 + offsetX.value
    const imageTop = (VIEW_SIZE - displayHeight.value) / 2 + offsetY.value
    const sourceX = -imageLeft / scale.value
    const sourceY = -imageTop / scale.value
    const sourceSize = VIEW_SIZE / scale.value

    context.drawImage(
      imageElement.value,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) throw new Error('이미지를 자르지 못했습니다.')
    emit('confirm', new File([blob], 'profile.jpg', { type: 'image/jpeg' }))
  } finally {
    isSaving.value = false
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') emit('cancel')
}

onMounted(() => {
  imageUrl.value = URL.createObjectURL(props.file)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="crop-overlay" @click.self="$emit('cancel')">
    <div class="crop-modal" role="dialog" aria-modal="true" aria-label="프로필 사진 자르기">
      <div class="crop-header">
        <h2>프로필 사진 설정</h2>
        <button type="button" aria-label="닫기" @click="$emit('cancel')">×</button>
      </div>

      <p class="crop-guide">사진을 움직여 원 안에 표시할 부분을 맞춰주세요.</p>
      <div
        class="crop-viewport"
        :class="{ dragging: isDragging }"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
      >
        <img
          ref="imageElement"
          :src="imageUrl"
          :style="imageStyle"
          alt="자를 프로필 사진"
          draggable="false"
          @load="onImageLoad"
        />
      </div>

      <div class="zoom-row">
        <span class="zoom-small">−</span>
        <input v-model.number="zoom" type="range" min="1" max="3" step="0.01" aria-label="사진 확대 비율" />
        <span class="zoom-large">＋</span>
      </div>

      <div class="crop-actions">
        <button class="btn-cancel" type="button" @click="$emit('cancel')">취소</button>
        <button class="btn-confirm" type="button" :disabled="isSaving || !naturalWidth" @click="confirmCrop">
          {{ isSaving ? '처리 중...' : '적용' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crop-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(15, 23, 42, 0.65); }
.crop-modal { width: min(440px, 100%); padding: 22px; border-radius: 18px; background: #fff; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28); }
.crop-header { display: flex; align-items: center; justify-content: space-between; }
.crop-header h2 { font-size: 19px; font-weight: 700; }
.crop-header button { border: none; background: none; color: #6b7280; font-size: 28px; cursor: pointer; }
.crop-guide { margin: 8px 0 18px; color: #6b7280; font-size: 13px; }
.crop-viewport { position: relative; width: 320px; height: 320px; max-width: 100%; margin: 0 auto; overflow: hidden; border: 4px solid #fff; border-radius: 50%; background: #e5e7eb; box-shadow: 0 0 0 2px #1b78fd, 0 8px 24px rgba(15, 23, 42, 0.18); cursor: grab; touch-action: none; user-select: none; }
.crop-viewport.dragging { cursor: grabbing; }
.crop-viewport img { position: absolute; max-width: none; pointer-events: none; user-select: none; }
.zoom-row { display: flex; align-items: center; gap: 12px; margin: 22px 12px 18px; color: #6b7280; }
.zoom-row input { flex: 1; accent-color: #1b78fd; }
.zoom-small { font-size: 18px; }
.zoom-large { font-size: 22px; }
.crop-actions { display: flex; justify-content: flex-end; gap: 10px; }
.crop-actions button { height: 42px; padding: 0 22px; border-radius: 11px; font-weight: 700; cursor: pointer; }
.btn-cancel { border: 1px solid #d1d5db; background: #fff; color: #6b7280; }
.btn-confirm { border: none; background: #1b78fd; color: #fff; }
.btn-confirm:disabled { opacity: 0.5; cursor: wait; }
@media (max-width: 390px) {
  .crop-viewport { width: 270px; height: 270px; }
}
</style>
