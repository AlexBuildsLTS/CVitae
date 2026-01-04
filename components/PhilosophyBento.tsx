/**
 * @file components/PhilosophyBento.tsx
 */
import React from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '../constants/Theme';

interface PhilosophyProps {
  profile: {
    headline: string;
    bio: string;
    about_me: string | null;
    growth_summary: string | null;
  } | null;
}

const TechBadge = ({ label }: { label: string }) => (
  <View className="bg-black/50 border border-zinc-800 px-2 py-1 rounded-md mr-1.5 mb-1.5 flex-row items-center">
    <View className="w-1 h-1 rounded-full bg-[#a3e635] mr-2" />
    <Text className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest">
      {label}
    </Text>
  </View>
);

const AnimatedCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scale.value, { damping: 10, stiffness: 100 }) },
    ],
    borderColor:
      scale.value === 1.05 ? COLORS.primary : 'rgba(39, 39, 42, 0.8)',
    borderWidth: 1,
  }));

  return (
    <Pressable
      onHoverIn={() => {
        scale.value = 1.05;
      }}
      onHoverOut={() => {
        scale.value = 1;
      }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
};

const PhilosophyBento = ({ profile }: PhilosophyProps) => {
  const technicalPillars = [
    {
      icon: 'server',
      title: 'Backend',
      stack: [
        'Java',
        'Spring Boot',
        'Node.js',
        'Deno (Edge)',
        'PostgreSQL (RLS)',
      ],
      color: COLORS.secondary,
    },
    {
      icon: 'layers',
      title: 'Frontend',
      stack: ['React', 'React Native', 'TypeScript', 'Tailwind'],
      color: COLORS.primary,
    },
    {
      icon: 'shield-checkmark',
      title: 'Security',
      stack: ['Secure Auth', 'OAuth2', 'JWT', 'RLS Protocols'],
      color: '#ef4444',
    },
    {
      icon: 'code-slash',
      title: 'Infrastructure',
      stack: ['Git', 'Docker', 'Supabase', 'Firebase', 'Linux/Kubuntu'],
      color: '#f97316',
    },
  ];

  return (
    <View className="w-full py-8 md:py-12">
      {/* SECTION HEADER - UPDATED TEXT STYLE AND ICON ONLY */}
      <View className="px-4 mb-8 md:px-2 md:mb-12">
        <View className="flex-row items-center mb-4">
          {/* New Professional Icon for the Header */}
          <View className="bg-[#a3e635]/10 border border-[#a3e635]/20 p-2 rounded-lg mr-3">
            <Ionicons name="construct" size={14} color="#a3e635" />
          </View>

          {/* TECHNICAL FOUNDATION now matches the TechStack Badge style */}
          <View className="flex-row items-center px-3 py-1 border rounded-md bg-black/50 border-zinc-800">
            <View className="w-1.5 h-1.5 rounded-full bg-[#a3e635] mr-2" />
            <Text className="text-[10px] font-black tracking-[0.3em] text-[#a3e635] uppercase">
              TECHNICAL FOUNDATION
            </Text>
          </View>
        </View>

        <Text
          className="font-black tracking-tighter text-zinc-100"
          style={{
            fontSize: Platform.OS === 'web' ? 56 : 34,
            lineHeight: Platform.OS === 'web' ? 62 : 40,
          }}
        >
          {profile?.headline?.toUpperCase() || ''}
        </Text>
      </View>

      {/* REST OF CODE REMAINS EXACTLY THE SAME */}
      <View className="flex-row flex-wrap mb-6 -m-3">
        <View className="w-full p-3 lg:w-1/2">
          <AnimatedCard
            style={{
              backgroundColor: 'rgba(18, 18, 18, 1)',
              borderRadius: 48,
              minHeight: 380,
              justifyContent: 'space-between',
            }}
          >
            <View className="flex-row items-center p-6 gap-x-6 md:p-12">
              <View className="p-3 border bg-teal-500/10 rounded-xl border-teal-500/20">
                <Ionicons name="person" size={20} color={COLORS.primary} />
              </View>
              <Text className="text-3xl font-bold tracking-tight text-zinc-100">
                Biography
              </Text>
            </View>
            <View className="p-6 md:p-12 mt-[-40]">
              <Text className="text-lg leading-relaxed text-zinc-400">
                {profile?.about_me || 'Certified Java Fullstack Developer.'}
              </Text>
            </View>
          </AnimatedCard>
        </View>

        <View className="w-full p-3 lg:w-1/2">
          <AnimatedCard
            style={{
              backgroundColor: 'rgba(18, 18, 18, 1)',
              borderRadius: 48,
              minHeight: 380,
              justifyContent: 'space-between',
            }}
          >
            <View className="flex-row items-center p-6 gap-x-6 md:p-12">
              <View className="p-3 border bg-teal-500/10 rounded-xl border-teal-500/20">
                <Ionicons name="trending-up" size={20} color={COLORS.primary} />
              </View>
              <Text className="text-3xl font-bold tracking-tight text-zinc-100">
                Growth
              </Text>
            </View>
            <View className="p-6 md:p-12 mt-[-40]">
              <Text className="text-lg leading-relaxed text-zinc-400">
                {profile?.growth_summary ||
                  'Focused on distributed consistency.'}
              </Text>
            </View>
          </AnimatedCard>
        </View>
      </View>

      <View className="flex-row flex-wrap -m-2">
        {technicalPillars.map((item, idx) => (
          <View key={idx} className="w-full p-2 md:w-1/2 lg:w-1/4">
            <AnimatedCard
              style={{
                backgroundColor: 'rgba(18, 18, 18, 1)',
                borderRadius: 32,
                minHeight: 220,
                justifyContent: 'flex-start',
              }}
            >
              <View className="flex-row items-center p-5 gap-x-4 md:p-8">
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={item.color}
                />
                <Text className="text-sm font-black tracking-widest uppercase text-zinc-100">
                  {item.title}
                </Text>
              </View>
              <View className="flex-row flex-wrap px-5 pb-5 md:px-8 md:pb-8">
                {item.stack.map((tech, techIdx) => (
                  <TechBadge key={techIdx} label={tech} />
                ))}
              </View>
            </AnimatedCard>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PhilosophyBento;
