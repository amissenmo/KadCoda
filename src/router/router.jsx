/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';

import { createBrowserRouter } from 'react-router';

import { AdminRoute, ProtectedRoute } from '../components/common/RouteGuards';
import RootLayout from '../components/layouts/RootLayout';
import Spinner from '../components/ui/Spinner';

const About = lazy(() => import('../pages/about'));
const Archive = lazy(() => import('../pages/archive'));
const ArchiveArticles = lazy(() => import('../pages/archive-articles'));
const ArchiveOnline = lazy(() => import('../pages/archiveOnline'));
const Collab = lazy(() => import('../pages/collab'));
const Contact = lazy(() => import('../pages/contact'));
const DetailCourse = lazy(() => import('../pages/detail'));
const ArticlePage = lazy(() => import('../pages/detail-article'));
const ForgotPasswordPage = lazy(() => import('../pages/forgot-password'));
const HomePage = lazy(() => import('../pages/homepage'));
const LoginPage = lazy(() => import('../pages/login'));
const NotFound = lazy(() => import('../pages/not-found/NotFound'));
const PanelLayout = lazy(() => import('../pages/panel'));
const PanelDashboard = lazy(() => import('../pages/panel/dashboard'));
const PanelCertificates = lazy(() => import('../pages/panel/myCertificates'));
const PanelCourses = lazy(() => import('../pages/panel/myCourses'));
const PanelProfile = lazy(() => import('../pages/panel/profile'));
const PanelProfileInfo = lazy(
  () => import('../pages/panel/profile/PanelProfileInfo'),
);
const PanelProfileNotification = lazy(
  () => import('../pages/panel/profile/PanelProfileNotification'),
);
const PanelProfileSecurity = lazy(
  () => import('../pages/panel/profile/PanelProfileSecurity'),
);
const PanelSupport = lazy(() => import('../pages/panel/support'));
const PanelAdminLayout = lazy(() => import('../pages/panel-admin'));
const PanelAdminArticles = lazy(() => import('../pages/panel-admin/articles'));
const PanelAdminArticleEdit = lazy(
  () => import('../pages/panel-admin/articles/edit'),
);
const PanelAdminArticleCreate = lazy(
  () => import('../pages/panel-admin/articles/new'),
);
const PanelAdminCourses = lazy(() => import('../pages/panel-admin/courses'));
const PanelAdminCourseEdit = lazy(
  () => import('../pages/panel-admin/courses/edit'),
);
const PanelAdminCourseCreate = lazy(
  () => import('../pages/panel-admin/courses/new'),
);
const PanelAdminDashboard = lazy(
  () => import('../pages/panel-admin/dashboard'),
);
const PanelAdminFinance = lazy(() => import('../pages/panel-admin/finance'));
const PanelAdminDiscountCreate = lazy(
  () => import('../pages/panel-admin/finance/discount'),
);
const FinancialReport = lazy(
  () => import('../pages/panel-admin/reports/FinancialReport'),
);
const PanelAdminSupport = lazy(() => import('../pages/panel-admin/support'));
const PanelAdminTicketDetail = lazy(
  () => import('../pages/panel-admin/support/chat'),
);
const PanelAdminUsers = lazy(() => import('../pages/panel-admin/users'));
const PanelAdminUserEdit = lazy(
  () => import('../pages/panel-admin/users/edit'),
);
const RegisterPage = lazy(() => import('../pages/signup'));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#E8EDF5]">
    <Spinner className="text-primary-600 h-40 w-40" />
  </div>
);

const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<PageLoader />}>
        <RootLayout />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        children: [
          { index: true, element: <HomePage /> },

          { path: 'course/:slug', element: <DetailCourse /> },
          { path: 'article/:slug', element: <ArticlePage /> },

          {
            path: 'login',
            element: <LoginPage />,
          },

          {
            path: 'register',
            element: <RegisterPage />,
          },

          {
            path: 'forgot-password',
            element: <ForgotPasswordPage />,
          },

          {
            path: 'about',
            element: <About />,
          },

          {
            path: 'contact',
            element: <Contact />,
          },

          {
            path: 'collab',
            element: <Collab />,
          },

          {
            path: 'archive',
            element: <Archive />,
          },

          {
            path: 'articles',
            element: <ArchiveArticles />,
          },

          {
            path: 'archive-online',
            element: <ArchiveOnline />,
          },

          {
            path: 'panel',
            element: (
              <ProtectedRoute>
                <PanelLayout />
              </ProtectedRoute>
            ),
            children: [
              {
                index: true,
                element: <PanelDashboard />,
              },

              {
                path: 'courses',
                element: <PanelCourses />,
              },

              {
                path: 'certificates',
                element: <PanelCertificates />,
              },

              {
                path: 'support',
                element: <PanelSupport />,
              },

              {
                path: 'profile',
                element: <PanelProfile />,
                children: [
                  {
                    index: true,
                    element: <PanelProfileInfo />,
                  },

                  {
                    path: 'security',
                    element: <PanelProfileSecurity />,
                  },

                  {
                    path: 'notification',
                    element: <PanelProfileNotification />,
                  },
                ],
              },
            ],
          },
          {
            path: 'panel-admin',
            element: (
              <AdminRoute>
                <PanelAdminLayout />
              </AdminRoute>
            ),
            children: [
              {
                index: true,
                element: <PanelAdminDashboard />,
              },
              {
                path: 'users',
                element: <PanelAdminUsers />,
              },

              {
                path: 'editUser',
                element: <PanelAdminUserEdit />,
              },
              {
                path: 'support',
                element: <PanelAdminSupport />,
              },

              {
                path: 'finance',
                element: <PanelAdminFinance />,
              },

              {
                path: 'reports/finance',
                element: <FinancialReport />,
              },

              {
                path: 'courses',
                element: <PanelAdminCourses />,
              },

              {
                path: 'newCourse',
                element: <PanelAdminCourseCreate />,
              },

              {
                path: 'editCourse',
                element: <PanelAdminCourseEdit />,
              },

              {
                path: 'articles',
                element: <PanelAdminArticles />,
              },

              {
                path: 'newArticles',
                element: <PanelAdminArticleCreate />,
              },

              {
                path: 'newDiscount',
                element: <PanelAdminDiscountCreate />,
              },

              {
                path: 'editArticle',
                element: <PanelAdminArticleEdit />,
              },

              {
                path: 'ticket',
                element: <PanelAdminTicketDetail />,
              },
            ],
          },

          {
            path: '*',
            element: <NotFound />,
          },
        ],
      },
    ],
  },
]);

export default router;
