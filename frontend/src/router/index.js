import Vue from 'vue';
import Router from 'vue-router';
import Login from '../components/LoginPage.vue';
import AdminDashboard from '../components/AdminDashboard.vue';
import TeacherDashboard from '../components/TeacherDashboard.vue';
import StudentDashboard from '../components/StudentDashboardFixed.vue';
import TestNewSelection from '../components/TestNewSelection.vue';
import ApiTest from '../components/ApiTest.vue';
import APIDebug from '../components/APIDebug.vue';
import store from '../store';

Vue.use(Router);

const router = new Router({
  mode: 'hash',
  routes: [
    { path: '/', component: Login, meta: { noAuth: true } },
    { path: '/admin', component: AdminDashboard, meta: { role: 'admin' } },
    { path: '/teacher', component: TeacherDashboard, meta: { role: 'teacher' } },
    { path: '/student', component: StudentDashboard, meta: { role: 'student' } },
    { path: '/test', component: TestNewSelection, meta: { noAuth: true } },
    { path: '/api-test', component: ApiTest, meta: { noAuth: true } },
    { path: '/debug', component: APIDebug, meta: { noAuth: true } }
  ]
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userInfo = store.state.userInfo;
  // 日志1：看当前要跳转的路由和用户信息
  console.log('要跳转的路由：', to.path, '，路由要求角色：', to.meta.role);
  console.log('当前用户信息：', userInfo);

  // 1. 无需授权的页面直接放行
  if (to.meta.noAuth) {
    console.log('路由标记noAuth，直接放行');
    next();
    return;
  }

  // 2. 未登录/无角色 → 跳登录
  if (!userInfo || !userInfo.role) {
    console.log('未登录/无角色，跳登录页');
    next('/');
    return;
  }

  // 3. 有角色要求 → 验证匹配
  if (to.meta.role) {
    if (to.meta.role === userInfo.role) {
      console.log('角色匹配，放行');
      next();
    } else {
      console.log('角色不匹配，跳登录页');
      next('/');
    }
  } else {
    // 无角色要求的路由直接放行
    console.log('无角色要求，放行');
    next();
  }
});

export default router;