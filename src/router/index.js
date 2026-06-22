import { createRouter, createWebHistory } from 'vue-router'
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
import DepositListView from '@/views/DepositListView.vue'
import SpotAssetChartView from '@/views/SpotAssetChartView.vue'

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
    { path: '/deposits', component: DepositListView },
    { path: '/spot-assets', component: SpotAssetChartView },
    {path: '/stock-videos',name: 'stock-videos', component: () => import('@/views/StockVideoSearchView.vue'),},
    {path: '/stock-videos/:videoId',name: 'stock-video-detail', component: () => import('@/views/StockVideoDetailView.vue'),},
    {path: '/banks',name: 'banks',component: () => import('@/views/BankMapView.vue'),},
  ],
})

export default router
