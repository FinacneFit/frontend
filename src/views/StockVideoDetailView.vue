<template>
  <div class="app-shell">
    <AppHeader />

    <main class="detail-page">
      <div class="detail-inner">
        <section class="page-header">
          <button class="btn-back" type="button" @click="router.push('/stock-videos')">
            ← 검색 결과로 돌아가기
          </button>

          <div>
            <p class="eyebrow">Stock Video Detail</p>
            <h1>관심 종목 영상 상세 보기</h1>
            <p class="description">
              선택한 영상을 페이지 안에서 바로 재생하고 관련 정보를 확인할 수 있습니다.
            </p>
          </div>
        </section>

        <section v-if="isLoading" class="detail-card">
          <div class="empty-state">
            영상 정보를 불러오는 중입니다.
          </div>
        </section>

        <section v-else-if="errorMessage" class="detail-card">
          <div class="empty-state error">
            {{ errorMessage }}
          </div>
        </section>

        <section v-else class="detail-card">
          <div class="player-wrap">
            <iframe
              class="youtube-player"
              :src="embedUrl"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>

          <div class="video-meta">
            <h2>{{ video.title }}</h2>

            <div class="meta-row">
              <span>{{ video.channelTitle }}</span>
              <span>{{ formatDate(video.publishedAt) }}</span>
            </div>

            <p class="video-description">
              {{ video.description || '영상 설명이 없습니다.' }}
            </p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import logoImg from '@/assets/logo.png'
import { getYoutubeVideoDetail } from '@/api/youtubeApi'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type ?? '안정추구형')
const initial = computed(() => nickname.value.charAt(0))

const video = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const videoId = computed(() => route.params.videoId)

const embedUrl = computed(() => {
  return `https://www.youtube.com/embed/${videoId.value}`
})

function logout() {
  authStore.logout()
  router.push('/login')
}

async function loadVideoDetail() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    video.value = await getYoutubeVideoDetail(videoId.value)
  } catch (error) {
    errorMessage.value = error.message || '영상 상세 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

onMounted(() => {
  loadVideoDetail()
})
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Noto Sans KR', sans-serif;
}

.app-header {
  height: 68px;
  border-bottom: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
  background: #fff;
}

.logo-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.logo-text {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #000;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-community {
  background: #1b78fd;
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 8px 18px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.btn-community:hover {
  opacity: 0.88;
}

.btn-logout {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 7px 13px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  color: #787878;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-weight: 700;
  font-size: 14px;
}

.name-blue {
  color: #1b78fd;
}

.user-type {
  font-size: 11px;
  color: #787878;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1b78fd, #2adbc6);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-page {
  min-height: calc(100vh - 68px);
  padding: 32px 24px 40px;
  background: #f8fafc;
  color: #172033;
}

.detail-inner {
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
}

.page-header {
  max-width: 960px;
  margin: 0 auto 20px;
}

.btn-back {
  margin-bottom: 18px;
  padding: 9px 15px;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  cursor: pointer;
}

.btn-back:hover {
  border-color: #1b78fd;
  color: #1b78fd;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
}

.description {
  margin: 12px 0 0;
  color: #64748b;
  line-height: 1.6;
}

.detail-card {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 22px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.player-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 18px;
  background: #0f172a;
}

.youtube-player {
  width: 100%;
  height: 100%;
}

.video-meta {
  margin-top: 22px;
}

.video-meta h2 {
  margin: 0 0 12px;
  font-size: 24px;
  line-height: 1.45;
}

.meta-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.meta-row span {
  padding: 7px 12px;
  border-radius: 999px;
  background: #f1f5f9;
}

.video-description {
  margin: 0;
  color: #475569;
  line-height: 1.7;
  white-space: pre-line;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
  color: #64748b;
}

.empty-state.error {
  color: #ef4444;
  font-weight: 700;
}

@media (max-width: 900px) {
  .app-header {
    height: auto;
    min-height: 68px;
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .header-right {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .btn-community,
  .btn-logout,
  .user-info {
    flex-shrink: 0;
  }
}

@media (max-width: 640px) {
  .detail-page {
    padding: 24px 18px 32px;
  }
}
</style>