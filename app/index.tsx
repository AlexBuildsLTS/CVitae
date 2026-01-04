/* cspell:disable */
/**
 * @file app/index.tsx
 * @description Senior Portfolio Entry Point.
 * Merged Features: Project Registry with Multi-Image Gallery, Philosophy Bento, & Real-time Analytics.
 */
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, Stack } from 'expo-router';

// --- ICON PACK ---
import {
  Github,
  Linkedin,
  Send,
  ExternalLink,
  Shield,
  Layout,
  Server,
  Lock,
  Mail,
  Code,
  Coffee,
  Terminal,
  ArrowUp,
  Award,
  FileText,
  Cpu,
  Database,
  User,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

// --- CUSTOM MODULES ---
import { GlassCard } from '../components/GlassCard';
import { LiveStatus } from '../components/LiveStatus';
import PhilosophyBento from '../components/PhilosophyBento';
import { COLORS, SPACING } from '../constants/Theme';
import { supabase } from '../lib/supabase';

/**
 * --- DATA INTERFACES ---
 */
interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  additional_images?: string[]; // Support for multiple images
  github_url: string | null;
  live_url: string | null;
  tags: string[];
  local_image?: any;
  display_order: number;
}

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
}

const LocalProfile = require('../assets/images/profileIcon.png');
const ProjectPlaceholder = require('../assets/images/icon.png');

/**
 * --- UI UTILITIES ---
 */
const getTechIcon = (tag: string, color: string, size: number = 14) => {
  const t = tag.toLowerCase().trim();
  if (t.includes('react') || t.includes('native') || t.includes('expo'))
    return <Layout size={size} color={color} />;
  if (t.includes('java') || t.includes('spring'))
    return <Coffee size={size} color={color} />;
  if (
    t.includes('data') ||
    t.includes('sql') ||
    t.includes('supabase') ||
    t.includes('postgres')
  )
    return <Database size={size} color={color} />;
  if (t.includes('security') || t.includes('auth'))
    return <Shield size={size} color={color} />;
  return <Code size={size} color={color} />;
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * --- SUB-COMPONENTS ---
 */
const Particle = React.memo(function Particle({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 4000 + Math.random() * 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${Math.random() * 100}%`,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
});

const ProjectCard = React.memo(function ProjectCard({
  project,
  isDesktop,
  isTablet,
}: any) {
  // --- MULTI-IMAGE GALLERY LOGIC ---
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const images = useMemo(() => {
    return [project.image_url, ...(project.additional_images || [])].filter(
      Boolean
    );
  }, [project.image_url, project.additional_images]);

  const nextImg = () =>
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  const prevImg = () =>
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <View
      style={[
        styles.projectWrapper,
        isDesktop
          ? { width: '48.5%' }
          : isTablet
          ? { width: '48%' }
          : { width: '100%' },
      ]}
    >
      <GlassCard style={styles.projectCard}>
        <View style={styles.projectImageContainer}>
          <Image
            source={
              images.length > 0
                ? { uri: images[currentImgIndex] }
                : ProjectPlaceholder
            }
            style={styles.projectImage}
            contentFit="cover"
            transition={500}
          />

          {/* Gallery Navigation Controls */}
          {images.length > 1 && (
            <>
              <TouchableOpacity onPress={prevImg} style={styles.galleryBtnLeft}>
                <ChevronLeft color="white" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextImg}
                style={styles.galleryBtnRight}
              >
                <ChevronRight color="white" size={20} />
              </TouchableOpacity>
              <View style={styles.galleryIndicator}>
                <Text style={styles.galleryIndicatorText}>
                  {currentImgIndex + 1} / {images.length}
                </Text>
              </View>
            </>
          )}

          <View style={styles.imageOverlay} />
        </View>
        <View style={styles.projectContent}>
          <View>
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.projectDesc}>{project.description}</Text>
          </View>
          <View>
            <View style={styles.tagRow}>
              {project.tags?.map((tag: string, i: number) => (
                <View key={i} style={styles.tag}>
                  {getTechIcon(tag, COLORS.primary)}
                  <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
            <View style={styles.projectLinks}>
              {project.github_url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(project.github_url!)}
                  style={styles.iconButton}
                >
                  <Github color={COLORS.textDim} size={18} />
                  <Text style={styles.linkTextSmall}>Github</Text>
                </TouchableOpacity>
              )}
              {project.live_url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(project.live_url!)}
                  style={styles.liveButton}
                >
                  <Text style={styles.liveButtonText}>View Live</Text>
                  <ExternalLink color={COLORS.background} size={14} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </GlassCard>
    </View>
  );
});

export default function PortfolioHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const isDesktop = width > 1024;
  const isMobile = width <= 768;

  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const [pRes, projRes] = await Promise.all([
          supabase.from('profile_settings').select('*').single(),
          supabase
            .from('projects')
            .select('*')
            .order('display_order', { ascending: true }),
        ]);
        if (pRes.data) setProfile(pRes.data);
        if (projRes.data?.length) setProjects(projRes.data);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      } catch (e) {
        console.error('[FETCH_ERROR]:', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fadeAnim]
  );

  useEffect(() => {
    supabase
      .from('analytics_events')
      .insert({ event_type: 'page_view' })
      .then(() => {});
    fetchData();
  }, [fetchData]);

  const handleSendMessage = async () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.message.trim() ||
      !isValidEmail(form.email)
    ) {
      Alert.alert('Validation Error', 'Verification failed. Check inputs.');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert([
        {
          sender_name: form.name.trim(),
          sender_email: form.email.trim(),
          message_text: form.message.trim(),
        },
      ]);
      if (error) throw error;
      Alert.alert('Success', 'Message transmitted.');
      setForm({ name: '', email: '', message: '' });
    } catch {
      Alert.alert('Error', 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>INITIALIZING_SYSTEM_CORE...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isMobile ? SPACING.m : SPACING.xl * 2 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={COLORS.primary}
          />
        }
        style={{ opacity: fadeAnim }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.logoBadge}
            >
              <Text style={styles.logoBadgeText}>AY</Text>
            </TouchableOpacity>
            {isDesktop && (
              <View style={styles.socialHeader}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(profile?.github_url || '#')}
                >
                  <Github size={18} color="#a1a1aa" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Linking.openURL(profile?.linkedin_url || '#')}
                >
                  <Linkedin size={18} color="#a1a1aa" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {!isMobile && <LiveStatus />}
        </View>

        {/* HERO */}
        <View
          style={[
            styles.heroContainer,
            { flexDirection: isDesktop ? 'row' : 'column-reverse' },
          ]}
        >
          <View
            style={[
              styles.heroTextWrapper,
              isDesktop
                ? { width: '55%', paddingRight: SPACING.l }
                : { width: '100%' },
            ]}
          >
            <GlassCard style={styles.heroCard}>
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {[...Array(5)].map((_, i) => (
                  <Particle key={i} delay={i * 500} />
                ))}
              </View>
              <Text style={styles.greeting}>ACTIVE</Text>
              <Text style={[styles.heroName, { fontSize: isMobile ? 42 : 64 }]}>
                Alex Youssef
              </Text>

              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: profile?.is_looking_for_work
                        ? '#10b981'
                        : COLORS.error,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: profile?.is_looking_for_work
                        ? '#cfc104'
                        : COLORS.error,
                    },
                  ]}
                >
                  {profile?.is_looking_for_work
                    ? 'OPEN TO WORK'
                    : 'CURRENTLY BUSY'}
                </Text>
              </View>

              <Text style={styles.heroSubtitle}>
                {profile?.headline || 'Fullstack Engineer'}
              </Text>
              <Text style={styles.heroDesc}>
                {profile?.bio || 'Architecting resilient digital ecosystems.'}
              </Text>

              <View style={styles.credentialsRow}>
                <TouchableOpacity
                  style={[styles.credentialBtn, styles.primaryButton]}
                  onPress={() => Linking.openURL(profile?.cv_url || '')}
                >
                  <FileText size={18} color={COLORS.background} />
                  <Text style={styles.primaryButtonText}>RESUME</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.credentialBtn, styles.secondaryButton]}
                  onPress={() =>
                    Linking.openURL(profile?.certification_url || '')
                  }
                >
                  <Award size={18} color={COLORS.text} />
                  <Text style={styles.secondaryButtonText}>CREDENTIALS</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>

          <View
            style={[
              styles.heroImageContainer,
              isDesktop
                ? { width: '45%', alignItems: 'flex-end' }
                : {
                    width: '100%',
                    alignItems: 'center',
                    marginBottom: SPACING.xl,
                  },
            ]}
          >
            <View style={styles.avatarBorder}>
              <Image
                source={LocalProfile}
                style={{
                  width: isMobile ? 240 : 380,
                  height: isMobile ? 240 : 380,
                  borderRadius: 1000,
                }}
                contentFit="cover"
                transition={500}
              />
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
        <PhilosophyBento profile={profile} />

        <View style={styles.spacer} />

        {/* --- PORTFOLIO HEADER --- */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING.l,
            gap: 12,
          }}
        >
          <View
            style={{
              backgroundColor: '#a3e63510',
              borderWidth: 1,
              borderColor: '#a3e63520',
              padding: 10,
              borderRadius: 12,
            }}
          >
            <Briefcase size={16} color="#a3e635" />
          </View>

          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderWidth: 1,
              borderColor: '#18181b',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#a3e635',
                marginRight: 10,
              }}
            />
            <Text
              style={{
                color: '#a3e635',
                fontSize: 10,
                fontWeight: '900',
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}
            >
              Portfolio
            </Text>
          </View>
        </View>

        <View style={styles.projectsContainer}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isDesktop={isDesktop}
              isTablet={width > 768}
            />
          ))}
        </View>

        <View style={styles.spacer} />
        <GlassCard style={styles.contactCard}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <Mail color={COLORS.primary} size={28} />
            <Text style={styles.contactHeader}>Secure Message Channel</Text>
          </View>
          <View style={styles.formGap}>
            <View style={isDesktop ? styles.rowInput : styles.colInput}>
              <TextInput
                placeholder="Name"
                placeholderTextColor={COLORS.textDim}
                style={[styles.input, isDesktop && { flex: 1 }]}
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />
              <TextInput
                placeholder="Email"
                placeholderTextColor={COLORS.textDim}
                style={[styles.input, isDesktop && { flex: 1 }]}
                value={form.email}
                onChangeText={(t) => setForm({ ...form, email: t })}
              />
            </View>
            <TextInput
              placeholder="Message"
              placeholderTextColor={COLORS.textDim}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              value={form.message}
              onChangeText={(t) => setForm({ ...form, message: t })}
            />
            <TouchableOpacity
              style={[styles.sendButton, sending && { opacity: 0.5 }]}
              onPress={handleSendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <>
                  <Text style={styles.sendButtonText}>Send Message</Text>
                  <Send
                    size={16}
                    color={COLORS.background}
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Alex Fredrik Youssef
          </Text>
          <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => Linking.openURL(profile?.github_url || '#')}
            >
              <Github size={18} color="#52525b" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(profile?.linkedin_url || '#')}
            >
              <Linkedin size={18} color="#52525b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Lock size={16} color="#27272a" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      {isDesktop && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <ArrowUp color={COLORS.background} size={24} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
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
  scrollContent: {
    paddingVertical: SPACING.l,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  spacer: { height: SPACING.xl * 2 },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.s,
  },
  logoBadge: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: { fontWeight: '900', color: COLORS.background, fontSize: 16 },
  socialHeader: {
    flexDirection: 'row',
    gap: 16,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#18181b',
  },
  heroContainer: {
    gap: SPACING.l,
    marginBottom: SPACING.l,
    alignItems: 'center',
  },
  heroTextWrapper: { justifyContent: 'center' },
  heroCard: { padding: SPACING.xl },
  greeting: {
    color: COLORS.textDim,
    marginBottom: 8,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '900',
  },
  heroName: {
    color: COLORS.text,
    fontWeight: '900',
    marginBottom: SPACING.m,
    letterSpacing: -2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: SPACING.m,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroSubtitle: {
    color: COLORS.text,
    marginBottom: SPACING.m,
    fontWeight: '800',
    fontSize: 26,
  },
  heroDesc: {
    color: COLORS.textDim,
    fontSize: 16,
    lineHeight: 28,
    maxWidth: 620,
    marginBottom: SPACING.xl,
  },
  credentialsRow: { flexDirection: 'row', gap: SPACING.m },
  credentialBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: { backgroundColor: COLORS.primary },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: '900',
    fontSize: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#18181b',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  secondaryButtonText: { color: COLORS.text, fontWeight: '900', fontSize: 12 },
  heroImageContainer: { justifyContent: 'center' },
  avatarBorder: {
    borderRadius: 1000,
    padding: 12,
    backgroundColor: 'rgba(204,255,0,0.01)',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.05)',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: SPACING.l,
    letterSpacing: 2,
    paddingLeft: 4,
  },
  projectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  projectWrapper: { marginBottom: SPACING.l },
  projectCard: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#18181b',
  },
  projectImageContainer: { width: '100%', height: 240, position: 'relative' },
  projectImage: { width: '100%', height: '100%' },
  // --- Gallery Navigation Styles ---
  galleryBtnLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  galleryBtnRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  galleryIndicator: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  galleryIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  projectContent: { padding: SPACING.xl, gap: 14 },
  projectTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  projectDesc: { color: COLORS.textDim, fontSize: 15, lineHeight: 24 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#151515',
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  projectLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#151515',
  },
  iconButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkTextSmall: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  liveButtonText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  contactCard: { padding: 40, borderRadius: 40 },
  contactHeader: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  formGap: { gap: 16 },
  rowInput: { flexDirection: 'row', gap: 16 },
  colInput: { flexDirection: 'column', gap: 16 },
  input: {
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#151515',
    color: COLORS.text,
    padding: 20,
    borderRadius: 16,
    fontSize: 15,
  },
  textArea: { minHeight: 160, textAlignVertical: 'top' },
  sendButton: {
    backgroundColor: COLORS.text,
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: COLORS.background,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    marginTop: 100,
    paddingVertical: 60,
    borderTopWidth: 1,
    borderTopColor: '#151515',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  footerText: {
    color: '#3f3f46',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  adminLock: { opacity: 0.1 },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
});
