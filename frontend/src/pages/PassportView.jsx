import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

const PassportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Craft Passport',
        url: `${API_URL}/passport/${id}`
      });
    } else {
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0, margin: 0 }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 20px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--bg-glass-border)'
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white' }}>
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontWeight: '600' }}>Your Craft Passport</span>
        <button onClick={handleShare} style={{ background: 'none', border: 'none', color: 'white' }}>
          <Share2 size={24} />
        </button>
      </header>
      
      <iframe 
        src={`${API_URL}/passport/${id}`} 
        style={{ width: '100%', flex: 1, border: 'none', background: '#0f0c29' }}
        title="Craft Passport"
      />
    </div>
  );
};

export default PassportView;
