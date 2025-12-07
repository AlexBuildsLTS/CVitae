import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  TextInput, 
  Image, 
  ActivityIndicator, 
  Platform, 
  useWindowDimensions, 
  KeyboardAvoidingView,
  RefreshControl,
  LayoutAnimation,
  UIManager
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, Stack } from 'expo-router';
import { 
  LogOut, 
  Camera, 
  Save, 
  FileText, 
  CheckCircle, 
  Activity, 
  Globe, 
  User, 
  Award, 
  FileCheck, 
  AlertCircle,
  Eye,
  Download,
  Clock,
  Trash2,
  Settings,
  ShieldCheck
} from 'lucide-react-native';

// --- IMPORTS ---
// Robust relative paths to ensure stability
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- TYPES ---
// Comprehensive interface defining all editable profile fields
interface ProfileSettings {
  id?: number;
  bio: string;
  headline: string; // Ensuring headline is managed
  is_looking_for_work: boolean;
  github_url: string;
  linkedin_url: string;
  cv_url: string | null;
  certification_url: string | null;
  profile_image_url: string | null;
  email?: string;
  updated_at?: string;
}

// Log entry type for the Audit Log section
interface StatusLog {
  id: number;
  created_at: string;
  status_text: string;
}

// --- CONSTANTS ---
// Status options with color codes for visual distinction
const STATUS_OPTIONS = [
  { label: '🟢 OPEN TO WORK', value: 'OPEN TO WORK', color: COLORS.success },
  { label: '🟡 BUSY / CONTRACT', value: 'CURRENTLY BUSY', color: '#FFC107' },
  { label: '🔴 OFFLINE', value: 'OFFLINE', color: COLORS.error },
  { label: '✈️ TRAVELLING', value: 'TRAVELLING', color: '#2196F3' },
];

// --- MAIN COMPONENT ---
export default function Dashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [recentLogs, setRecentLogs] = useState<StatusLog[]>([]);
  
  // Profile State with safe defaults to prevent null crashes
  const [profile, setProfile] = useState<ProfileSettings>({
    bio: '',
    headline: '',
    is_looking_for_work: false,
    github_url: '',
    linkedin_url: '',
    cv_url: null,
    certification_url: null,
    profile_image_url: null,
  });

  // --- LIFECYCLE ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Profile Settings
      const { data: profileData, error: profileError } = await supabase
        .from('profile_settings')
        .select('*')
        .single();

      if (profileData) {
        setProfile(profileData);
      } else if (profileError && profileError.code !== 'PGRST116') {
         console.error('Profile fetch error:', profileError.message);
      }

      // 2. Fetch Latest Status
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

      // 3. Fetch Recent Audit Logs (History)
      const { data: logsData } = await supabase
        .from('status_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (logsData) setRecentLogs(logsData);

    } catch (e: any) {
      console.error('Error fetching dashboard:', e);
      Alert.alert('Connection Error', 'Could not load dashboard data. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- ACTIONS ---

  // 1. Update Global Status
  async function updateStatus(newStatus: string) {
    if (newStatus === currentStatus) return;
    setSaving(true);
    
    try {
      // Determine if this status implies "looking for work" for the public badge
      const isLooking = newStatus.includes('OPEN');
      
      // Update Profile "Open to Work" boolean
      const { error: profileUpdateError } = await supabase
        .from('profile_settings')
        .update({ is_looking_for_work: isLooking })
        .eq('id', profile.id);

      if (profileUpdateError) throw profileUpdateError;
      
      // Log the status change
      const { error: logError } = await supabase
        .from('status_logs')
        .insert([{ status_text: newStatus, is_active: true }]);

      if (logError) throw logError;

      // Update Local State Optimistically
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStatus(newStatus);
      setProfile(prev => ({ ...prev, is_looking_for_work: isLooking }));
      
      // Refresh logs to show the new entry
      const { data: updatedLogs } = await supabase
        .from('status_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (updatedLogs) setRecentLogs(updatedLogs);

      if (Platform.OS !== 'web') {
        Alert.alert('Status Updated', `Global status set to: ${newStatus}`);
      }

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
        base64: true, // Required for Supabase upload compatibility
      });

      if (!result.canceled && result.assets[0].base64) {
        // We use the base64 helper method for image upload
        uploadFile(result.assets[0].base64, 'image/jpeg', 'profile_image_url', 'portfolio-images');
      }
    } catch (e) {
      Alert.alert('Picker Error', 'Could not open image picker.');
    }
  }

  // 3. Upload Document (CV or Certification)
  async function pickDocument(type: 'cv' | 'cert') {
    try {
      let result = await DocumentPicker.getDocumentAsync({ 
        type: 'application/pdf', 
        copyToCacheDirectory: true 
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
         const fileUri = result.assets[0].uri;
         const { data: { user } } = await supabase.auth.getUser();
         
         // Security check
         if (!user) {
             Alert.alert("Authentication Error", "You must be logged in to upload files.");
             return;
         }

         setSaving(true);
         
         // Create user-scoped path: userId/cv_timestamp.pdf
         const column = type === 'cv' ? 'cv_url' : 'certification_url';
         const fileName = `${user.id}/${column}_${Date.now()}.pdf`;
         
         // Fetch blob from URI (Robust Cross-platform compatibility)
         const response = await fetch(fileUri);
         const blob = await response.blob();
         
         const { error } = await supabase.storage
            .from('portfolio-docs')
            .upload(fileName, blob, { 
                contentType: 'application/pdf',
                upsert: true
            });
         
         if (!error) {
            const { data } = supabase.storage.from('portfolio-docs').getPublicUrl(fileName);
            
            // Update Database Record with new public URL
            const updatePayload: any = {};
            updatePayload[column] = data.publicUrl;

            await supabase
                .from('profile_settings')
                .update(updatePayload)
                .eq('id', profile.id);
            
            // Update Local State
            setProfile(prev => ({ ...prev, [column]: data.publicUrl }));
            
            Alert.alert('Success', `${type === 'cv' ? 'Resume' : 'Certification'} uploaded successfully.`);
         } else {
            throw error;
         }
      }
    } catch (e: any) {
       console.error(e);
       Alert.alert('Upload Error', e.message || 'Failed to upload file.');
    } finally {
       setSaving(false);
    }
  }

  // 4. Delete Asset (Clear CV or Cert)
  async function deleteAsset(type: 'cv' | 'cert') {
    Alert.alert(
      "Remove Document?",
      "Are you sure you want to remove this file from your public profile?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
             setSaving(true);
             const column = type === 'cv' ? 'cv_url' : 'certification_url';
             
             // Update DB to null
             await supabase
                .from('profile_settings')
                .update({ [column]: null })
                .eq('id', profile.id);
             
             setProfile(prev => ({ ...prev, [column]: null }));
             setSaving(false);
          }
        }
      ]
    );
  }

  // 5. Generic Image Upload Helper
  async function uploadFile(base64: string, mime: string, column: keyof ProfileSettings, bucket: string) {
    setSaving(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user found.");

        const fileExt = mime.split('/')[1];
        const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;
        
        // Convert base64 to binary array buffer
        const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
        
        const { error } = await supabase.storage.from(bucket).upload(fileName, arrayBuffer, { 
            contentType: mime,
            upsert: true
        });
        
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

  // 6. Save Text Settings (Bio, Links, Headline)
  async function saveSettings() {
    // Check if headline exists to prevent empty hero titles
    if (!profile.headline.trim()) {
        Alert.alert("Validation Error", "Headline cannot be empty.");
        return;
    }
    
    setSaving(true);
    
    const { error } = await supabase.from('profile_settings').update({
        headline: profile.headline,
        bio: profile.bio,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url
    }).eq('id', profile.id);
    
    setSaving(false);
    
    if (!error) {
        Alert.alert('Saved', 'Profile settings updated successfully.');
    } else {
        Alert.alert('Error', error.message);
    }
  }

  // 7. Logout Handler
  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to exit the admin panel?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/');
        }}
    ]);
  }

  // --- LOADING VIEW ---
  if (loading) {
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary}/>
            <Text style={{color: COLORS.textDim, marginTop: 20}}>Loading Dashboard...</Text>
        </View>
    );
  }

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Admin Dashboard', headerShown: false }} />
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <ShieldCheck size={20} color={COLORS.primary} />
                <Text style={styles.title}>DASHBOARD</Text>
            </View>
            <Text style={styles.subtitle}>Welcome back, Admin.</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} color={COLORS.error} />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        
        {/* --- ANALYTICS PREVIEW --- */}
        <View style={styles.analyticsRow}>
            <GlassCard style={styles.analyticCard}>
                <Eye size={20} color={COLORS.secondary} />
                <Text style={styles.analyticValue}>1.2k</Text>
                <Text style={styles.analyticLabel}>VIEWS</Text>
            </GlassCard>
            <GlassCard style={styles.analyticCard}>
                <Download size={20} color={COLORS.success} />
                <Text style={styles.analyticValue}>{profile.cv_url ? '45' : '0'}</Text>
                <Text style={styles.analyticLabel}>RESUME DLs</Text>
            </GlassCard>
            <GlassCard style={styles.analyticCard}>
                <Activity size={20} color={COLORS.primary} />
                <Text style={styles.analyticValue}>98%</Text>
                <Text style={styles.analyticLabel}>UPTIME</Text>
            </GlassCard>
        </View>

        {/* --- STATUS SECTION --- */}
        <Text style={styles.sectionTitle}>
            <Activity size={14} color={COLORS.primary} style={{marginRight: 8}}/> LIVE STATUS CONTROL
        </Text>
        <GlassCard style={styles.statusCard}>
            <View style={styles.statusGrid}>
                {STATUS_OPTIONS.map((option) => {
                    const isActive = currentStatus === option.value;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.statusButton, 
                                isActive && styles.activeStatusButton,
                                isActive && { borderColor: option.color, backgroundColor: `${option.color}20` }
                            ]}
                            onPress={() => updateStatus(option.value)}
                            disabled={saving}
                        >
                            <Text style={[styles.statusLabel, isActive && { color: option.color }]}>
                                {option.label}
                            </Text>
                            {isActive && <CheckCircle size={16} color={option.color} style={{ marginLeft: 6 }} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={styles.statusHint}>
                Updates the public availability indicator instantly.
            </Text>
        </GlassCard>

        <View style={styles.divider} />

        {/* --- ASSETS SECTION --- */}
        <Text style={styles.sectionTitle}>
            <User size={14} color={COLORS.secondary} style={{marginRight: 8}}/> IDENTITY & ASSETS
        </Text>
        
        <View style={[styles.row, { flexDirection: isDesktop ? 'row' : 'column' }]}>
            
            {/* PROFILE IMAGE CARD */}
            <TouchableOpacity 
                onPress={pickImage} 
                style={[styles.uploadCard, isDesktop && { flex: 1 }]}
                activeOpacity={0.7}
            >
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

            {/* CV CARD */}
            <View style={[styles.uploadCardWrapper, isDesktop && { flex: 1 }]}>
                <TouchableOpacity 
                    onPress={() => pickDocument('cv')} 
                    style={[styles.uploadCard, styles.dashedCard, { flex: 1 }]}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconCircle}>
                        <FileText color={COLORS.primary} size={24} />
                    </View>
                    <View style={styles.uploadMeta}>
                        <Text style={styles.uploadTitle}>Curriculum Vitae</Text>
                        <Text style={styles.uploadSub}>
                            {profile.cv_url ? '✅ Active PDF Uploaded' : 'Upload PDF'}
                        </Text>
                        {profile.cv_url && (
                            <Text style={styles.fileLink} numberOfLines={1}>
                                {profile.cv_url.split('/').pop()}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
                {/* Delete Button for CV */}
                {profile.cv_url && (
                    <TouchableOpacity style={styles.deleteAssetBtn} onPress={() => deleteAsset('cv')}>
                        <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                )}
            </View>

            {/* CERTIFICATION CARD - NEW FEATURE */}
            <View style={[styles.uploadCardWrapper, isDesktop && { flex: 1 }]}>
                <TouchableOpacity 
                    onPress={() => pickDocument('cert')} 
                    style={[styles.uploadCard, styles.dashedCard, { flex: 1 }]}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconCircle, {backgroundColor: 'rgba(255,215,0,0.1)'}]}>
                        <Award color="#FFD700" size={24} />
                    </View>
                    <View style={styles.uploadMeta}>
                        <Text style={styles.uploadTitle}>Certification</Text>
                        <Text style={styles.uploadSub}>
                            {profile.certification_url ? '✅ Proof Active' : 'Upload Proof'}
                        </Text>
                    </View>
                </TouchableOpacity>
                 {/* Delete Button for Cert */}
                 {profile.certification_url && (
                    <TouchableOpacity style={styles.deleteAssetBtn} onPress={() => deleteAsset('cert')}>
                        <Trash2 size={16} color={COLORS.error} />
                    </TouchableOpacity>
                )}
            </View>
        </View>

        <View style={styles.divider} />

        {/* --- LINKS & BIO SECTION --- */}
        <Text style={styles.sectionTitle}>
            <Globe size={14} color={COLORS.success} style={{marginRight: 8}}/> PUBLIC PROFILE SETTINGS
        </Text>
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <GlassCard style={styles.formCard}>
                
                {/* HEADLINE INPUT (New Feature) */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>HEADLINE (e.g. Java Fullstack Developer)</Text>
                    <TextInput 
                        style={styles.input} 
                        value={profile.headline || ''} // FIX: Ensures no null crash
                        onChangeText={t => setProfile({...profile, headline: t})}
                        placeholderTextColor={COLORS.textDim} 
                    />
                </View>

                {/* BIO INPUT */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>PROFESSIONAL BIO</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea]} 
                        value={profile.bio || ''} 
                        onChangeText={t => setProfile({...profile, bio: t})}
                        placeholder="Summarize your experience and goals..."
                        placeholderTextColor={COLORS.textDim} 
                        multiline
                    />
                </View>

                {/* SOCIAL LINKS ROW */}
                <View style={styles.rowInputs}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>GITHUB URL</Text>
                        <TextInput 
                            style={styles.input} 
                            value={profile.github_url || ''} 
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
                            value={profile.linkedin_url || ''} 
                            onChangeText={t => setProfile({...profile, linkedin_url: t})} 
                            placeholder="https://linkedin.com/..."
                            autoCapitalize="none"
                            placeholderTextColor={COLORS.textDim}
                        />
                    </View>
                </View>

                {/* SAVE ACTION */}
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
                            <Text style={styles.btnText}>SAVE ALL CHANGES</Text>
                        </>
                    )}
                </TouchableOpacity>

            </GlassCard>
        </KeyboardAvoidingView>

        {/* --- AUDIT LOG (History) --- */}
        {recentLogs.length > 0 && (
            <View style={styles.auditSection}>
                <Text style={styles.sectionTitle}><Clock size={14} color={COLORS.textDim}/> RECENT ACTIVITY</Text>
                {recentLogs.map((log) => (
                    <View key={log.id} style={styles.logItem}>
                        <Text style={styles.logText}>Updated status to: {log.status_text}</Text>
                        <Text style={styles.logDate}>{new Date(log.created_at).toLocaleDateString()}</Text>
                    </View>
                ))}
            </View>
        )}

        <View style={{height: 100}}/>
      </ScrollView>
    </View>
  );
}

// Polyfill for Base64 (Web Compatibility)
if (typeof atob === 'undefined') { 
    global.atob = function (b64Encoded) { 
        return new Buffer(b64Encoded, 'base64').toString('binary'); 
    }; 
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      backgroundColor: COLORS.background, 
      padding: SPACING.l 
  },
  content: { 
      paddingBottom: 50 
  },
  center: { 
      flex: 1, 
      backgroundColor: COLORS.background, 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  
  // Header
  header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      marginBottom: SPACING.l 
  },
  title: { 
      color: COLORS.text, 
      fontSize: 24, 
      fontWeight: '900', 
      letterSpacing: 1 
  },
  subtitle: { 
      color: COLORS.textDim, 
      fontSize: 12, 
      marginTop: 4 
  },
  logoutBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 6, 
      backgroundColor: 'rgba(255,50,50,0.1)', 
      paddingVertical: 8, 
      paddingHorizontal: 12, 
      borderRadius: 8, 
      borderWidth: 1, 
      borderColor: 'rgba(255,50,50,0.3)' 
  },
  logoutText: { 
      color: COLORS.error, 
      fontSize: 10, 
      fontWeight: 'bold', 
      letterSpacing: 1 
  },

  // Analytics
  analyticsRow: {
      flexDirection: 'row',
      gap: SPACING.m,
      marginBottom: SPACING.l
  },
  analyticCard: {
      flex: 1,
      padding: SPACING.m,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.03)'
  },
  analyticValue: {
      color: COLORS.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 4
  },
  analyticLabel: {
      color: COLORS.textDim,
      fontSize: 10,
      fontWeight: 'bold',
      marginTop: 2
  },
  
  // Sections
  sectionTitle: { 
      color: COLORS.textDim, 
      fontSize: 11, 
      fontWeight: 'bold', 
      marginBottom: SPACING.m, 
      letterSpacing: 1, 
      marginTop: SPACING.l, 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8 
  },
  divider: { 
      height: 1, 
      backgroundColor: COLORS.border, 
      marginVertical: SPACING.l, 
      opacity: 0.5 
  },
  
  // Status Grid
  statusCard: { 
      padding: SPACING.m 
  },
  statusGrid: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: 8 
  },
  statusButton: { 
      flexGrow: 1, 
      minWidth: '45%', 
      paddingVertical: 12, 
      paddingHorizontal: 16, 
      backgroundColor: 'rgba(255,255,255,0.03)', 
      borderRadius: 12, 
      borderWidth: 1, 
      borderColor: COLORS.border, 
      alignItems: 'center', 
      justifyContent: 'center', 
      flexDirection: 'row' 
  },
  activeStatusButton: { 
      backgroundColor: 'rgba(255,255,255,0.1)', 
      borderColor: COLORS.primary 
  },
  statusLabel: { 
      color: COLORS.textDim, 
      fontSize: 10, 
      fontWeight: 'bold' 
  },
  activeStatusLabel: { 
      color: COLORS.text 
  },
  statusHint: { 
      color: COLORS.textDim, 
      fontSize: 10, 
      marginTop: 12, 
      textAlign: 'center', 
      fontStyle: 'italic' 
  },

  // Upload Cards
  row: { 
      gap: SPACING.m 
  },
  uploadCardWrapper: {
      flex: 1,
      position: 'relative'
  },
  uploadCard: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: 'rgba(255,255,255,0.03)', 
      padding: SPACING.m, 
      borderRadius: 12, 
      borderWidth: 1, 
      borderColor: COLORS.border, 
      marginBottom: 8,
      height: 80
  },
  dashedCard: { 
      borderStyle: 'dashed', 
      borderColor: COLORS.textDim 
  },
  profileImg: { 
      width: 50, 
      height: 50, 
      borderRadius: 25, 
      borderWidth: 2, 
      borderColor: COLORS.primary 
  },
  placeholderImg: { 
      width: 50, 
      height: 50, 
      borderRadius: 25, 
      backgroundColor: COLORS.surfaceHighlight, 
      alignItems: 'center', 
      justifyContent: 'center' 
  },
  uploadMeta: { 
      flex: 1, 
      marginLeft: SPACING.m 
  },
  uploadTitle: { 
      color: COLORS.text, 
      fontWeight: 'bold', 
      fontSize: 12 
  },
  uploadSub: { 
      color: COLORS.textDim, 
      fontSize: 10, 
      marginTop: 2 
  },
  fileLink: { 
      color: COLORS.primary, 
      fontSize: 10, 
      marginTop: 4, 
      maxWidth: 150 
  },
  deleteAssetBtn: {
      position: 'absolute',
      right: 10,
      top: 25,
      padding: 5,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20
  },
  iconCircle: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: 'rgba(204, 255, 0, 0.1)', 
      alignItems: 'center', 
      justifyContent: 'center' 
  },

  // Form
  formCard: { 
      padding: SPACING.l 
  },
  inputGroup: { 
      marginBottom: SPACING.m 
  },
  rowInputs: { 
      flexDirection: 'row', 
      gap: SPACING.m 
  },
  halfInput: { 
      flex: 1, 
      marginBottom: SPACING.m 
  },
  label: { 
      color: COLORS.textDim, 
      fontSize: 10, 
      fontWeight: 'bold', 
      marginBottom: 6, 
      textTransform: 'uppercase' 
  },
  input: { 
      backgroundColor: 'rgba(0,0,0,0.3)', 
      borderWidth: 1, 
      borderColor: COLORS.border, 
      color: COLORS.text, 
      padding: 12, 
      borderRadius: 8, 
      fontSize: 14 
  },
  textArea: {
      height: 100,
      textAlignVertical: 'top'
  },
  saveBtn: { 
      backgroundColor: COLORS.primary, 
      padding: 14, 
      borderRadius: 10, 
      alignItems: 'center', 
      marginTop: 10, 
      flexDirection: 'row', 
      justifyContent: 'center' 
  },
  btnText: { 
      color: COLORS.background, 
      fontWeight: 'bold', 
      fontSize: 12, 
      letterSpacing: 1 
  },

  // Audit Logs
  auditSection: {
      marginTop: SPACING.xl,
      opacity: 0.7
  },
  logItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  logText: {
      color: COLORS.text,
      fontSize: 11
  },
  logDate: {
      color: COLORS.textDim,
      fontSize: 10
  }
});