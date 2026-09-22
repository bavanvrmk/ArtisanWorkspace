import { useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTranslation } from '../i18n/i18n';

/**
 * Accessible button that speaks its label on focus when voice mode is active.
 * Drop-in replacement for <button> with built-in a11y features.
 */
const VoiceButton = ({
  children,
  voiceLabel,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  ariaLabel,
  ...rest
}) => {
  const { speak, voiceEnabled } = useAccessibility();
  const { language } = useTranslation();

  const handleFocus = useCallback(() => {
    if (voiceEnabled && voiceLabel) {
      speak(voiceLabel, language);
    }
  }, [voiceEnabled, voiceLabel, speak, language]);

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      onFocus={handleFocus}
      onMouseEnter={handleFocus}
      disabled={disabled}
      aria-label={ariaLabel || voiceLabel}
      role="button"
      {...rest}
    >
      {children}
    </button>
  );
};

export default VoiceButton;
