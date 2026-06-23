<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useSurveyStore } from '@/stores/surveyStore'
import { useAuthStore } from '@/stores/authStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import profileImg from '@/assets/profile.svg'

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
          <div class="post-meta">
            <div class="author-row" @click.stop="openProfile(post.authorId)">
              <img :src="profileImg" class="mini-avatar" alt="profile" />
              <span class="author-name">{{ post.author }}</span>
            </div>
            <div class="meta-stats">
              <span>♡ {{ post.likes }}</span>
              <span>💬 {{ post.comments.length }}</span>
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
.meta-stats { display: flex; gap: 10px; font-size: 12px; color: #787878; }
.empty { color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px; }
</style>
