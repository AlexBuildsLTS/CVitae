/**
 * @file components/PhilosophyBento.tsx
 * @description Code For Tech Card and Growth. 
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

// Hover Wrapper for the animations
const AnimatedCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scale.value, { damping: 10, stiffness: 100 }) },
    ],
    borderColor:
      scale.value === 1.05 ? COLORS.primary : 'rgba(63, 63, 70, 0.4)',
  }));

  return (
    <Pressable
      onHoverIn={() => {
        scale.value = 1.05;
        borderOpacity.value = 0.8;
      }}
      onHoverOut={() => {
        scale.value = 1;
        borderOpacity.value = 0.1;
      }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
};

const PhilosophyBento = ({ profile }: PhilosophyProps) => {
  return (
    <View className="w-full py-8 md:py-12">
      {/* SECTION HEADER */}
      <View className="px-4 mb-8 md:px-2 md:mb-12">
        <Text className="text-zinc-500 text-xs font-black tracking-[0.3em] uppercase mb-4">
          TECHNICAL FOUNDATION
        </Text>
        <Text
          className="font-black tracking-tighter text-zinc-100"
          style={{
            fontSize: Platform.OS === 'web' ? 56 : 34,
            lineHeight: Platform.OS === 'web' ? 62 : 40,
          }}
        >
          {profile?.headline?.toUpperCase() ||
            'FOUNDATION & PROFESSIONAL GROWTH.'}
        </Text>
      </View>

      {/* ROW 1: 2 LARGE SYMMETRICAL CARDS */}
      <View className="flex-row flex-wrap mb-6 -m-3">
        {/* Biography Card */}
        <View className="w-full p-3 lg:w-1/2">
          <AnimatedCard
            style={{
              backgroundColor: 'rgba(34, 34, 34, 1)',
              borderWeight: 1,
              p: 6,
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
                {profile?.about_me ||
                  'Certified Java Fullstack Developer. I focus on building scalable systems.'}
              </Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Growth Card */}
        <View className="w-full p-3 lg:w-1/2">
          <AnimatedCard
            style={{
              backgroundColor: 'rgba(34, 34, 34, 1)',
              borderWeight: 1,
              p: 6,
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
                  '6+ months of daily technical immersion.'}
              </Text>
            </View>
          </AnimatedCard>
        </View>
      </View>

      {/* ROW 2: 4 SYMMETRICAL PILLARS */}
      <View className="flex-row flex-wrap -m-2">
        {[
          {
            icon: 'server',
            title: 'Backend',
            text: 'Java, Spring Boot, Node.js, and PostgreSQL.',
            color: COLORS.secondary,
          },
          {
            icon: 'layers',
            title: 'Frontend',
            text: 'React, React Native, TypeScript, and Tailwind.',
            color: COLORS.primary,
          },
          {
            icon: 'shield-checkmark',
            title: 'Security',
            text: 'Secure Auth, OAuth2, JWT, and RLS Protocols.',
            color: '#a80303',
          },
          {
            icon: 'code-slash',
            title: 'Infrastructure',
            text: 'Git, Docker, Firebase, and VMware,VirtualBox,Hyper-V Linux/Ubuntu/Kali',
            color: '#fc860f',
          },
        ].map((item, idx) => (
          <View key={idx} className="w-full p-2 md:w-1/2 lg:w-1/4">
            <AnimatedCard
              style={{
                backgroundColor: 'rgba(34, 34, 34, 1)',
                borderWeight: 1,
                p: 4,
                borderRadius: 32,
                minHeight: 200,
                justifyContent: 'space-between',
              }}
            >
              <View className="flex-row items-center p-4 gap-x-4 md:p-8">
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.color}
                />
                <Text className="text-lg font-bold tracking-tighter uppercase text-zinc-100">
                  {item.title}
                </Text>
              </View>
              <View className="p-4 md:p-8 mt-[-20]">
                <Text className="text-zinc-500 text-[11px] leading-5">
                  {item.text}
                </Text>
              </View>
            </AnimatedCard>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PhilosophyBento;
