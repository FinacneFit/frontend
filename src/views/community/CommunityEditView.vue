<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'

const route          = useRoute()
const router         = useRouter()
const communityStore = useCommunityStore()

const postId  = Number(route.params.postId)
const post    = computed(() => communityStore.getPost(postId))

const form   = reactive({ title: '', content: '' })
const errors = reactive({ title: '', content: '' })
const loaded = ref(false)

onMounted(async () => {
  if (!post.value) await communityStore.loadPost(postId)
  if (post.value) {
    form.title   = post.value.title
    form.content = post.value.content
    loaded.value = true
  }
})

function validate() {
  let ok = true
  if (!form.title.trim())   { errors.title   = '제목을 입력해주세요.'; ok = false } else errors.title   = ''
  if (!form.content.trim()) { errors.content = '내용을 입력해주세요.'; ok = false } else errors.content = ''
  return ok
}

async function submit() {
  if (!validate()) return
  try {
    await communityStore.updatePost(postId, {
      title:   form.title.trim(),
      content: form.content.trim(),
    })
    router.push(`/community/${postId}`)
  } catch {
    errors.title = '저장에 실패했습니다. 다시 시도해주세요.'
  }
}
</script>

<template>
  <CommunityLayout>
    <div class="edit-shell">
      <div class="edit-scroll">
        <div class="edit-wrap">
          <div class="form-header">
            <button class="back-btn" @click="router.push(`/community/${postId}`)">‹ 돌아가기</button>
            <h2 class="edit-title">게시글 수정</h2>

            <div v-if="post" class="category-row">
              <span class="category-label">카테고리</span>
              <span class="category-badge">{{ post.riskType }}</span>
            </div>

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

      <div class="edit-footer">
        <button class="btn-cancel" @click="router.push(`/community/${postId}`)">취소</button>
        <button class="btn-submit" :disabled="!loaded" @click="submit">수정 완료</button>
      </div>
    </div>
  </CommunityLayout>
</template>

<style scoped>
.edit-shell { display: flex; flex-direction: column; height: 100%; }
.edit-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-height: 0; }
.edit-wrap { flex: 1; display: flex; flex-direction: column; padding: 24px 32px 0; min-height: 0; }
.form-header { flex-shrink: 0; }

.back-btn {
  background: none; border: none; font-size: 14px; color: #6b7280;
  cursor: pointer; margin-bottom: 14px; padding: 0;
}
.back-btn:hover { color: #1b78fd; }

.edit-title { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 18px; }

.category-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px; padding: 10px 14px;
  background: #f0f4ff; border-radius: 10px;
}
.category-label { font-size: 12px; color: #6b7280; font-family: 'Noto Sans KR', sans-serif; flex-shrink: 0; }
.category-badge {
  font-size: 13px; font-weight: 700; color: #1b78fd;
  background: #e8f0fe; border-radius: 20px; padding: 3px 12px;
}

.form-group { margin-bottom: 12px; }
.title-input {
  width: 100%; height: 46px;
  border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 0 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 15px; outline: none;
  box-sizing: border-box;
}
.title-input:focus { border-color: #1b78fd; }
.title-input.error { border-color: #ef4444; }

.content-group { flex: 1; display: flex; flex-direction: column; margin-bottom: 0; min-height: 0; padding-bottom: 16px; }
.content-input {
  flex: 1; width: 100%; min-height: 0; resize: none;
  border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 14px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 15px;
  outline: none; line-height: 1.6; box-sizing: border-box;
}
.content-input:focus { border-color: #1b78fd; }
.content-input.error { border-color: #ef4444; }

.error-text { font-size: 12px; color: #ef4444; margin-top: 4px; flex-shrink: 0; }

.edit-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 12px 24px; border-top: 1px solid #e5e7eb; background: #fff; flex-shrink: 0;
}
.btn-cancel {
  height: 44px; padding: 0 24px; background: none; border: 1px solid #d1d5db;
  border-radius: 12px; font-family: 'Noto Sans KR', sans-serif; font-size: 15px; color: #6b7280; cursor: pointer;
}
.btn-cancel:hover { border-color: #9ca3af; color: #374151; }
.btn-submit {
  height: 44px; padding: 0 28px; background: #1b78fd; color: #fff; border: none;
  border-radius: 12px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer;
}
.btn-submit:hover:not(:disabled) { opacity: 0.88; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
