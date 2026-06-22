const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

function assertYoutubeApiKey() {
  if (!YOUTUBE_API_KEY) {
    throw new Error('VITE_YOUTUBE_API_KEY가 설정되지 않았습니다. frontend/.env.local 파일을 확인해주세요.')
  }
}

function buildStockKeyword(keyword) {
  const trimmed = keyword.trim()

  if (!trimmed) {
    return '주식 투자 기초'
  }

  if (trimmed.includes('주식') || trimmed.includes('투자')) {
    return trimmed
  }

  return `${trimmed} 주식 투자`
}

function normalizeSearchItem(item) {
  const snippet = item.snippet || {}
  const thumbnails = snippet.thumbnails || {}

  return {
    videoId: item.id?.videoId,
    title: snippet.title || '제목 없음',
    channelTitle: snippet.channelTitle || '채널 정보 없음',
    publishedAt: snippet.publishedAt || '',
    description: snippet.description || '',
    thumbnail:
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      '',
  }
}

function normalizeVideoDetail(item) {
  const snippet = item.snippet || {}
  const thumbnails = snippet.thumbnails || {}

  return {
    videoId: item.id,
    title: snippet.title || '제목 없음',
    channelTitle: snippet.channelTitle || '채널 정보 없음',
    publishedAt: snippet.publishedAt || '',
    description: snippet.description || '',
    thumbnail:
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      '',
  }
}

export async function searchStockVideos(keyword) {
  assertYoutubeApiKey()

  const params = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: 'snippet',
    type: 'video',
    maxResults: '12',
    order: 'relevance',
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    q: buildStockKeyword(keyword),
  })

  const response = await fetch(`${YOUTUBE_API_BASE_URL}/search?${params.toString()}`)

  if (!response.ok) {
    throw new Error('유튜브 영상 검색에 실패했습니다.')
  }

  const data = await response.json()

  return (data.items || [])
    .map(normalizeSearchItem)
    .filter((item) => item.videoId)
}

export async function getYoutubeVideoDetail(videoId) {
  assertYoutubeApiKey()

  const params = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: 'snippet',
    id: videoId,
  })

  const response = await fetch(`${YOUTUBE_API_BASE_URL}/videos?${params.toString()}`)

  if (!response.ok) {
    throw new Error('유튜브 영상 상세 정보를 불러오지 못했습니다.')
  }

  const data = await response.json()
  const item = data.items?.[0]

  if (!item) {
    throw new Error('해당 영상을 찾을 수 없습니다.')
  }

  return normalizeVideoDetail(item)
}