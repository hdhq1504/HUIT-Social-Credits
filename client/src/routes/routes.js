import config from '../config';

// Import các trang public
import HomePage from '../pages/HomePage/HomePage';
import LoginPage from '../pages/LoginPage/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage/ForgotPasswordPage';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import ListActivitiesPage from '../pages/ListActivitiesPage/ListActivitiesPage';
import ActivityDetailPage from '../pages/ActivityDetailPage/ActivityDetailPage';
import MyActivitiesPage from '../pages/MyActivitiesPage/MyActivitiesPage';
import MyPointsPage from '../pages/MyPointsPage/MyPointsPage';
import RollCallPage from '../pages/RollCallPage/RollCallPage';
import FeedbackPage from '../pages/FeedbackPage/FeedbackPage';
import Loading from '../pages/Loading/Loading';

// Layout
import HeaderOnly from '../layouts/HeaderOnly/HeaderOnly';
import DefaultLayout from '../layouts/DefaultLayout/DefaultLayout';
import AdminLayout from '../layouts/Admin/AdminLayout/AdminLayout.jsx';

// Trang admin
import DashboardPage from '../pages/Admin/DashboardPage/DashboardPage.jsx';
import ActivitiesPage from '../pages/Admin/ActivitiesPage/ActivitiesPage.jsx';
import ScoringPage from '../pages/Admin/ScoringPage/ScoringPage.jsx';
import ProofPage from '../pages/Admin/ProofPage/ProofPage.jsx';

const publicRoutes = [
  { path: config.routes.home, component: HomePage, layout: DefaultLayout },
  { path: config.routes.login, component: LoginPage, layout: DefaultLayout },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage, layout: DefaultLayout },
  { path: config.routes.profile, component: ProfilePage, layout: HeaderOnly },
  { path: config.routes.listActivities, component: ListActivitiesPage, layout: DefaultLayout },
  { path: config.routes.activityDetail, component: ActivityDetailPage, layout: DefaultLayout },
  { path: config.routes.activityDetailWithId, component: ActivityDetailPage, layout: DefaultLayout },
  { path: config.routes.myActivities, component: MyActivitiesPage, layout: DefaultLayout },
  { path: config.routes.myPoints, component: MyPointsPage, layout: DefaultLayout },
  { path: config.routes.rollCall, component: RollCallPage, layout: DefaultLayout },
  { path: config.routes.feedback, component: FeedbackPage, layout: DefaultLayout },
  { path: config.routes.loading, component: Loading, layout: DefaultLayout },
];

const adminRoutes = [
  { path: '/admin/dashboard', component: DashboardPage, layout: AdminLayout },
  { path: '/admin/activities', component: ActivitiesPage, layout: AdminLayout },
  { path: '/admin/scoring', component: ScoringPage, layout: AdminLayout },
  { path: '/admin/proof', component: ProofPage, layout: AdminLayout },
];

export { publicRoutes, adminRoutes };
