<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import CommunityLayout from '@/layouts/CommunityLayout.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import CommunityPortfolioCard from '@/components/CommunityPortfolioCard.vue'
import profileImg from '@/assets/profile.svg'

const route          = useRoute()
const router         = useRouter()
const communityStore = useCommunityStore()
const authStore      = useAuthStore()

const post = computed(() => communityStore.getPost(route.params.postId))
const bodyExpanded = ref(false)
const BODY_PREVIEW_LENGTH = 300
const BODY_PREVIEW_LINES = 20
const collapsedBody = computed(() => {
  const content = post.value?.content ?? ''
  const lineLimited = content.split(/\r?\n/).slice(0, BODY_PREVIEW_LINES).join('\n')
  return lineLimited.slice(0, BODY_PREVIEW_LENGTH)
})
const isLongBody = computed(() => collapsedBody.value.length < (post.value?.content.length ?? 0))
const displayedBody = computed(() =>
  bodyExpanded.value || !isLongBody.value
    ? (post.value?.content ?? '')
    : `${collapsedBody.value}…`
)

onMounted(() => communityStore.loadPost(Number(route.params.postId)))

const commentText = ref('')
const replyingToId = ref(null)
const replyText = ref('')
const myId        = computed(() => authStore.user?.id ?? null)
const nickname    = computed(() => authStore.user?.nickname ?? '')
const initial     = computed(() => nickname.value.charAt(0))

// 댓글 인라인 수정
const editingCommentId   = ref(null)
const editingCommentText = ref('')

function startEditComment(c) {
  editingCommentId.value   = c.id
  editingCommentText.value = c.text
}
function cancelEditComment() {
  editingCommentId.value   = null
  editingCommentText.value = ''
}
async function submitEditComment(commentId) {
  const text = editingCommentText.value.trim()
  if (!text || !post.value) return
  await communityStore.updateComment(post.value.id, commentId, text)
  cancelEditComment()
}

function toggleLike() {
  if (!post.value) return
  communityStore.toggleLike(post.value.id)
}

function addComment() {
  const text = commentText.value.trim()
  if (!text || !post.value) return
  communityStore.addComment(post.value.id, text)
  commentText.value = ''
}

function startReply(commentId) {
  replyingToId.value = replyingToId.value === commentId ? null : commentId
  replyText.value = ''
}

async function addReply(parentId) {
  const text = replyText.value.trim()
  if (!text || !post.value) return
  await communityStore.addComment(post.value.id, text, parentId)
  replyingToId.value = null
  replyText.value = ''
}

const commentTotal = computed(() => post.value?.comments.reduce(
  (total, comment) => total + 1 + comment.replies.length,
  0,
) ?? 0)

function deleteComment(commentId) {
  if (!post.value) return
  if (!confirm('댓글을 삭제하시겠습니까?')) return
  communityStore.deleteComment(post.value.id, commentId)
}

async function deletePost() {
  if (!post.value) return
  if (!confirm('게시글을 삭제하시겠습니까?')) return
  await communityStore.deletePost(post.value.id)
  router.push('/community')
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

            <!-- 작성자 전용 수정/삭제 -->
            <div v-if="post.authorId === myId" class="post-actions">
              <button class="btn-edit" @click="router.push(`/community/${post.id}/edit`)">수정</button>
              <button class="btn-delete-post" @click="deletePost">삭제</button>
            </div>
          </div>

          <CommunityPortfolioCard
            v-if="Object.keys(post.portfolioSnapshot ?? {}).length"
            class="attached-portfolio"
            :snapshot="post.portfolioSnapshot"
          />
          <div class="post-body">
            <div>{{ displayedBody }}</div>
            <button
              v-if="isLongBody"
              class="btn-more"
              @click="bodyExpanded = !bodyExpanded"
            >{{ bodyExpanded ? '접기' : '더보기' }}</button>
          </div>

          <div class="reaction-row">
            <button class="like-btn" :class="{ liked: post.liked }" @click="toggleLike">
              <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20.4 4.7 13.7C.8 10.1 3.5 4 8.6 4c1.5 0 2.7.7 3.4 1.8C12.7 4.7 13.9 4 15.4 4c5.1 0 7.8 6.1 3.9 9.7L12 20.4Z" />
              </svg>
              <span>{{ post.likes }}</span>
            </button>
            <span class="comment-count">
              <svg class="comment-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.4-.7L4 20l1.5-4A7.4 7.4 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
              </svg>
              <span>{{ commentTotal }}</span>
            </span>
          </div>

          <hr class="divider" />

          <p class="comments-heading">댓글 {{ commentTotal }}</p>
          <div class="comment-list">
            <div v-for="c in post.comments" :key="c.id" class="comment-thread">
              <div class="comment-item">
              <button class="avatar-btn" @click="openProfile(c.authorId)">
                <img :src="profileImg" class="avatar-sm" alt="profile" />
              </button>
              <div class="comment-body">
                <div class="comment-author-row">
                  <button class="comment-author-btn" @click="openProfile(c.authorId)">{{ c.author }}</button>
                  <span v-if="c.authorId === post.authorId" class="author-badge">작성자</span>
                </div>

                <!-- 인라인 수정 모드 -->
                <template v-if="editingCommentId === c.id">
                  <textarea
                    v-model="editingCommentText"
                    class="comment-edit-input"
                    rows="2"
                    @keydown.enter.ctrl="submitEditComment(c.id)"
                  />
                  <div class="comment-edit-btns">
                    <button class="btn-save-comment" @click="submitEditComment(c.id)">저장</button>
                    <button class="btn-cancel-comment" @click="cancelEditComment">취소</button>
                  </div>
                </template>
                <p v-else class="comment-text">{{ c.text }}</p>
              </div>

              <div v-if="editingCommentId !== c.id" class="comment-actions">
                <button class="act-btn reply" @click="startReply(c.id)">답글</button>
                <button v-if="c.authorId === myId" class="act-btn" @click="startEditComment(c)">수정</button>
                <button v-if="c.authorId === myId" class="act-btn del" @click="deleteComment(c.id)">삭제</button>
              </div>
              </div>

              <div v-if="replyingToId === c.id" class="reply-input-wrap">
                <input
                  v-model="replyText"
                  class="reply-input"
                  :placeholder="`${c.author}님에게 답글 작성`"
                  @keydown.enter="addReply(c.id)"
                />
                <button class="btn-reply-submit" @click="addReply(c.id)">등록</button>
                <button class="btn-reply-cancel" @click="startReply(c.id)">취소</button>
              </div>

              <div v-if="c.replies.length" class="reply-list">
                <div v-for="reply in c.replies" :key="reply.id" class="comment-item reply-item">
                  <span class="reply-arrow">↳</span>
                  <button class="avatar-btn" @click="openProfile(reply.authorId)">
                    <img :src="profileImg" class="avatar-sm" alt="profile" />
                  </button>
                  <div class="comment-body">
                    <div class="comment-author-row">
                      <button class="comment-author-btn" @click="openProfile(reply.authorId)">{{ reply.author }}</button>
                      <span v-if="reply.authorId === post.authorId" class="author-badge">작성자</span>
                    </div>
                    <template v-if="editingCommentId === reply.id">
                      <textarea
                        v-model="editingCommentText"
                        class="comment-edit-input"
                        rows="2"
                        @keydown.enter.ctrl="submitEditComment(reply.id)"
                      />
                      <div class="comment-edit-btns">
                        <button class="btn-save-comment" @click="submitEditComment(reply.id)">저장</button>
                        <button class="btn-cancel-comment" @click="cancelEditComment">취소</button>
                      </div>
                    </template>
                    <p v-else class="comment-text">{{ reply.text }}</p>
                  </div>
                  <div v-if="reply.authorId === myId && editingCommentId !== reply.id" class="comment-actions">
                    <button class="act-btn" @click="startEditComment(reply)">수정</button>
                    <button class="act-btn del" @click="deleteComment(reply.id)">삭제</button>
                  </div>
                </div>
              </div>
            </div>
            <p v-if="!post.comments.length" class="no-comment">첫 댓글을 남겨보세요.</p>
          </div>
        </div>
        <div v-else class="not-found">게시글을 찾을 수 없습니다.</div>
      </div>

      <UserProfileModal
        v-if="selectedUserId !== null"
        :userId="selectedUserId"
        @close="closeProfile"
      />

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
.detail-shell { display: flex; flex-direction: column; height: 100%; }
.detail-scroll { flex: 1; overflow-y: auto; }
.detail-wrap { padding: 24px; }

.back-btn {
  background: none; border: none;
  font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #6b7280;
  cursor: pointer; margin-bottom: 16px; padding: 0;
}
.back-btn:hover { color: #1b78fd; }
.detail-title { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 24px; margin-bottom: 14px; }

.author-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.author-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; padding: 0; }
.avatar-sm { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; display: block; }
.author-name { font-family: 'Noto Sans KR', sans-serif; font-size: 14px; font-weight: 600; }
.risk-badge { font-size: 12px; color: #1b78fd; background: rgba(27,120,253,0.1); border-radius: 6px; padding: 2px 8px; }
.post-date { font-size: 12px; color: #9ca3af; margin-left: auto; }

.post-actions { display: flex; gap: 6px; }
.btn-edit {
  background: none; border: 1px solid #d1d5db; border-radius: 8px;
  padding: 4px 12px; font-size: 12px; color: #374151;
  font-family: 'Noto Sans KR', sans-serif; cursor: pointer;
}
.btn-edit:hover { border-color: #1b78fd; color: #1b78fd; }
.btn-delete-post {
  background: none; border: 1px solid #fca5a5; border-radius: 8px;
  padding: 4px 12px; font-size: 12px; color: #ef4444;
  font-family: 'Noto Sans KR', sans-serif; cursor: pointer;
}
.btn-delete-post:hover { background: #ef4444; color: #fff; }

.post-body {
  border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;
  font-family: 'Noto Sans KR', sans-serif; font-size: 14px; line-height: 1.7;
  white-space: pre-wrap; word-break: keep-all; margin-bottom: 16px;
}
.btn-more { display: block; margin: 14px auto 0; border: none; background: none; color: #1b78fd; font-weight: 700; cursor: pointer; }
.attached-portfolio { margin-bottom: 16px; }

.reaction-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.like-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; font-size: 14px; cursor: pointer; color: #9ca3af; }
.heart-icon { width: 22px; height: 22px; fill: transparent; stroke: currentColor; stroke-width: 1.8; stroke-linejoin: round; transition: fill 0.15s, color 0.15s, transform 0.15s; }
.like-btn.liked { color: #ef4444; }
.like-btn.liked .heart-icon { fill: currentColor; }
.like-btn:hover .heart-icon { color: #ef4444; transform: scale(1.08); }
.comment-count { display: inline-flex; align-items: center; gap: 5px; font-size: 14px; color: #9ca3af; }
.comment-icon { width: 22px; height: 22px; fill: transparent; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: color 0.15s, transform 0.15s; }
.comment-count:hover .comment-icon { color: #1b78fd; transform: scale(1.08); }
.divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 0 16px; }

.comments-heading { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 12px; }
.comment-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item { display: flex; align-items: flex-start; gap: 10px; }
.comment-body { flex: 1; min-width: 0; }
.avatar-btn { background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; }
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

.comment-edit-input {
  width: 100%; box-sizing: border-box;
  border: 1.5px solid #1b78fd; border-radius: 8px;
  padding: 8px 10px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px;
  resize: none; outline: none; margin-top: 4px;
}
.comment-edit-btns { display: flex; gap: 6px; margin-top: 6px; }
.btn-save-comment {
  height: 30px; padding: 0 14px; background: #1b78fd; color: #fff; border: none;
  border-radius: 8px; font-size: 12px; font-family: 'Noto Sans KR', sans-serif; font-weight: 700; cursor: pointer;
}
.btn-save-comment:hover { opacity: 0.88; }
.btn-cancel-comment {
  height: 30px; padding: 0 14px; background: none; border: 1px solid #d1d5db;
  border-radius: 8px; font-size: 12px; font-family: 'Noto Sans KR', sans-serif; color: #6b7280; cursor: pointer;
}
.btn-cancel-comment:hover { border-color: #9ca3af; color: #374151; }

.comment-actions { display: flex; gap: 4px; flex-shrink: 0; }
.act-btn {
  background: none; border: none; font-size: 12px; color: #9ca3af;
  cursor: pointer; padding: 2px 6px;
  font-family: 'Noto Sans KR', sans-serif;
}
.act-btn:hover { color: #374151; }
.act-btn.del:hover { color: #ef4444; }

.reply-input-wrap { display: flex; gap: 6px; margin: 8px 0 0 38px; }
.reply-input { flex: 1; height: 36px; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0 10px; outline: none; }
.reply-input:focus { border-color: #1b78fd; }
.btn-reply-submit, .btn-reply-cancel { height: 36px; padding: 0 12px; border-radius: 8px; cursor: pointer; font-size: 12px; }
.btn-reply-submit { border: none; background: #1b78fd; color: #fff; }
.btn-reply-cancel { border: 1px solid #d1d5db; background: #fff; color: #6b7280; }
.reply-list { margin: 10px 0 0 34px; padding: 10px 12px; border-radius: 10px; background: #f8fafc; }
.reply-item { position: relative; }
.reply-item + .reply-item { margin-top: 10px; }
.reply-arrow { color: #9ca3af; font-size: 16px; flex-shrink: 0; }

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
