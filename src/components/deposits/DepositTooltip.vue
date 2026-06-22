<script setup>
defineProps({
  text: { type: String, required: true },
})
</script>

<template>
  <span class="tooltip-wrap">
    <span class="tooltip-trigger">?</span>
    <span class="tooltip-box">{{ text }}</span>
  </span>
</template>

<style scoped>
.tooltip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.tooltip-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #e5e7eb;
  color: #6b7280;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  cursor: default;
  user-select: none;
  flex-shrink: 0;
}
.tooltip-box {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #fff;
  font-size: 11px;
  font-family: 'Noto Sans KR', sans-serif;
  line-height: 1.5;
  padding: 7px 10px;
  border-radius: 8px;
  white-space: pre-line;
  width: 200px;
  z-index: 100;
  pointer-events: none;
  word-break: keep-all;
}
.tooltip-box::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #111827;
}
.tooltip-wrap:hover .tooltip-box {
  display: block;
}
</style>
