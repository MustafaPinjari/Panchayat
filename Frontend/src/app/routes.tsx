import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VoiceComplaint from './pages/VoiceComplaint';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import ComplaintDetail from './pages/ComplaintDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Login,
      },
      {
        path: 'dashboard',
        Component: Dashboard,
      },
      {
        path: 'voice-complaint',
        Component: VoiceComplaint,
      },
      {
        path: 'complaint/:id',
        Component: ComplaintDetail,
      },
      {
        path: 'chat',
        Component: Chat,
      },
      {
        path: 'admin',
        Component: AdminDashboard,
      },
      {
        path: 'users',
        Component: UserManagement,
      },
      {
        path: 'notifications',
        Component: Notifications,
      },
      {
        path: 'settings',
        Component: Settings,
      },
    ],
  },
]);