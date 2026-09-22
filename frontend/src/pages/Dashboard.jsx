import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IndianRupee, TrendingUp, Plus, Camera } from 'lucide-react';
import { useTranslation } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import './Dashboard.css';

const API_URL = 'http://localhost:8000/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { speak, voiceEnabled } = useAccessibility();
  const [khataSummary, setKhataSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const artisanId = user?.id || 1;
  const userName = user?.full_name || 'Artisan';

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get(`${API_URL}/khata/summary?artisan_id=${artisanId}`);
        setKhataSummary(response.data);
      } catch (error) {
        console.error('Failed to fetch summary', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [artisanId]);

  // Announce on mount
  useEffect(() => {
    if (voiceEnabled && !loading) {
      speak(`${t('dashboard_greeting')} ${userName}. ${t('dashboard_tagline')}`, language);
    }
  }, [loading, voiceEnabled]);

  return (
    <div className="dashboard" role="main" aria-label="Dashboard">
      <header className="dashboard-header">
        <h1>{t('dashboard_greeting')}, {userName} 🏺</h1>
        <p>{t('dashboard_tagline')}</p>
      </header>

      {loading ? (
        <div className="loading-skeleton glass-card" aria-busy="true" aria-label={t('common_loading')}></div>
      ) : (
        <div className="glass-card balance-card" role="region" aria-label={t('dashboard_balance')}>
          <div className="balance-info">
            <span className="label">{t('dashboard_balance')}</span>
            <div className="amount">
              <IndianRupee size={28} />
              <span>{khataSummary?.current_balance?.toLocaleString('en-IN') || '0'}</span>
            </div>
          </div>
          <div className="trend">
            <TrendingUp size={20} className="text-success" />
            <span className="text-success">+₹{khataSummary?.month_income?.toLocaleString('en-IN') || '0'} {t('dashboard_month_income')}</span>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h2>{t('dashboard_quick_actions')}</h2>
        <div className="action-grid">
          <div
            className="action-card glass-card"
            onClick={() => navigate('/add-product')}
            role="button"
            tabIndex={0}
            aria-label={t('dashboard_new_listing')}
            onKeyDown={e => e.key === 'Enter' && navigate('/add-product')}
          >
            <div className="icon-wrapper bg-gradient-primary">
              <Camera size={28} color="white" />
            </div>
            <span>{t('dashboard_new_listing')}</span>
          </div>

          <div
            className="action-card glass-card"
            onClick={() => navigate('/khata')}
            role="button"
            tabIndex={0}
            aria-label={t('dashboard_add_income')}
            onKeyDown={e => e.key === 'Enter' && navigate('/khata')}
          >
            <div className="icon-wrapper bg-gradient-secondary">
              <Plus size={28} color="white" />
            </div>
            <span>{t('dashboard_add_income')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
