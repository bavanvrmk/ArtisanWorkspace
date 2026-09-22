import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Modal, Pressable } from 'react-native';
import { IndianRupee, TrendingUp, Plus, Camera, LogOut, Globe } from 'lucide-react-native';
import apiClient from '../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

export default function HomeScreen({ navigation }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { userId, fullName, logout } = useContext(AuthContext);
  const { t, language, setLanguage } = useContext(LanguageContext);

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ta', name: 'தமிழ்' }
  ];

  const fetchSummary = async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get(`/khata/summary?artisan_id=${userId}`);
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [userId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  const selectLanguage = (code) => {
    setLanguage(code);
    setSettingsVisible(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      <Modal visible={settingsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {availableLanguages.map(lang => (
              <TouchableOpacity 
                key={lang.code}
                style={[styles.modalBtn, language === lang.code && styles.modalBtnActive]}
                onPress={() => selectLanguage(lang.code)}
              >
                <Text style={[styles.modalBtnText, language === lang.code && styles.modalBtnTextActive]}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSettingsVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('Welcome back,')}</Text>
          <Text style={styles.name}>{fullName || "Artisan"} 👋</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={{ padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, marginRight: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Globe size={18} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{language.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={{ padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 12 }}>
            <LogOut size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
          <View style={styles.balanceRow}>
            <IndianRupee size={28} color="#fff" />
            <Text style={styles.balanceAmount}>
              {summary?.current_balance?.toLocaleString('en-IN') || '0'}
            </Text>
          </View>
          <View style={styles.trendRow}>
            <TrendingUp size={16} color="#10b981" />
            <Text style={styles.trendText}>
              +₹{summary?.month_income?.toLocaleString('en-IN') || '0'} this month
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('Add Product')}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#6366f1' }]}>
            <Camera size={32} color="#fff" />
          </View>
          <Text style={styles.actionText}>New Listing</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Khata', { screen: 'KhataList' })}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#10b981' }]}>
            <Plus size={32} color="#fff" />
          </View>
          <Text style={styles.actionText}>Add Income</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1016',
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 40, // for status bar
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  balanceCard: {
    backgroundColor: '#1a1c23',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  trendText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#1a1c23',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '48%',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1c23', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalBtn: { padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  modalBtnActive: { backgroundColor: '#6366f1' },
  modalBtnText: { color: '#9ca3af', fontSize: 16, fontWeight: '500' },
  modalBtnTextActive: { color: '#fff' },
  closeBtn: { marginTop: 10, padding: 16, alignItems: 'center' },
  closeBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
