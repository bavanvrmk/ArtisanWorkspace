import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Alert, Image } from 'react-native';
import { Camera, Mic, Square, CheckCircle2, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import apiClient from '../api/client';
import { LanguageContext } from '../context/LanguageContext';

export default function AddProductScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [visionTags, setVisionTags] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [processedImageUrl, setProcessedImageUrl] = useState(null);
  const [listing, setListing] = useState(null);
  const [pricing, setPricing] = useState(null);
  
  const { t, language } = React.useContext(LanguageContext);
  
  const [materialCost, setMaterialCost] = useState('');
  const [labourHours, setLabourHours] = useState('');

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const handleCaptureImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Refused", "You need to allow camera access.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      processImage(result.assets[0]);
    }
  };

  const processImage = async (asset) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        name: 'photo.jpg',
        type: 'image/jpeg'
      });

      const res = await apiClient.post('/vision/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setVisionTags(res.data.tags);
      setImageUrl(asset.uri);
      
      // Use processed image from API if available
      if (res.data.processed_image_url) {
        setProcessedImageUrl(`http://10.12.178.54:8000${res.data.processed_image_url}`);
      }
      
      setStep(2);
    } catch (e) {
      Alert.alert('Error', 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = () => {
    try {
      recorder.record();
    } catch (err) {
      Alert.alert('Failed to start recording', err.message);
    }
  };

  const handleStopRecording = async () => {
    try {
      await recorder.stop();
      if (recorder.uri) {
        processAudio(recorder.uri);
      } else {
        Alert.alert('Error', 'No recording found');
      }
    } catch (err) {
      Alert.alert('Error stopping recording', err.message);
    }
  };

  const processAudio = async (uri) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'voice.m4a',
        type: 'audio/m4a'
      });
      formData.append('language', language);
      formData.append('image_tags', JSON.stringify(visionTags));

      const res = await apiClient.post('/voice/listing/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setListing(res.data.listing);
      setStep(3);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate listing');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePricing = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/pricing/calculate', {
        material_cost: parseFloat(materialCost),
        labour_hours: parseFloat(labourHours),
        hourly_wage: 100,
        craft_type: visionTags.craft_type || "Handicraft"
      });
      setPricing(res.data);
      setStep(4);
    } catch (e) {
      Alert.alert('Error', 'Failed to calculate price');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    Alert.alert('Success', 'Product published successfully!', [
      { text: 'OK', onPress: () => {
        setStep(1);
        navigation.navigate('Home');
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{t('New Listing 📦')}</Text>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
      </View>

      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{t('1. Product Photo')}</Text>
          <Text style={styles.stepDesc}>Take a clear photo of your craft. AI will tag it and remove the background.</Text>
          
          <TouchableOpacity style={styles.actionBox} onPress={handleCaptureImage} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="large" color="#6366f1" />
            ) : (
              <>
                <Camera size={48} color="#6366f1" />
                <Text style={styles.actionBoxText}>{t('Open Camera')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{t('2. Voice Description')}</Text>
          
          {(processedImageUrl || imageUrl) && <Image source={{uri: processedImageUrl || imageUrl}} style={styles.thumbnail} />}

          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>🏷️ {visionTags?.craft_type}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>🧱 {visionTags?.material}</Text></View>
          </View>
          <Text style={styles.stepDesc}>Tap the mic and describe your product in your language.</Text>
          
          <TouchableOpacity 
            style={[styles.actionBox, recorder.isRecording && { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} 
            onPress={recorder.isRecording ? handleStopRecording : handleStartRecording} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#ec4899" />
            ) : recorder.isRecording ? (
              <>
                <Square size={48} color="#ef4444" />
                <Text style={[styles.actionBoxText, {color: '#ef4444'}]}>{t('Stop Recording')}</Text>
              </>
            ) : (
              <>
                <Mic size={48} color="#ec4899" />
                <Text style={styles.actionBoxText}>{t('Tap to Speak')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{t('3. Set Fair Price')}</Text>
          
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{listing?.title}</Text>
            <Text style={styles.previewDesc}>{listing?.description}</Text>
          </View>

          <Text style={styles.inputLabel}>{t('Raw Material Cost (₹)')}</Text>
          <TextInput
            style={styles.input}
            value={materialCost}
            onChangeText={setMaterialCost}
            keyboardType="numeric"
            placeholder="e.g. 200"
            placeholderTextColor="#6b7280"
          />

          <Text style={styles.inputLabel}>{t('Labour Hours Spent')}</Text>
          <TextInput
            style={styles.input}
            value={labourHours}
            onChangeText={setLabourHours}
            keyboardType="numeric"
            placeholder="e.g. 5"
            placeholderTextColor="#6b7280"
          />
          
          <TouchableOpacity style={styles.btnPrimary} onPress={handleCalculatePricing} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t('Calculate AI Price')}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 4 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{t('4. Review & Publish')}</Text>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>{t('Recommended Retail Price')}</Text>
            <Text style={styles.resultPrice}>₹{pricing?.retail_price}</Text>
            
            <View style={styles.explanationBox}>
              <Sparkles size={16} color="#9ca3af" style={{ marginTop: 2 }} />
              <Text style={styles.explanationText}>{pricing?.explanation}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.btnPrimary} onPress={handlePublish}>
            <CheckCircle2 size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnPrimaryText}>{t('Publish to Market')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1016', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 30 },
  progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 8 },
  stepDesc: { fontSize: 14, color: '#9ca3af', marginBottom: 20 },
  thumbnail: { width: 100, height: 100, borderRadius: 12, marginBottom: 16 },
  actionBox: { height: 200, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed', borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  actionBoxText: { color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '500' },
  tagRow: { flexDirection: 'row', marginBottom: 16 },
  tag: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  tagText: { color: '#fff', fontSize: 12 },
  previewCard: { backgroundColor: '#1a1c23', padding: 16, borderRadius: 12, marginBottom: 20 },
  previewTitle: { color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 8 },
  previewDesc: { color: '#9ca3af', fontSize: 12, lineHeight: 18 },
  inputLabel: { color: '#9ca3af', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
  btnPrimary: { backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultCard: { backgroundColor: '#1a1c23', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  resultLabel: { color: '#9ca3af', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  resultPrice: { color: '#10b981', fontSize: 48, fontWeight: 'bold', marginVertical: 8 },
  explanationBox: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, marginTop: 12 },
  explanationText: { color: '#d1d5db', fontSize: 12, lineHeight: 18, marginLeft: 8, flex: 1 },
});
