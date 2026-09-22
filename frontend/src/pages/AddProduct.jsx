import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Mic, IndianRupee, Sparkles, CheckCircle2 } from 'lucide-react';
import './AddProduct.css';

const API_URL = 'http://localhost:8000/api';

const AddProduct = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State for flow
  const [visionTags, setVisionTags] = useState(null);
  const [listing, setListing] = useState(null);
  const [pricing, setPricing] = useState(null);
  
  // Inputs
  const [materialCost, setMaterialCost] = useState('200');
  const [labourHours, setLabourHours] = useState('5');

  const handleSimulateVision = async () => {
    setLoading(true);
    // Simulate Vision API since we can't easily upload a file in this demo UI without a real file
    setTimeout(() => {
      setVisionTags({ craft_type: 'Pottery', material: 'Terracotta', category: 'Home Decor' });
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleGenerateListing = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/voice/listing`, {
        language: 'hi',
        image_tags: visionTags
      });
      setListing(res.data.listing);
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePricing = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/pricing/calculate`, {
        material_cost: parseFloat(materialCost),
        labour_hours: parseFloat(labourHours),
        hourly_wage: 100,
        craft_type: visionTags.craft_type
      });
      setPricing(res.data);
      setStep(4);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    // In a real app, this would POST to /api/products
    // We'll just route to the passport view for demo product ID 1
    navigate('/passport/1');
  };

  return (
    <div className="add-product">
      <header className="page-header">
        <h1>New Listing 📦</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>
      </header>

      {/* Step 1: Image / Vision */}
      {step === 1 && (
        <div className="step-container slide-in">
          <h2>1. Product Photo</h2>
          <p>Take a clear photo of your craft. Our AI will automatically remove the background and tag it.</p>
          
          <div className="camera-box glass-card" onClick={handleSimulateVision}>
            {loading ? (
              <div className="spinner">Processing...</div>
            ) : (
              <>
                <Camera size={48} color="var(--accent-primary)" />
                <span>Tap to Scan</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Voice Description */}
      {step === 2 && (
        <div className="step-container slide-in">
          <h2>2. Voice Description</h2>
          <div className="tags-display mb-4">
            <span className="tag">🏷️ {visionTags.craft_type}</span>
            <span className="tag">🧱 {visionTags.material}</span>
          </div>
          <p>Tap the mic and describe your product in your local language.</p>
          
          <div className="mic-box glass-card" onClick={handleGenerateListing}>
             {loading ? (
              <div className="spinner"><Sparkles className="spin" /> Generating...</div>
            ) : (
              <>
                <Mic size={48} color="var(--accent-secondary)" />
                <span>Tap to Speak</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="step-container slide-in">
          <h2>3. Set Fair Price</h2>
          
          <div className="glass-card mb-4 p-4">
            <h3 className="mb-2">{listing?.title}</h3>
            <p style={{fontSize: '12px'}}>{listing?.description}</p>
          </div>

          <div className="input-group">
            <label className="input-label">Raw Material Cost (₹)</label>
            <input type="number" className="input-field" value={materialCost} onChange={e => setMaterialCost(e.target.value)} />
          </div>
          <div className="input-group mb-4">
            <label className="input-label">Labour Hours Spent</label>
            <input type="number" className="input-field" value={labourHours} onChange={e => setLabourHours(e.target.value)} />
          </div>
          
          <button className="btn-primary" onClick={handleCalculatePricing} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate AI Price'}
          </button>
        </div>
      )}

      {/* Step 4: Publish */}
      {step === 4 && (
        <div className="step-container slide-in">
          <h2>4. Review & Publish</h2>
          
          <div className="pricing-result glass-card mb-4">
            <div className="text-center">
              <span className="label">Recommended Retail Price</span>
              <div className="price-big text-success">₹{pricing?.retail_price}</div>
            </div>
            
            <div className="explanation mt-4">
              <Sparkles size={16} />
              <p>{pricing?.explanation}</p>
            </div>
          </div>
          
          <button className="btn-primary" onClick={handlePublish}>
            <CheckCircle2 size={20} /> Publish to Market
          </button>
        </div>
      )}

    </div>
  );
};

export default AddProduct;
