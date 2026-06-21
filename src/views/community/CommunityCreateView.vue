<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'

const DRAFT_KEY = 'community_draft'

const router = useRouter()
const communityStore = useCommunityStore()
const authStore = useAuthStore()
const surveyStore = useSurveyStore()

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const initial  = computed(() => nickname.value.charAt(0))
const riskType = computed(() => authStore.user?.investment_type || surveyStore.resultType || '')
const hasType  = computed(() => !!riskType.value)

const form          = reactive({ title: '', content: '' })
const errors        = reactive({ title: '', content: '' })
// sessionStorage에서 복원한 경우에만 true — 새로 타이핑 중엔 false
const draftRestored = ref(false)

// ── 마운트 시 임시저장 복원 ──
onMounted(() => {
  const saved = sessionStorage.getItem(DRAFT_KEY)
  if (saved) {
    try {
      const { title, content } = JSON.parse(saved)
      if (title || content) {
        form.title      = title   ?? ''
        form.content    = content ?? ''
        draftRestored.value = true
      }
    } catch (_) {}
  }
})

// ── 입력마다 sessionStorage 자동 저장 (배너와 무관) ──
watch(form, (val) => {
  if (val.title || val.content) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title: val.title, content: val.content }))
  } else {
    sessionStorage.removeItem(DRAFT_KEY)
  }
}, { deep: true })

function clearDraft() {
  form.title = ''
  form.content = ''
  sessionStorage.removeItem(DRAFT_KEY)
  draftRestored.value = false
}

function validate() {
  let ok = true
  if (!form.title.trim())   { errors.title   = '제목을 입력해주세요.'; ok = false } else errors.title   = ''
  if (!form.content.trim()) { errors.content = '내용을 입력해주세요.'; ok = false } else errors.content = ''
  return ok
}

async function submit() {
  if (!hasType.value) return
  if (!validate()) return
  try {
    await communityStore.createPost({
      title:    form.title.trim(),
      content:  form.content.trim(),
      riskType: riskType.value,
    })
    sessionStorage.removeItem(DRAFT_KEY)
    router.push('/community')
  } catch {
    errors.title = '저장에 실패했습니다. 다시 시도해주세요.'
  }
}
</script>

<template>
  <CommunityLayout>
    <div class="create-shell">

      <!-- 성향 없음 -->
      <div v-if="!hasType" class="no-type-wrap">
        <div class="no-type-notice">
          <p class="notice-text">투자 성향 설문을 완료해야 글을 작성할 수 있습니다.</p>
          <button class="btn-survey" @click="router.push('/survey')">설문하러 가기</button>
        </div>
      </div>

      <!-- 작성 폼 -->
      <template v-else>
        <div class="create-scroll">
          <div class="create-wrap">

            <div class="form-header">
              <button class="back-btn" @click="router.push('/community')">‹ 목록으로</button>
              <h2 class="create-title">글쓰기</h2>

              <!-- 임시저장 복원 배너 -->
              <div v-if="draftRestored" class="draft-banner">
                <span>✏️ 임시저장된 내용이 있습니다.</span>
                <button class="btn-clear-draft" @click="clearDraft">초기화</button>
              </div>

              <!-- 카테고리 (자신의 성향 고정) -->
              <div class="category-row">
                <span class="category-label">카테고리</span>
                <span class="category-badge">{{ riskType }}</span>
                <span class="category-hint">내 성향 카테고리에만 작성할 수 있습니다.</span>
              </div>

              <!-- 제목 -->
              <div class="form-group">
                <input
                  v-model="form.title"
                  class="title-input"
                  :class="{ error: errors.title }"
                  placeholder="제목을 입력하세요"
                />
                <p v-if="errors.title" class="error-text">{{ errors.title }}</p>
              </div>
            </div>

            <!-- 내용 (남은 높이 채움) -->
            <div class="form-group content-group">
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
      </template>

    </div>
  </CommunityLayout>
</template>

<style scoped>
/* ── 전체 셸: comm-content(flex:1)을 꽉 채움 ── */
.create-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── 성향 없음 ── */
.no-type-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.no-type-notice {
  border: 1px solid #fbbf24;
  background: #fffbeb;
  border-radius: 12px;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  max-width: 480px;
  width: 100%;
}
.notice-text { font-size: 15px; color: #92400e; font-family: 'Noto Sans KR', sans-serif; }
.btn-survey {
  height: 38px; padding: 0 20px;
  background: #f59e0b; color: #fff; border: none;
  border-radius: 10px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer;
}
.btn-survey:hover { opacity: 0.88; }

/* ── 스크롤 + 폼 영역 ── */
.create-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.create-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 32px 0;
  min-height: 0;
}

/* 상단 고정 영역 (뒤로가기 · 제목 · 카테고리 · title-input) */
.form-header { flex-shrink: 0; }

.back-btn {
  background: none; border: none; font-size: 14px; color: #6b7280;
  cursor: pointer; margin-bottom: 14px; padding: 0;
}
.back-btn:hover { color: #1b78fd; }

.create-title {
  font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 18px;
}

/* 임시저장 배너 */
.draft-banner {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; padding: 9px 14px;
  background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px;
  font-size: 13px; color: #15803d; font-family: 'Noto Sans KR', sans-serif;
}
.btn-clear-draft {
  background: none; border: 1px solid #86efac; border-radius: 8px;
  padding: 3px 10px; font-size: 12px; color: #15803d; cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif; font-weight: 600;
}
.btn-clear-draft:hover { background: #dcfce7; }

/* 카테고리 */
.category-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px; padding: 10px 14px;
  background: #f0f4ff; border-radius: 10px;
}
.category-label  { font-size: 12px; color: #6b7280; font-family: 'Noto Sans KR', sans-serif; flex-shrink: 0; }
.category-badge  {
  font-size: 13px; font-weight: 700; color: #1b78fd;
  background: #e8f0fe; border-radius: 20px; padding: 3px 12px; flex-shrink: 0;
}
.category-hint   { font-size: 11px; color: #9ca3af; font-family: 'Noto Sans KR', sans-serif; }

/* 제목 입력 */
.form-group { margin-bottom: 12px; }
.title-input {
  width: 100%; height: 46px;
  border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 0 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 15px; outline: none;
  box-sizing: border-box;
}
.title-input:focus  { border-color: #1b78fd; }
.title-input.error  { border-color: #ef4444; }

/* 내용 textarea — 남은 높이를 모두 채움 */
.content-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  min-height: 0;
  padding-bottom: 16px;
}
.content-input {
  flex: 1;
  width: 100%;
  min-height: 0;
  resize: none;
  border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 14px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 15px;
  outline: none; line-height: 1.6; box-sizing: border-box;
}
.content-input:focus { border-color: #1b78fd; }
.content-input.error { border-color: #ef4444; }

.error-text { font-size: 12px; color: #ef4444; margin-top: 4px; flex-shrink: 0; }

/* ── 푸터 ── */
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
