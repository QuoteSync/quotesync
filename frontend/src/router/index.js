import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { getSession } from '@/api';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '/',
          name: 'dashboard',
          meta: { requiresAuth: true },
          component: () => import('@/views/Dashboard.vue')
        },
        {
          path: '/quotes',
          name: 'quotes',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/Quotes.vue')
        },
        {
          path: '/authors',
          name: 'authors',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/Authors.vue')
        },
        {
          path: '/authors/:id',
          name: 'authorDetail',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/AuthorDetail.vue')
        },
        {
          path: '/books',
          name: 'books',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/Books.vue')
        },
        {
          path: '/books/:id',
          name: 'bookDetail',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/BookDetail.vue')
        },
        {
          path: '/tags',
          name: 'tags',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/Tags.vue')
        },
        {
          path: '/tags/:id',
          name: 'tagDetail',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/TagDetail.vue')
        },        
        {
          path: '/uikit/formlayout',
          name: 'formlayout',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/FormLayout.vue')
        },
        {
          path: '/uikit/input',
          name: 'input',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/InputDoc.vue')
        },
        {
          path: '/uikit/button',
          name: 'button',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/ButtonDoc.vue')
        },
        {
          path: '/uikit/table',
          name: 'table',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/TableDoc.vue')
        },
        {
          path: '/uikit/list',
          name: 'list',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/ListDoc.vue')
        },
        {
          path: '/uikit/tree',
          name: 'tree',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/TreeDoc.vue')
        },
        {
          path: '/uikit/panel',
          name: 'panel',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/PanelsDoc.vue')
        },
        {
          path: '/uikit/overlay',
          name: 'overlay',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/OverlayDoc.vue')
        },
        {
          path: '/uikit/media',
          name: 'media',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/MediaDoc.vue')
        },
        {
          path: '/uikit/message',
          name: 'message',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/MessagesDoc.vue')
        },
        {
          path: '/uikit/file',
          name: 'file',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/FileDoc.vue')
        },
        {
          path: '/uikit/menu',
          name: 'menu',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/MenuDoc.vue')
        },
        {
          path: '/uikit/charts',
          name: 'charts',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/ChartDoc.vue')
        },
        {
          path: '/uikit/misc',
          name: 'misc',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/MiscDoc.vue')
        },
        {
          path: '/uikit/timeline',
          name: 'timeline',
          meta: { requiresAuth: true },
          component: () => import('@/views/uikit/TimelineDoc.vue')
        },
        {
          path: '/pages/empty',
          name: 'empty',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/Empty.vue')
        },
        {
          path: '/pages/crud',
          name: 'crud',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/Crud.vue')
        },
        {
          path: '/documentation',
          name: 'documentation',
          meta: { requiresAuth: true },
          component: () => import('@/views/pages/Documentation.vue')
        }
      ]
    },
    {
      path: '/landing',
      name: 'landing',
      component: () => import('@/views/pages/Landing.vue')
    },
    {
      path: '/pages/notfound',
      name: 'notfound',
      component: () => import('@/views/pages/NotFound.vue')
    },
    {
      path: '/auth/login',
      name: 'login',
      component: () => import('@/views/pages/auth/Login.vue')
    },
    {
      path: '/auth/register',
      name: 'register',
      component: () => import('@/views/pages/auth/Register.vue')
    },
    {
      path: '/auth/access',
      name: 'accessDenied',
      component: () => import('@/views/pages/auth/Access.vue')
    },
    {
      path: '/auth/error',
      name: 'error',
      component: () => import('@/views/pages/auth/Error.vue')
    }
  ]
});

router.beforeEach(async (to, _from, next) => {
  // Lista de rutas públicas
  const publicRoutes = ['login', 'register', 'accessDenied', 'error'];

  // Si la ruta es pública, permite la navegación sin llamar a getSession
  if (publicRoutes.includes(to.name)) {
    return next();
  }

  // Si la ruta requiere autenticación, se verifica la sesión
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const sessionData = await getSession();
    if (sessionData && sessionData.meta && sessionData.meta.is_authenticated) {
      return next();
    } else {
      return next({ name: 'login' });
    }
  }

  next();
});


export default router;
