import { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import './Khata.css';

const API_URL = 'http://localhost:8000/api';
const ARTISAN_ID = 1;

const Khata = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Sales');
  
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}/khata/entries?artisan_id=${ARTISAN_ID}`);
      setEntries(response.data.entries);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!amount) return;
    
    try {
      await axios.post(`${API_URL}/khata/entry`, {
        artisan_id: String(ARTISAN_ID),
        type,
        amount: parseFloat(amount),
        category,
        notes: ''
      });
      setAmount('');
      fetchEntries(); // Refresh
    } catch (error) {
      console.error('Failed to add entry', error);
    }
  };

  return (
    <div className="khata">
      <header className="page-header">
        <h1>Digital Khata 📒</h1>
      </header>

      <form className="glass-card add-form" onSubmit={handleAddEntry}>
        <h3>Add Transaction</h3>
        
        <div className="type-toggle mt-4">
          <button 
            type="button" 
            className={`toggle-btn ${type === 'income' ? 'active-income' : ''}`}
            onClick={() => { setType('income'); setCategory('Sales'); }}
          >
            Income
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${type === 'expense' ? 'active-expense' : ''}`}
            onClick={() => { setType('expense'); setCategory('Raw Materials'); }}
          >
            Expense
          </button>
        </div>

        <div className="input-group mt-4">
          <label className="input-label">Amount (₹)</label>
          <input 
            type="number" 
            className="input-field" 
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Category</label>
          <select 
            className="input-field"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {type === 'income' ? (
              <>
                <option value="Sales">Sales</option>
                <option value="B2B Order">B2B Order</option>
                <option value="Other Income">Other Income</option>
              </>
            ) : (
              <>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Fuel">Fuel / Transport</option>
                <option value="Tools">Tools</option>
                <option value="Other Expense">Other Expense</option>
              </>
            )}
          </select>
        </div>

        <button type="submit" className="btn-primary mt-4">Add Entry</button>
      </form>

      <div className="entries-list mt-8">
        <h3>Recent Transactions</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="transactions mt-4">
            {entries.map((entry, idx) => (
              <div key={idx} className="transaction-item glass-card">
                <div className="tx-icon">
                  {entry.type === 'income' ? (
                    <ArrowDownRight size={24} className="text-success" />
                  ) : (
                    <ArrowUpRight size={24} className="text-danger" />
                  )}
                </div>
                <div className="tx-details">
                  <span className="tx-cat">{entry.category}</span>
                  <span className="tx-date">
                    {new Date(entry.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric'})}
                  </span>
                </div>
                <div className={`tx-amount ${entry.type === 'income' ? 'text-success' : 'text-danger'}`}>
                  {entry.type === 'income' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Khata;
