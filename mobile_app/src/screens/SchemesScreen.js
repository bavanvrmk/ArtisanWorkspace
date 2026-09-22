import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import { Award, ShieldCheck, ExternalLink } from 'lucide-react-native';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

export default function SchemesScreen() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useContext(AuthContext);
  const { t, language, translateDynamic } = useContext(LanguageContext);

  useEffect(() => {
    const fetchSchemes = async () => {
      if (!userId) return;
      try {
        const res = await apiClient.get(`/schemes/match?artisan_id=${userId}`);
        let fetchedSchemes = res.data.eligible_schemes;
        
        if (language !== 'en') {
          // Translate dynamic scheme data using Bhashini
          fetchedSchemes = await Promise.all(fetchedSchemes.map(async (scheme) => {
            const translatedTitle = await translateDynamic(scheme.title);
            const translatedDesc = await translateDynamic(scheme.description);
            return { ...scheme, title: translatedTitle, description: translatedDesc };
          }));
        }
        
        setSchemes(fetchedSchemes);
      } catch (error) {
        console.error('Error fetching schemes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, [userId, language]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Award size={24} color="#6366f1" />
        </View>
        <Text style={styles.cardTitle}>{item.title || item.name}</Text>
      </View>
      <Text style={styles.ministry}>{item.ministry}</Text>
      <View style={styles.benefitBox}>
        <Text style={styles.benefitText}><Text style={{fontWeight: 'bold'}}>{t('Benefit')}:</Text> {item.benefit}</Text>
      </View>
      <TouchableOpacity 
        style={styles.applyBtn}
        onPress={() => Linking.openURL(item.link)}
      >
        <Text style={styles.applyBtnText}>{t('Apply Now')}</Text>
        <ExternalLink size={16} color="#c7d2fe" style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('Eligible Schemes')}</Text>
      <Text style={styles.subtitle}>{t('Based on your profile, you are eligible for the following government support programs.')}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statusBox}>
            <ShieldCheck size={24} color="#10b981" />
            <Text style={styles.statusText}>
              {t('You are eligible for')} <Text style={{fontWeight: 'bold'}}>{schemes.length}</Text> {t('schemes')}.
            </Text>
          </View>

          <FlatList
            data={schemes}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        </>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    marginLeft: 12,
    fontSize: 15,
  },
  card: {
    backgroundColor: '#1a1c23',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  ministry: {
    color: '#9ca3af',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  benefitBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ec4899',
    marginBottom: 16,
  },
  benefitText: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 20,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#c7d2fe',
    fontWeight: '600',
    fontSize: 14,
  },
});
