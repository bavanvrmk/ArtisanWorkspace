import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    username: '', password: '', full_name: '', age: '', gender: 'other', craft_type: '', state: '', annual_income: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const { language, setLanguage } = useContext(LanguageContext);

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' }
  ];

  const handleRegister = async () => {
    const { username, password, full_name, age, craft_type, state, annual_income } = formData;
    if (!username || !password || !full_name || !age || !craft_type || !state || !annual_income) {
      Alert.alert('Error', 'Please fill all fields for scheme matching');
      return;
    }
    
    setLoading(true);
    try {
      await register({
        ...formData,
        age: parseInt(age),
        annual_income: parseFloat(annual_income)
      });
    } catch (error) {
      Alert.alert('Registration Failed', 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.title}>Create Account ✨</Text>
      <Text style={styles.subtitle}>We need this data to match you with Government Schemes automatically.</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Account Info</Text>
        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#6b7280" onChangeText={t => setFormData({...formData, full_name: t})} />
        <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#6b7280" autoCapitalize="none" onChangeText={t => setFormData({...formData, username: t})} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#6b7280" secureTextEntry onChangeText={t => setFormData({...formData, password: t})} />
        
        <Text style={styles.label}>App Language</Text>
        <View style={styles.langContainer}>
          {availableLanguages.map(lang => (
            <TouchableOpacity 
              key={lang.code}
              style={[styles.langChip, language === lang.code && styles.langChipActive]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Demographics for Schemes</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Age" keyboardType="numeric" placeholderTextColor="#6b7280" onChangeText={t => setFormData({...formData, age: t})} />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Gender" placeholderTextColor="#6b7280" onChangeText={t => setFormData({...formData, gender: t})} />
        </View>
        <TextInput style={styles.input} placeholder="State (e.g., Gujarat, Karnataka)" placeholderTextColor="#6b7280" onChangeText={t => setFormData({...formData, state: t})} />
        <TextInput style={styles.input} placeholder="Craft Type (e.g., Pottery, Textiles)" placeholderTextColor="#6b7280" onChangeText={t => setFormData({...formData, craft_type: t})} />
        <TextInput style={styles.input} placeholder="Annual Income (₹)" keyboardType="numeric" placeholderTextColor="#6b7280" onChangeText={t => setFormData({...formData, annual_income: t})} />
        
        <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register & Proceed</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={styles.linkText}>Back to <Text style={{fontWeight: 'bold', color: '#6366f1'}}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1016', padding: 20, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 20, lineHeight: 20 },
  form: { backgroundColor: '#1a1c23', padding: 20, borderRadius: 16 },
  label: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', padding: 14, fontSize: 16, marginBottom: 12 },
  langContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  langChip: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  langChipActive: { backgroundColor: '#6366f1' },
  langText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
  langTextActive: { color: '#fff' },
  btnPrimary: { backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#9ca3af', fontSize: 14 }
});
