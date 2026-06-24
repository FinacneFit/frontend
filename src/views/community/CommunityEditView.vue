<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useDepositStore } from '@/stores/depositStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'
import CommunityPortfolioCard from '@/components/CommunityPortfolioCard.vue'

const route          = useRoute()
const router         = useRouter()
const communityStore = useCommunityStore()
const authStore      = useAuthStore()
const portfolioStore = usePortfolioStore()
const depositStore = useDepositStore()

const postId  = Number(route.params.postId)
const post    = computed(() => communityStore.getPost(postId))
const editSnapshot = computed(() => {
  const snapshot = {}
  if (form.attachStocks && post.value?.portfolioSnapshot?.stocks) {
    snapshot.stocks = post.value.portfolioSnapshot.stocks
  }
  if (form.attachDeposits && post.value?.portfolioSnapshot?.deposits) {
    snapshot.deposits = post.value.portfolioSnapshot.deposits
  }
  return snapshot
})

const form = reactive({
  title: '',
  content: '',
  attachStocks: false,
  attachDeposits: false,
  showReturns: true,
})
const errors = reactive({ title: '', content: '' })
const loaded = ref(false)
const blocked = ref(false)

onMounted(async () => {
  await Promise.allSettled([
    communityStore.loadPost(postId),
    portfolioStore.loadPortfolio(),
    depositStore.loadSavedProducts(),
  ])
  if (post.value) {
    if (post.value.riskType !== authStore.user?.investment_type) {
      blocked.value = true
      return
    }
    form.title   = post.value.title
    form.content = post.value.content
    form.attachStocks = !!post.value.portfolioSnapshot?.stocks
    form.attachDeposits = !!post.value.portfolioSnapshot?.deposits
    form.showReturns = post.value.portfolioSnapshot?.stocks?.show_returns !== false
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
      attachStocks: form.attachStocks,
      attachDeposits: form.attachDeposits,
      showReturns: form.showReturns,
    })
    router.push(`/community/${postId}`)
  } catch {
    errors.title = '저장에 실패했습니다. 다시 시도해주세요.'
  }
}
</script>

<template>
  <CommunityLayout>
    <div v-if="blocked" class="blocked-wrap">
      <p class="blocked-icon">🚫</p>
      <p class="blocked-title">수정할 수 없는 게시글입니다</p>
      <p class="blocked-desc">투자 성향이 변경되어 이 게시글을 수정할 수 없습니다.</p>
      <button class="blocked-btn" @click="router.push(`/community/${postId}`)">돌아가기</button>
    </div>

    <div v-else class="edit-shell">
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

            <div class="portfolio-picker">
              <p class="picker-title">내 포트폴리오 첨부</p>
              <label class="picker-option" :class="{ disabled: !portfolioStore.holdings.length && !form.attachStocks }">
                <input v-model="form.attachStocks" type="checkbox" :disabled="!portfolioStore.holdings.length && !form.attachStocks" />
                <span>주식 포트폴리오</span>
                <small>{{ portfolioStore.holdings.length ? `${portfolioStore.holdings.length}개 종목` : '보유 종목 없음' }}</small>
              </label>
              <label v-if="form.attachStocks" class="picker-option sub-option">
                <input v-model="form.showReturns" type="checkbox" />
                <span>수익률 공개</span>
                <small>선택하지 않으면 차트 아래 종목 목록이 숨겨집니다.</small>
              </label>
              <label class="picker-option" :class="{ disabled: !depositStore.savedDeposits.length && !form.attachDeposits }">
                <input v-model="form.attachDeposits" type="checkbox" :disabled="!depositStore.savedDeposits.length && !form.attachDeposits" />
                <span>예·적금 포트폴리오</span>
                <small>{{ depositStore.savedDeposits.length ? `${depositStore.savedDeposits.length}개 상품` : '담은 상품 없음' }}</small>
              </label>
              <CommunityPortfolioCard
                v-if="form.attachStocks || form.attachDeposits"
                class="portfolio-preview"
                :snapshot="editSnapshot"
                :preview-stocks="form.attachStocks ? portfolioStore.holdings : []"
                :preview-deposits="form.attachDeposits ? depositStore.savedDeposits : []"
                :show-returns-override="form.showReturns"
              />
              <p class="snapshot-hint">기존 첨부는 작성 당시 값이 유지되며, 새로 추가한 포트폴리오만 현재 값으로 저장됩니다.</p>
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
.blocked-wrap {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: 10px; padding: 40px;
}
.blocked-icon { font-size: 40px; margin: 0; }
.blocked-title { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 18px; color: #111827; margin: 0; }
.blocked-desc { font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #6b7280; margin: 0; text-align: center; }
.blocked-btn {
  margin-top: 8px; height: 40px; padding: 0 24px;
  background: #1b78fd; color: #fff; border: none; border-radius: 10px;
  font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer;
}
.blocked-btn:hover { opacity: 0.88; }

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

.content-group { flex: 0 0 auto; display: flex; flex-direction: column; margin-bottom: 0; min-height: 360px; padding-bottom: 16px; }
.content-input {
  flex: 1; width: 100%; min-height: 320px; resize: vertical;
  border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 14px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 15px;
  outline: none; line-height: 1.6; box-sizing: border-box;
}
.content-input:focus { border-color: #1b78fd; }
.content-input.error { border-color: #ef4444; }

.error-text { font-size: 12px; color: #ef4444; margin-top: 4px; flex-shrink: 0; }

.portfolio-picker { margin: 14px 0 18px; padding: 14px; border: 1px solid #dbeafe; border-radius: 12px; background: #f8fbff; }
.picker-title { margin-bottom: 10px; font-size: 14px; font-weight: 700; }
.picker-option { display: flex; align-items: center; gap: 8px; padding: 8px 0; font-size: 13px; cursor: pointer; }
.picker-option small { margin-left: auto; color: #6b7280; }
.picker-option.disabled { color: #9ca3af; cursor: default; }
.picker-option.sub-option { margin-left: 22px; padding: 6px 10px; border-left: 2px solid #bfdbfe; }
.portfolio-preview { margin-top: 12px; }
.snapshot-hint { margin-top: 10px; font-size: 11px; color: #6b7280; }

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
