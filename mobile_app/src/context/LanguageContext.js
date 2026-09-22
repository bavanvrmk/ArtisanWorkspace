import React, { createContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../api/client';

export const LanguageContext = createContext();

const staticTranslations = {
  hi: {
    'Home': 'मुख्य पृष्ठ',
    'Khata': 'खाता',
    'Add Product': 'उत्पाद जोड़ें',
    'Schemes': 'योजनाएं',
    'Welcome back,': 'वापसी पर स्वागत है,',
    'Today\'s Sales': 'आज की बिक्री',
    'Add New Entry': 'नई प्रविष्टि',
    'Income': 'आय',
    'Expense': 'खर्च',
    'Description': 'विवरण',
    'Amount (₹)': 'राशि (₹)',
    'Save Entry': 'सहेजें',
    'New Listing 📦': 'नई लिस्टिंग 📦',
    '1. Product Photo': '1. उत्पाद फोटो',
    '2. Voice Description': '2. वॉयस विवरण',
    '3. Set Fair Price': '3. उचित मूल्य तय करें',
    '4. Review & Publish': '4. समीक्षा और प्रकाशित करें',
    'Calculate AI Price': 'एआई मूल्य की गणना करें',
    'Publish to Market': 'बाजार में प्रकाशित करें',
    'Eligible Schemes': 'पात्र योजनाएं',
    'Logout': 'लॉग आउट',
    'Recommended Retail Price': 'अनुशंसित खुदरा मूल्य',
    'Raw Material Cost (₹)': 'कच्चे माल की लागत (₹)',
    'Labour Hours Spent': 'श्रम के घंटे',
    'Open Camera': 'कैमरा खोलें',
    'Tap to Speak': 'बोलने के लिए टैप करें',
    'Stop Recording': 'रिकॉर्डिंग रोकें',
  },
  mr: {
    'Home': 'मुख्य पृष्ठ',
    'Khata': 'खाते',
    'Add Product': 'उत्पादन जोडा',
    'Schemes': 'योजना',
    'Welcome back,': 'परत स्वागत आहे,',
  },
  ta: {
    'Home': 'முகப்பு',
    'Khata': 'கணக்கு',
    'Add Product': 'தயாரிப்பைச் சேர்க்க',
    'Schemes': 'திட்டங்கள்',
    'Welcome back,': 'மீண்டும் வருக,',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = useCallback((key) => {
    if (language === 'en') return key;
    return staticTranslations[language]?.[key] || key;
  }, [language]);

  const translateDynamic = async (text) => {
    if (!text || language === 'en') return text;
    try {
      const res = await apiClient.post('/translate', {
        text: text,
        source_lang: 'en',
        target_lang: language
      });
      return res.data.translated_text || text;
    } catch (e) {
      console.warn('Dynamic translation failed:', e);
      return text;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateDynamic }}>
      {children}
    </LanguageContext.Provider>
  );
};
