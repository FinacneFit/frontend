<script setup>
import { computed } from 'vue'

const props = defineProps({
  nickname: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  size: { type: String, default: 'md' }, // xs | sm | md | lg | xl
})

const initial = computed(() => props.nickname.trim().charAt(0) || '?')
</script>

<template>
  <img
    v-if="imageUrl"
    :src="imageUrl"
    class="avatar"
    :class="`size-${size}`"
    :alt="`${nickname} 프로필`"
    draggable="false"
  />
  <span v-else class="avatar fallback" :class="`size-${size}`" aria-hidden="true">
    {{ initial }}
  </span>
</template>

<style scoped>
.avatar {
  border-radius: 50%;
  display: block;
  flex-shrink: 0;
  object-fit: cover;
  user-select: none;
}
.fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1b78fd, #2adbc6);
  color: #fff;
  font-weight: 700;
}
.size-xs  { width: 20px; height: 20px; font-size: 9px; }
.size-sm  { width: 28px; height: 28px; font-size: 11px; }
.size-md  { width: 40px; height: 40px; font-size: 15px; }
.size-lg  { width: 56px; height: 56px; font-size: 20px; }
.size-xl  { width: 80px; height: 80px; font-size: 28px; }
</style>
