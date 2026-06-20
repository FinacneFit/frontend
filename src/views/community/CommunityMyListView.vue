<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'

const router = useRouter()
const communityStore = useCommunityStore()
const authStore = useAuthStore()

const nickname = authStore.user?.nickname ?? '이서현'
const myPosts = computed(() => communityStore.posts.filter(p => p.author === nickname))

function deletePost(id) {
  if (!confirm('삭제하시겠습니까?')) return
  communityStore.deletePost(id)
}
</script>

<template>
  <CommunityLayout>
    <div class="my-wrap">
      <button class="back-btn" @click="router.push('/community')">‹ 목록으로</button>
      <h2 class="my-title">내가 쓴 글</h2>

      <div class="my-list">
        <div
          v-for="post in myPosts"
          :key="post.id"
          class="my-card"
        >
          <div class="my-card-body" @click="router.push(`/community/${post.id}`)">
            <p class="mc-title">{{ post.title }}</p>
            <p class="mc-content">{{ post.content }}</p>
            <div class="mc-meta">
              <span>♡ {{ post.likes }}</span>
              <span>💬 {{ post.comments.length }}</span>
              <span class="mc-date">{{ post.createdAt }}</span>
            </div>
          </div>
          <button class="btn-del" @click="deletePost(post.id)">삭제</button>
        </div>
      </div>

      <p v-if="!myPosts.length" class="empty">작성한 글이 없습니다.</p>
    </div>
  </CommunityLayout>
</template>

<style scoped>
.my-wrap { padding: 24px; }
.back-btn { background: none; border: none; font-size: 14px; color: #6b7280; cursor: pointer; margin-bottom: 16px; padding: 0; }
.back-btn:hover { color: #1b78fd; }
.my-title { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 20px; }

.my-list { display: flex; flex-direction: column; gap: 12px; }
.my-card {
  border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px;
  display: flex; align-items: flex-start; gap: 12px;
  background: #fff;
}
.my-card-body { flex: 1; cursor: pointer; }
.my-card-body:hover .mc-title { color: #1b78fd; }
.mc-title { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 6px; }
.mc-content {
  font-size: 14px; color: #374151;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  margin-bottom: 10px;
}
.mc-meta { display: flex; gap: 12px; font-size: 12px; color: #9ca3af; }
.mc-date { margin-left: auto; }

.btn-del {
  background: none; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 6px 12px; font-size: 12px; color: #9ca3af; cursor: pointer; flex-shrink: 0;
}
.btn-del:hover { border-color: #ef4444; color: #ef4444; }
.empty { text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px; }
</style>
