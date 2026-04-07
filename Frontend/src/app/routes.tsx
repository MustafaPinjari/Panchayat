import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
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
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: 'voice-complaint',
        element: <ProtectedRoute><VoiceComplaint /></ProtectedRoute>,
      },
      {
        path: 'complaint/:id',
        element: <ProtectedRoute><ComplaintDetail /></ProtectedRoute>,
      },
      {
        path: 'chat',
        element: <ProtectedRoute><Chat /></ProtectedRoute>,
      },
      {
        path: 'admin',
        element: <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>,
      },
      {
        path: 'users',
        element: <ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>,
      },
      {
        path: 'notifications',
        element: <ProtectedRoute><Notifications /></ProtectedRoute>,
      },
      {
        path: 'settings',
        element: <ProtectedRoute><Settings /></ProtectedRoute>,
      },
    ],
  },
]);
