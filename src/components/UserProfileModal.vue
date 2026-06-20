<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyStore } from '@/stores/surveyStore'
import { useFollowStore } from '@/stores/followStore'
import { getUserById } from '@/data/mockUsers'
import UserAvatar from '@/components/UserAvatar.vue'

const props = defineProps({
  userId: { type: Number, required: true },
})
const emit = defineEmits(['close'])

const router     = useRouter()
const authStore  = useAuthStore()
const surveyStore = useSurveyStore()
const followStore = useFollowStore()

// 대상 사용자 정보
const targetUser = computed(() => {
  // 내 프로필인 경우
  if (props.userId === (authStore.user?.id ?? 99)) {
    return {
      id: authStore.user?.id ?? 99,
      nickname: authStore.user?.nickname ?? '사용자',
      bio: authStore.user?.bio ?? '',
      investmentType: surveyStore.resultType ?? '미설정',
      followerCount: followStore.followerCount,
      followingCount: followStore.followingCount,
      postCount: 1,
    }
  }
  return getUserById(props.userId)
})

const isSelf      = computed(() => props.userId === (authStore.user?.id ?? 99))
const isFollowing = computed(() => followStore.isFollowing(props.userId))

function handleFollow() {
  if (isSelf.value) return
  followStore.toggleFollow(props.userId)
}

function goToMyPage() {
  emit('close')
  router.push('/mypage')
}

// ESC 닫기, 배경 스크롤 잠금
function onKeyDown(e) { if (e.key === 'Escape') emit('close') }
onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true">
      <!-- 닫기 -->
      <button class="close-btn" @click="$emit('close')">✕</button>

      <template v-if="targetUser">
        <!-- 아바타 + 닉네임 -->
        <div class="profile-head">
          <UserAvatar :nickname="targetUser.nickname" size="xl" />
          <h2 class="nickname">{{ targetUser.nickname }}</h2>
          <p class="follow-counts">
            팔로워 <strong>{{ targetUser.followerCount ?? 0 }}</strong>
            &nbsp;·&nbsp;
            팔로잉 <strong>{{ targetUser.followingCount ?? 0 }}</strong>
          </p>
        </div>

        <!-- 투자 성향 -->
        <div class="info-field">
          <span class="field-label">투자 성향</span>
          <span class="field-value">{{ targetUser.investmentType || '미설정' }}</span>
        </div>

        <!-- 한 줄 소개 -->
        <div class="info-field">
          <span class="field-label">한 줄 소개</span>
          <span class="field-value bio-text">{{ targetUser.bio || '소개가 없습니다.' }}</span>
        </div>

        <!-- 버튼 -->
        <template v-if="isSelf">
          <button class="btn-self" @click="goToMyPage">내 프로필 보기</button>
        </template>
        <template v-else>
          <button
            class="btn-follow"
            :class="{ following: isFollowing }"
            @click="handleFollow"
          >
            {{ isFollowing ? '팔로잉' : '팔로우' }}
          </button>
        </template>
      </template>

      <div v-else class="not-found">사용자를 찾을 수 없습니다.</div>
    </div>
  </div>
</template>

<style scoped>
/* ── 오버레이 ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── 카드 ── */
.modal-card {
  position: relative;
  background: #fff;
  border-radius: 20px;
  width: 320px;
  max-width: calc(100vw - 32px);
  padding: 36px 28px 28px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 닫기 버튼 ── */
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  padding: 2px;
}
.close-btn:hover { color: #374151; }

/* ── 프로필 헤더 ── */
.profile-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-bottom: 4px;
}
.nickname {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 800;
  font-size: 20px;
  color: #111827;
  margin: 0;
}
.follow-counts {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}
.follow-counts strong { color: #374151; font-weight: 700; }

/* ── 정보 필드 ── */
.info-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}
.field-value {
  background: #f3f4f6;
  border-radius: 10px;
  padding: 10px 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
.bio-text {
  font-weight: 400;
  min-height: 44px;
  display: flex;
  align-items: center;
  word-break: keep-all;
  line-height: 1.5;
}

/* ── 팔로우 버튼 ── */
.btn-follow {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.15s;
  border: 2px solid #1b78fd;
  background: #fff;
  color: #1b78fd;
  margin-top: 4px;
}
.btn-follow:hover:not(.following) {
  background: #1b78fd;
  color: #fff;
}
.btn-follow.following {
  border-color: #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
}
.btn-follow.following:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* ── 내 프로필 버튼 ── */
.btn-self {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  border: none;
  background: #1b78fd;
  color: #fff;
  margin-top: 4px;
  transition: opacity 0.15s;
}
.btn-self:hover { opacity: 0.88; }

.not-found {
  text-align: center;
  color: #9ca3af;
  font-family: 'Noto Sans KR', sans-serif;
  padding: 20px 0;
}
</style>
