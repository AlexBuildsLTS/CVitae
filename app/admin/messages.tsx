import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { Mail, Trash2, Reply, CheckCircle, Circle, Archive, RefreshCw } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';
import { useFocusEffect } from 'expo-router';

interface Message {
  id: number;
  created_at: string;
  sender_name: string;
  sender_email: string;
  message_text: string;
  is_read: boolean;
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchMessages = async () => {
    try {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (filter === 'unread') query = query.eq('is_read', false);
      
      const { data, error } = await query;
      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchMessages(); }, [filter]));

  const handleMarkRead = async (id: number, currentStatus: boolean) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: !currentStatus } : m)); // Optimistic
    await supabase.from('messages').update({ is_read: !currentStatus }).eq('id', id);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Delete this message permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          setMessages(prev => prev.filter(m => m.id !== id));
          await supabase.from('messages').delete().eq('id', id);
      }}
    ]);
  };

  const handleReply = (email: string) => Linking.openURL(`mailto:${email}`);

  const renderItem = ({ item }: { item: Message }) => {
      const date = new Date(item.created_at).toLocaleDateString();
      return (
        <GlassCard style={[styles.messageCard, !item.is_read && styles.unreadCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.senderRow}>
                    {!item.is_read && <View style={styles.unreadDot} />}
                    <Text style={[styles.senderName, !item.is_read && styles.boldText]}>{item.sender_name}</Text>
                </View>
                <Text style={styles.dateText}>{date}</Text>
            </View>
            <TouchableOpacity onPress={() => handleReply(item.sender_email)}>
                <Text style={styles.emailText}>{item.sender_email}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <Text style={styles.messageBody}>{item.message_text}</Text>
            <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => handleReply(item.sender_email)} style={styles.actionBtn}>
                    <Reply size={16} color={COLORS.primary} />
                    <Text style={styles.actionText}>Reply</Text>
                </TouchableOpacity>
                <View style={styles.rightActions}>
                    <TouchableOpacity onPress={() => handleMarkRead(item.id, item.is_read)} style={styles.iconBtn}>
                        {item.is_read ? <CheckCircle size={18} color={COLORS.success} /> : <Circle size={18} color={COLORS.textDim} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                        <Trash2 size={18} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </GlassCard>
      );
  }

  return (
    <View style={styles.container}>
        <View style={styles.headerContainer}>
            <View>
                <Text style={styles.header}>INBOX</Text>
                <Text style={styles.subHeader}>{messages.filter(m => !m.is_read).length} new messages</Text>
            </View>
            <View style={styles.filterRow}>
                <TouchableOpacity onPress={() => setFilter('all')} style={[styles.filterBtn, filter === 'all' && styles.activeFilter]}>
                    <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('unread')} style={[styles.filterBtn, filter === 'unread' && styles.activeFilter]}>
                    <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>Unread</Text>
                </TouchableOpacity>
            </View>
        </View>

      {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(); }} tintColor={COLORS.primary} />}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Archive size={40} color={COLORS.textDim} />
                    <Text style={styles.emptyText}>No messages found.</Text>
                    <TouchableOpacity onPress={() => fetchMessages()} style={{marginTop: 20}}><RefreshCw size={20} color={COLORS.primary}/></TouchableOpacity>
                </View>
            }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { padding: SPACING.l, paddingTop: SPACING.xl, paddingBottom: SPACING.m, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { color: COLORS.text, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  subHeader: { color: COLORS.textDim, fontSize: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  activeFilter: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textDim, fontSize: 12, fontWeight: 'bold' },
  activeFilterText: { color: COLORS.background },
  listContent: { padding: SPACING.l, paddingTop: 0 },
  messageCard: { padding: SPACING.m, marginBottom: SPACING.m },
  unreadCard: { borderColor: COLORS.primary, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  senderName: { color: COLORS.text, fontSize: 16 },
  boldText: { fontWeight: 'bold' },
  dateText: { color: COLORS.textDim, fontSize: 10 },
  emailText: { color: COLORS.primary, fontSize: 12, marginBottom: SPACING.s },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.m, opacity: 0.5 },
  messageBody: { color: COLORS.text, lineHeight: 22, fontSize: 14, marginBottom: SPACING.m },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  actionText: { color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
  rightActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: COLORS.textDim, marginTop: 10, fontSize: 16 },
});