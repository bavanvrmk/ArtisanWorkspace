import { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, ExternalLink, ShieldCheck } from 'lucide-react';
import './Schemes.css';

const API_URL = 'http://localhost:8000/api';
const ARTISAN_ID = 1;

const Schemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const response = await axios.get(`${API_URL}/schemes/match?artisan_id=${ARTISAN_ID}`);
        setSchemes(response.data.eligible_schemes);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  return (
    <div className="schemes-page">
      <header className="page-header">
        <h1>My Schemes 🇮🇳</h1>
        <p>Govt schemes matching your profile</p>
      </header>

      {loading ? (
        <p>Finding matching schemes...</p>
      ) : (
        <div className="schemes-list">
          <div className="match-status glass-card mb-4">
            <ShieldCheck size={24} className="text-success" />
            <span>You are eligible for <strong>{schemes.length}</strong> schemes.</span>
          </div>
          
          {schemes.map((scheme, idx) => (
            <div key={idx} className="scheme-card glass-card">
              <div className="scheme-header">
                <div className="icon-wrap">
                  <Award size={24} color="var(--accent-primary)" />
                </div>
                <h3>{scheme.name}</h3>
              </div>
              <div className="scheme-ministry">{scheme.ministry}</div>
              <div className="scheme-benefit">
                <strong>Benefit:</strong> {scheme.benefit}
              </div>
              <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-4">
                <span>Apply Now</span>
                <ExternalLink size={18} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schemes;
