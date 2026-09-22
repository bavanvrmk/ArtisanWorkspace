import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import apiClient from '../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

export default function KhataScreen() {
  const { userId } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sales');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get(`/khata/entries?artisan_id=${userId}`);
      setEntries(res.data.entries);
      setSummary(res.data.summary);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [userId])
  );

  const handleAddEntry = async () => {
    if (!amount) {
      Alert.alert('Error', t('Please enter an amount'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiClient.post('/khata/entry', {
        artisan_id: userId,
        type,
        amount: parseFloat(amount),
        category,
        notes: description
      });
      setAmount('');
      setDescription('');
      fetchEntries();
    } catch (error) {
      Alert.alert('Error', t('Failed to add entry'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.iconContainer}>
        {item.type === 'income' ? (
          <ArrowDownRight size={24} color="#10b981" />
        ) : (
          <ArrowUpRight size={24} color="#ef4444" />
        )}
      </View>
      <View style={styles.entryDetails}>
        <Text style={styles.entryCategory}>{item.category}</Text>
        {item.notes ? <Text style={styles.entryNotes}>{item.notes}</Text> : null}
        <Text style={styles.entryDate}>
          {new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric'})}
        </Text>
      </View>
      <Text style={[styles.entryAmount, item.type === 'income' ? styles.textSuccess : styles.textDanger]}>
        {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('Digital Khata 📒')}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('Today\'s Sales')}</Text>
          <Text style={styles.summaryValue}>₹{summary?.today_sales || 0}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('Income')}</Text>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>+₹{summary?.total_income || 0}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('Expense')}</Text>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>-₹{summary?.total_expense || 0}</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{t('Add New Entry')}</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, type === 'income' && styles.activeIncome]}
            onPress={() => { setType('income'); setCategory('Sales'); }}
          >
            <Text style={[styles.toggleText, type === 'income' && styles.activeIncomeText]}>{t('Income')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, type === 'expense' && styles.activeExpense]}
            onPress={() => { setType('expense'); setCategory('Raw Materials'); }}
          >
            <Text style={[styles.toggleText, type === 'expense' && styles.activeExpenseText]}>{t('Expense')}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={t('Amount (₹)')}
          placeholderTextColor="#6b7280"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TextInput
          style={styles.input}
          placeholder={t('Description')}
          placeholderTextColor="#6b7280"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleAddEntry}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{t('Save Entry')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t('Recent Transactions')}</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.entry_id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1016',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: '#1a1c23',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeIncome: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  activeExpense: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  toggleText: { color: '#9ca3af', fontWeight: '600' },
  activeIncomeText: { color: '#10b981' },
  activeExpenseText: { color: '#ef4444' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1c23',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 24,
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
  },
  entryCategory: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  entryDate: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textSuccess: { color: '#10b981' },
  textDanger: { color: '#ef4444' },
});
