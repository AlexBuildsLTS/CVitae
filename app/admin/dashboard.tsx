/* cspell:disable */
/**
 * @file app/admin/dashboard.tsx
 * @description Refined Master Administrative Control Unit.
 * VERSION: 11.0.0 (Senior UI Refinement)
 * UPGRADES:
 * - Optimized Bento Grid (Mobile-First responsive).
 * - High-density Registry Form layout.
 * - Enhanced Availability Protocol visuals.
 * - STRICT preservation of resume/cert logic.
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
      <Text style={styles.liveText}>REALTIME ACTIVE</Text>
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

  /**
   * --- ASSET UPLOAD PIPELINE ---
   * STRICTLY PROTECTING working resume/cert logic while maintaining path safety.
   */
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

        // FIXED PATH: Prepended 'public/' to comply with RLS policy folder security
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
        {/* ENHANCED BENTO ANALYTICS */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoTopRow}>
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
          <GlassCard style={styles.fullWidthStat}>
            <View style={styles.fullWidthStatLeft}>
              <Award size={24} color="#FACC15" />
              <Text style={styles.fullWidthLabel}>Technical Credentials</Text>
            </View>
            <Text style={styles.fullWidthValue}>{analytics.certDownloads}</Text>
          </GlassCard>
        </View>

        {/* STATUS PROTOCOL */}
        <Text style={styles.sectionTitle}>Availability Protocol</Text>
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

        {/* REGISTRY CONFIGURATION */}
        <Text style={styles.sectionTitle}>Registry Configuration</Text>
        <GlassCard style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Headline</Text>
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
            <Text style={styles.label}>Hero Tagline</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 70 }]}
              multiline
              value={profile?.bio}
              onChangeText={(t) =>
                setProfile((p) => (p ? { ...p, bio: t } : null))
              }
              placeholderTextColor="#444"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <TrendingUp size={12} color={COLORS.primary} />
              <Text style={styles.label}>Velocity Summary</Text>
            </View>
            <TextInput
              style={[styles.textInput, { minHeight: 120 }]}
              multiline
              value={profile?.growth_summary || ''}
              onChangeText={(t) =>
                setProfile((p) => (p ? { ...p, growth_summary: t } : null))
              }
              placeholderTextColor="#444"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Technical Bio</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 180 }]}
              multiline
              numberOfLines={10}
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
                <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* REFINED ASSET NODES */}
        <Text style={styles.sectionTitle}></Text>
        <View
          style={[
            styles.assetSplit,
            { flexDirection: isDesktop ? 'row' : 'column' },
          ]}
        >
          <GlassCard
            style={StyleSheet.flatten([
              styles.avatarCard,
              isDesktop && { width: 340 },
            ])}
          >
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
            <Text style={styles.assetNodeLabel}>Avatar</Text>
          </GlassCard>

          <View style={styles.docList}>
            {[
              {
                type: 'cv',
                label: 'RESUME (CV)',
                icon: FileCheck,
                col: COLORS.primary,
                url: profile?.cv_url,
              },
              {
                type: 'cert',
                label: 'Certification',
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
  bentoTopRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    padding: 24,
    borderRadius: 32,
    gap: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  fullWidthStat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  fullWidthStatLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  fullWidthLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  fullWidthValue: { color: COLORS.text, fontSize: 24, fontWeight: '900' },
  statValue: { color: COLORS.text, fontSize: 26, fontWeight: '900' },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 20,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
    flexWrap: 'wrap',
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#151515',
    gap: 12,
    minWidth: 110,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillLabel: { color: COLORS.textDim, fontSize: 10, fontWeight: '800' },
  formCard: {
    padding: 28,
    borderRadius: 40,
    gap: 24,
    borderWidth: 1,
    borderColor: '#151515',
    marginBottom: 40,
  },
  inputGroup: { gap: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#050505',
    padding: 22,
    borderRadius: 24,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#121212',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  saveBtnText: { color: 'black', fontWeight: '900', fontSize: 15 },
  assetSplit: { gap: 16 },
  avatarCard: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#151515',
  },
  avatarWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    padding: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 75 },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    backgroundColor: '#080808',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  assetNodeLabel: {
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 20,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  docList: { flex: 1, gap: 12 },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070707',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#151515',
    gap: 20,
  },
  docTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  docStatus: {
    color: COLORS.textDim,
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
});
