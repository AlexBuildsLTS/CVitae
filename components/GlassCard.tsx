import React from 'react';
import { StyleSheet, View, Platform, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS, SPACING } from '../constants/Theme';

// Explicitly add children to the interface for React 19 compatibility
interface GlassCardProps extends ViewProps {
  children?: React.ReactNode;
  delay?: number;
  intensity?: number;
}

export function GlassCard({
  children,
  style,
  delay = 0,
  intensity = 20,
  ...props
}: GlassCardProps) {
  // Web compatibility: BlurView behaves differently on web vs native
  const Container = Platform.OS === 'web' ? View : BlurView;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify().damping(12)}
      style={[styles.animatedContainer, style]}
    >
      <Container
        intensity={intensity}
        tint="dark"
        style={styles.blurContainer}
        {...props}
      >
        <View style={styles.content}>{children}</View>
        <View style={styles.overlay} pointerEvents="none" />
      </Container>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: 'rgba(18, 18, 18, 0.6)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  blurContainer: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: SPACING.l,
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    zIndex: 1,
  },
});
