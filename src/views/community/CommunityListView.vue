<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useSurveyStore } from '@/stores/surveyStore'
import { useAuthStore } from '@/stores/authStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const router         = useRouter()
const communityStore = useCommunityStore()
const surveyStore    = useSurveyStore()
const authStore      = useAuthStore()

onMounted(() => communityStore.loadPosts())

const activeFilter = computed(() => communityStore.activeFilter)
const posts = computed(() => communityStore.filteredPosts)
const heading = computed(() => {
  const t = activeFilter.value ?? surveyStore.resultType ?? '전체'
  return activeFilter.value ? t : '전체'
})

const selectedUserId = ref(null)
function openProfile(authorId) {
  if (!authorId) return
  const myId = authStore.user?.id ?? 99
  if (authorId === myId) { router.push('/mypage'); return }
  selectedUserId.value = authorId
}
function closeProfile() { selectedUserId.value = null }
</script>

<template>
  <CommunityLayout>
    <div class="list-wrap">
      <h2 class="list-heading">
        <span v-if="activeFilter" class="blue">{{ activeFilter }}</span>
        <span v-else>전체</span>
        {{ activeFilter ? ' 사람들의 포트폴리오' : ' 게시글' }}
      </h2>

      <div class="post-grid">
        <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="router.push(`/community/${post.id}`)"
        >
          <p class="post-title">{{ post.title }}</p>
          <p class="post-content">{{ post.content }}</p>
          <div v-if="Object.keys(post.portfolioSnapshot ?? {}).length" class="portfolio-badges">
            <span v-if="post.portfolioSnapshot.stocks">주식 {{ post.portfolioSnapshot.stocks.items.length }}종목</span>
            <span v-if="post.portfolioSnapshot.deposits">예·적금 {{ post.portfolioSnapshot.deposits.items.length }}개</span>
          </div>
          <div class="post-meta">
            <div class="author-row" @click.stop="openProfile(post.authorId)">
              <UserAvatar
                :nickname="post.author"
                :image-url="post.authorProfileImage"
                size="sm"
                class="mini-avatar"
              />
              <span class="author-name">{{ post.author }}</span>
            </div>
            <div class="meta-stats" @click.stop>
              <button
                class="like-btn"
                :class="{ liked: post.liked }"
                :aria-label="post.liked ? '좋아요 취소' : '좋아요'"
                @click="communityStore.toggleLike(post.id)"
              >
                <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20.4 4.7 13.7C.8 10.1 3.5 4 8.6 4c1.5 0 2.7.7 3.4 1.8C12.7 4.7 13.9 4 15.4 4c5.1 0 7.8 6.1 3.9 9.7L12 20.4Z" />
                </svg>
                <span>{{ post.likes }}</span>
              </button>
              <span class="comment-count">
                <svg class="comment-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.4-.7L4 20l1.5-4A7.4 7.4 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
                </svg>
                <span>{{ post.commentCount }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!posts.length" class="empty">해당 성향의 게시글이 없습니다.</p>
    </div>
  </CommunityLayout>

  <UserProfileModal
    v-if="selectedUserId !== null"
    :userId="selectedUserId"
    @close="closeProfile"
  />
</template>

<style scoped>
.list-wrap { padding: 24px; }
.list-heading {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 16px;
}
.blue { color: #1b78fd; }

.post-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.post-card {
  border: 1px solid #9f9f9f;
  border-radius: 14px;
  padding: 21px;
  cursor: pointer;
  transition: box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
}
.post-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.post-title {
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 16px;
}
.post-content {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: #374151;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}
.portfolio-badges { display: flex; gap: 6px; }
.portfolio-badges span { padding: 3px 8px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; }
.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}
.author-row { display: flex; align-items: center; gap: 6px; }
.mini-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.author-name { font-size: 12px; font-family: 'Noto Sans KR', sans-serif; }
.meta-stats { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #9ca3af; }
.like-btn { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; font-size: 12px; }
.heart-icon { width: 18px; height: 18px; fill: transparent; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; transition: fill 0.15s, color 0.15s, transform 0.15s; }
.like-btn.liked { color: #ef4444; }
.like-btn.liked .heart-icon { fill: currentColor; }
.like-btn:hover .heart-icon { color: #ef4444; transform: scale(1.08); }
.comment-count { display: inline-flex; align-items: center; gap: 4px; }
.comment-icon { width: 18px; height: 18px; fill: transparent; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.empty { color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px; }
</style>
