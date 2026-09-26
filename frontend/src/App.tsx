import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { SettingsProvider } from "./settings/SettingsContext";
import { RequireAuth } from "./components/RequireAuth";
import { HomePage } from "./pages/HomePage";
import { KhataPage } from "./pages/KhataPage";
import { LoginPage } from "./pages/LoginPage";
import { PassportPage } from "./pages/PassportPage";
import { PricingPage } from "./pages/PricingPage";
import { SchemesPage } from "./pages/SchemesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudioPage } from "./pages/StudioPage";
import { VoicePage } from "./pages/VoicePage";

export default function App() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/studio" element={<StudioPage />} />
                <Route path="/voice" element={<VoicePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/khata" element={<KhataPage />} />
                <Route path="/schemes" element={<SchemesPage />} />
                <Route path="/passport" element={<PassportPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
}
