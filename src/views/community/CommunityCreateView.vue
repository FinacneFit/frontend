<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'

const router = useRouter()
const communityStore = useCommunityStore()
const authStore = useAuthStore()
const surveyStore = useSurveyStore()

const nickname = authStore.user?.nickname ?? '이서현'
const initial = nickname.charAt(0)
const riskType = authStore.user?.investment_type || surveyStore.resultType || '안정추구형'

const form = reactive({ title: '', content: '' })
const errors = reactive({ title: '', content: '' })

function validate() {
  let ok = true
  if (!form.title.trim()) { errors.title = '제목을 입력해주세요.'; ok = false } else errors.title = ''
  if (!form.content.trim()) { errors.content = '내용을 입력해주세요.'; ok = false } else errors.content = ''
  return ok
}

async function submit() {
  if (!validate()) return
  try {
    await communityStore.createPost({
      title: form.title.trim(),
      content: form.content.trim(),
      riskType,
    })
    router.push('/community')
  } catch (err) {
    errors.title = '저장에 실패했습니다. 다시 시도해주세요.'
  }
}
</script>

<template>
  <CommunityLayout>
    <div class="create-shell">
      <div class="create-scroll">
        <div class="create-wrap">
          <button class="back-btn" @click="router.push('/community')">‹ 목록으로</button>
          <h2 class="create-title">글쓰기</h2>

          <div class="form-group">
            <input
              v-model="form.title"
              class="title-input"
              :class="{ error: errors.title }"
              placeholder="제목을 입력하세요"
            />
            <p v-if="errors.title" class="error-text">{{ errors.title }}</p>
          </div>

          <div class="form-group">
            <textarea
              v-model="form.content"
              class="content-input"
              :class="{ error: errors.content }"
              placeholder="내용을 입력하세요"
            />
            <p v-if="errors.content" class="error-text">{{ errors.content }}</p>
          </div>
        </div>
      </div>

      <div class="create-footer">
        <button class="btn-submit" @click="submit">등록하기</button>
      </div>
    </div>
  </CommunityLayout>
</template>

<style scoped>
.create-shell { display: flex; flex-direction: column; height: 100%; }
.create-scroll { flex: 1; overflow-y: auto; }
.create-wrap { padding: 24px; }

.back-btn { background: none; border: none; font-size: 14px; color: #6b7280; cursor: pointer; margin-bottom: 16px; padding: 0; }
.back-btn:hover { color: #1b78fd; }
.create-title { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 20px; }

.form-group { margin-bottom: 12px; }
.title-input {
  width: 100%; height: 46px;
  border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 0 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 15px; outline: none;
  box-sizing: border-box;
}
.title-input:focus, .content-input:focus { border-color: #1b78fd; }
.title-input.error, .content-input.error { border-color: #ef4444; }

.content-input {
  width: 100%; min-height: 400px; resize: vertical;
  border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 14px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 15px;
  outline: none; line-height: 1.6; box-sizing: border-box;
}
.error-text { font-size: 12px; color: #ef4444; margin-top: 4px; }

.create-footer {
  display: flex; justify-content: flex-end;
  padding: 12px 24px; border-top: 1px solid #e5e7eb; background: #fff; flex-shrink: 0;
}
.btn-submit {
  height: 44px; padding: 0 28px; background: #1b78fd; color: #fff; border: none;
  border-radius: 12px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer;
}
.btn-submit:hover { opacity: 0.88; }
</style>
