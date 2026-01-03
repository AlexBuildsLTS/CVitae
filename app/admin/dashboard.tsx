/* cspell:disable */
/**
 * @file app/admin/dashboard.tsx
 * @description Refined Master Administrative Control Unit.
 * VERSION: 10.0.0 (Enhanced Layout)
 * UPGRADES:
 * - Responsive Bento Analytics Grid (Mobile optimized).
 * - FIXED: Path compliance for all uploads (public/admin/).
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
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
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
  ShieldCheck,
  Download,
  Eye,
  FileCheck,
  Zap,
  Award,
  ArrowUpRight,
  User,
  Globe,
  TrendingUp,
} from 'lucide-react-native';

// System Primitives
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';

/**
 * --- DATA INTERFACES ---
 */
interface ProfileSettings {
  id: number;
  headline: string;
  bio: string;
  about_me: string | null;
  growth_summary: string | null;
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

const AVAILABILITY_MODES = [
  { label: 'Available', value: 'OPEN TO WORK', color: '#10b981' },
  { label: 'Busy', value: 'CURRENTLY BUSY', color: '#FACC15' },
  { label: 'Offline', value: 'OFFLINE', color: COLORS.error },
];

/**
 * --- UI SUB-COMPONENT: REAL-TIME PULSE ---
 */
const LivePulse = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);
  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
      <Text style={styles.liveText}>Live</Text>
    </View>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot>({
    views: 0,
    cvDownloads: 0,
    certDownloads: 0,
    totalMessages: 0,
  });

  const [imgRev, setImgRev] = useState(0);
  const isDesktop = width > 1024;
  const isMobile = width <= 768;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const syncData = useCallback(async () => {
    try {
      const [pRes, sRes, vCount, cvCount, certCount, msgCount] =
        await Promise.all([
          supabase.from('profile_settings').select('*').single(),
          supabase
            .from('status_logs')
            .select('status_text')
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
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
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true }),
        ]);

      if (pRes.data) setProfile(pRes.data);
      if (sRes.data) setCurrentStatus(sRes.data.status_text);

      setAnalytics({
        views: vCount.count || 0,
        cvDownloads: cvCount.count || 0,
        certDownloads: certCount.count || 0,
        totalMessages: msgCount.count || 0,
      });
    } catch (e) {
      console.error('[SYNC_ERROR]:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim]);

  useEffect(() => {
    syncData();
    const channel = supabase
      .channel('admin-live-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'analytics_events' },
        () => syncData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncData]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.replace('/');
    } catch (e: any) {
      Alert.alert('LOGOUT_FAILED', e.message);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profile_settings')
        .update(profile)
        .eq('id', profile.id);
      if (error) throw error;
      Alert.alert('SUCCESS', 'System Registry Synchronized.');
    } catch (e: any) {
      Alert.alert('COMMIT_ERROR', e.message);
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
      Alert.alert('STATUS_UPDATE_FAIL', e.message);
    } finally {
      setSaving(false);
    }
  };

  // RESTRICTED: Asset Upload Logic (Not touching Resume/Cert core functionality)
  const handleAssetUpload = async (type: 'avatar' | 'cv' | 'cert') => {
    if (!profile) return;
    setSaving(true);
    try {
      let result =
        type === 'avatar'
          ? await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
              base64: true,
            })
          : await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });

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

        // MAINTAINED: Path compliance (public/) to satisfy RLS policy
        const path = `public/admin/${field}_${Date.now()}.${
          type === 'avatar' ? 'jpg' : 'pdf'
        }`;

        let body;
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
        const { error: dbErr } = await supabase
          .from('profile_settings')
          .update({ [field]: publicUrl })
          .eq('id', profile.id);
        if (dbErr) throw dbErr;

        setProfile({ ...profile, [field]: publicUrl });
        setImgRev((prev) => prev + 1);
        Alert.alert('ASSET_SYNCED', 'New cloud asset is now active.');
      }
    } catch (e: any) {
      Alert.alert('UPLOAD_ERROR', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>SYNCHRONIZING_ADMIN_UNIT...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER UNIT */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ShieldCheck size={24} color={COLORS.primary} />
          <View>
            <Text style={styles.headerTitle}>System Admin</Text>
            <LivePulse />
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color={COLORS.error} />
          {!isMobile && <Text style={styles.logoutText}>TERMINATE</Text>}
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && { padding: 16 },
        ]}
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
        {/* ENHANCED ANALYTICS BENTO GRID */}
        <View
          style={[styles.bentoGrid, isMobile && { flexDirection: 'column' }]}
        >
          <View style={styles.bentoRow}>
            {[
              {
                label: 'Visits',
                val: analytics.views,
                icon: Eye,
                col: COLORS.primary,
              },
              {
                label: 'CV Pulls',
                val: analytics.cvDownloads,
                icon: Download,
                col: COLORS.secondary,
              },
            ].map((stat, i) => (
              <GlassCard key={i} style={styles.statBox}>
                <stat.icon size={20} color={stat.col} />
                <View>
                  <Text style={styles.statValue}>{stat.val}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
          <GlassCard style={[styles.statBox, isMobile && { minHeight: 80 }]}>
            <Award size={20} color="#FACC15" />
            <View>
              <Text style={styles.statValue}>{analytics.certDownloads}</Text>
              <Text style={styles.statLabel}>Credentials</Text>
            </View>
          </GlassCard>
        </View>

        {/* STATUS PROTOCOL */}
        <Text style={styles.sectionTitle}>Availability Protocol</Text>
        <View style={[styles.pillRow, isMobile && { flexWrap: 'wrap' }]}>
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

        {/* REGISTRY CONFIGURATION */}
        <Text style={styles.sectionTitle}>Registry Configuration</Text>
        <GlassCard style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Professional Headline</Text>
            <TextInput
              style={styles.textInput}
              value={profile?.headline}
              onChangeText={(t) =>
                setProfile((p) => (p ? { ...p, headline: t } : null))
              }
              placeholderTextColor="#444"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hero Subtitle</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              multiline
              value={profile?.bio}
              onChangeText={(t) =>
                setProfile((p) => (p ? { ...p, bio: t } : null))
              }
              placeholderTextColor="#444"
            />
          </View>

          <View style={styles.inputGroup}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <TrendingUp size={12} color={COLORS.primary} />
              <Text style={styles.label}>Growth Narrative</Text>
            </View>
            <TextInput
              style={[styles.textInput, { height: 100 }]}
              multiline
              value={profile?.growth_summary || ''}
              onChangeText={(t) =>
                setProfile((p) => (p ? { ...p, growth_summary: t } : null))
              }
              placeholderTextColor="#444"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Detailed Biography</Text>
            <TextInput
              style={[styles.textInput, { height: 140 }]}
              multiline
              numberOfLines={8}
              value={profile?.about_me || ''}
              onChangeText={(t) =>
                setProfile((p) => (p ? { ...p, about_me: t } : null))
              }
              placeholderTextColor="#444"
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator color="black" />
            ) : (
              <>
                <Save size={20} color="black" />
                <Text style={styles.saveBtnText}>Commit Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* REFINED ASSET NODES */}
        <Text style={styles.sectionTitle}>Technical Asset Nodes</Text>
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
                  key={`${profile.profile_image_url}-${imgRev}`}
                  source={{ uri: profile.profile_image_url }}
                  style={styles.avatarImg}
                  contentFit="cover"
                  transition={500}
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
            <Text style={styles.assetNodeLabel}>System Avatar</Text>
          </GlassCard>

          <View style={styles.docList}>
            {[
              {
                type: 'cv',
                label: 'Technical CV',
                icon: FileCheck,
                col: COLORS.primary,
                url: profile?.cv_url,
              },
              {
                type: 'cert',
                label: 'Certification Bundle',
                icon: Award,
                col: '#FACC15',
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
                  color={doc.url ? doc.col : COLORS.textDim}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{doc.label}</Text>
                  <Text style={styles.docStatus}>
                    {doc.url
                      ? 'Cloud Uplink Verified'
                      : 'Awaiting Synchronization'}
                  </Text>
                </View>
                <ArrowUpRight size={18} color={COLORS.textDim} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  liveText: {
    color: '#4ade80',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,50,50,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,50,50,0.1)',
  },
  logoutText: { color: COLORS.error, fontWeight: '900', fontSize: 10 },
  bentoGrid: { gap: 12, marginBottom: 32 },
  bentoRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 28,
    gap: 12,
    borderWidth: 1,
    borderColor: '#151515',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
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
    minWidth: 100,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillLabel: { color: COLORS.textDim, fontSize: 10, fontWeight: '700' },
  formCard: {
    padding: 24,
    borderRadius: 32,
    gap: 20,
    borderWidth: 1,
    borderColor: '#151515',
    marginBottom: 32,
  },
  inputGroup: { gap: 10 },
  label: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#080808',
    padding: 18,
    borderRadius: 18,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#151515',
  },
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
  assetSplit: { gap: 16 },
  avatarCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#151515',
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 70 },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
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
  assetNodeLabel: {
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 16,
    fontSize: 14,
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
  docTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  docStatus: { color: COLORS.textDim, fontSize: 10, marginTop: 2 },
});
