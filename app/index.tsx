import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  LayoutAnimation,
  UIManager,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';

// --- ICON PACK ---
import {
  Github,
  Linkedin,
  Send,
  ExternalLink,
  Download,
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
  ChevronRight,
  Briefcase,
  ArrowUp,
  Award,
  FileText,
  CheckCircle,
  Cpu,
  Monitor,
  Icon,
  ZapIcon,
} from 'lucide-react-native';

// --- CUSTOM COMPONENTS ---
import { GlassCard } from '../components/GlassCard';
import { LiveStatus } from '../components/LiveStatus';
// GlassScheduler import removed
import { COLORS, SPACING, LAYOUT } from '../constants/Theme';
import { supabase } from '../lib/supabase';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- ASSETS ---
const ProjectImages = {
  north: require('../assets/images/Northm.png'),
  pantry: require('../assets/images/pantryApp.png'),
  time: require('../assets/images/TimeApp.png'),
  placeholder: require('../assets/images/icon.png'),
};

const LocalProfile = require('../assets/images/profileIcon.png');

// --- DATA TYPES ---
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

// --- UTILITIES ---
const getTechIcon = (tag: string, color: string, size: number = 14) => {
  const t = tag.toLowerCase().trim();
  if (
    t.includes('react') ||
    t.includes('front') ||
    t.includes('next') ||
    t.includes('native') ||
    t.includes('expo')
  )
    return <Layout size={size} color={color} />;
  if (
    t.includes('java') ||
    t.includes('spring') ||
    t.includes('kotlin') ||
    t.includes('c#')
  )
    return <Coffee size={size} color={color} />;
  if (
    t.includes('data') ||
    t.includes('sql') ||
    t.includes('firebase') ||
    t.includes('postgres') ||
    t.includes('supabase')
  )
    return <Database size={size} color={color} />;
  if (
    t.includes('security') ||
    t.includes('auth') ||
    t.includes('jwt') ||
    t.includes('encryption')
  )
    return <Shield size={size} color={color} />;
  if (
    t.includes('docker') ||
    t.includes('aws') ||
    t.includes('cloud') ||
    t.includes('git') ||
    t.includes('ci/cd')
  )
    return <Cpu size={size} color={color} />;
  if (t.includes('node') || t.includes('express') || t.includes('api'))
    return <Server size={size} color={color} />;
  if (t.includes('programming') || t.includes('coding'))
    return <Monitor size={size} color={color} />;
  if (
    t.includes('ts') ||
    t.includes('type') ||
    t.includes('js') ||
    t.includes('python')
  )
    return <Code size={size} color={color} />;
  return <Terminal size={size} color={color} />;
};

const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const FALLBACK_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'NorthFinance',
    description:
      'A comprehensive financial management application built with React Native, Expo, and Supabase. Features OCR scanning, AI chat, and CPA portals.',
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
    description:
      'Smart inventory management for modern kitchens. Tracks expiration dates, suggests recipes, and manages shopping lists in real-time.',
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
    description:
      'Precision scheduling and workforce management tool. Handles shifts, payroll calculations, and real-time attendance tracking.',
    tags: ['Java', 'Spring Boot', 'PostgreSQL', 'Security'],
    github_url: 'https://github.com/alexbuilds/timekeeper',
    live_url: null,
    image_url: null,
    local_image: ProjectImages.time,
    display_order: 3,
  },
];

// --- VISUAL COMPONENTS ---
const Particle = ({ delay }: { delay: number }) => {
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
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

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
};

export default function PortfolioHome() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;

  const isDesktop = width > 1024;
  const isTablet = width > 768 && width <= 1024;
  const isMobile = width <= 768;

  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);

    try {
      const [profileResponse, projectsResponse] = await Promise.all([
        supabase.from('profile_settings').select('*').single(),
        supabase
          .from('projects')
          .select('*')
          .order('display_order', { ascending: true }),
      ]);

      if (profileResponse.data) {
        setProfile(profileResponse.data);
      } else {
        setProfile({
          id: 0,
          headline: 'Java Fullstack Developer',
          is_looking_for_work: true,
          bio: 'Java-Fullstack Engineer | Architecting High-Performance Ecosystems Bridging the gap between high-integrity distributed backends and seamless, intuitive interfaces.',
          github_url: 'https://github.com/AlexBuildsLTS/',
          linkedin_url: '',
          cv_url: null,
          certification_url: null,
          profile_image_url: null,
        });
      }

      if (projectsResponse.data && projectsResponse.data.length > 0) {
        setProjects(projectsResponse.data);
      } else {
        setProjects(FALLBACK_PROJECTS);
      }

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideUpAnim, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (e: any) {
      console.error('Fetch error:', e);
      setProjects(FALLBACK_PROJECTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const handleSendEmail = async () => {
    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) {
      Alert.alert(
        'Missing Information',
        'Please fill out all fields before sending.'
      );
      return;
    }
    if (!isValidEmail(formEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      const { error: sendError } = await supabase.from('messages').insert([
        {
          sender_name: formName.trim(),
          sender_email: formEmail.trim(),
          message_text: formMessage.trim(),
        },
      ]);

      if (sendError) throw sendError;

      Alert.alert(
        'Message Sent',
        'Thank you for reaching out! I will get back to you shortly.'
      );
      setFormName('');
      setFormEmail('');
      setFormMessage('');
    } catch (err: any) {
      Alert.alert('Error', 'Could not send message. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  const openLink = (url: string | null | undefined) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        Alert.alert('Error', 'Could not open link: ' + url)
      );
    } else {
      Alert.alert('Notice', 'This document is not yet uploaded.');
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.7}
          style={styles.logoButton}
        >
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>AY</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRight}>{!isMobile && <LiveStatus />}</View>
    </View>
  );

  const renderHero = () => (
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

          <Text style={styles.greeting}>Hello, I'm</Text>
          <Text style={[styles.heroName, { fontSize: isMobile ? 42 : 64 }]}>
            Alex Youssef
          </Text>

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: profile?.is_looking_for_work
                    ? COLORS.primary
                    : COLORS.error,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {profile?.is_looking_for_work ? 'OPEN TO WORK' : 'CURRENTLY BUSY'}
            </Text>
          </View>

          <Text style={styles.heroSubtitle}>
            {profile?.headline || 'Java Fullstack Developer'}
          </Text>

          <Text style={styles.heroDesc}>
            Java Fullstack Engineer Architecting secure, scalable, and
            cross-platform digital ecosystems with a systems-level perspective
            from the infrastructure up.
          </Text>

          <View style={styles.divider} />

          <View
            style={[
              styles.credentialsRow,
              isMobile && { flexDirection: 'column' },
            ]}
          >
            <TouchableOpacity
              style={[styles.credentialBtn, styles.primaryButton]}
              onPress={() =>
                profile?.cv_url
                  ? openLink(profile.cv_url)
                  : Alert.alert('Info', 'Resume upload pending.')
              }
              activeOpacity={0.8}
            >
              <FileText
                size={20}
                color={COLORS.background}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryButtonText}>RESUME</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.credentialBtn, styles.secondaryButton]}
              onPress={() =>
                profile?.certification_url
                  ? openLink(profile.certification_url)
                  : Alert.alert('Info', 'Certification upload pending.')
              }
              activeOpacity={0.8}
            >
              <Award size={20} color={COLORS.text} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryButtonText}>CERTIFICATION</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.certBadge}>
            <CheckCircle
              size={14}
              color={COLORS.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.certText}>
              Certified Java Fullstack Developer
            </Text>
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
                marginBottom: isMobile ? SPACING.m : SPACING.xl,
              },
        ]}
      >
        <GlassCard style={[styles.imageCard, { borderRadius: 1000 }]}>
          <Image
            source={LocalProfile}
            style={{
              width: isMobile ? 240 : 400,
              height: isMobile ? 240 : 400,
              borderRadius: 1000,
            }}
            resizeMode="cover"
          />
        </GlassCard>
      </View>
    </View>
  );

  // FIX: REMOVED SCHEDULER & MADE ABOUT FULL WIDTH
  const renderAboutOnly = () => (
    <View style={{ width: '100%' }}>
      <GlassCard delay={200} style={styles.aboutCard}>
        <View style={styles.sectionHeaderRow}>
          <User color={COLORS.primary} size={24} />
          <Text style={styles.sectionHeader}>ABOUT ME</Text>
        </View>

        <Text style={styles.bodyText}>
          {profile?.bio && profile.bio.length > 20
            ? profile.bio
            : `I am a dedicated Java Fullstack Developer currently refining my craft at Lexicon. My passion stems from the ability to control the entire stack—from the pixel-perfect frontend to the secure database queries.
                \n\nI specialize in Java, Spring Boot, React, and cloud architecture. Beyond code, I am deeply invested in cybersecurity and ethical hacking, ensuring that every application I build is robust against modern threats.`}
        </Text>
      </GlassCard>
    </View>
  );

  const renderSkills = () => (
    <View style={styles.skillsGrid}>
      {[
        {
          title: 'Frontend',
          icon: Layout,
          color: COLORS.primary,
          list: 'React, React Native, TypeScript, Tailwind, MUI',
        },
        {
          title: 'Backend',
          icon: Server,
          color: COLORS.secondary,
          list: 'Java, Spring Boot, Node.js, REST APIs, PostgreSQL',
        },
        {
          title: 'Security',
          icon: Lock,
          color: COLORS.error,
          list: 'Ethical Hacking, OAuth2, JWT, Secure Design',
        },
        {
          title: 'Tools & Cloud',
          icon: Briefcase,
          color: COLORS.success,
          list: 'Git, Docker, Google Cloud, Firebase, Postman, Linux/Ubuntu',
        },
      ].map((skill, i) => (
        <View key={i} style={{ width: isMobile ? '100%' : '48%', flexGrow: 1 }}>
          <GlassCard style={styles.skillCard}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <skill.icon color={skill.color} size={28} />
              <Text style={styles.skillTitle}>{skill.title}</Text>
            </View>
            <Text style={styles.skillList}>{skill.list}</Text>
          </GlassCard>
        </View>
      ))}
    </View>
  );

  const renderProjects = () => (
    <View style={styles.projectsContainer}>
      {projects.map((project, index) => (
        <View
          key={project.id}
          style={[
            styles.projectWrapper,
            isDesktop
              ? { width: '48.5%' }
              : isTablet
              ? { width: '48%' }
              : { width: '100%' },
          ]}
        >
          <GlassCard delay={300 + index * 100} style={styles.projectCard}>
            <View style={styles.projectImageContainer}>
              <Image
                source={
                  project.local_image ||
                  (project.image_url
                    ? { uri: project.image_url }
                    : ProjectImages.placeholder)
                }
                style={styles.projectImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </View>

            <View style={styles.projectContent}>
              <View>
                <Text style={styles.projectTitle}>{project.title}</Text>
                {/* FIX: REMOVED numberOfLines={3} TO PREVENT CUTOFF */}
                <Text style={styles.projectDesc}>{project.description}</Text>
              </View>

              <View>
                <View style={styles.tagRow}>
                  {project.tags?.slice(0, 4).map((tag: string, i: number) => (
                    <View key={i} style={styles.tag}>
                      {getTechIcon(tag, COLORS.primary)}
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.projectLinks}>
                  {project.github_url ? (
                    <TouchableOpacity
                      onPress={() => openLink(project.github_url)}
                      style={styles.iconButton}
                    >
                      <Github color={COLORS.textDim} size={18} />
                      <Text style={styles.linkTextSmall}>Code</Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  {project.live_url && (
                    <TouchableOpacity
                      onPress={() => openLink(project.live_url)}
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
      ))}
    </View>
  );

  const renderContactForm = () => (
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
        <Text style={styles.contactHeader}>Send a Message</Text>
      </View>

      <View style={styles.formGap}>
        <View style={isDesktop ? styles.rowInput : styles.colInput}>
          <TextInput
            placeholder="Your Name"
            placeholderTextColor={COLORS.textDim}
            style={[styles.input, isDesktop && { flex: 1 }]}
            value={formName}
            onChangeText={setFormName}
          />
          <TextInput
            placeholder="Your Email"
            placeholderTextColor={COLORS.textDim}
            style={[styles.input, isDesktop && { flex: 1 }]}
            value={formEmail}
            onChangeText={setFormEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <TextInput
          placeholder="How can I help you?"
          placeholderTextColor={COLORS.textDim}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          value={formMessage}
          onChangeText={setFormMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendEmail}
          disabled={sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Text style={styles.sendButtonText}>SEND MESSAGE</Text>
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
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.socialRow}>
        <TouchableOpacity
          onPress={() => openLink(profile?.github_url)}
          style={styles.socialIcon}
        >
          <Github color={COLORS.text} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openLink(profile?.linkedin_url)}
          style={styles.socialIcon}
        >
          <Linkedin color={COLORS.text} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        © {new Date().getFullYear()} Alex Youssef
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        style={styles.adminLock}
      >
        <Lock size={12} color={COLORS.surfaceHighlight} />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Initializing PortfolioOS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Alex Youssef', headerShown: false }} />

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
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
      >
        {renderHeader()}

        {renderHero()}

        {/* FIX: REDUCED SPACER FOR MOBILE */}
        <View style={[styles.spacer, isMobile && { height: SPACING.l }]} />

        {renderAboutOnly()}

        {/* FIX: REDUCED SPACER FOR MOBILE */}
        <View style={[styles.spacer, isMobile && { height: SPACING.l }]} />
        {renderSkills()}

        {/* FIX: REDUCED SPACER FOR MOBILE */}
        <View style={[styles.spacer, isMobile && { height: SPACING.l }]} />
        <Text style={styles.sectionTitle}>FEATURED WORK</Text>
        {renderProjects()}

        {/* FIX: REDUCED SPACER FOR MOBILE */}
        <View style={[styles.spacer, isMobile && { height: SPACING.l }]} />
        <Text style={styles.sectionTitle}>LET'S CONNECT</Text>
        {renderContactForm()}

        {renderFooter()}

        {isDesktop && (
          <TouchableOpacity style={styles.fab} onPress={scrollToTop}>
            <ArrowUp color={COLORS.background} size={24} />
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textDim,
    marginTop: SPACING.m,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
  },

  scrollContent: {
    paddingVertical: SPACING.l,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  spacer: { height: SPACING.xl * 2 },
  splitRow: { gap: SPACING.l, alignItems: 'stretch' },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.l,
    opacity: 0.5,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.s,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoButton: { padding: 4 },
  logoBadge: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  logoBadgeText: { fontWeight: '900', color: COLORS.background, fontSize: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },

  heroContainer: {
    gap: SPACING.l,
    marginBottom: SPACING.l,
    alignItems: 'center',
  },
  heroTextWrapper: { justifyContent: 'center' },
  heroCard: { padding: SPACING.xl },
  heroImageContainer: { justifyContent: 'center' },

  greeting: {
    color: COLORS.textDim,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    fontSize: 16,
    letterSpacing: 1,
  },
  heroName: {
    color: COLORS.text,
    fontWeight: '900',
    marginBottom: SPACING.m,
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: COLORS.text,
    marginBottom: SPACING.m,
    lineHeight: 32,
    fontWeight: '600',
    fontSize: 20,
  },
  heroDesc: {
    color: COLORS.textDim,
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 600,
    marginBottom: SPACING.l,
  },

  credentialsRow: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginBottom: SPACING.l,
  },
  credentialBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  actionRow: { flexDirection: 'row', gap: SPACING.m, marginBottom: SPACING.l },
  primaryButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.1)',
    alignSelf: 'flex-start',
    marginBottom: SPACING.m,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.8,
    marginTop: SPACING.s,
  },
  certText: { color: COLORS.textDim, fontSize: 11, fontWeight: '600' },

  imageCard: { padding: SPACING.s },
  placeholderImage: {
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aboutCard: { padding: SPACING.xl, height: '100%' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.m,
  },
  sectionHeader: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bodyText: { color: COLORS.textDim, fontSize: 16, lineHeight: 28 },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: SPACING.l,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.m },
  skillCard: {
    padding: SPACING.l,
    gap: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 140,
  },
  skillTitle: { color: COLORS.text, fontWeight: 'bold', fontSize: 18 },
  skillList: { color: COLORS.textDim, fontSize: 14, lineHeight: 22 },

  projectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.m,
  },
  projectWrapper: { marginBottom: SPACING.m },
  projectCard: { height: '100%', padding: 0, overflow: 'hidden' },

  projectImageContainer: { width: '100%', height: 200, position: 'relative' },
  projectImage: { width: '100%', height: '100%' },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  projectContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.l,
  },
  projectTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
  },
  projectDesc: {
    color: COLORS.textDim,
    fontSize: 14,
    marginBottom: SPACING.m,
    lineHeight: 22,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.l,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(204,255,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
  },
  tagText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },

  projectLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 8,
  },
  linkTextSmall: { color: COLORS.textDim, fontSize: 12, fontWeight: 'bold' },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
  },
  liveButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },

  contactCard: { padding: SPACING.xl },
  contactHeader: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  formGap: { gap: SPACING.m },
  rowInput: { flexDirection: 'row', gap: SPACING.m },
  colInput: { flexDirection: 'column', gap: SPACING.m },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    padding: 16,
    borderRadius: 8,
    fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sendButton: {
    backgroundColor: COLORS.text,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  sendButtonDisabled: { opacity: 0.7 },
  sendButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  footer: {
    marginTop: SPACING.xl * 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: { color: COLORS.textDim, fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: SPACING.m },
  socialIcon: {
    padding: 8,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 50,
  },
  adminLock: { padding: 10, opacity: 0.3 },

  fab: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});
