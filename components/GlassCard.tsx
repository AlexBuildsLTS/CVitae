/**
 * @file components/GlassCard.tsx
 * @description Corrected Tag Hierarchy to resolve JSX parsing errors.
 */
import * as React from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../constants/Theme';

export function GlassCard({ children, style, intensity = 20 }: any) {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.2);

  // Define dynamic container for Web/Native compatibility
  const Container = Platform.OS === 'web' ? View : BlurView;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 100 }) }],
      borderColor: withSpring(`rgba(100, 255, 218, ${borderOpacity.value})`),
    };
  });

  return (
    <Pressable
      onHoverIn={() => {
        scale.value = 1.015;
        borderOpacity.value = 0.6;
      }}
      onHoverOut={() => {
        scale.value = 1;
        borderOpacity.value = 0.2;
      }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.animatedContainer, animatedStyle, style]}>
        <Container 
          intensity={intensity} 
          tint="dark" 
          style={styles.blurContainer}
        >
          <View style={styles.content}>
            {children}
          </View>
        </Container>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    overflow: 'hidden',
    borderRadius: 48,
    backgroundColor: 'rgba(24, 24, 27, 0.4)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  blurContainer: { 
    width: '100%', 
    height: '100%' 
  },
  content: { 
    width: '100%' 
  },
});