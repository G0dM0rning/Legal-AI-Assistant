import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AdminSignup from "./pages/admin/Auth/AdminSignup";
import AdminSignin from "./pages/admin/Auth/AdminSignin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import Training from "./pages/admin/Training";
import Users from "./pages/admin/Users";
import AdminSupport from "./pages/admin/Support";
import Audit from "./pages/admin/Audit";
import Settings from "./pages/admin/Settings";
import About from "./pages/About";
import TryItNow from "./pages/TryItNow";
import Documentation from "./pages/Documentation";
import FAQ from "./pages/FAQ";
import Support from "./pages/Support";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import GDPRCompliance from "./pages/GDPRCompliance";
import { CssBaseline, Box } from "@mui/material";

function Layout({ children }) {
  const location = useLocation();

  // Hide Navbar & Footer on auth pages and ALL admin pages
  const shouldHideLayout = () => {
    const path = location.pathname;

    // Hide for auth pages or try-it
    if (["/login", "/register", "/try-it", "/verify-email", "/forgot-password", "/reset-password"].includes(path)) {
      return true;
    }

    // Hide for ALL admin pages (including /admin itself)
    if (path === "/admin" || path.startsWith("/admin/")) {
      return true;
    }

    return false;
  };

  const hideLayout = shouldHideLayout();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <CssBaseline />
      {!hideLayout && <Navbar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: hideLayout ? '#020617' : 'transparent' // Ensure background is dark on admin pages even if layout is hidden
        }}
      >
        {children}
      </Box>
      {!hideLayout && <Footer />}
    </Box>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/about" element={<About />} />
        <Route path="/try-it" element={<TryItNow />} />

        {/* Footer Resource Routes */}
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/support" element={<Support />} />

        {/* Footer Legal Routes */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/gdpr" element={<GDPRCompliance />} />

        {/* Admin Auth Routes */}
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/signin" element={<AdminSignin />} />

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="training" element={<Training />} />
          <Route path="users" element={<Users />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="audit" element={<Audit />} />
          <Route path="settings" element={<Settings />} />
          <Route path="dashboard" element={<Navigate to="/admin/overview" replace />} />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

// Simple 404 component
function NotFound() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      flexDirection: 'column',
      textAlign: 'center'
    }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default App;