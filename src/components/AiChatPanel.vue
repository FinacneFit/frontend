<script setup>
import { ref, nextTick, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useChatStore } from '@/stores/chatStore'

marked.use({ gfm: true, breaks: true })

function renderMd(text) {
  if (!text) return ''
  try {
    const html = marked.parse(text, { async: false })
    return DOMPurify.sanitize(typeof html === 'string' ? html : text)
  } catch {
    return text
  }
}

const chatStore = useChatStore()
const inputText = ref('')
const messagesEl = ref(null)
const textareaEl = ref(null)

async function send() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await nextTick()
  resizeTextarea()
  await chatStore.sendMessage(text)
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

function resizeTextarea() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  const next = el.scrollHeight
  el.style.height = Math.min(next, 72) + 'px'
  el.style.overflowY = next > 72 ? 'auto' : 'hidden'
}

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick()
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  },
)
</script>

<template>
  <div class="chat-panel">
    <div class="chat-header">
      <span class="chat-icon">🤖</span>
      <div>
        <p class="chat-title">AI 챗봇</p>
        <p class="chat-sub">포트폴리오의 종목을 설명합니다.</p>
      </div>
    </div>

    <div ref="messagesEl" class="chat-messages">
      <div
        v-for="(msg, i) in chatStore.messages"
        :key="i"
        class="msg-row"
        :class="msg.role"
      >
        <div
          class="bubble"
          :class="{ 'md-body': msg.role === 'bot' }"
          v-html="msg.role === 'bot' ? renderMd(msg.text) : msg.text"
        />
      </div>
      <div v-if="chatStore.isTyping" class="msg-row bot">
        <div class="bubble typing">
          <span /><span /><span />
        </div>
      </div>
    </div>

    <div class="chat-input-row">
      <div class="input-wrap">
        <textarea
          ref="textareaEl"
          v-model="inputText"
          class="chat-input"
          placeholder="궁금한 것을 물어보세요 !"
          rows="1"
          @keydown="onKeydown"
          @input="resizeTextarea"
        />
      </div>
      <button class="btn-send" @click="send">전송</button>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.chat-icon { font-size: 22px; }
.chat-title {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: #000;
}
.chat-sub {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 9999px;
}
.chat-messages::-webkit-scrollbar-thumb:hover { background: #d1d5db; }

.msg-row { display: flex; }
.msg-row.user { justify-content: flex-end; }
.msg-row.bot { justify-content: flex-start; }

.bubble {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 봇 말풍선 마크다운 스타일 */
.md-body :deep(p)          { margin: 0 0 6px; }
.md-body :deep(p:last-child) { margin-bottom: 0; }
.md-body :deep(strong)     { font-weight: 700; }
.md-body :deep(em)         { font-style: italic; }
.md-body :deep(ul),
.md-body :deep(ol)         { margin: 4px 0 6px; padding-left: 18px; }
.md-body :deep(li)         { margin-bottom: 2px; }
.md-body :deep(h1),
.md-body :deep(h2),
.md-body :deep(h3)         { font-size: 13px; font-weight: 700; margin: 6px 0 4px; }
.md-body :deep(code)       {
  background: rgba(0,0,0,0.08);
  border-radius: 4px;
  padding: 1px 5px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
.md-body :deep(hr)         { border: none; border-top: 1px solid rgba(0,0,0,0.12); margin: 6px 0; }
.msg-row.user .bubble {
  background: #1b78fd;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg-row.bot .bubble {
  background: #f3f4f6;
  color: #111;
  border-bottom-left-radius: 4px;
}

/* typing dots */
.bubble.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}
.bubble.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: blink 1.2s infinite;
}
.bubble.typing span:nth-child(2) { animation-delay: 0.2s; }
.bubble.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.input-wrap {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.input-wrap:focus-within { border-color: #1b78fd; }
.chat-input {
  display: block;
  width: 100%;
  min-height: 38px;
  max-height: 72px;
  border: none;
  outline: none;
  padding: 9px 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  resize: none;
  overflow-y: hidden;
  line-height: 1.5;
  box-sizing: border-box;
  background: transparent;
}
.chat-input::-webkit-scrollbar { width: 4px; }
.chat-input::-webkit-scrollbar-track { background: transparent; }
.chat-input::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 9999px;
}
.chat-input::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
.btn-send {
  height: 38px;
  padding: 0 16px;
  background: #1b78fd;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-send:hover { opacity: 0.88; }
</style>
