<template>
  <div class="app-shell">
    <!-- ── HEADER ── -->
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
        <button class="btn-community" @click="router.push('/stock-videos')">주식 영상</button>
        <button class="btn-community" @click="router.push('/banks')">은행 찾기</button>
        <button class="btn-community" @click="router.push('/community')">커뮤니티</button>

        <button class="btn-logout" @click="logout">로그아웃</button>

        <button class="user-info" @click="router.push('/mypage')">
          <div class="user-text">
            <span class="user-name">
              <span class="name-blue">{{ nickname }}</span> 님
            </span>
            <span class="user-type">{{ resultType }}</span>
          </div>
          <div class="avatar">{{ initial }}</div>
        </button>
      </div>
    </header>

    <!-- ── BODY ── -->
    <main class="bank-page">
      <div class="bank-inner">
        <section class="page-header">
          <div>
            <p class="eyebrow">Nearby Bank Map</p>
            <h1>근처 은행 찾기</h1>
            <p class="description">
              현재 위치 또는 입력한 주소를 기준으로 주변 은행 지점을 지도와 목록에서 확인할 수 있습니다.
            </p>
          </div>
        </section>

        <section class="search-card">
          <div class="search-header">
            <div>
              <h2>위치 검색</h2>
              <p>주소를 입력하거나 현재 위치를 사용해 주변 은행을 조회하세요.</p>
            </div>
          </div>

          <form class="search-row" @submit.prevent="searchByAddress">
            <input
              v-model="addressKeyword"
              class="search-input"
              type="text"
              placeholder="예: 서울 강남구 테헤란로, 부산 해운대구"
            />

            <select v-model="selectedRadius" class="radius-select">
              <option :value="1000">1km</option>
              <option :value="2000">2km</option>
              <option :value="3000">3km</option>
              <option :value="5000">5km</option>
            </select>

            <button class="btn-search" type="submit" :disabled="isLoading">
              검색
            </button>

            <button
              class="btn-location"
              type="button"
              :disabled="isLoading"
              @click="searchByCurrentLocation"
            >
              현재 위치
            </button>
          </form>

          <p v-if="message" class="message" :class="{ error: isError }">
            {{ message }}
          </p>
        </section>

        <section class="map-layout">
          <div class="map-card">
            <div ref="mapContainer" class="map-box"></div>
          </div>

          <aside class="bank-list-card">
            <div class="list-header">
              <div>
                <h2>검색된 은행</h2>
                <p>{{ banks.length }}개 지점</p>
              </div>
            </div>

            <div v-if="isLoading" class="empty-state">
              은행 정보를 불러오는 중입니다.
            </div>

            <div v-else-if="banks.length === 0" class="empty-state">
              검색된 은행이 없습니다. 위치나 반경을 다시 선택해보세요.
            </div>

            <div v-else class="bank-list">
              <article
                v-for="bank in banks"
                :key="bank.id"
                class="bank-item"
                @click="focusBank(bank)"
              >
                <div class="bank-title-row">
                  <strong>{{ bank.place_name }}</strong>
                  <span>{{ formatDistance(bank.distance) }}</span>
                </div>

                <p class="bank-address">
                  {{ bank.road_address_name || bank.address_name || '주소 정보 없음' }}
                </p>

                <p v-if="bank.phone" class="bank-phone">
                  {{ bank.phone }}
                </p>
              </article>
            </div>
          </aside>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import logoImg from '@/assets/logo.png'

const router = useRouter()
const authStore = useAuthStore()

const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const resultType = computed(() => authStore.user?.investment_type ?? '안정추구형')
const initial = computed(() => nickname.value.charAt(0))

const mapContainer = ref(null)
const addressKeyword = ref('')
const selectedRadius = ref(2000)
const banks = ref([])
const isLoading = ref(false)
const message = ref('')
const isError = ref(false)

let map = null
let geocoder = null
let places = null
let currentPositionMarker = null
let markers = []
let infoWindow = null

const DEFAULT_CENTER = {
  lat: 37.566826,
  lng: 126.9786567,
}

function logout() {
  authStore.logout()
  router.push('/login')
}

function loadKakaoMapScript() {
  return new Promise((resolve, reject) => {
    const kakaoKey = import.meta.env.VITE_KAKAO_MAP_JS_KEY

    if (!kakaoKey) {
      reject(new Error('VITE_KAKAO_MAP_JS_KEY가 설정되지 않았습니다.'))
      return
    }

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(resolve)
      return
    }

    const existingScript = document.querySelector('script[data-kakao-map-sdk]')

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.kakao.maps.load(resolve)
      })
      existingScript.addEventListener('error', () => {
        reject(new Error('카카오 지도 SDK 로드에 실패했습니다.'))
      })
      return
    }

    const script = document.createElement('script')
    script.setAttribute('data-kakao-map-sdk', 'true')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`
    script.async = true

    script.onload = () => {
      window.kakao.maps.load(resolve)
    }

    script.onerror = () => {
      reject(new Error('카카오 지도 SDK 로드에 실패했습니다.'))
    }

    document.head.appendChild(script)
  })
}

async function initMap() {
  await loadKakaoMapScript()
  await nextTick()

  const kakao = window.kakao
  const center = new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)

  map = new kakao.maps.Map(mapContainer.value, {
    center,
    level: 4,
  })

  geocoder = new kakao.maps.services.Geocoder()
  places = new kakao.maps.services.Places()
  infoWindow = new kakao.maps.InfoWindow({ zIndex: 3 })

  setCurrentPosition(center)
  searchBanks(center)
}

function setCurrentPosition(position) {
  const kakao = window.kakao

  if (currentPositionMarker) {
    currentPositionMarker.setMap(null)
  }

  currentPositionMarker = new kakao.maps.Marker({
    map,
    position,
  })

  map.setCenter(position)
}

function clearBankMarkers() {
  markers.forEach((marker) => marker.setMap(null))
  markers = []
}

function searchBanks(position) {
  if (!places || !map) return

  isLoading.value = true
  message.value = ''
  isError.value = false
  banks.value = []
  clearBankMarkers()

  const kakao = window.kakao

  places.categorySearch(
    'BK9',
    (result, status) => {
      isLoading.value = false

      if (status === kakao.maps.services.Status.OK) {
        banks.value = result
        drawBankMarkers(result)

        if (result.length > 0) {
          message.value = `반경 ${formatDistance(selectedRadius.value)} 안에서 은행 ${result.length}개를 찾았습니다.`
        }

        return
      }

      if (status === kakao.maps.services.Status.ZERO_RESULT) {
        message.value = '선택한 위치 주변에 검색된 은행이 없습니다.'
        return
      }

      message.value = '은행 검색 중 오류가 발생했습니다.'
      isError.value = true
    },
    {
      location: position,
      radius: selectedRadius.value,
      sort: kakao.maps.services.SortBy.DISTANCE,
      size: 15,
    },
  )
}

function drawBankMarkers(bankList) {
  const kakao = window.kakao
  const bounds = new kakao.maps.LatLngBounds()

  bankList.forEach((bank) => {
    const position = new kakao.maps.LatLng(Number(bank.y), Number(bank.x))

    const marker = new kakao.maps.Marker({
      map,
      position,
    })

    kakao.maps.event.addListener(marker, 'click', () => {
      openBankInfo(bank, marker)
    })

    markers.push(marker)
    bounds.extend(position)
  })

  if (bankList.length > 0) {
    map.setBounds(bounds)
  }
}

function openBankInfo(bank, marker) {
  const content = `
    <div style="padding:10px 12px;min-width:190px;font-size:13px;line-height:1.5;">
      <strong style="display:block;margin-bottom:4px;color:#172033;">${bank.place_name}</strong>
      <span style="display:block;color:#64748b;">${bank.road_address_name || bank.address_name || ''}</span>
      <span style="display:block;margin-top:4px;color:#1b78fd;font-weight:700;">${formatDistance(bank.distance)}</span>
    </div>
  `

  infoWindow.setContent(content)
  infoWindow.open(map, marker)
}

function focusBank(bank) {
  const kakao = window.kakao
  const position = new kakao.maps.LatLng(Number(bank.y), Number(bank.x))
  const marker = markers.find((item) => {
    const markerPosition = item.getPosition()
    return (
      markerPosition.getLat() === position.getLat() &&
      markerPosition.getLng() === position.getLng()
    )
  })

  map.setCenter(position)
  map.setLevel(3)

  if (marker) {
    openBankInfo(bank, marker)
  }
}

function searchByAddress() {
  if (!addressKeyword.value.trim()) {
    message.value = '검색할 주소를 입력해주세요.'
    isError.value = true
    return
  }

  if (!geocoder) {
    message.value = '지도 서비스를 아직 불러오는 중입니다. 잠시 후 다시 시도해주세요.'
    isError.value = true
    return
  }

  isLoading.value = true
  message.value = ''
  isError.value = false

  geocoder.addressSearch(addressKeyword.value.trim(), (result, status) => {
    const kakao = window.kakao

    if (status !== kakao.maps.services.Status.OK || result.length === 0) {
      isLoading.value = false
      message.value = '입력한 주소의 좌표를 찾을 수 없습니다. 주소를 다시 확인해주세요.'
      isError.value = true
      return
    }

    const coords = new kakao.maps.LatLng(Number(result[0].y), Number(result[0].x))

    setCurrentPosition(coords)
    searchBanks(coords)
  })
}

function searchByCurrentLocation() {
  if (!navigator.geolocation) {
    message.value = '현재 브라우저에서 위치 정보를 사용할 수 없습니다.'
    isError.value = true
    return
  }

  isLoading.value = true
  message.value = '현재 위치를 확인하는 중입니다.'
  isError.value = false

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const kakao = window.kakao
      const coords = new kakao.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude,
      )

      setCurrentPosition(coords)
      searchBanks(coords)
    },
    () => {
      isLoading.value = false
      message.value = '현재 위치를 가져오지 못했습니다. 브라우저 위치 권한을 확인해주세요.'
      isError.value = true
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    },
  )
}

function formatDistance(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const distance = Number(value)

  if (!Number.isFinite(distance)) {
    return '-'
  }

  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`
  }

  return `${Math.round(distance)}m`
}

onMounted(async () => {
  try {
    await initMap()
  } catch (error) {
    message.value = error.message || '지도를 불러오지 못했습니다.'
    isError.value = true
  }
})
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Noto Sans KR', sans-serif;
}

/* ── 헤더 ── */
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

/* ── 본문 ── */
.bank-page {
  min-height: calc(100vh - 68px);
  padding: 32px 24px 40px;
  background: #f8fafc;
  color: #172033;
}

.bank-inner {
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

.search-card {
  width: 100%;
  max-width: 960px;
  margin: 0 auto 20px;
  padding: 22px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.search-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.search-header h2 {
  margin: 0;
  font-size: 22px;
}

.search-header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.search-row {
  display: flex;
  gap: 12px;
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

.search-input:focus,
.radius-select:focus {
  border-color: #1b78fd;
  box-shadow: 0 0 0 3px rgba(27, 120, 253, 0.12);
}

.radius-select {
  width: 110px;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #ffffff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  outline: none;
}

.btn-search,
.btn-location {
  height: 44px;
  border: none;
  border-radius: 14px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.btn-search {
  width: 86px;
  background: #1b78fd;
  color: #ffffff;
}

.btn-location {
  padding: 0 18px;
  background: #172033;
  color: #ffffff;
}

.btn-search:disabled,
.btn-location:disabled {
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

.map-layout {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 20px;
}

.map-card,
.bank-list-card {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
}

.map-card {
  padding: 16px;
}

.map-box {
  width: 100%;
  height: 560px;
  border-radius: 18px;
  overflow: hidden;
  background: #e5e7eb;
}

.bank-list-card {
  padding: 18px;
  height: 592px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  margin-bottom: 14px;
}

.list-header h2 {
  margin: 0;
  font-size: 20px;
}

.list-header p {
  margin: 6px 0 0;
  color: #1b78fd;
  font-weight: 800;
  font-size: 14px;
}

.bank-list {
  overflow-y: auto;
  padding-right: 4px;
}

.bank-list::-webkit-scrollbar {
  width: 4px;
}

.bank-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 999px;
}

.bank-item {
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: 0.18s ease;
}

.bank-item:hover {
  border-color: #1b78fd;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.bank-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.bank-title-row strong {
  color: #172033;
  font-size: 14px;
  line-height: 1.45;
}

.bank-title-row span {
  flex-shrink: 0;
  color: #1b78fd;
  font-size: 12px;
  font-weight: 800;
}

.bank-address {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.bank-phone {
  margin: 6px 0 0;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 1100px) {
  .map-layout {
    grid-template-columns: 1fr;
  }

  .bank-list-card {
    height: auto;
    max-height: 420px;
  }
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
  .bank-page {
    padding: 24px 18px 32px;
  }

  .search-row {
    flex-direction: column;
  }

  .radius-select,
  .btn-search,
  .btn-location {
    width: 100%;
  }

  .map-box {
    height: 420px;
  }
}
</style>