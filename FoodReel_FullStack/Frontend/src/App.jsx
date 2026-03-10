import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Orders from './pages/Orders';
import Stores from './pages/Stores';
import StorePage from './pages/Store';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerOrders from './pages/PartnerOrders';
import UploadReel from './pages/UploadReel';
import PartnerCoupons from './pages/PartnerCoupons';

function UserRoute({ children }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" />;
  if (role !== 'user') return <Navigate to="/partner/dashboard" />;
  return children;
}
function PartnerRoute({ children }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" />;
  if (role !== 'partner') return <Navigate to="/feed" />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User */}
        <Route path="/feed" element={<UserRoute><Feed /></UserRoute>} />
        <Route path="/orders" element={<UserRoute><Orders /></UserRoute>} />
        <Route path="/stores" element={<UserRoute><Stores /></UserRoute>} />
        <Route path="/store/:partnerId" element={<UserRoute><StorePage /></UserRoute>} />

        {/* Partner */}
        <Route path="/partner/dashboard" element={<PartnerRoute><PartnerDashboard /></PartnerRoute>} />
        <Route path="/partner/orders" element={<PartnerRoute><PartnerOrders /></PartnerRoute>} />
        <Route path="/partner/upload" element={<PartnerRoute><UploadReel /></PartnerRoute>} />
        <Route path="/partner/coupons" element={<PartnerRoute><PartnerCoupons /></PartnerRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
