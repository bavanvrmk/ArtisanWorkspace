import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import BottomNav from './components/BottomNav';
import AccessibilityFAB from './components/AccessibilityFAB';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import Khata from './pages/Khata';
import Schemes from './pages/Schemes';
import PassportView from './pages/PassportView';

/**
 * Inner app that has access to auth context.
 * Shows onboarding for unauthenticated users, main app for authenticated.
 */
const AppContent = () => {
  const { isAuthenticated, isOnboarded } = useAuth();

  // Not authenticated or not completed onboarding → show onboarding
  if (!isAuthenticated || !isOnboarded) {
    return <Onboarding />;
  }

  // Authenticated & onboarded → main app
  return (
    <>
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/khata" element={<Khata />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/passport/:id" element={<PassportView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
      <AccessibilityFAB />
    </>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AccessibilityProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
