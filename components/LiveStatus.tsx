import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { COLORS, SPACING } from '../constants/Theme';

export function LiveStatus() {
  const [status, setStatus] = useState<string>('OFFLINE');
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    // 1. Initial Fetch
    fetchStatus();

    // 2. Realtime Subscription
    const subscription = supabase
      .channel('public:status_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'status_logs' },
        (payload) => {
          if (payload.new && payload.new.status_text) {
            setStatus(payload.new.status_text);
          }
        }
      )
      .subscribe();

    // 3. Animation Loop (Pulsing Effect)
    opacity.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await supabase
        .from('status_logs')
        .select('status_text')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setStatus(data.status_text);
    } catch (error) {
      console.log('Error fetching status:', error);
    }
  };

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const isOnline = ['SHIPPING', 'FOCUS', 'ONLINE'].some(s => status.includes(s));
  const dotColor = isOnline ? COLORS.primary : COLORS.error;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { backgroundColor: dotColor }, animatedDotStyle]} />
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: SPACING.s + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.s,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  text: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});