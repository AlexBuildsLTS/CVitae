/**
 * @file components/PhilosophyBento.tsx
 * @description Senior-Tier Bento Grid. Symmetrical 2x2 layout with professional icon scaling.
 */
import React from 'react';
import { View, Text, Platform } from 'react-native';
import {
  Shield,
  Layout,
  Server,
  TrendingUp,
  Users,
  Code2,
} from 'lucide-react-native';
import { COLORS } from '../constants/Theme';

interface PhilosophyProps {
  profile: {
    headline: string;
    bio: string;
    about_me: string | null;
    growth_summary: string | null;
  } | null;
}

const PhilosophyBento = ({ profile }: PhilosophyProps) => {
  return (
    <View className="w-full py-12">
      {/* SECTION HEADER */}
      <View className="px-2 mb-12">
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
          <View className="bg-zinc-900/40 border border-zinc-800 p-12 rounded-[3rem] min-h-[380px] justify-between shadow-2xl">
            <View className="self-start p-3 border bg-teal-500/10 rounded-xl border-teal-500/20">
              <Users size={20} color={COLORS.primary} strokeWidth={2} />
            </View>
            <View className="mt-10">
              <Text className="mb-5 text-3xl font-bold tracking-tight text-zinc-100">
                Biography
              </Text>
              <Text className="text-lg leading-relaxed text-zinc-400">
                {profile?.about_me ||
                  'Certified Java Fullstack Developer. I focus on building scalable systems and am eager to contribute my skills while learning from a professional engineering team.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Growth Card */}
        <View className="w-full p-3 lg:w-1/2">
          <View className="bg-zinc-900/40 border border-zinc-800 p-12 rounded-[3rem] min-h-[380px] justify-between shadow-2xl">
            <View className="self-start p-3 border bg-teal-500/10 rounded-xl border-teal-500/20">
              <TrendingUp size={20} color={COLORS.primary} strokeWidth={2} />
            </View>
            <View className="mt-10">
              <Text className="mb-5 text-3xl font-bold tracking-tight text-zinc-100">
                Growth
              </Text>
              <Text className="text-lg leading-relaxed text-zinc-400">
                {profile?.growth_summary ||
                  '6+ months of daily technical immersion. I treat every project as a roadmap to mastering enterprise standards in scalability and security.'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ROW 2: 4 SYMMETRICAL PILLARS */}
      <View className="flex-row flex-wrap -m-2">
        <View className="w-full p-2 md:w-1/2 lg:w-1/4">
          <View className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] min-h-[220px] justify-between">
            <Server size={20} color={COLORS.secondary} strokeWidth={2} />
            <View>
              <Text className="mb-1 text-lg font-bold tracking-tighter uppercase text-zinc-100">
                Backend
              </Text>
              <Text className="text-zinc-500 text-[11px] leading-5">
                Java, Spring Boot, Node.js, and PostgreSQL.
              </Text>
            </View>
          </View>
        </View>

        <View className="w-full p-2 md:w-1/2 lg:w-1/4">
          <View className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] min-h-[220px] justify-between">
            <Layout size={20} color={COLORS.primary} strokeWidth={2} />
            <View>
              <Text className="mb-1 text-lg font-bold tracking-tighter uppercase text-zinc-100">
                Frontend
              </Text>
              <Text className="text-zinc-500 text-[11px] leading-5">
                React, React Native, TypeScript, and Tailwind.
              </Text>
            </View>
          </View>
        </View>

        <View className="w-full p-2 md:w-1/2 lg:w-1/4">
          <View className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] min-h-[220px] justify-between">
            <Shield size={20} color="#f87171" strokeWidth={2} />
            <View>
              <Text className="mb-1 text-lg font-bold tracking-tighter uppercase text-zinc-100">
                Security
              </Text>
              <Text className="text-zinc-500 text-[11px] leading-5">
                Secure Auth, OAuth2, JWT, and RLS Protocols.
              </Text>
            </View>
          </View>
        </View>

        <View className="w-full p-2 md:w-1/2 lg:w-1/4">
          <View className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] min-h-[220px] justify-between">
            <Code2 size={20} color="#fbbf24" strokeWidth={2} />
            <View>
              <Text className="mb-1 text-lg font-bold tracking-tighter uppercase text-zinc-100">
                Infrastructure
              </Text>
              <Text className="text-zinc-500 text-[11px] leading-5">
                Git, Docker, Firebase, and Linux/Ubuntu.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PhilosophyBento;
