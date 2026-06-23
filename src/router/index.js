import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import LandingView from '@/views/LandingView.vue'
import SignupView from '@/views/auth/SignupView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import MyPageView from '@/views/MyPageView.vue'
import SurveyIntroView from '@/views/survey/SurveyIntroView.vue'
import SurveyQuestionView from '@/views/survey/SurveyQuestionView.vue'
import SurveyResultLoadingView from '@/views/survey/SurveyResultLoadingView.vue'
import SurveyResultView from '@/views/survey/SurveyResultView.vue'
import CommunityListView from '@/views/community/CommunityListView.vue'
import CommunityDetailView from '@/views/community/CommunityDetailView.vue'
import CommunityCreateView from '@/views/community/CommunityCreateView.vue'
import CommunityMyListView from '@/views/community/CommunityMyListView.vue'
import CommunityEditView from '@/views/community/CommunityEditView.vue'
import DepositListView from '@/views/DepositListView.vue'
import SpotAssetChartView from '@/views/SpotAssetChartView.vue'

// 로그인 없이 접근 가능한 페이지
const PUBLIC_PATHS = ['/', '/login', '/signup']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: LandingView },
    { path: '/signup', component: SignupView },
    { path: '/login', component: LoginView },
    { path: '/dashboard', component: DashboardView },
    { path: '/mypage', component: MyPageView },
    { path: '/survey/intro', component: SurveyIntroView },
    { path: '/survey/question', component: SurveyQuestionView },
    { path: '/survey/result/loading', component: SurveyResultLoadingView },
    { path: '/survey/result', component: SurveyResultView },
    { path: '/community', component: CommunityListView },
    { path: '/community/create', component: CommunityCreateView },
    { path: '/community/my', component: CommunityMyListView },
    { path: '/community/:postId', component: CommunityDetailView },
    { path: '/community/:postId/edit', component: CommunityEditView },
    { path: '/deposits', component: DepositListView },
    { path: '/spot-assets', component: SpotAssetChartView },
    { path: '/stock-videos', name: 'stock-videos', component: () => import('@/views/StockVideoSearchView.vue') },
    { path: '/stock-videos/:videoId', name: 'stock-video-detail', component: () => import('@/views/StockVideoDetailView.vue') },
    { path: '/banks', name: 'banks', component: () => import('@/views/BankMapView.vue') },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn && !PUBLIC_PATHS.includes(to.path)) {
    return { path: '/login' }
  }
})

export default router
