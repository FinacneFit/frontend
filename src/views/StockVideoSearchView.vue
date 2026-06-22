<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-left">
        <button class="logo-btn" @click="router.push('/dashboard')">
          <img :src="logoImg" class="logo-img" alt="FinFit" />
          <span class="logo-text">FinFit</span>
        </button>
      </div>

      <div class="header-right">
        <button class="btn-community" @click="router.push('/deposits')">예금·적금</button>
        <button class="btn-community" @click="router.push('/spot-assets')">현물 차트</button>
        <button class="btn-community" @click="router.push('/stock-videos')">주식 정보</button>
        <button class="btn-community" @click="router.push('/community')">커뮤니티</button>

        <button class="btn-logout" @click="logout">로그아웃</button>

        <button class="user-info" @click="router.push('/mypage')">
          <div class="user-text">
            <span class="user-name"><span class="name-blue">{{ nickname }}</span> 님</span>
            <span class="user-type">{{ resultType }}</span>
          </div>
          <div class="avatar">{{ initial }}</div>
        </button>
      </div>
    </header>

    <main class="video-page">
      <div class="video-inner">
        <section class="page-header">
          <div>
            <p class="eyebrow">Stock Video Search</p>
            <h1>관심 종목 영상 검색</h1>
            <p class="description">
              관심 있는 종목명이나 투자 키워드를 검색하면 관련 주식 영상을 확인할 수 있습니다.
            </p>
          </div>
        </section>

        <section class="search-card">
          <div class="search-title-row">
            <div>
              <h2>주식 관련 영상 검색</h2>
              <p>예: 삼성전자, 엔비디아, 배당주, ETF, 주식 입문</p>
            </div>
          </div>

          <form class="search-row" @submit.prevent="handleSearch">
            <input
              v-model="searchQuery"
              class="search-input"
              type="text"
              placeholder="관심 종목 또는 키워드를 입력하세요."
            />
            <button class="btn-search" type="submit" :disabled="isLoading">
              {{ isLoading ? '검색 중' : '검색' }}
            </button>
          </form>

          <p v-if="message" class="message" :class="{ error: isError }">
            {{ message }}
          </p>
        </section>

        <section class="result-section">
          <div class="result-header">
            <h2>검색 결과</h2>
            <span>{{ videos.length }}개</span>
          </div>

          <div v-if="isLoading" class="empty-state">
            영상을 불러오는 중입니다.
          </div>

          <div v-else-if="videos.length === 0" class="empty-state">
            검색 결과가 없습니다. 다른 종목명이나 키워드로 검색해보세요.
          </div>

          <div v-else class="video-grid">
            <article
              v-for="video in videos"
              :key="video.videoId"
              class="video-card"
              @click="goDetail(video.videoId)"
            >
              <div class="thumbnail-wrap">
                <img :src="video.thumbnail" :alt="video.title" class="thumbnail" />
                <div class="play-badge">▶</div>
              </div>

              <div class="video-info">
                <h3>{{ video.title }}</h3>
                <p class="channel">{{ video.channelTitle }}</p>
                <p class="date">{{ formatDate(video.publishedAt) }}</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import logoImg from '@/assets/logo.png'
import { searchStockVideos } from '@/api/youtubeApi'

const router = useRouter()
const authStore = useAuthStore()

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type ?? '안정추구형')
const initial = computed(() => nickname.value.charAt(0))

const searchQuery = ref('')
const videos = ref([])
const isLoading = ref(false)
const message = ref('')
const isError = ref(false)

function logout() {
  authStore.logout()
  router.push('/login')
}

async function handleSearch() {
  isLoading.value = true
  message.value = ''
  isError.value = false

  try {
    videos.value = await searchStockVideos(searchQuery.value)

    if (videos.value.length === 0) {
      message.value = '검색 결과가 없습니다.'
    }
  } catch (error) {
    videos.value = []
    message.value = error.message || '영상 검색 중 오류가 발생했습니다.'
    isError.value = true
  } finally {
    isLoading.value = false
  }
}

function goDetail(videoId) {
  router.push({
    name: 'stock-video-detail',
    params: { videoId },
  })
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
  searchQuery.value = '주식 투자 기초'
  handleSearch()
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

.video-page {
  min-height: calc(100vh - 68px);
  padding: 32px 24px 40px;
  background: #f8fafc;
  color: #172033;
}

.video-inner {
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
}

.page-header {
  max-width: 960px;
  margin: 0 auto 20px;
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

.search-card,
.result-section {
  width: 100%;
  max-width: 960px;
  margin: 0 auto 20px;
  padding: 22px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.search-title-row h2,
.result-header h2 {
  margin: 0;
  font-size: 22px;
}

.search-title-row p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.search-row {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.search-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #1b78fd;
  box-shadow: 0 0 0 3px rgba(27, 120, 253, 0.12);
}

.btn-search {
  width: 96px;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: #1b78fd;
  color: #fff;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  cursor: pointer;
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 13px;
}

.message.error {
  color: #ef4444;
  font-weight: 700;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.result-header span {
  color: #1b78fd;
  font-weight: 800;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.video-card {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
}

.thumbnail-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #e5e7eb;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-badge {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(27, 120, 253, 0.92);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.video-info {
  padding: 14px;
}

.video-info h3 {
  height: 44px;
  margin: 0 0 10px;
  color: #172033;
  font-size: 14px;
  line-height: 1.45;
  overflow: hidden;
}

.channel {
  margin: 0 0 4px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.date {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: #64748b;
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

  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .video-page {
    padding: 24px 18px 32px;
  }

  .search-row {
    flex-direction: column;
  }

  .btn-search {
    width: 100%;
  }

  .video-grid {
    grid-template-columns: 1fr;
  }
}
</style>