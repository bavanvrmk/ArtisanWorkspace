import { useState, useCallback, useEffect } from 'react';
import {
  Globe, Mic, BookOpen, Award, ChevronRight, ChevronLeft,
  CheckCircle2, Volume2, Eye, Type, User, Lock, Phone,
  MapPin, Briefcase, Sparkles
} from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import VoiceButton from '../components/VoiceButton';
import './Onboarding.css';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const CRAFT_KEYS = [
  'craft_pottery', 'craft_weaving', 'craft_woodwork', 'craft_metalwork',
  'craft_painting', 'craft_embroidery', 'craft_leather', 'craft_bamboo',
  'craft_stone', 'craft_jewelry', 'craft_textile', 'craft_other',
];

const Onboarding = () => {
  const { t, language, setLanguage } = useTranslation();
  const { register, login, completeOnboarding } = useAuth();
  const { speak, voiceEnabled, highContrast, fontSize, setAllPreferences } = useAccessibility();

  const [step, setStep] = useState(1);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [direction, setDirection] = useState('forward');

  // Registration fields
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    craft_type: '',
    state: '',
    gender: '',
    age: '',
    annual_income: '',
  });

  // Login fields
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Accessibility preferences (step 4)
  const [a11yPrefs, setA11yPrefs] = useState({
    voice: false,
    contrast: false,
    font: 'normal',
  });

  // Speak announcements on step changes
  useEffect(() => {
    if (voiceEnabled) {
      const announcements = {
        1: t('onboarding_choose_language'),
        2: t('onboarding_intro_title'),
        3: isLoginMode ? t('onboarding_login_title') : t('onboarding_create_account'),
        4: t('onboarding_accessibility_title'),
        5: t('onboarding_success_title'),
      };
      speak(announcements[step], language);
    }
  }, [step, voiceEnabled]);

  const goNext = () => {
    setDirection('forward');
    setStep(prev => Math.min(prev + 1, 5));
  };

  const goBack = () => {
    setDirection('backward');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRegister = async () => {
    // Validation
    if (!form.full_name || !form.username || !form.password) {
      setError(t('common_error') + ': Name, phone, and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await register({
        ...form,
        craft_type: form.craft_type || 'Other',
        state: form.state || 'Not specified',
        age: form.age || 25,
        annual_income: form.annual_income || 0,
      });
      setUserName(user.full_name);
      goNext(); // → Step 4 (Accessibility)
    } catch (err) {
      const msg = err?.response?.data?.detail || t('common_error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError(t('common_error'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(loginForm);
      setUserName(user.full_name);
      goNext(); // → Step 4
    } catch (err) {
      const msg = err?.response?.data?.detail || t('common_error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccessibility = () => {
    setAllPreferences(a11yPrefs);
    goNext(); // → Step 5
  };

  const handleFinish = () => {
    completeOnboarding();
  };

  // Intro slides data
  const slides = [
    { icon: <Mic size={48} />, title: t('onboarding_slide1_title'), desc: t('onboarding_slide1_desc'), color: '#6366f1' },
    { icon: <BookOpen size={48} />, title: t('onboarding_slide2_title'), desc: t('onboarding_slide2_desc'), color: '#ec4899' },
    { icon: <Award size={48} />, title: t('onboarding_slide3_title'), desc: t('onboarding_slide3_desc'), color: '#10b981' },
  ];

  return (
    <div className="onboarding" role="main" aria-label="Onboarding">
      {/* Background decorative elements */}
      <div className="onboarding-bg">
        <div className="bg-circle c1"></div>
        <div className="bg-circle c2"></div>
        <div className="bg-circle c3"></div>
      </div>

      {/* Progress dots */}
      <div className="onboarding-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={5}>
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`progress-dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`} />
        ))}
      </div>

      {/* Back button (steps 2-4) */}
      {step > 1 && step < 5 && (
        <button className="onboarding-back" onClick={goBack} aria-label={t('common_back')}>
          <ChevronLeft size={24} />
        </button>
      )}

      {/* ═══════════════════ STEP 1: Language Selection ═══════════════════ */}
      {step === 1 && (
        <div className={`onboarding-step step-lang ${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}`}>
          {/* Logo */}
          <div className="onboarding-logo">
            <div className="logo-icon">🏺</div>
          </div>

          <h1 className="onboarding-title">{t('onboarding_welcome')}</h1>
          <h2 className="onboarding-app-name">{t('onboarding_app_name')}</h2>
          <p className="onboarding-tagline">{t('onboarding_app_tagline')}</p>

          <div className="lang-section">
            <h3 className="lang-section-title">
              <Globe size={20} />
              {t('onboarding_choose_language')}
            </h3>

            <div className="lang-grid">
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className={`lang-card ${language === lang.code ? 'selected' : ''}`}
                  onClick={() => handleLanguageSelect(lang.code)}
                  aria-label={`Select ${lang.name}`}
                  aria-pressed={language === lang.code}
                >
                  <span className="lang-script">{lang.script}</span>
                  <span className="lang-native">{lang.nativeName}</span>
                  <span className="lang-english">{lang.name}</span>
                  {language === lang.code && (
                    <div className="lang-check">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <VoiceButton
            className="btn-primary onboarding-cta"
            onClick={goNext}
            voiceLabel={t('onboarding_continue')}
          >
            {t('onboarding_continue')}
            <ChevronRight size={20} />
          </VoiceButton>
        </div>
      )}

      {/* ═══════════════════ STEP 2: App Introduction ═══════════════════ */}
      {step === 2 && (
        <div className={`onboarding-step step-intro ${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}`}>
          <h2 className="intro-title">{t('onboarding_intro_title')}</h2>

          <div className="intro-carousel">
            <div className="intro-slide" key={slideIndex}>
              <div className="slide-icon-wrapper" style={{ background: `${slides[slideIndex].color}20`, borderColor: `${slides[slideIndex].color}40` }}>
                <div style={{ color: slides[slideIndex].color }}>
                  {slides[slideIndex].icon}
                </div>
              </div>
              <h3 className="slide-title">{slides[slideIndex].title}</h3>
              <p className="slide-desc">{slides[slideIndex].desc}</p>
            </div>

            {/* Slide dots */}
            <div className="slide-dots">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  className={`slide-dot ${idx === slideIndex ? 'active' : ''}`}
                  onClick={() => setSlideIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="intro-actions">
            {slideIndex < slides.length - 1 ? (
              <>
                <button className="btn-text" onClick={goNext}>{t('onboarding_skip')}</button>
                <VoiceButton
                  className="btn-primary onboarding-cta"
                  onClick={() => setSlideIndex(prev => prev + 1)}
                  voiceLabel={t('onboarding_next')}
                >
                  {t('onboarding_next')}
                  <ChevronRight size={20} />
                </VoiceButton>
              </>
            ) : (
              <VoiceButton
                className="btn-primary onboarding-cta full-width"
                onClick={goNext}
                voiceLabel={t('onboarding_get_started')}
              >
                <Sparkles size={20} />
                {t('onboarding_get_started')}
              </VoiceButton>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ STEP 3: Registration / Login ═══════════════════ */}
      {step === 3 && (
        <div className={`onboarding-step step-register ${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}`}>
          {!isLoginMode ? (
            /* Registration Form */
            <div className="register-form">
              <h2>{t('onboarding_create_account')}</h2>

              {error && <div className="form-error" role="alert">{error}</div>}

              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-name">
                    <User size={14} /> {t('onboarding_full_name')}
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    className="input-field"
                    placeholder={t('onboarding_full_name_placeholder')}
                    value={form.full_name}
                    onChange={e => handleFormChange('full_name', e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-phone">
                    <Phone size={14} /> {t('onboarding_phone')}
                  </label>
                  <input
                    id="reg-phone"
                    type="text"
                    className="input-field"
                    placeholder={t('onboarding_phone_placeholder')}
                    value={form.username}
                    onChange={e => handleFormChange('username', e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-password">
                    <Lock size={14} /> {t('onboarding_password')}
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    className="input-field"
                    placeholder={t('onboarding_password_placeholder')}
                    value={form.password}
                    onChange={e => handleFormChange('password', e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="reg-craft">
                    <Briefcase size={14} /> {t('onboarding_craft_type')}
                  </label>
                  <select
                    id="reg-craft"
                    className="input-field"
                    value={form.craft_type}
                    onChange={e => handleFormChange('craft_type', e.target.value)}
                  >
                    <option value="">{t('onboarding_select_craft')}</option>
                    {CRAFT_KEYS.map(key => (
                      <option key={key} value={t(key)}>{t(key)}</option>
                    ))}
                  </select>
                </div>

                <div className="input-row">
                  <div className="input-group flex-1">
                    <label className="input-label" htmlFor="reg-state">
                      <MapPin size={14} /> {t('onboarding_state')}
                    </label>
                    <select
                      id="reg-state"
                      className="input-field"
                      value={form.state}
                      onChange={e => handleFormChange('state', e.target.value)}
                    >
                      <option value="">{t('onboarding_select_state')}</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group flex-half">
                    <label className="input-label" htmlFor="reg-gender">{t('onboarding_gender')}</label>
                    <select
                      id="reg-gender"
                      className="input-field"
                      value={form.gender}
                      onChange={e => handleFormChange('gender', e.target.value)}
                    >
                      <option value="">{t('onboarding_select_gender')}</option>
                      <option value="male">{t('onboarding_gender_male')}</option>
                      <option value="female">{t('onboarding_gender_female')}</option>
                      <option value="other">{t('onboarding_gender_other')}</option>
                    </select>
                  </div>
                </div>

                <div className="input-row">
                  <div className="input-group flex-half">
                    <label className="input-label" htmlFor="reg-age">{t('onboarding_age')}</label>
                    <input
                      id="reg-age"
                      type="number"
                      className="input-field"
                      placeholder={t('onboarding_age_placeholder')}
                      value={form.age}
                      onChange={e => handleFormChange('age', e.target.value)}
                    />
                  </div>

                  <div className="input-group flex-1">
                    <label className="input-label" htmlFor="reg-income">{t('onboarding_annual_income')}</label>
                    <input
                      id="reg-income"
                      type="number"
                      className="input-field"
                      placeholder={t('onboarding_annual_income_placeholder')}
                      value={form.annual_income}
                      onChange={e => handleFormChange('annual_income', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <VoiceButton
                className="btn-primary onboarding-cta"
                onClick={handleRegister}
                voiceLabel={t('onboarding_register')}
                disabled={loading}
              >
                {loading ? (
                  <><span className="btn-spinner"></span> {t('common_loading')}</>
                ) : (
                  <>{t('onboarding_register')} <ChevronRight size={20} /></>
                )}
              </VoiceButton>

              <div className="auth-switch">
                <span>{t('onboarding_have_account')}</span>
                <button className="btn-link" onClick={() => { setIsLoginMode(true); setError(''); }}>
                  {t('onboarding_login')}
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="register-form">
              <h2>{t('onboarding_login_title')}</h2>

              {error && <div className="form-error" role="alert">{error}</div>}

              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label" htmlFor="login-user">
                    <Phone size={14} /> {t('onboarding_phone')}
                  </label>
                  <input
                    id="login-user"
                    type="text"
                    className="input-field"
                    placeholder={t('onboarding_phone_placeholder')}
                    value={loginForm.username}
                    onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="login-pass">
                    <Lock size={14} /> {t('onboarding_password')}
                  </label>
                  <input
                    id="login-pass"
                    type="password"
                    className="input-field"
                    placeholder={t('onboarding_password_placeholder')}
                    value={loginForm.password}
                    onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <VoiceButton
                className="btn-primary onboarding-cta"
                onClick={handleLogin}
                voiceLabel={t('onboarding_login_button')}
                disabled={loading}
              >
                {loading ? (
                  <><span className="btn-spinner"></span> {t('common_loading')}</>
                ) : (
                  <>{t('onboarding_login_button')} <ChevronRight size={20} /></>
                )}
              </VoiceButton>

              <div className="auth-switch">
                <span>{t('onboarding_no_account')}</span>
                <button className="btn-link" onClick={() => { setIsLoginMode(false); setError(''); }}>
                  {t('onboarding_signup')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ STEP 4: Accessibility Setup ═══════════════════ */}
      {step === 4 && (
        <div className={`onboarding-step step-a11y ${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}`}>
          <div className="a11y-header">
            <h2>{t('onboarding_accessibility_title')}</h2>
            <p>{t('onboarding_accessibility_desc')}</p>
          </div>

          <div className="a11y-options">
            {/* Voice toggle */}
            <div className="a11y-option glass-card">
              <div className="a11y-option-info">
                <div className="a11y-option-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                  <Volume2 size={24} color="#6366f1" />
                </div>
                <div>
                  <h4>{t('onboarding_voice_assist')}</h4>
                  <p>{t('onboarding_voice_assist_desc')}</p>
                </div>
              </div>
              <label className="toggle-switch" aria-label={t('onboarding_voice_assist')}>
                <input
                  type="checkbox"
                  checked={a11yPrefs.voice}
                  onChange={e => setA11yPrefs(prev => ({ ...prev, voice: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* High contrast toggle */}
            <div className="a11y-option glass-card">
              <div className="a11y-option-info">
                <div className="a11y-option-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
                  <Eye size={24} color="#ec4899" />
                </div>
                <div>
                  <h4>{t('onboarding_high_contrast')}</h4>
                  <p>{t('onboarding_high_contrast_desc')}</p>
                </div>
              </div>
              <label className="toggle-switch" aria-label={t('onboarding_high_contrast')}>
                <input
                  type="checkbox"
                  checked={a11yPrefs.contrast}
                  onChange={e => setA11yPrefs(prev => ({ ...prev, contrast: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Font size */}
            <div className="a11y-option glass-card">
              <div className="a11y-option-info">
                <div className="a11y-option-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                  <Type size={24} color="#10b981" />
                </div>
                <div>
                  <h4>{t('onboarding_text_size')}</h4>
                </div>
              </div>
              <div className="font-size-options">
                {['normal', 'large', 'xl'].map(size => (
                  <button
                    key={size}
                    className={`font-size-btn ${a11yPrefs.font === size ? 'active' : ''}`}
                    onClick={() => setA11yPrefs(prev => ({ ...prev, font: size }))}
                    aria-label={t(`onboarding_text_${size === 'xl' ? 'xl' : size}`)}
                  >
                    {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <VoiceButton
            className="btn-primary onboarding-cta"
            onClick={handleSaveAccessibility}
            voiceLabel={t('onboarding_save_preferences')}
          >
            {t('onboarding_save_preferences')}
            <ChevronRight size={20} />
          </VoiceButton>
        </div>
      )}

      {/* ═══════════════════ STEP 5: Success ═══════════════════ */}
      {step === 5 && (
        <div className="onboarding-step step-success slide-in-right">
          <div className="success-animation">
            <div className="success-circle">
              <CheckCircle2 size={72} color="#10b981" />
            </div>
            <div className="success-confetti"></div>
          </div>

          <h1 className="success-title">{t('onboarding_success_title')}</h1>
          <h2 className="success-welcome">
            {t('onboarding_success_welcome')}, {userName}! 🎉
          </h2>
          <p className="success-desc">{t('onboarding_success_desc')}</p>

          <VoiceButton
            className="btn-primary onboarding-cta success-cta"
            onClick={handleFinish}
            voiceLabel={t('onboarding_go_dashboard')}
          >
            {t('onboarding_go_dashboard')}
            <ChevronRight size={20} />
          </VoiceButton>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
