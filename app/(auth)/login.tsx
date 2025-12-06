import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both ID and Key.');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Access Denied', error.message);
      setLoading(false);
    } else {
      // Login Successful -> Redirect to the Admin Dashboard
      router.replace('/admin/dashboard');
    }
  }

  return (
    <View style={styles.container}>
      {/* WRAPPER: This is the fix for Desktop. 
        It constraints the width to 400px so it doesn't stretch 
        across the entire monitor.
      */}
      <View style={styles.wrapper}>
        <GlassCard style={styles.card}>
          <Text style={styles.header}>SYSTEM ACCESS</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>IDENTITY</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@northfinance.com"
              placeholderTextColor={COLORS.textDim}
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>KEY</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textDim}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.buttonText}>AUTHENTICATE</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center', // Centers the card horizontally
    padding: SPACING.l,
  },
  wrapper: {
    width: '100%',
    maxWidth: 400, // KEY FIX: Limits width on large screens
  },
  card: {
    padding: SPACING.xl,
  },
  header: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.l,
  },
  label: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    padding: SPACING.m,
    borderRadius: 8,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', // Preserved your font choice
  },
  button: {
    backgroundColor: COLORS.text,
    padding: SPACING.m,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.m,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backLink: {
    marginTop: SPACING.l,
    alignItems: 'center',
  },
  backText: {
    color: COLORS.error,
    fontSize: 12,
    letterSpacing: 1,
  },
});