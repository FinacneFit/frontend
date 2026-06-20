import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import SignupView from '@/views/auth/SignupView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import SurveyIntroView from '@/views/survey/SurveyIntroView.vue'
import SurveyQuestionView from '@/views/survey/SurveyQuestionView.vue'
import SurveyResultLoadingView from '@/views/survey/SurveyResultLoadingView.vue'
import SurveyResultView from '@/views/survey/SurveyResultView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: LandingView },
    { path: '/signup', component: SignupView },
    { path: '/login', component: LoginView },
    { path: '/dashboard', component: DashboardView },
    { path: '/survey/intro', component: SurveyIntroView },
    { path: '/survey/question', component: SurveyQuestionView },
    { path: '/survey/result/loading', component: SurveyResultLoadingView },
    { path: '/survey/result', component: SurveyResultView },
  ],
})

export default router
