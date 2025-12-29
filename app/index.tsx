import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
  RefreshControl,
  Animated,
  Easing,
  FlatList,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';

// --- ICON PACK ---
import {
  Github,
  Linkedin,
  Send,
  ExternalLink,
  User,
  Database,
  Shield,
  Layout,
  Server,
  Lock,
  Mail,
  Code,
  Coffee,
  Terminal,
  Briefcase,
  ArrowUp,
  Award,
  FileText,
  CheckCircle,
  Cpu,
  Monitor,
} from 'lucide-react-native';

// --- CUSTOM COMPONENTS ---
import { GlassCard } from '../components/GlassCard';
import { LiveStatus } from '../components/LiveStatus';
import { COLORS, SPACING } from '../constants/Theme';
import { supabase } from '../lib/supabase';

/**
 * --- DATA TYPES ---
 */
interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
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
  is_looking_for_work: boolean;
  github_url: string;
  linkedin_url: string;
  cv_url: string | null;
  certification_url: string | null;
  profile_image_url: string | null;
}

// --- ASSETS ---
const ProjectImages = {
  north: require('../assets/images/Northm.png'),
  pantry: require('../assets/images/pantryApp.png'),
  time: require('../assets/images/TimeApp.png'),
  placeholder: require('../assets/images/icon.png'),
};

const LocalProfile = require('../assets/images/profileIcon.png');

/**
 * --- UTILITIES ---
 */
const getTechIcon = (tag: string, color: string, size: number = 14) => {
  const t = tag.toLowerCase().trim();
  if (t.includes('react') || t.includes('front') || t.includes('next') || t.includes('native') || t.includes('expo'))
    return <Layout size={size} color={color} />;
  if (t.includes('java') || t.includes('spring') || t.includes('kotlin') || t.includes('c#'))
    return <Coffee size={size} color={color} />;
  if (t.includes('data') || t.includes('sql') || t.includes('firebase') || t.includes('postgres') || t.includes('supabase'))
    return <Database size={size} color={color} />;
  if (t.includes('security') || t.includes('auth') || t.includes('jwt') || t.includes('encryption'))
    return <Shield size={size} color={color} />;
  if (t.includes('docker') || t.includes('aws') || t.includes('cloud') || t.includes('git') || t.includes('ci/cd'))
    return <Cpu size={size} color={color} />;
  if (t.includes('node') || t.includes('express') || t.includes('api'))
    return <Server size={size} color={color} />;
  if (t.includes('programming') || t.includes('coding'))
    return <Monitor size={size} color={color} />;
  if (t.includes('ts') || t.includes('type') || t.includes('js') || t.includes('python'))
    return <Code size={size} color={color} />;
  return <Terminal size={size} color={color} />;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const FALLBACK_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'NorthFinance',
    description: 'A comprehensive financial management application built with React Native, Expo, and Supabase. Features OCR scanning, AI chat, and CPA portals.',
    tags: ['React Native', 'TypeScript', 'Supabase', 'AI'],
    github_url: 'https://github.com/alexbuilds/northfinance',
    live_url: null,
    image_url: null,
    local_image: ProjectImages.north,
    display_order: 1,
  },
  {
    id: 2,
    title: 'PantryApp',
    description: 'Smart inventory management for modern kitchens. Tracks expiration dates, suggests recipes, and manages shopping lists in real-time.',
    tags: ['React', 'Firebase', 'IoT', 'Mobile'],
    github_url: 'https://github.com/alexbuilds/pantry',
    live_url: null,
    image_url: null,
    local_image: ProjectImages.pantry,
    display_order: 2,
  },
  {
    id: 3,
    title: 'TimeKeeper',
    description: 'Precision scheduling and workforce management tool. Handles shifts, payroll calculations, and real-time attendance tracking.',
    tags: ['Java', 'Spring Boot', 'PostgreSQL', 'Security'],
    github_url: 'https://github.com/alexbuilds/timekeeper',
    live_url: null,
    image_url: null,
    local_image: ProjectImages.time,
    display_order: 3,
  },
];

/**
 * --- SUB-COMPONENTS ---
 */

const Particle = React.memo(({ delay }: { delay: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 4000 + Math.random() * 2000,
            delay: delay,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.6, duration: 2000, delay: delay, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 4,
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        bottom: 0,
        left: `${Math.random() * 100}%`,
        opacity: opacity,
        transform: [{ translateY }],
      }}
    />
  );
});

const ProjectCard = React.memo(({ project, isDesktop, isTablet }: { project: Project; isDesktop: boolean; isTablet: boolean }) => (
  <View style={[styles.projectWrapper, isDesktop ? { width: '48.5%' } : isTablet ? { width: '48%' } : { width: '100%' }]}>
    <GlassCard style={styles.projectCard}>
      <View style={styles.projectImageContainer}>
        <Image
          source={project.local_image || (project.image_url ? { uri: project.image_url } : ProjectImages.placeholder)}
          style={styles.projectImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
      </View>
      <View style={styles.projectContent}>
        <View>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectDesc}>{project.description}</Text>
        </View>
        <View>
          <View style={styles.tagRow}>
            {/* NO LIMIT TO TECH STACK SHOWING */}
            {project.tags?.map((tag: string, i: number) => (
              <View key={i} style={styles.tag}>
                {getTechIcon(tag, COLORS.primary)}
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.projectLinks}>
            {project.github_url ? (
              <TouchableOpacity onPress={() => Linking.openURL(project.github_url!)} style={styles.iconButton}>
                <Github color={COLORS.textDim} size={18} />
                <Text style={styles.linkTextSmall}>Code</Text>
              </TouchableOpacity>
            ) : <View />}
            {project.live_url && (
              <TouchableOpacity onPress={() => Linking.openURL(project.live_url!)} style={styles.liveButton}>
                <Text style={styles.liveButtonText}>View Live</Text>
                <ExternalLink color={COLORS.background} size={14} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </GlassCard>
  </View>
));

const SkillCard = React.memo(({ title, icon: Icon, color, list, isMobile }: any) => (
  <View style={{ width: isMobile ? '100%' : '48%', flexGrow: 1 }}>
    <GlassCard style={styles.skillCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Icon color={color} size={28} />
        <Text style={styles.skillTitle}>{title}</Text>
      </View>
      <Text style={styles.skillList}>{list}</Text>
    </GlassCard>
  </View>
));

/**
 * --- MAIN COMPONENT ---
 */
export default function PortfolioHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const isDesktop = width > 1024;
  const isTablet = width > 768 && width <= 1024;
  const isMobile = width <= 768;

  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [pRes, projRes] = await Promise.all([
        supabase.from('profile_settings').select('*').single(),
        supabase.from('projects').select('*').order('display_order', { ascending: true }),
      ]);

      if (pRes.data) setProfile(pRes.data);
      if (projRes.data && projRes.data.length > 0) setProjects(projRes.data);
      else setProjects(FALLBACK_PROJECTS);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideUpAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      setProjects(FALLBACK_PROJECTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim, slideUpAnim]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendMessage = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }
    if (!isValidEmail(form.email)) {
      Alert.alert('Validation Error', 'Invalid email address.');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert([{
        sender_name: form.name.trim(),
        sender_email: form.email.trim(),
        message_text: form.message.trim(),
      }]);
      if (error) throw error;
      Alert.alert('Success', 'Message transmitted successfully.');
      setForm({ name: '', email: '', message: '' });
    } catch (e: any) {
      Alert.alert('System Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const skillsData = useMemo(() => [
    { title: 'Frontend', icon: Layout, color: COLORS.primary, list: 'React, React Native, TypeScript, Tailwind, MUI' },
    { title: 'Backend', icon: Server, color: COLORS.secondary, list: 'Java, Spring Boot, Node.js, REST APIs, PostgreSQL' },
    { title: 'Security', icon: Lock, color: COLORS.error, list: 'Ethical Hacking, OAuth2, JWT, Secure Design' },
    { title: 'Tools & Cloud', icon: Briefcase, color: COLORS.success, list: 'Git, Docker, Google Cloud, Firebase, Postman, Linux/Ubuntu' },
  ], []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>INITIALIZING_PORTFOLIO_OS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isMobile ? SPACING.m : SPACING.xl * 2 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={COLORS.primary} />}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>AY</Text>
          </TouchableOpacity>
          {!isMobile && <LiveStatus />}
        </View>

        {/* HERO */}
        <View style={[styles.heroContainer, { flexDirection: isDesktop ? 'row' : 'column-reverse' }]}>
          <View style={[styles.heroTextWrapper, isDesktop ? { width: '55%', paddingRight: SPACING.l } : { width: '100%' }]}>
            <GlassCard style={styles.heroCard}>
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {[...Array(5)].map((_, i) => <Particle key={i} delay={i * 500} />)}
              </View>
              <Text style={styles.greeting}>SYSTEM_INIT: Hello, I'm</Text>
              <Text style={[styles.heroName, { fontSize: isMobile ? 42 : 64 }]}>Alex Youssef</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: profile?.is_looking_for_work ? COLORS.primary : COLORS.error }]} />
                <Text style={styles.statusText}>{profile?.is_looking_for_work ? 'OPEN TO WORK' : 'CURRENTLY BUSY'}</Text>
              </View>
              <Text style={styles.heroSubtitle}>{profile?.headline || 'Java Fullstack Developer'}</Text>
              <Text style={styles.heroDesc}>{profile?.bio || 'Architecting secure, scalable digital ecosystems.'}</Text>
              <View style={styles.divider} />
              <View style={[styles.credentialsRow, isMobile && { flexDirection: 'column' }]}>
                <TouchableOpacity style={[styles.credentialBtn, styles.primaryButton]} onPress={() => Linking.openURL(profile?.cv_url || '')}>
                  <FileText size={20} color={COLORS.background} style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>RESUME</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.credentialBtn, styles.secondaryButton]} onPress={() => Linking.openURL(profile?.certification_url || '')}>
                  <Award size={20} color={COLORS.text} style={{ marginRight: 8 }} />
                  <Text style={styles.secondaryButtonText}>CREDENTIALS</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
          <View style={[styles.heroImageContainer, isDesktop ? { width: '45%', alignItems: 'flex-end' } : { width: '100%', alignItems: 'center', marginBottom: SPACING.xl }]}>
            <GlassCard style={[styles.imageCard, { borderRadius: 1000 }]}>
              <Image source={LocalProfile} style={{ width: isMobile ? 240 : 400, height: isMobile ? 240 : 400, borderRadius: 1000 }} resizeMode="cover" />
            </GlassCard>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* ABOUT */}
        <GlassCard style={styles.aboutCard}>
          <View style={styles.sectionHeaderRow}>
            <User color={COLORS.primary} size={24} />
            <Text style={styles.sectionHeader}>CORE_PROFILE</Text>
          </View>
          <Text style={styles.bodyText}>{profile?.bio || 'Fullstack Engineer specializing in high-integrity systems.'}</Text>
        </GlassCard>

        <View style={styles.spacer} />

        {/* SKILLS */}
        <View style={styles.skillsGrid}>
          {skillsData.map((skill, i) => <SkillCard key={i} {...skill} isMobile={isMobile} />)}
        </View>

        <View style={styles.spacer} />

        {/* PROJECTS */}
        <Text style={styles.sectionTitle}>FEATURED_REGISTRY</Text>
        <View style={styles.projectsContainer}>
          {projects.map((project) => <ProjectCard key={project.id} project={project} isDesktop={isDesktop} isTablet={isTablet} />)}
        </View>

        <View style={styles.spacer} />

        {/* CONTACT */}
        <Text style={styles.sectionTitle}>ESTABLISH_CONNECTION</Text>
        <GlassCard style={styles.contactCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <Mail color={COLORS.primary} size={28} />
            <Text style={styles.contactHeader}>Secure Message Channel</Text>
          </View>
          <View style={styles.formGap}>
            <View style={isDesktop ? styles.rowInput : styles.colInput}>
              <TextInput placeholder="Identification (Name)" placeholderTextColor={COLORS.textDim} style={[styles.input, isDesktop && { flex: 1 }]} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
              <TextInput placeholder="Return Address (Email)" placeholderTextColor={COLORS.textDim} style={[styles.input, isDesktop && { flex: 1 }]} value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} />
            </View>
            <TextInput placeholder="Message Payload" placeholderTextColor={COLORS.textDim} style={[styles.input, styles.textArea]} multiline numberOfLines={4} value={form.message} onChangeText={(t) => setForm({ ...form, message: t })} />
            <TouchableOpacity style={[styles.sendButton, sending && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={sending}>
              {sending ? <ActivityIndicator color={COLORS.background} /> : (
                <>
                  <Text style={styles.sendButtonText}>TRANSMIT_DATA</Text>
                  <Send size={16} color={COLORS.background} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.socialRow}>
            <TouchableOpacity onPress={() => Linking.openURL(profile?.github_url || '')} style={styles.socialIcon}><Github color={COLORS.text} size={20} /></TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(profile?.linkedin_url || '')} style={styles.socialIcon}><Linkedin color={COLORS.text} size={20} /></TouchableOpacity>
          </View>
          <Text style={styles.footerText}>© {new Date().getFullYear()} Alex Youssef</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.adminLock}><Lock size={12} color={COLORS.surfaceHighlight} /></TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {isDesktop && (
        <TouchableOpacity style={styles.fab} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}>
          <ArrowUp color={COLORS.background} size={24} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textDim, marginTop: SPACING.m, fontSize: 10, letterSpacing: 2, fontWeight: '900' },
  scrollContent: { paddingVertical: SPACING.l, maxWidth: 1440, width: '100%', alignSelf: 'center' },
  spacer: { height: SPACING.xl * 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.l, opacity: 0.3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl, marginTop: SPACING.s },
  logoBadge: { width: 36, height: 36, backgroundColor: COLORS.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoBadgeText: { fontWeight: '900', color: COLORS.background, fontSize: 16 },
  heroContainer: { gap: SPACING.l, marginBottom: SPACING.l, alignItems: 'center' },
  heroTextWrapper: { justifyContent: 'center' },
  heroCard: { padding: SPACING.xl },
  greeting: { color: COLORS.textDim, marginBottom: 4, fontSize: 12, letterSpacing: 2, fontWeight: '900' },
  heroName: { color: COLORS.text, fontWeight: '900', marginBottom: SPACING.m, letterSpacing: -1.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(204, 255, 0, 0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(204, 255, 0, 0.1)', alignSelf: 'flex-start', marginBottom: SPACING.m },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: COLORS.primary, fontSize: 10, fontWeight: '900' },
  heroSubtitle: { color: COLORS.text, marginBottom: SPACING.m, fontWeight: '800', fontSize: 24 },
  heroDesc: { color: COLORS.textDim, fontSize: 16, lineHeight: 26, maxWidth: 600, marginBottom: SPACING.l },
  credentialsRow: { flexDirection: 'row', gap: SPACING.m },
  credentialBtn: { flex: 1, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: COLORS.primary },
  primaryButtonText: { color: COLORS.background, fontWeight: '900', fontSize: 12 },
  secondaryButton: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  secondaryButtonText: { color: COLORS.text, fontWeight: '900', fontSize: 12 },
  imageCard: { padding: SPACING.s },
  heroImageContainer: { justifyContent: 'center' },
  aboutCard: { padding: SPACING.xl },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m, marginBottom: SPACING.m },
  sectionHeader: { color: COLORS.text, fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  bodyText: { color: COLORS.textDim, fontSize: 16, lineHeight: 28 },
  sectionTitle: { color: COLORS.text, fontSize: 24, fontWeight: '900', marginBottom: SPACING.l, letterSpacing: 2 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.m },
  skillCard: { padding: SPACING.l, minHeight: 140, borderWidth: 1, borderColor: COLORS.border },
  skillTitle: { color: COLORS.text, fontWeight: '800', fontSize: 18 },
  skillList: { color: COLORS.textDim, fontSize: 14, lineHeight: 22 },
  projectsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.m },
  projectWrapper: { marginBottom: SPACING.m },
  projectCard: { height: '100%', padding: 0, overflow: 'hidden' },
  projectImageContainer: { width: '100%', height: 200 },
  projectImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  projectContent: { flex: 1, justifyContent: 'space-between', padding: SPACING.l },
  projectTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginBottom: SPACING.s },
  projectDesc: { color: COLORS.textDim, fontSize: 14, marginBottom: SPACING.m, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.l },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(204,255,0,0.03)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(204,255,0,0.1)' },
  tagText: { color: COLORS.primary, fontSize: 10, fontWeight: '800' },
  projectLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.s, paddingTop: SPACING.s, borderTopWidth: 1, borderTopColor: '#151515' },
  iconButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: '#0d0d0d', borderRadius: 8 },
  linkTextSmall: { color: COLORS.textDim, fontSize: 12, fontWeight: '900' },
  liveButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100 },
  liveButtonText: { color: COLORS.background, fontSize: 11, fontWeight: '900' },
  contactCard: { padding: SPACING.xl },
  contactHeader: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  formGap: { gap: SPACING.m },
  rowInput: { flexDirection: 'row', gap: SPACING.m },
  colInput: { flexDirection: 'column', gap: SPACING.m },
  input: { backgroundColor: '#080808', borderWidth: 1, borderColor: '#151515', color: COLORS.text, padding: 16, borderRadius: 12, fontSize: 15 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  sendButton: { backgroundColor: COLORS.text, padding: 18, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: COLORS.background, fontWeight: '900', letterSpacing: 2 },
  footer: { marginTop: SPACING.xl * 2, borderTopWidth: 1, borderTopColor: '#151515', paddingTop: SPACING.l, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { color: COLORS.textDim, fontSize: 11, fontWeight: '700' },
  socialRow: { flexDirection: 'row', gap: SPACING.m },
  socialIcon: { padding: 10, backgroundColor: '#0d0d0d', borderRadius: 50 },
  adminLock: { padding: 10, opacity: 0.1 },
  fab: { position: 'absolute', bottom: 40, right: 40, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
});
