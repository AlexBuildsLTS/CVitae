import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/Theme';
import { LayoutDashboard, Layers, MessageSquare, LogOut } from 'lucide-react-native';

export default function AdminLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) router.replace('/(auth)/login');
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
     const { data: { session } } = await supabase.auth.getSession();
     setSession(session);
     setLoading(false);
     if (!session) router.replace('/(auth)/login');
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: COLORS.border,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        sceneStyle: { backgroundColor: COLORS.background }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
       <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <Layers size={22} color={color} />,
        }}
      />
       <Tabs.Screen
        name="messages"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}