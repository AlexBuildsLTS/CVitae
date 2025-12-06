import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Clock, CheckCircle, Calendar } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { COLORS, SPACING } from '../constants/Theme';

const TIME_SLOTS = ["10:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"];

export function GlassScheduler() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        setLoading(false);
        Alert.alert("Request Received", `I have noted your request for ${selectedSlot}. I will confirm via email shortly.`);
        setSelectedSlot(null);
    }, 1500);
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.headerRow}>
        <Calendar color={COLORS.primary} size={20} />
        <Text style={styles.title}>Schedule a Meeting</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Open for freelance or interview discussions.
      </Text>
      
      <View style={styles.grid}>
        {TIME_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot;
            return (
                <TouchableOpacity 
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.slot, isSelected && styles.slotActive]}
                >
                    <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                        {slot}
                    </Text>
                    {isSelected && <CheckCircle size={12} color={COLORS.background} style={{ marginLeft: 6 }} />}
                </TouchableOpacity>
            )
        })}
      </View>

      <TouchableOpacity 
        onPress={handleBook}
        disabled={!selectedSlot || loading}
        style={[styles.bookButton, !selectedSlot && styles.bookButtonDisabled]}
      >
        {loading ? (
            <ActivityIndicator color={COLORS.background} size="small" />
        ) : (
            <Text style={styles.bookButtonText}>
                {selectedSlot ? `CONFIRM BOOKING` : 'SELECT A TIME'}
            </Text>
        )}
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.l, width: '100%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: COLORS.textDim, fontSize: 12, marginBottom: SPACING.m },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.l },
  slot: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  slotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotText: { color: COLORS.textDim, fontSize: 11, fontWeight: '600', fontFamily: Platform.OS === 'web' ? 'monospace' : 'System' },
  slotTextActive: { color: COLORS.background, fontWeight: 'bold' },
  bookButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  bookButtonDisabled: { opacity: 0.3, backgroundColor: 'rgba(255,255,255,0.1)' },
  bookButtonText: { color: COLORS.background, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }
});