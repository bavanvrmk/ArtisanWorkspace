import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Camera,
  Home,
  IndianRupee,
  Landmark,
  LogOut,
  Mic,
  QrCode,
  Settings,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { useSettings } from "../settings/SettingsContext";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { mode } = useSettings();

  const advanced = [
    { to: "/", label: t.navHome, icon: Home },
    { to: "/studio", label: t.navStudio, icon: Camera },
    { to: "/voice", label: t.navVoice, icon: Mic },
    { to: "/pricing", label: t.navPricing, icon: IndianRupee },
    { to: "/khata", label: t.navKhata, icon: BookOpen },
    { to: "/schemes", label: t.navSchemes, icon: Landmark },
    { to: "/passport", label: t.navPassport, icon: QrCode },
    { to: "/settings", label: t.navSettings, icon: Settings },
  ];
  const direct = [
    { to: "/", label: t.navHome, icon: Home },
    { to: "/passport", label: t.navPassport, icon: QrCode },
    { to: "/settings", label: t.navSettings, icon: Settings },
  ];
  const links = mode === "direct" ? direct : advanced;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ✦
          </span>
          <div>
            <strong>{t.brand}</strong>
            <em>{mode === "direct" ? t.modeDirect : t.modeAdvanced}</em>
          </div>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className="nav-link">
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div>
            <strong>{user?.username}</strong>
            <span>Artisan #{user?.userId}</span>
          </div>
          <button
            className="icon-btn"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
