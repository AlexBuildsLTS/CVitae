/* cspell:disable */
/**
 * @file app/admin/dashboard.tsx
 * @description Senior Administrative Suite.
 * @version 6.1.0
 * * FIX LOG:
 * - Added 'about_me' field to handle detailed biography separately from Hero tagline.
 * - Optimized state sync with useDashboard hook.
 * - Premium Sleek professional design preserved.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  UIManager,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, Stack } from 'expo-router';

/**
 * --- ICONOGRAPHY ---
 */
import {
  LogOut,
  Camera,
  Save,
  Activity,
  User,
  Award,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Download,
  Eye,
  TrendingUp,
  FileCheck,
} from 'lucide-react-native';

// System Primitives
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';

// Platform Animation Guard
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * --- DATA INTERFACES ---
 */
interface ProfileSettings {
  id: number;
  bio: string;
  about_me: string | null; // NEW FIELD
  headline: string;
  is_looking_for_work: boolean;
  github_url: string;
  linkedin_url: string;
  cv_url: string | null;
  certification_url: string | null;
  profile_image_url: string | null;
  updated_at: string;
}

interface AnalyticsSnapshot {
  views: number;
  cvDownloads: number;
  certDownloads: number;
  totalMessages: number;
}

interface StatusLog {
  id: number;
  created_at: string;
  status_text: string;
}

const AVAILABILITY_MODES = [
  { label: 'Available', value: 'OPEN TO WORK', color: COLORS.primary },
  { label: 'Busy', value: 'CURRENTLY BUSY', color: '#FACC15' },
  { label: 'Offline', value: 'OFFLINE', color: COLORS.error },
];

/**
 * --- CUSTOM HOOKS ---
 */
const useDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [recentLogs, setRecentLogs] = useState<StatusLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot>({
    views: 0,
    cvDownloads: 0,
    certDownloads: 0,
    totalMessages: 0,
  });

  const syncData = useCallback(async () => {
    try {
      const [
        profileRes,
        statusRes,
        logsRes,
        viewsCount,
        cvCount,
        certCount,
        msgCount,
      ] = await Promise.all([
        supabase.from('profile_settings').select('*').single(),
        supabase
          .from('status_logs')
          .select('status_text')
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('status_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view'),
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'cv_download'),
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'cert_download'),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (statusRes.data) setCurrentStatus(statusRes.data.status_text);
      if (logsRes.data) setRecentLogs(logsRes.data);

      setAnalytics({
        views: viewsCount.count || 0,
        cvDownloads: cvCount.count || 0,
        certDownloads: certCount.count || 0,
        totalMessages: msgCount.count || 0,
      });
    } catch (e) {
      console.error('[DASHBOARD_SYNC_FAIL]:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleLogout = async () => {
    Alert.alert('SYSTEM_EXIT', 'Confirm administrative sign-out?', [
      { text: 'CANCEL', style: 'cancel' },
      {
        text: 'SIGN_OUT',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const updateProfile = async (updates: Partial<ProfileSettings>) => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profile_settings')
        .update(updates)
        .eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, ...updates });
      Alert.alert('Success', 'Profile identity synchronized.');
      return { success: true };
    } catch (e: any) {
      Alert.alert('Update Error', e.message);
      return { success: false };
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!profile || newStatus === currentStatus) return;
    setSaving(true);
    try {
      await supabase
        .from('profile_settings')
        .update({ is_looking_for_work: newStatus.includes('OPEN') })
        .eq('id', profile.id);
      await supabase
        .from('status_logs')
        .insert([{ status_text: newStatus, is_active: true }]);
      setCurrentStatus(newStatus);
      syncData();
    } catch (e: any) {
      Alert.alert('Status Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    syncData();
  }, [syncData]);

  return {
    loading,
    refreshing,
    saving,
    setSaving,
    profile,
    setProfile,
    currentStatus,
    recentLogs,
    analytics,
    syncData,
    handleLogout,
    updateProfile,
    updateStatus,
  };
};

const StatCard = React.memo(
  ({ icon: Icon, value, label, color, trend }: any) => (
    <GlassCard style={styles.statBox}>
      <Icon size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend && (
        <View style={styles.trendLine}>
          <TrendingUp size={10} color={COLORS.primary} />
          <Text style={styles.trendValue}>{trend}</Text>
        </View>
      )}
    </GlassCard>
  )
);

/**
 * --- MAIN COMPONENT ---
 */
export default function AdminDashboard() {
  const { width } = useWindowDimensions();
  const {
    loading,
    refreshing,
    saving,
    setSaving,
    profile,
    setProfile,
    currentStatus,
    recentLogs,
    analytics,
    syncData,
    handleLogout,
    updateProfile,
    updateStatus,
  } = useDashboard();
  const isDesktop = width > 1024;
  const isMobile = width <= 768;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
  }, [loading]);

  const handleAssetUpload = async (type: 'avatar' | 'cv' | 'cert') => {
    if (!profile) return;
    setSaving(true);
    try {
      let result;
      if (type === 'avatar') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const bucket =
          type === 'avatar' ? 'portfolio-images' : 'portfolio-docs';
        const field =
          type === 'avatar'
            ? 'profile_image_url'
            : type === 'cv'
            ? 'cv_url'
            : 'certification_url';
        const ext = type === 'avatar' ? 'jpg' : 'pdf';
        const path = `admin/${field}_${Date.now()}.${ext}`;

        let body: any;
        if (type === 'avatar' && asset.base64) {
          const raw = atob(asset.base64);
          const uint8 = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);
          body = uint8;
        } else {
          const res = await fetch(asset.uri);
          body = await res.blob();
        }

        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, body, {
            upsert: true,
            contentType: type === 'avatar' ? 'image/jpeg' : 'application/pdf',
          });
        if (upErr) throw upErr;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);
        updateProfile({ [field]: publicUrl });
      }
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>SYNCHRONIZING_CORE...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.badgeWrapper}>
            <ShieldCheck size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>System Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Administrative Control Unit
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color={COLORS.error} />
          {!isMobile && (
            <Text style={styles.logoutText}>TERMINATE_SESSION</Text>
          )}
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={syncData}
            tintColor={COLORS.primary}
          />
        }
        style={{ opacity: fadeAnim }}
      >
        <View style={styles.bentoGrid}>
          <StatCard
            icon={Eye}
            value={analytics.views}
            label="Registry Views"
            color={COLORS.primary}
            trend="LIVE"
          />
          <StatCard
            icon={Download}
            value={analytics.cvDownloads}
            label="CV Pulls"
            color={COLORS.secondary}
          />
          <StatCard
            icon={Award}
            value={analytics.certDownloads}
            label="Credentials"
            color="#FACC15"
          />
        </View>

        <Text style={styles.sectionTitle}>Availability Protocol</Text>
        <GlassCard style={styles.protocolCard}>
          <View style={styles.pillRow}>
            {AVAILABILITY_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                onPress={() => updateStatus(mode.value)}
                style={[
                  styles.statusPill,
                  currentStatus === mode.value && {
                    borderColor: mode.color,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: mode.color }]} />
                <Text
                  style={[
                    styles.pillLabel,
                    currentStatus === mode.value && { color: 'white' },
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>Identity Assets</Text>
        <View
          style={[
            styles.assetSplit,
            { flexDirection: isDesktop ? 'row' : 'column' },
          ]}
        >
          <GlassCard style={[styles.avatarCard, isDesktop && { width: 340 }]}>
            <TouchableOpacity
              onPress={() => handleAssetUpload('avatar')}
              style={styles.avatarWrapper}
            >
              {profile?.profile_image_url ? (
                <Image
                  source={{ uri: profile.profile_image_url }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User color={COLORS.textDim} size={40} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Camera size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.assetName}>System Avatar</Text>
          </GlassCard>
          <View style={styles.docList}>
            {[
              {
                type: 'cv',
                label: 'Technical CV',
                icon: FileCheck,
                color: COLORS.primary,
                url: profile?.cv_url,
              },
              {
                type: 'cert',
                label: 'Credentials',
                icon: Award,
                color: '#FACC15',
                url: profile?.certification_url,
              },
            ].map((doc: any) => (
              <TouchableOpacity
                key={doc.type}
                onPress={() => handleAssetUpload(doc.type)}
                style={styles.docItem}
              >
                <doc.icon
                  size={24}
                  color={doc.url ? doc.color : COLORS.textDim}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{doc.label}</Text>
                  <Text style={styles.docStatus}>
                    {doc.url
                      ? 'Asset live in cloud'
                      : 'Pending synchronization'}
                  </Text>
                </View>
                <ArrowUpRight size={18} color={COLORS.textDim} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Profile Configuration</Text>
        <GlassCard style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Professional Headline</Text>
            <TextInput
              style={styles.textInput}
              value={profile?.headline}
              onChangeText={(t) =>
                profile && setProfile({ ...profile, headline: t })
              }
              placeholderTextColor="#444"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hero Tagline (Short Summary)</Text>
            <TextInput
              style={styles.textInput}
              value={profile?.bio}
              onChangeText={(t) =>
                profile && setProfile({ ...profile, bio: t })
              }
              placeholderTextColor="#444"
            />
          </View>

          {/* NEW BIOGRAPHY BOX */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Professional Biography (About Me Section)
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={profile?.about_me || ''}
              onChangeText={(t) =>
                profile && setProfile({ ...profile, about_me: t })
              }
              multiline
              numberOfLines={6}
              placeholderTextColor="#444"
            />
          </View>

          <View
            style={[
              styles.row,
              { flexDirection: isDesktop ? 'row' : 'column' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>GitHub</Text>
              <TextInput
                style={styles.textInput}
                value={profile?.github_url}
                onChangeText={(t) =>
                  profile && setProfile({ ...profile, github_url: t })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>LinkedIn</Text>
              <TextInput
                style={styles.textInput}
                value={profile?.linkedin_url}
                onChangeText={(t) =>
                  profile && setProfile({ ...profile, linkedin_url: t })
                }
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => profile && updateProfile(profile)}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color="black" />
            ) : (
              <>
                <Save size={20} color="black" />
                <Text style={styles.saveBtnText}>COMMIT_IDENTITY_SYNC</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textDim,
    marginTop: 20,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '900',
  },
  scrollContent: { padding: SPACING.l },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  badgeWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(204,255,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.1)',
  },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  headerSubtitle: { color: COLORS.textDim, fontSize: 11, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,50,50,0.1)',
    backgroundColor: 'rgba(255,50,50,0.02)',
  },
  logoutText: { color: COLORS.error, fontWeight: '900', fontSize: 11 },
  bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  statBox: {
    flex: 1,
    padding: 24,
    borderRadius: 28,
    gap: 8,
    borderWidth: 1,
    borderColor: '#151515',
  },
  statValue: { color: COLORS.text, fontSize: 28, fontWeight: '900' },
  statLabel: { color: COLORS.textDim, fontSize: 10, fontWeight: '800' },
  trendLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendValue: { color: COLORS.primary, fontSize: 9, fontWeight: '900' },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  protocolCard: {
    padding: 12,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#151515',
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#151515',
    gap: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillLabel: { color: COLORS.textDim, fontSize: 11, fontWeight: '700' },
  assetSplit: { gap: 16, marginBottom: 32 },
  avatarCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#151515',
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 55 },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  assetName: {
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 16,
    fontSize: 15,
  },
  docList: { flex: 1, gap: 12 },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080808',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#151515',
    gap: 18,
  },
  docTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  docStatus: { color: COLORS.textDim, fontSize: 11, marginTop: 2 },
  formCard: {
    padding: 32,
    borderRadius: 32,
    gap: 24,
    borderWidth: 1,
    borderColor: '#151515',
  },
  inputGroup: { gap: 10 },
  label: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  textInput: {
    backgroundColor: '#080808',
    padding: 18,
    borderRadius: 18,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#151515',
  },
  textArea: { height: 140, textAlignVertical: 'top' },
  row: { gap: 16 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  saveBtnText: { color: 'black', fontWeight: '900', fontSize: 14 },
});
