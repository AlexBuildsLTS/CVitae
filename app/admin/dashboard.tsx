import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, 
  TextInput, Image, ActivityIndicator, Platform, useWindowDimensions, KeyboardAvoidingView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, Stack } from 'expo-router';
import { 
  LogOut, Camera, Save, FileText, CheckCircle, 
  Activity, Globe, User, Briefcase, FileCheck, AlertCircle
} from 'lucide-react-native';

// --- IMPORTS ---
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';

// --- TYPES (This fixes your 'prev' error by defining the shape of data) ---
interface ProfileSettings {
  id?: number;
  bio: string;
  is_looking_for_work: boolean;
  github_url: string;
  linkedin_url: string;
  cv_url: string | null;
  profile_image_url: string | null;
  email?: string;
}

const STATUS_OPTIONS = [
  { label: '🟢 OPEN TO WORK', value: 'OPEN TO WORK', active: true },
  { label: '🟡 BUSY / CONTRACT', value: 'CURRENTLY BUSY', active: false },
  { label: '🔴 OFFLINE', value: 'OFFLINE', active: false },
  { label: '✈️ TRAVELLING', value: 'TRAVELLING', active: false },
];

export default function Dashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  
  // Initialize with default types to prevent 'any' errors
  const [profile, setProfile] = useState<ProfileSettings>({
    bio: '',
    is_looking_for_work: false,
    github_url: '',
    linkedin_url: '',
    cv_url: null,
    profile_image_url: null,
  });

  // --- LIFECYCLE ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch Profile Settings
      const { data: profileData, error: profileError } = await supabase
        .from('profile_settings')
        .select('*')
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // 2. Fetch Latest Status Log
      const { data: statusData } = await supabase
        .from('status_logs')
        .select('status_text')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (statusData) {
        setCurrentStatus(statusData.status_text);
      } else {
        setCurrentStatus('OFFLINE');
      }

    } catch (e: any) {
      console.error('Error fetching dashboard:', e);
      Alert.alert('Error', 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---

  // 1. Update Status (Real-time)
  async function updateStatus(newStatus: string) {
    if (newStatus === currentStatus) return;
    setSaving(true);
    
    try {
      // Determine if this status implies "looking for work"
      const isLooking = newStatus.includes('OPEN');
      
      // Update Profile "Open to Work" boolean
      await supabase
        .from('profile_settings')
        .update({ is_looking_for_work: isLooking })
        .eq('id', profile.id);
      
      // Insert new log entry
      const { error } = await supabase
        .from('status_logs')
        .insert([{ status_text: newStatus, is_active: true }]);

      if (error) throw error;

      setCurrentStatus(newStatus);
      setProfile(prev => ({ ...prev, is_looking_for_work: isLooking }));
      Alert.alert('Status Updated', `Global status set to: ${newStatus}`);

    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  // 2. Upload Profile Image
  async function pickImage() {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        uploadFile(result.assets[0].base64, 'image/jpeg', 'profile_image_url', 'portfolio-images');
      }
    } catch (e) {
      Alert.alert('Picker Error', 'Could not open image picker.');
    }
  }

  // 3. Upload CV (PDF)
  async function pickCV() {
    try {
      let result = await DocumentPicker.getDocumentAsync({ 
        type: 'application/pdf', 
        copyToCacheDirectory: true 
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
         const fileUri = result.assets[0].uri;
         
         // Fetch blob from URI (Cross-platform compatibility)
         const response = await fetch(fileUri);
         const blob = await response.blob();
         
         setSaving(true);
         const fileName = `cv_${Date.now()}.pdf`;
         
         const { error } = await supabase.storage
            .from('portfolio-docs')
            .upload(fileName, blob, { contentType: 'application/pdf' });
         
         if (!error) {
            const { data } = supabase.storage.from('portfolio-docs').getPublicUrl(fileName);
            
            // Update Database
            await supabase
                .from('profile_settings')
                .update({ cv_url: data.publicUrl })
                .eq('id', profile.id);
            
            // Update Local State (Typed Correctly now)
            setProfile(prev => ({ ...prev, cv_url: data.publicUrl }));
            
            Alert.alert('Success', 'CV Uploaded successfully.');
         } else {
            throw error;
         }
      }
    } catch (e: any) {
       Alert.alert('Upload Error', e.message || 'Failed to upload CV.');
    } finally {
       setSaving(false);
    }
  }

  // Helper for generic uploads
  async function uploadFile(base64: string, mime: string, column: keyof ProfileSettings, bucket: string) {
    setSaving(true);
    try {
        const fileName = `${Date.now()}.${mime.split('/')[1]}`;
        const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
        
        const { error } = await supabase.storage.from(bucket).upload(fileName, arrayBuffer, { contentType: mime });
        
        if (error) throw error;

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        
        await supabase
            .from('profile_settings')
            .update({ [column]: data.publicUrl })
            .eq('id', profile.id);
            
        setProfile(prev => ({ ...prev, [column]: data.publicUrl }));
        Alert.alert('Success', 'Asset updated successfully');

    } catch (error: any) {
        Alert.alert('Error', error.message);
    } finally {
        setSaving(false);
    }
  }

  // 4. Save Text Fields
  async function saveSettings() {
    setSaving(true);
    const { error } = await supabase.from('profile_settings').update({
        bio: profile.bio,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url
    }).eq('id', profile.id);
    
    setSaving(false);
    
    if (!error) {
        Alert.alert('Saved', 'Profile settings updated.');
    } else {
        Alert.alert('Error', error.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (loading) {
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary}/>
            <Text style={{color: COLORS.textDim, marginTop: 20}}>Loading Dashboard...</Text>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Admin Dashboard', headerShown: false }} />
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>DASHBOARD</Text>
            <Text style={styles.subtitle}>Welcome back, Alex.</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} color={COLORS.error} />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* --- STATUS SECTION --- */}
        <Text style={styles.sectionTitle}>
            <Activity size={14} color={COLORS.primary} style={{marginRight: 8}}/> LIVE STATUS
        </Text>
        <GlassCard style={styles.statusCard}>
            <View style={styles.statusGrid}>
                {STATUS_OPTIONS.map((option) => {
                    const isActive = currentStatus === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[styles.statusButton, isActive && styles.activeStatusButton]}
                            onPress={() => updateStatus(option.value)}
                            disabled={saving}
                        >
                            <Text style={[styles.statusLabel, isActive && styles.activeStatusLabel]}>
                                {option.label}
                            </Text>
                            {isActive && <CheckCircle size={16} color={COLORS.background} style={{ marginLeft: 6 }} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={styles.statusHint}>This updates the pulsing indicator on your homepage instantly.</Text>
        </GlassCard>

        <View style={styles.divider} />

        {/* --- ASSETS SECTION --- */}
        <Text style={styles.sectionTitle}>
            <User size={14} color={COLORS.secondary} style={{marginRight: 8}}/> IDENTITY & ASSETS
        </Text>
        
        <View style={[styles.row, { flexDirection: isDesktop ? 'row' : 'column' }]}>
            
            {/* PROFILE IMAGE */}
            <TouchableOpacity onPress={pickImage} style={[styles.uploadCard, isDesktop && { flex: 1 }]}>
                {profile.profile_image_url ? (
                    <Image source={{ uri: profile.profile_image_url }} style={styles.profileImg} />
                ) : (
                    <View style={styles.placeholderImg}>
                        <Camera color={COLORS.textDim} size={32} />
                    </View>
                )}
                <View style={styles.uploadMeta}>
                    <Text style={styles.uploadTitle}>Profile Picture</Text>
                    <Text style={styles.uploadSub}>Tap to change (1:1 Ratio)</Text>
                </View>
            </TouchableOpacity>

            {/* CV UPLOAD */}
            <TouchableOpacity onPress={pickCV} style={[styles.uploadCard, styles.cvCard, isDesktop && { flex: 1 }]}>
                <View style={styles.iconCircle}>
                    <FileText color={COLORS.primary} size={28} />
                </View>
                <View style={styles.uploadMeta}>
                    <Text style={styles.uploadTitle}>Curriculum Vitae</Text>
                    <Text style={styles.uploadSub}>
                        {profile.cv_url ? '✅ Active PDF Uploaded' : 'Tap to upload PDF'}
                    </Text>
                    {profile.cv_url && (
                        <Text style={styles.fileLink} numberOfLines={1}>{profile.cv_url.split('/').pop()}</Text>
                    )}
                </View>
                <View style={styles.uploadAction}>
                    <FileCheck size={20} color={COLORS.success} />
                </View>
            </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* --- LINKS SECTION --- */}
        <Text style={styles.sectionTitle}>
            <Globe size={14} color={COLORS.success} style={{marginRight: 8}}/> PUBLIC LINKS & BIO
        </Text>
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <GlassCard style={styles.formCard}>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>PROFESSIONAL BIO</Text>
                    <TextInput 
                        style={styles.input} 
                        value={profile.bio} 
                        onChangeText={t => setProfile({...profile, bio: t})}
                        placeholder="e.g. Full Stack Developer based in Sweden"
                        placeholderTextColor={COLORS.textDim} 
                    />
                </View>

                <View style={styles.rowInputs}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>GITHUB URL</Text>
                        <TextInput 
                            style={styles.input} 
                            value={profile.github_url} 
                            onChangeText={t => setProfile({...profile, github_url: t})} 
                            placeholder="https://github.com/..."
                            autoCapitalize="none"
                            placeholderTextColor={COLORS.textDim}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>LINKEDIN URL</Text>
                        <TextInput 
                            style={styles.input} 
                            value={profile.linkedin_url} 
                            onChangeText={t => setProfile({...profile, linkedin_url: t})} 
                            placeholder="https://linkedin.com/..."
                            autoCapitalize="none"
                            placeholderTextColor={COLORS.textDim}
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={saveSettings} 
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={COLORS.background} />
                    ) : (
                        <>
                            <Save size={18} color={COLORS.background} style={{ marginRight: 8 }} />
                            <Text style={styles.btnText}>SAVE CHANGES</Text>
                        </>
                    )}
                </TouchableOpacity>

            </GlassCard>
        </KeyboardAvoidingView>

        <View style={{height: 100}}/>
      </ScrollView>
    </View>
  );
}

// Polyfill for Base64 (Web)
if (typeof atob === 'undefined') {
    global.atob = function (b64Encoded) {
        return new Buffer(b64Encoded, 'base64').toString('binary');
    };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.l },
  content: { paddingBottom: 50 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.l },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: COLORS.textDim, fontSize: 14, marginTop: 4 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,50,50,0.3)' },
  logoutText: { color: COLORS.error, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  
  // Sections
  sectionTitle: { color: COLORS.textDim, fontSize: 12, fontWeight: 'bold', marginBottom: SPACING.m, letterSpacing: 1.5, marginTop: SPACING.l, flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.l, opacity: 0.5 },
  
  // Status Grid
  statusCard: { padding: SPACING.m },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { flexGrow: 1, minWidth: '45%', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  activeStatusButton: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusLabel: { color: COLORS.textDim, fontSize: 11, fontWeight: 'bold' },
  activeStatusLabel: { color: COLORS.background },
  statusHint: { color: COLORS.textDim, fontSize: 10, marginTop: 12, textAlign: 'center', fontStyle: 'italic' },

  // Upload Cards
  row: { gap: SPACING.m },
  uploadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: SPACING.m, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  cvCard: { borderStyle: 'dashed', borderColor: COLORS.textDim },
  
  profileImg: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.primary },
  placeholderImg: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
  
  uploadMeta: { flex: 1, marginLeft: SPACING.m },
  uploadTitle: { color: COLORS.text, fontWeight: 'bold', fontSize: 14 },
  uploadSub: { color: COLORS.textDim, fontSize: 12, marginTop: 2 },
  fileLink: { color: COLORS.primary, fontSize: 10, marginTop: 4, maxWidth: 200 },
  uploadAction: { marginLeft: SPACING.m },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(204, 255, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },

  // Form
  formCard: { padding: SPACING.l },
  inputGroup: { marginBottom: SPACING.m },
  rowInputs: { flexDirection: 'row', gap: SPACING.m },
  halfInput: { flex: 1, marginBottom: SPACING.m },
  
  label: { color: COLORS.textDim, fontSize: 10, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, padding: 14, borderRadius: 8, fontSize: 14 },
  
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: SPACING.s, flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: COLORS.background, fontWeight: 'bold', letterSpacing: 1, fontSize: 14 }
});