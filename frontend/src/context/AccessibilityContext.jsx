import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SPEECH_LANG_MAP } from '../i18n/i18n';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('artisan_voice') === 'true';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('artisan_contrast') === 'true';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('artisan_fontsize') || 'normal';
  });

  // Apply high contrast to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', highContrast ? 'high-contrast' : 'default');
    localStorage.setItem('artisan_contrast', highContrast);
  }, [highContrast]);

  // Apply font size to root
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('artisan_fontsize', fontSize);
  }, [fontSize]);

  // Persist voice preference
  useEffect(() => {
    localStorage.setItem('artisan_voice', voiceEnabled);
  }, [voiceEnabled]);

  /**
   * Speak text using the Web Speech API in the specified language.
   * Falls back to the browser's default voice if no language-specific voice is found.
   */
  const speak = useCallback((text, langCode = 'en') => {
    if (!voiceEnabled) return;
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG_MAP[langCode] || 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode)) ||
                          voices.find(v => v.lang.includes(langCode));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => !prev);
  }, []);

  const cycleFontSize = useCallback(() => {
    setFontSize(prev => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xl';
      return 'normal';
    });
  }, []);

  const setAllPreferences = useCallback(({ voice, contrast, font }) => {
    if (voice !== undefined) setVoiceEnabled(voice);
    if (contrast !== undefined) setHighContrast(contrast);
    if (font !== undefined) setFontSize(font);
  }, []);

  return (
    <AccessibilityContext.Provider value={{
      voiceEnabled,
      highContrast,
      fontSize,
      speak,
      stopSpeaking,
      toggleVoice,
      toggleHighContrast,
      cycleFontSize,
      setAllPreferences,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;
