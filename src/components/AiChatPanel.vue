<script setup>
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chatStore'

const chatStore = useChatStore()
const inputText = ref('')
const messagesEl = ref(null)

async function send() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await chatStore.sendMessage(text)
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
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
        <div class="bubble">{{ msg.text }}</div>
      </div>
      <div v-if="chatStore.isTyping" class="msg-row bot">
        <div class="bubble typing">
          <span /><span /><span />
        </div>
      </div>
    </div>

    <div class="chat-input-row">
      <input
        v-model="inputText"
        class="chat-input"
        placeholder="궁금한 것을 물어보세요 !"
        @keydown="onKeydown"
      />
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
  word-break: keep-all;
}
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
.chat-input {
  flex: 1;
  height: 38px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  outline: none;
}
.chat-input:focus { border-color: #1b78fd; }
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
