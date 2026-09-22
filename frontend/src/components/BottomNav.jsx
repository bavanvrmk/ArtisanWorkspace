import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Book, Award } from 'lucide-react';
import { useTranslation } from '../i18n/i18n';
import { useAccessibility } from '../context/AccessibilityContext';
import './BottomNav.css';

const BottomNav = () => {
  const { t, language } = useTranslation();
  const { speak, voiceEnabled } = useAccessibility();

  const handleFocus = (label) => {
    if (voiceEnabled) {
      speak(label, language);
    }
  };

  return (
    <nav className="bottom-nav glass-card" role="navigation" aria-label={t('nav_home')}>
      <NavLink
        to="/"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        aria-label={t('nav_home')}
        onFocus={() => handleFocus(t('nav_home'))}
      >
        <Home size={24} />
        <span>{t('nav_home')}</span>
      </NavLink>

      <NavLink
        to="/khata"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        aria-label={t('nav_khata')}
        onFocus={() => handleFocus(t('nav_khata'))}
      >
        <Book size={24} />
        <span>{t('nav_khata')}</span>
      </NavLink>

      <NavLink
        to="/add-product"
        className={({ isActive }) => `nav-item add-btn ${isActive ? 'active' : ''}`}
        aria-label={t('nav_add')}
        onFocus={() => handleFocus(t('nav_add'))}
      >
        <div className="add-btn-inner">
          <PlusCircle size={32} color="white" />
        </div>
      </NavLink>

      <NavLink
        to="/schemes"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        aria-label={t('nav_schemes')}
        onFocus={() => handleFocus(t('nav_schemes'))}
      >
        <Award size={24} />
        <span>{t('nav_schemes')}</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
