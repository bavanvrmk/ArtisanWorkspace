import { useState, useCallback } from 'react';
import { Volume2, VolumeX, Eye, Type, X, Accessibility } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTranslation } from '../i18n/i18n';
import './AccessibilityFAB.css';

/**
 * Floating Action Button for accessibility controls.
 * Always visible bottom-right, expands to show voice/contrast/font toggles.
 */
const AccessibilityFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { voiceEnabled, highContrast, fontSize, toggleVoice, toggleHighContrast, cycleFontSize, speak } = useAccessibility();
  const { t, language } = useTranslation();

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleVoice = () => {
    toggleVoice();
    if (!voiceEnabled) {
      // Will be enabled after toggle, so speak the confirmation
      setTimeout(() => {
        speak(t('onboarding_voice_assist') + ' ' + t('common_on'), language);
      }, 100);
    }
  };

  const handleContrast = () => {
    toggleHighContrast();
  };

  const handleFontSize = () => {
    cycleFontSize();
    if (voiceEnabled) {
      const nextSize = fontSize === 'normal' ? t('onboarding_text_large') :
                       fontSize === 'large' ? t('onboarding_text_xl') :
                       t('onboarding_text_normal');
      speak(t('a11y_text_size') + ': ' + nextSize, language);
    }
  };

  return (
    <div className={`a11y-fab-container ${isOpen ? 'open' : ''}`}>
      {/* Menu items */}
      {isOpen && (
        <div className="a11y-menu" role="menu" aria-label={t('a11y_menu_title')}>
          <button
            className={`a11y-menu-item ${voiceEnabled ? 'active' : ''}`}
            onClick={handleVoice}
            aria-label={t('a11y_voice')}
            role="menuitem"
          >
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>{t('a11y_voice')}</span>
          </button>

          <button
            className={`a11y-menu-item ${highContrast ? 'active' : ''}`}
            onClick={handleContrast}
            aria-label={t('a11y_contrast')}
            role="menuitem"
          >
            <Eye size={20} />
            <span>{t('a11y_contrast')}</span>
          </button>

          <button
            className={`a11y-menu-item`}
            onClick={handleFontSize}
            aria-label={t('a11y_text_size')}
            role="menuitem"
          >
            <Type size={20} />
            <span className="font-size-label">
              {fontSize === 'normal' ? 'A' : fontSize === 'large' ? 'A+' : 'A++'}
            </span>
          </button>
        </div>
      )}

      {/* Main FAB button */}
      <button
        className="a11y-fab-trigger"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={t('a11y_menu_title')}
        aria-haspopup="true"
      >
        {isOpen ? <X size={24} /> : <Accessibility size={24} />}
      </button>
    </div>
  );
};

export default AccessibilityFAB;
