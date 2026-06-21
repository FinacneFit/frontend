<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import profileImg from '@/assets/profile.svg'

const route          = useRoute()
const router         = useRouter()
const communityStore = useCommunityStore()
const authStore      = useAuthStore()

const post = computed(() => communityStore.getPost(route.params.postId))

onMounted(() => communityStore.loadPost(Number(route.params.postId)))
const commentText = ref('')

const myId    = computed(() => authStore.user?.id ?? 99)
const nickname = computed(() => authStore.user?.nickname ?? '이서현')
const initial  = computed(() => nickname.value.charAt(0))

function toggleLike() {
  if (!post.value) return
  communityStore.toggleLike(post.value.id)
}

function addComment() {
  const text = commentText.value.trim()
  if (!text || !post.value) return
  communityStore.addComment(post.value.id, text, nickname.value, initial.value, myId.value)
  commentText.value = ''
}

function deleteComment(commentId) {
  if (!post.value) return
  communityStore.deleteComment(post.value.id, commentId)
}

// 프로필 모달
const selectedUserId = ref(null)
function openProfile(authorId) {
  if (!authorId) return
  if (authorId === myId.value) { router.push('/mypage'); return }
  selectedUserId.value = authorId
}
function closeProfile() { selectedUserId.value = null }
</script>

<template>
  <CommunityLayout>
    <div class="detail-shell">
      <!-- 스크롤 영역 -->
      <div class="detail-scroll">
        <div v-if="post" class="detail-wrap">
          <button class="back-btn" @click="router.push('/community')">‹ 목록으로</button>
          <h1 class="detail-title">{{ post.title }}</h1>

          <div class="author-row">
            <button class="author-btn" @click="openProfile(post.authorId)">
              <img :src="profileImg" class="avatar-sm" alt="profile" />
              <span class="author-name">{{ post.author }}</span>
            </button>
            <span class="risk-badge">{{ post.riskType }}</span>
            <span class="post-date">{{ post.createdAt }}</span>
          </div>

          <div class="post-body">{{ post.content }}</div>

          <div class="reaction-row">
            <button class="like-btn" :class="{ liked: post.liked }" @click="toggleLike">
              {{ post.liked ? '♥' : '♡' }} {{ post.likes }}
            </button>
            <span class="comment-count">💬 {{ post.comments.length }}</span>
          </div>

          <hr class="divider" />

          <p class="comments-heading">댓글 {{ post.comments.length }}</p>
          <div class="comment-list">
            <div v-for="c in post.comments" :key="c.id" class="comment-item">
              <button class="avatar-btn" @click="openProfile(c.authorId)">
                <img :src="profileImg" class="avatar-sm" alt="profile" />
              </button>
              <div class="comment-body">
                <div class="comment-author-row">
                  <button class="comment-author-btn" @click="openProfile(c.authorId)">{{ c.author }}</button>
                  <span v-if="c.authorId === post.authorId" class="author-badge">작성자</span>
                </div>
                <p class="comment-text">{{ c.text }}</p>
              </div>
              <button
                v-if="c.authorId === myId"
                class="del-comment"
                @click="deleteComment(c.id)"
              >삭제</button>
            </div>
            <p v-if="!post.comments.length" class="no-comment">첫 댓글을 남겨보세요.</p>
          </div>
        </div>
        <div v-else class="not-found">게시글을 찾을 수 없습니다.</div>
      </div>

      <!-- UserProfileModal -->
      <UserProfileModal
        v-if="selectedUserId !== null"
        :userId="selectedUserId"
        @close="closeProfile"
      />

      <!-- 댓글 입력 고정 하단 -->
      <div v-if="post" class="comment-input-row">
        <input
          v-model="commentText"
          class="comment-input"
          placeholder="댓글을 입력하세요"
          @keydown.enter="addComment"
        />
        <button class="btn-comment-submit" @click="addComment">등록</button>
      </div>
    </div>
  </CommunityLayout>
</template>

<style scoped>
.detail-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.detail-scroll { flex: 1; overflow-y: auto; }
.detail-wrap { padding: 24px; }

.back-btn {
  background: none; border: none;
  font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #6b7280;
  cursor: pointer; margin-bottom: 16px; padding: 0;
}
.back-btn:hover { color: #1b78fd; }
.detail-title { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 24px; margin-bottom: 14px; }

.author-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.author-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; padding: 0; }
.avatar-sm {
  width: 28px; height: 28px; border-radius: 50%;
  object-fit: cover; flex-shrink: 0; display: block;
}
.author-name { font-family: 'Noto Sans KR', sans-serif; font-size: 14px; font-weight: 600; }
.risk-badge { font-size: 12px; color: #1b78fd; background: rgba(27,120,253,0.1); border-radius: 6px; padding: 2px 8px; }
.post-date { font-size: 12px; color: #9ca3af; margin-left: auto; }

.post-body {
  border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;
  font-family: 'Noto Sans KR', sans-serif; font-size: 14px; line-height: 1.7;
  white-space: pre-wrap; word-break: keep-all; margin-bottom: 16px;
}

.reaction-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.like-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: #9ca3af; }
.like-btn.liked { color: #ef4444; }
.like-btn:hover { color: #ef4444; }
.comment-count { font-size: 14px; color: #9ca3af; }
.divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 0 16px; }

.comments-heading { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 12px; }
.comment-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item { display: flex; align-items: flex-start; gap: 10px; }
.comment-body { flex: 1; }
.avatar-btn { background: none; border: none; cursor: pointer; padding: 0; }
.avatar-btn:hover { opacity: 0.8; }
.comment-author-row { display: flex; align-items: center; gap: 6px; }
.comment-author-btn {
  background: none; border: none; cursor: pointer; padding: 0;
  font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 13px; color: #111827;
}
.comment-author-btn:hover { color: #1b78fd; text-decoration: underline; }
.author-badge {
  font-size: 10px; font-weight: 700; color: #1b78fd;
  background: rgba(27, 120, 253, 0.1); border-radius: 4px;
  padding: 1px 6px; flex-shrink: 0;
}
.comment-text { font-family: 'Noto Sans KR', sans-serif; font-size: 14px; margin-top: 3px; }
.del-comment { background: none; border: none; font-size: 12px; color: #9ca3af; cursor: pointer; flex-shrink: 0; }
.del-comment:hover { color: #ef4444; }
.no-comment { font-size: 13px; color: #9ca3af; text-align: center; padding: 20px; }
.not-found { padding: 40px; text-align: center; color: #9ca3af; }

.comment-input-row {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 24px; border-top: 1px solid #e5e7eb; background: #fff; flex-shrink: 0;
}
.comment-input {
  flex: 1; height: 42px; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 0 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none;
}
.comment-input:focus { border-color: #1b78fd; }
.btn-comment-submit {
  height: 42px; padding: 0 20px; background: #1b78fd; color: #fff; border: none;
  border-radius: 10px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 14px; cursor: pointer;
}
.btn-comment-submit:hover { opacity: 0.88; }
</style>
